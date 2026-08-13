import '../models/monster.dart';

/// Every monster in the game, keyed by id.
final Map<String, MonsterDefinition> kMonsters = {
  for (final m in _allMonsters) m.monsterId: m,
};

MonsterDefinition monsterById(String monsterId) {
  final monster = kMonsters[monsterId];
  if (monster == null) {
    throw ArgumentError('Unknown monsterId: $monsterId');
  }
  return monster;
}

const _allMonsters = [
  MonsterDefinition(
    monsterId: 'giant_rat',
    name: 'Giant Rat',
    level: 2,
    attackPower: 2,
    defence: 1,
    lootTable: [
      LootEntry(itemId: 'copper_ore', minQty: 1, maxQty: 2, weight: 5),
      LootEntry(itemId: 'copper_bar', minQty: 1, maxQty: 1, weight: 1),
    ],
  ),
  MonsterDefinition(
    monsterId: 'goblin',
    name: 'Goblin',
    level: 5,
    attackPower: 5,
    defence: 3,
    lootTable: [
      LootEntry(itemId: 'copper_ore', minQty: 1, maxQty: 3, weight: 4),
      LootEntry(itemId: 'iron_ore', minQty: 1, maxQty: 1, weight: 2),
      LootEntry(itemId: 'copper_sword', minQty: 1, maxQty: 1, weight: 1),
    ],
  ),
  MonsterDefinition(
    monsterId: 'bandit',
    name: 'Bandit',
    level: 12,
    attackPower: 11,
    defence: 8,
    lootTable: [
      LootEntry(itemId: 'iron_ore', minQty: 1, maxQty: 3, weight: 4),
      LootEntry(itemId: 'coal', minQty: 1, maxQty: 2, weight: 3),
      LootEntry(itemId: 'iron_sword', minQty: 1, maxQty: 1, weight: 1),
    ],
  ),
  MonsterDefinition(
    monsterId: 'skeleton_warrior',
    name: 'Skeleton Warrior',
    level: 20,
    attackPower: 18,
    defence: 14,
    lootTable: [
      LootEntry(itemId: 'coal', minQty: 2, maxQty: 4, weight: 3),
      LootEntry(itemId: 'steel_bar', minQty: 1, maxQty: 2, weight: 2),
      LootEntry(itemId: 'iron_platebody', minQty: 1, maxQty: 1, weight: 1),
    ],
  ),
];

final List<CombatZone> kCombatZones = [
  const CombatZone(
    zoneId: 'whispering_burrow',
    name: 'Whispering Burrow',
    description: 'A rat-infested hole at the edge of town. Safe for beginners.',
    monsterIds: ['giant_rat'],
  ),
  const CombatZone(
    zoneId: 'greenfen_camp',
    name: 'Greenfen Goblin Camp',
    description: 'A ramshackle goblin camp in the fens.',
    monsterIds: ['goblin'],
  ),
  const CombatZone(
    zoneId: 'old_north_road',
    name: 'Old North Road',
    description: 'Bandits prey on travelers along this stretch.',
    monsterIds: ['bandit'],
  ),
  const CombatZone(
    zoneId: 'sunken_crypt',
    name: 'Sunken Crypt',
    description: 'The dead do not rest easy here.',
    monsterIds: ['skeleton_warrior'],
  ),
];

CombatZone zoneById(String zoneId) => kCombatZones.firstWhere((z) => z.zoneId == zoneId);
