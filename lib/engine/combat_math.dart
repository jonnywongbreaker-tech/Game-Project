import 'dart:math';

import '../data/items_data.dart';
import '../models/equipment.dart';
import '../models/item.dart';

/// Pure combat formulas, kept free of any state/timer concerns so they're
/// trivial to unit test and reuse (e.g. for a future "combat preview"
/// screen). All wired together with real-time ticking in
/// state/combat_notifier.dart.
class CombatMath {
  CombatMath._();

  /// hitChance = clamp(0.5 + (attack - enemyDefence) * 0.02, 0.1, 0.95)
  static double hitChance({required int attack, required int enemyDefence}) {
    final raw = 0.5 + (attack - enemyDefence) * 0.02;
    return raw.clamp(0.1, 0.95);
  }

  /// maxHit = floor(baseWeaponDamage * (1 + strength / 100))
  static int maxHit({required int baseWeaponDamage, required int strength}) {
    return (baseWeaponDamage * (1 + strength / 100)).floor();
  }

  /// Damage dealt by a landed hit: a uniform roll from 0 to [maxHit]
  /// inclusive (matching the classic "hitsplat of 0 on a landed attack"
  /// feel rather than guaranteeing at least 1 damage).
  static int rollDamage(int maxHit, Random rng) {
    if (maxHit <= 0) return 0;
    return rng.nextInt(maxHit + 1);
  }

  static bool rollHit(double chance, Random rng) => rng.nextDouble() < chance;
}

/// The player's derived combat totals for the current fight: attack and
/// defence bonuses summed across all equipped gear, and the base weapon
/// damage of whatever's in the weapon slot (bare fists deal 1 if nothing
/// is equipped).
class CombatStats {
  final int attack;
  final int strength;
  final int defence;
  final int baseWeaponDamage;

  const CombatStats({
    required this.attack,
    required this.strength,
    required this.defence,
    required this.baseWeaponDamage,
  });

  static const int unarmedDamage = 1;

  factory CombatStats.fromEquipment(Equipment equipment) {
    int attack = 0, strength = 0, defence = 0;
    int weaponDamage = unarmedDamage;

    for (final entry in equipment.all.entries) {
      final item = itemById(entry.value);
      attack += item.stats.attack;
      strength += item.stats.strength;
      defence += item.stats.defence;
      if (entry.key == EquipmentSlot.weapon) {
        weaponDamage = item.weaponDamage > 0 ? item.weaponDamage : unarmedDamage;
      }
    }

    return CombatStats(
      attack: attack,
      strength: strength,
      defence: defence,
      baseWeaponDamage: weaponDamage,
    );
  }

  int get maxHit => CombatMath.maxHit(baseWeaponDamage: baseWeaponDamage, strength: strength);
}
