import '../models/item.dart';

/// Central registry of every item in the game. Content files (actions,
/// loot tables) reference items by id string; this map is the single
/// source of truth for what that id actually is. Adding a new item never
/// requires touching the skill or combat engines — just add an entry here
/// and reference its id from an action or loot table.
final Map<String, ItemDefinition> kItems = {
  for (final item in _allItems) item.itemId: item,
};

ItemDefinition itemById(String itemId) {
  final item = kItems[itemId];
  if (item == null) {
    throw ArgumentError('Unknown itemId: $itemId');
  }
  return item;
}

const _ores = [
  ItemDefinition(
    itemId: 'copper_ore',
    name: 'Copper Ore',
    category: ItemCategory.ore,
    tier: 1,
    sellValue: 2,
    description: 'A dull, reddish ore. The first step toward copper bars.',
  ),
  ItemDefinition(
    itemId: 'iron_ore',
    name: 'Iron Ore',
    category: ItemCategory.ore,
    tier: 2,
    sellValue: 5,
    description: 'Heavier and harder to find than copper.',
  ),
  ItemDefinition(
    itemId: 'coal',
    name: 'Coal',
    category: ItemCategory.ore,
    tier: 2,
    sellValue: 4,
    description: 'Burns hot enough to temper iron into steel.',
  ),
];

const _bars = [
  ItemDefinition(
    itemId: 'copper_bar',
    name: 'Copper Bar',
    category: ItemCategory.bar,
    tier: 1,
    sellValue: 8,
    description: 'Smelted from copper ore. Soft, easy to work.',
  ),
  ItemDefinition(
    itemId: 'iron_bar',
    name: 'Iron Bar',
    category: ItemCategory.bar,
    tier: 2,
    sellValue: 18,
    description: 'Smelted from iron ore.',
  ),
  ItemDefinition(
    itemId: 'steel_bar',
    name: 'Steel Bar',
    category: ItemCategory.bar,
    tier: 3,
    sellValue: 35,
    description: 'Iron ore tempered with coal. Strong and reliable.',
  ),
];

const _gear = [
  // --- Copper tier (tier 1) ---
  ItemDefinition(
    itemId: 'copper_sword',
    name: 'Copper Sword',
    category: ItemCategory.weapon,
    tier: 1,
    equippable: true,
    slot: EquipmentSlot.weapon,
    weaponDamage: 3,
    stats: ItemStats(attack: 2, strength: 2),
    sellValue: 20,
  ),
  ItemDefinition(
    itemId: 'copper_platebody',
    name: 'Copper Platebody',
    category: ItemCategory.armor,
    tier: 1,
    equippable: true,
    slot: EquipmentSlot.body,
    stats: ItemStats(defence: 3),
    sellValue: 22,
  ),
  // --- Iron tier (tier 2) ---
  ItemDefinition(
    itemId: 'iron_sword',
    name: 'Iron Sword',
    category: ItemCategory.weapon,
    tier: 2,
    equippable: true,
    slot: EquipmentSlot.weapon,
    weaponDamage: 5,
    stats: ItemStats(attack: 5, strength: 5),
    sellValue: 45,
  ),
  ItemDefinition(
    itemId: 'iron_platebody',
    name: 'Iron Platebody',
    category: ItemCategory.armor,
    tier: 2,
    equippable: true,
    slot: EquipmentSlot.body,
    stats: ItemStats(defence: 7),
    sellValue: 50,
  ),
  // --- Steel tier (tier 3) ---
  ItemDefinition(
    itemId: 'steel_sword',
    name: 'Steel Sword',
    category: ItemCategory.weapon,
    tier: 3,
    equippable: true,
    slot: EquipmentSlot.weapon,
    weaponDamage: 8,
    stats: ItemStats(attack: 9, strength: 9),
    sellValue: 90,
  ),
  ItemDefinition(
    itemId: 'steel_platebody',
    name: 'Steel Platebody',
    category: ItemCategory.armor,
    tier: 3,
    equippable: true,
    slot: EquipmentSlot.body,
    stats: ItemStats(defence: 13),
    sellValue: 100,
  ),
];

// No Cooking skill yet — this exists purely so the auto-eat stub in the
// combat engine has something to react to. Player starts with a few in
// their inventory (see Player.newGame / player_notifier.dart). Once
// Cooking ships, real food items slot in here the same way and auto-eat
// keeps working unmodified.
const _food = [
  ItemDefinition(
    itemId: 'stale_bread',
    name: 'Stale Bread',
    category: ItemCategory.consumable,
    tier: 1,
    healAmount: 10,
    sellValue: 1,
    description: 'Not much, but it will keep you standing.',
  ),
];

const _allItems = [..._ores, ..._bars, ..._gear, ..._food];
