import 'dart:math';

import 'package:collection/collection.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/items_data.dart';
import '../data/monsters_data.dart';
import '../engine/combat_math.dart';
import '../engine/loot_roller.dart';
import '../models/item.dart';
import '../models/monster.dart';
import '../models/player.dart';
import 'game_tick_provider.dart';
import 'player_notifier.dart';
import 'skill_session_notifier.dart';

enum CombatStatus { idle, fighting }

class CombatLogEntry {
  final String message;
  final DateTime at;

  const CombatLogEntry(this.message, this.at);
}

/// Runtime (not persisted) state of the current auto-fight. Fully
/// idle/on-demand — there's nothing to fight until the player picks a
/// zone, and stopping just drops this back to [CombatState.idle].
class CombatState {
  final CombatStatus status;
  final CombatZone? zone;
  final MonsterDefinition? monster;
  final int monsterHp;
  final DateTime? exchangeAnchor;
  final int exchangesProcessed;
  final int kills;
  final List<CombatLogEntry> log;

  const CombatState({
    this.status = CombatStatus.idle,
    this.zone,
    this.monster,
    this.monsterHp = 0,
    this.exchangeAnchor,
    this.exchangesProcessed = 0,
    this.kills = 0,
    this.log = const [],
  });

  static const idle = CombatState();

  bool get isFighting => status == CombatStatus.fighting;

  double get monsterHpFraction {
    final m = monster;
    if (m == null || m.hp == 0) return 0;
    return (monsterHp / m.hp).clamp(0.0, 1.0);
  }

  CombatState copyWith({
    CombatStatus? status,
    CombatZone? zone,
    MonsterDefinition? monster,
    int? monsterHp,
    DateTime? exchangeAnchor,
    int? exchangesProcessed,
    int? kills,
    List<CombatLogEntry>? log,
  }) {
    return CombatState(
      status: status ?? this.status,
      zone: zone ?? this.zone,
      monster: monster ?? this.monster,
      monsterHp: monsterHp ?? this.monsterHp,
      exchangeAnchor: exchangeAnchor ?? this.exchangeAnchor,
      exchangesProcessed: exchangesProcessed ?? this.exchangesProcessed,
      kills: kills ?? this.kills,
      log: log ?? this.log,
    );
  }
}

final combatSessionProvider =
    NotifierProvider<CombatNotifier, CombatState>(CombatNotifier.new);

/// Drives the fully-automatic combat loop: pick a zone, then every
/// [exchangeIntervalSeconds] the player and monster trade a single attack
/// each, resolved in real time via the shared [gameTickProvider] — no
/// player input once the fight starts, per the design doc.
class CombatNotifier extends Notifier<CombatState> {
  static const double exchangeIntervalSeconds = 2.4;
  static const int _maxLogEntries = 30;
  // Safety cap on how many exchanges a single tick will catch up on (e.g.
  // after the app was backgrounded a long time), so recomputation always
  // finishes in bounded time instead of spinning.
  static const int _maxExchangesPerTick = 200;

  final Random _rng = Random();

  @override
  CombatState build() {
    ref.listen(gameTickProvider, (previous, next) {
      final now = next.value;
      if (now != null) _onTick(now);
    });
    return CombatState.idle;
  }

  /// Returns null on success, or a user-facing reason combat can't start.
  String? start(String zoneId) {
    final player = ref.read(playerProvider);
    if (player.isRecovering) {
      final secondsLeft = player.recoveryEndsAt!.difference(DateTime.now()).inSeconds;
      return 'Still recovering in town (${secondsLeft}s left).';
    }

    final zone = zoneById(zoneId);

    // Only one activity at a time — starting a fight interrupts gathering.
    ref.read(skillSessionProvider.notifier).stop();

    final monster = _spawnMonster(zone);
    state = CombatState(
      status: CombatStatus.fighting,
      zone: zone,
      monster: monster,
      monsterHp: monster.hp,
      exchangeAnchor: DateTime.now(),
      log: [_entry('A ${monster.name} (level ${monster.level}) appears.')],
    );
    return null;
  }

  void stop() {
    if (state.status == CombatStatus.idle) return;
    state = CombatState.idle;
  }

  MonsterDefinition _spawnMonster(CombatZone zone) {
    final id = zone.monsterIds[_rng.nextInt(zone.monsterIds.length)];
    return monsterById(id);
  }

  CombatLogEntry _entry(String message) => CombatLogEntry(message, DateTime.now());

