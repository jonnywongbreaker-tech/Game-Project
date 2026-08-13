import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/item.dart';
import '../models/player.dart';
import 'game_tick_provider.dart';
import 'save_service.dart';

/// Supplies the player state a fresh [PlayerNotifier] should boot with.
/// main.dart overrides this with whatever [SaveService.load] returned
/// before `runApp`, so the notifier itself never has to know or care
/// whether it's a brand new game or a restored save.
final initialPlayerProvider = Provider<Player>((ref) => Player.newGame());

final playerProvider = NotifierProvider<PlayerNotifier, Player>(PlayerNotifier.new);

/// Owns the single source of truth for the player's save data — skills,
/// inventory, equipment, and combat vitals. Every mutation here is
/// autosaved so the game loop never needs to remember to persist.
class PlayerNotifier extends Notifier<Player> {
  @override
  Player build() {
    // Ticks its own recovery-timer check so screens don't have to remember
    // to; see checkRecoveryComplete.
    ref.listen(gameTickProvider, (previous, next) {
      if (next.value != null) checkRecoveryComplete();
    });
    return ref.read(initialPlayerProvider);
  }

  void _commit(Player next) {
    state = next;
    // Fire-and-forget: the UI never blocks on disk I/O for a state update.
    unawaited(SaveService.save(next));
  }

  void grantXp(String skillId, int amount) => _commit(state.grantXp(skillId, amount));

  void addItem(String itemId, int qty) =>
      _commit(state.copyWith(inventory: state.inventory.add(itemId, qty)));

  void addItems(Map<String, int> items) =>
      _commit(state.copyWith(inventory: state.inventory.addAll(items)));

  bool hasItems(List<ItemQty> items) =>
      items.every((i) => state.inventory.has(i.itemId, i.qty));

  /// Removes items, throwing if any are insufficient. Callers must check
  /// [hasItems] first — the skill/combat engines always do.
  void consumeItems(List<ItemQty> items) {
    var inv = state.inventory;
    for (final i in items) {
      inv = inv.remove(i.itemId, i.qty);
    }
    _commit(state.copyWith(inventory: inv));
  }

  /// Atomically consumes [consume], adds [produce], and grants skill xp as
  /// a single state update — what the skill engine calls on each action
  /// completion, instead of three separate commits per completion.
  void applyActionCompletion({
    required List<ItemQty> consume,
    required List<ItemQty> produce,
    required String skillId,
    required int xp,
  }) {
    var inv = state.inventory;
    for (final i in consume) {
      inv = inv.remove(i.itemId, i.qty);
    }
    for (final o in produce) {
      inv = inv.add(o.itemId, o.qty);
    }
    _commit(state.copyWith(inventory: inv).grantXp(skillId, xp));
  }

  void equip(String itemId, EquipmentSlot slot) =>
      _commit(state.copyWith(equipment: state.equipment.equip(slot, itemId)));

  void unequip(EquipmentSlot slot) =>
      _commit(state.copyWith(equipment: state.equipment.unequip(slot)));

  void setCurrentHp(int hp) =>
      _commit(state.copyWith(currentHp: hp.clamp(0, state.maxHp)));

  void damage(int amount) => setCurrentHp(state.currentHp - amount);

  void heal(int amount) => setCurrentHp(state.currentHp + amount);

  void startRecovery(Duration duration) =>
      _commit(state.copyWith(currentHp: 0, recoveryEndsAt: DateTime.now().add(duration)));

  /// Called every game tick. If recovery has elapsed, fully heals the
  /// player and clears the timer. No-op otherwise.
  void checkRecoveryComplete() {
    final endsAt = state.recoveryEndsAt;
    if (endsAt != null && !endsAt.isAfter(DateTime.now())) {
      _commit(state.copyWith(currentHp: state.maxHp, clearRecovery: true));
    }
  }

  /// Replaces the whole player object in one shot — used by the combat
  /// engine to apply a batch of changes (damage, auto-eat, loot, recovery)
  /// as a single atomic update instead of many small ones.
  void restoreState(Player player) => _commit(player);
}
