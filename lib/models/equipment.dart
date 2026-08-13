import 'item.dart';

/// Currently equipped item per slot (itemId or null). Kept separate from
/// [Inventory] — equipping doesn't remove the item from the bag/count in
/// this MVP model, it just marks one unit of it as "worn" for stat
/// purposes. That keeps unequip trivial and avoids needing a second
/// "loose vs worn" quantity split.
class Equipment {
  final Map<EquipmentSlot, String> _equipped;

  const Equipment._(this._equipped);

  factory Equipment.empty() => const Equipment._({});

  factory Equipment.fromJson(Map<String, dynamic> json) => Equipment._(
        json.map((k, v) => MapEntry(
              EquipmentSlot.values.firstWhere((s) => s.name == k),
              v as String,
            )),
      );

  Map<String, dynamic> toJson() =>
      _equipped.map((slot, itemId) => MapEntry(slot.name, itemId));

  String? itemIn(EquipmentSlot slot) => _equipped[slot];

  Equipment equip(EquipmentSlot slot, String itemId) {
    final next = Map<EquipmentSlot, String>.from(_equipped);
    next[slot] = itemId;
    return Equipment._(next);
  }

  Equipment unequip(EquipmentSlot slot) {
    final next = Map<EquipmentSlot, String>.from(_equipped);
    next.remove(slot);
    return Equipment._(next);
  }

  Map<EquipmentSlot, String> get all => Map.unmodifiable(_equipped);
}
