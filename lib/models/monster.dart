/// One weighted entry in a monster's loot table. On a kill, the combat
/// engine picks entries using [weight] (higher = more common) and rolls a
/// quantity uniformly between [minQty] and [maxQty] inclusive.
class LootEntry {
  final String itemId;
  final int minQty;
  final int maxQty;
  final int weight;

  const LootEntry({
    required this.itemId,
    required this.minQty,
    this.maxQty = -1,
    this.weight = 1,
  });

  /// Convenience for a fixed-quantity drop.
  int get effectiveMaxQty => maxQty < minQty ? minQty : maxQty;
}

/// Static definition for a monster. `hp` and `maxHit` are *derived* from
/// [level] via the game's combat formulas rather than authored per-monster
/// — this keeps every monster balanced against the same curve and means
/// adding a new monster is just picking a level, an attack/defence pair,
/// and a loot table. See engine/combat_engine.dart for how these feed into
/// a fight.
class MonsterDefinition {
  final String monsterId;
  final String name;
  final int level;

  /// Used against the player's defence to compute the monster's hit chance.
  final int attackPower;

  /// Used against the player's attack to compute the player's hit chance.
  final int defence;

  final List<LootEntry> lootTable;

  const MonsterDefinition({
    required this.monsterId,
    required this.name,
    required this.level,
    required this.attackPower,
    required this.defence,
    this.lootTable = const [],
  });

  /// hp = 5 + (monsterLevel * 3)
  int get hp => 5 + (level * 3);

  /// maxHit = 1 + floor(monsterLevel / 3)
  int get maxHit => 1 + (level ~/ 3);

  @override
  String toString() => 'MonsterDefinition($monsterId, lvl $level, hp $hp)';
}

/// A named group of monsters the player can pick to fight — e.g. "Goblin
/// Camp" or "Copper Mine Rats". Keeps the combat screen simple (choose a
/// zone, not an individual monster) while leaving room for zones with
/// several possible monster types later.
class CombatZone {
  final String zoneId;
  final String name;
  final String description;
  final List<String> monsterIds;

  const CombatZone({
    required this.zoneId,
    required this.name,
    required this.description,
    required this.monsterIds,
  });
}
