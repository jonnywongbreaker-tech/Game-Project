import 'dart:math';

import '../models/monster.dart';

/// Rolls a single weighted drop from a monster's loot table. Returns null
/// if the table is empty. Every kill rolls exactly one drop for the MVP —
/// multi-drop tables (guaranteed + weighted rolls) are a natural follow-up
/// once loot balancing matters more.
class LootRoller {
  LootRoller._();

  static ({String itemId, int qty})? roll(List<LootEntry> table, Random rng) {
    if (table.isEmpty) return null;

    final totalWeight = table.fold<int>(0, (sum, e) => sum + e.weight);
    if (totalWeight <= 0) return null;

    var roll = rng.nextInt(totalWeight);
    for (final entry in table) {
      if (roll < entry.weight) {
        final span = entry.effectiveMaxQty - entry.minQty;
        final qty = entry.minQty + (span > 0 ? rng.nextInt(span + 1) : 0);
        return (itemId: entry.itemId, qty: qty);
      }
      roll -= entry.weight;
    }
    return null; // unreachable
  }
}
