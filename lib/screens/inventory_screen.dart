import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../data/items_data.dart';
import '../models/item.dart';
import '../state/player_notifier.dart';

class InventoryScreen extends ConsumerWidget {
  const InventoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final player = ref.watch(playerProvider);
    final stacks = player.inventory.stacks.entries.toList()
      ..sort((a, b) => itemById(a.key).name.compareTo(itemById(b.key).name));

    return Scaffold(
      appBar: AppBar(title: const Text('Inventory & Equipment')),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          const _SectionLabel('Equipment'),
          Row(
            children: [
              Expanded(
                child: _EquipmentSlotCard(slot: EquipmentSlot.weapon, label: 'Weapon'),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _EquipmentSlotCard(slot: EquipmentSlot.body, label: 'Body'),
              ),
            ],
          ),
          const _SectionLabel('Inventory'),
          if (stacks.isEmpty)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                child: Text('Nothing here yet — go mine or fight!',
                    style: TextStyle(color: GameColors.parchmentDim)),
              ),
            )
          else
            ...stacks.map((e) => _InventoryRow(itemId: e.key, qty: e.value)),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel(this.label);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 16, 4, 8),
        child: Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
            color: GameColors.parchmentDim,
          ),
        ),
      );
}

class _EquipmentSlotCard extends ConsumerWidget {
  final EquipmentSlot slot;
  final String label;

  const _EquipmentSlotCard({required this.slot, required this.label});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final equipment = ref.watch(playerProvider.select((p) => p.equipment));
    final itemId = equipment.itemIn(slot);
    final item = itemId != null ? itemById(itemId) : null;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: GameColors.parchmentDim)),
            const SizedBox(height: 4),
            Text(
              item?.name ?? 'Empty',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: item == null ? GameColors.parchmentDim : GameColors.parchment,
              ),
            ),
            if (item != null) ...[
              const SizedBox(height: 4),
              Text(_statSummary(item), style: const TextStyle(fontSize: 12, color: GameColors.gold)),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => ref.read(playerProvider.notifier).unequip(slot),
                  child: const Text('Unequip'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _statSummary(ItemDefinition item) {
    final parts = <String>[];
    if (item.stats.attack != 0) parts.add('Atk ${item.stats.attack}');
    if (item.stats.strength != 0) parts.add('Str ${item.stats.strength}');
    if (item.stats.defence != 0) parts.add('Def ${item.stats.defence}');
    if (item.weaponDamage > 0) parts.add('Dmg ${item.weaponDamage}');
    return parts.join('  ');
  }
}

class _InventoryRow extends ConsumerWidget {
  final String itemId;
  final int qty;

  const _InventoryRow({required this.itemId, required this.qty});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final item = itemById(itemId);
    final notifier = ref.read(playerProvider.notifier);

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: GameColors.slate,
          child: Icon(_iconFor(item.category), color: GameColors.gold, size: 18),
        ),
        title: Text(item.name),
        subtitle: Text('${item.sellValue} gold ea.  •  Tier ${item.tier}'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('x$qty', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(width: 8),
            if (item.equippable)
              TextButton(
                onPressed: () => notifier.equip(itemId, item.slot!),
                child: const Text('Equip'),
              )
            else if (item.category == ItemCategory.consumable)
              TextButton(
                onPressed: () {
                  notifier.consumeItems([ItemQty(itemId, 1)]);
                  notifier.heal(item.healAmount);
                },
                child: const Text('Eat'),
              ),
          ],
        ),
      ),
    );
  }

  IconData _iconFor(ItemCategory category) {
    switch (category) {
      case ItemCategory.ore:
        return Icons.terrain;
      case ItemCategory.bar:
        return Icons.view_agenda;
      case ItemCategory.weapon:
        return Icons.gavel;
      case ItemCategory.armor:
        return Icons.shield;
      case ItemCategory.consumable:
        return Icons.restaurant;
      case ItemCategory.tool:
        return Icons.build;
      case ItemCategory.misc:
        return Icons.category;
    }
  }
}