  void _onTick(DateTime now) {
    if (state.status != CombatStatus.fighting) return;
    final anchor = state.exchangeAnchor;
    final initialMonster = state.monster;
    final zone = state.zone;
    if (anchor == null || initialMonster == null || zone == null) return;

    final intervalMs = (exchangeIntervalSeconds * 1000).round();
    final elapsedMs = now.difference(anchor).inMilliseconds;
    final targetExchanges = elapsedMs ~/ intervalMs;

    final playerNotifier = ref.read(playerProvider.notifier);
    var processed = state.exchangesProcessed;
    var monsterHp = state.monsterHp;
    var kills = state.kills;
    // Declared non-nullable so reassigning it on a kill (a fresh spawn)
    // doesn't lose null-promotion the way `state.monster` would across a
    // loop.
    MonsterDefinition monster = initialMonster;
    final log = List<CombatLogEntry>.from(state.log);
    var iterations = 0;

    while (processed < targetExchanges && iterations < _maxExchangesPerTick) {
      iterations++;
      processed++;

      final stats = CombatStats.fromEquipment(ref.read(playerProvider).equipment);

      // 1. Player attacks the monster.
      final playerChance = CombatMath.hitChance(attack: stats.attack, enemyDefence: monster.defence);
      if (CombatMath.rollHit(playerChance, _rng)) {
        final dmg = CombatMath.rollDamage(stats.maxHit, _rng);
        monsterHp -= dmg;
        log.add(_entry('You hit the ${monster.name} for $dmg.'));
      } else {
        log.add(_entry('You miss the ${monster.name}.'));
      }

      if (monsterHp <= 0) {
        kills++;
        log.add(_entry('You defeated the ${monster.name}!'));
        final drop = LootRoller.roll(monster.lootTable, _rng);
        if (drop != null) {
          playerNotifier.addItem(drop.itemId, drop.qty);
          log.add(_entry('Looted ${drop.qty} x ${itemById(drop.itemId).name}.'));
        }
        monster = _spawnMonster(zone);
        monsterHp = monster.hp;
        log.add(_entry('A ${monster.name} (level ${monster.level}) appears.'));
        _trim(log);
        continue; // fresh monster gets no free hit this exchange
      }

      // 2. Monster counter-attacks.
      final monsterChance = CombatMath.hitChance(attack: monster.attackPower, enemyDefence: stats.defence);
      if (CombatMath.rollHit(monsterChance, _rng)) {
        final dmg = CombatMath.rollDamage(monster.maxHit, _rng);
        playerNotifier.damage(dmg);
        log.add(_entry('The ${monster.name} hits you for $dmg.'));
      } else {
        log.add(_entry('The ${monster.name} misses you.'));
      }

      // 3. Auto-eat stub: no Cooking skill yet, so this only fires if the
      // player happens to be holding a consumable item (see
      // data/items_data.dart's starter "Stale Bread").
      var player = ref.read(playerProvider);
      if (player.currentHp > 0 && player.currentHp < player.maxHp * 0.3) {
        final ate = _tryAutoEat(player, playerNotifier);
        if (ate != null) log.add(_entry('You eat $ate.'));
      }

      // 4. Death check.
      player = ref.read(playerProvider);
      if (player.currentHp <= 0) {
        final recovery = Duration(seconds: 30 + _rng.nextInt(31)); // 30-60s
        playerNotifier.startRecovery(recovery);
        log.add(_entry('You are defeated and dragged back to town to recover.'));
        _trim(log);
        state = CombatState.idle.copyWith(log: log, kills: kills);
        return;
      }

      _trim(log);
    }

    state = state.copyWith(
      monster: monster,
      monsterHp: monsterHp,
      exchangesProcessed: processed,
      kills: kills,
      log: log,
    );
  }

  void _trim(List<CombatLogEntry> log) {
    while (log.length > _maxLogEntries) {
      log.removeAt(0);
    }
  }

  /// Eats the first consumable item found in the inventory, healing the
  /// player. Returns the item's display name, or null if nothing edible
  /// was available.
  String? _tryAutoEat(Player player, PlayerNotifier notifier) {
    final entry = player.inventory.stacks.entries.firstWhereOrNull(
      (e) => e.value > 0 && itemById(e.key).category == ItemCategory.consumable,
    );
    if (entry == null) return null;

    final item = itemById(entry.key);
    final newInventory = player.inventory.remove(entry.key, 1);
    final healedHp = (player.currentHp + item.healAmount).clamp(0, player.maxHp);
    notifier.restoreState(player.copyWith(inventory: newInventory, currentHp: healedHp));
    return item.name;
  }
}
