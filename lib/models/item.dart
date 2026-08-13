/// Broad classification for an item. Kept intentionally small for the MVP —
/// add new categories here as new skills/systems need them (e.g. `food`
/// once Cooking exists, `rune`/`seed` for later skills).
enum ItemCategory {
  ore,
  bar,
  weapon,
  armor,
  consumable,
  tool,
  misc,
}

/// Where an equippable item sits on the character. A subset today; extend
/// freely (helmet, legs, shield, amulet, ...) as gear variety grows.
enum EquipmentSlot {
  weapon,
  body,
}

/// Combat-relevant bonuses granted while an item is equipped. All zero by
/// default so non-equippable items can share the same [ItemDefinition]
/// shape without special-casing.
class ItemStats {
  final int attack;
  final int strength;
  final int defence;

  const ItemStats({
    this.attack = 0,
    this.strength = 0,
    this.defence = 0,
  });

  static const ItemStats none = ItemStats();

  Map<String, dynamic> toJson() => {
        'attack': attack,
        'strength': strength,
        'defence': defence,
      };

  factory ItemStats.fromJson(Map<String, dynamic> json) => ItemStats(
        attack: json['attack'] as int? ?? 0,
        strength: json['strength'] as int? ?? 0,
        defence: json['defence'] as int? ?? 0,
      );

  @override
  String toString() => 'ItemStats(atk: $attack, str: $strength, def: $defence)';
}

/// Static definition for a single item type. This is *content*, not player
/// state — the same [ItemDefinition] instance is shared by every stack of
/// that item across inventories, shops, and loot tables. Player-owned
/// quantities live separately in the inventory model.
class ItemDefinition {
  final String itemId;
  final String name;
  final ItemCategory category;
  final int tier;
  final bool equippable;
  final EquipmentSlot? slot;
  final ItemStats stats;
  final int sellValue;
  final String? description;

  /// Base damage rating for weapons — the `baseWeaponDamage` term in the
  /// combat engine's maxHit formula. Irrelevant for non-weapon items.
  /// Fists (no weapon equipped) use a hardcoded value of 1 in the combat
  /// engine rather than an item, so this defaults to 0 here.
  final int weaponDamage;

  /// HP restored when eaten — only meaningful for [ItemCategory.consumable]
  /// items. Drives the auto-eat stub in the combat engine; 0 for anything
  /// that isn't food.
  final int healAmount;

  const ItemDefinition({
    required this.itemId,
    required this.name,
    required this.category,
    required this.tier,
    this.equippable = false,
    this.slot,
    this.stats = ItemStats.none,
    this.sellValue = 0,
    this.description,
    this.weaponDamage = 0,
    this.healAmount = 0,
  }) : assert(
          !equippable || slot != null,
          'Equippable items must declare an EquipmentSlot',
        );

  @override
  String toString() => 'ItemDefinition($itemId, $name, tier $tier)';
}

/// A quantity of a specific item — used for action inputs/outputs, loot
/// rewards, and inventory stacks alike.
class ItemQty {
  final String itemId;
  final int qty;

  const ItemQty(this.itemId, this.qty);

  @override
  String toString() => '$qty x $itemId';
}
