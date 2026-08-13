import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../data/monsters_data.dart';
import '../models/player.dart';
import '../state/combat_notifier.dart';
import '../state/game_tick_provider.dart';
import '../state/player_notifier.dart';
import '../widgets/hp_bar.dart';

class CombatScreen extends ConsumerWidget {
  const CombatScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watched purely to force a rebuild every tick — needed for the live
    // recovery countdown and combat log/HP, none of which change unless
    // something re-renders on the same cadence as the game loop.
    ref.watch(gameTickProvider);

    final player = ref.watch(playerProvider);
    final combat = ref.watch(combatSessionProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Combat')),
      body: player.isRecovering
          ? _RecoveryView(recoveryEndsAt: player.recoveryEndsAt!)
          : (combat.isFighting ? _FightView(combat: combat, player: player) : const _ZonePicker()),
    );
  }
}

class _RecoveryView extends StatelessWidget {
  final DateTime recoveryEndsAt;

  const _RecoveryView({required this.recoveryEndsAt});

  @override
  Widget build(BuildContext context) {
    final secondsLeft = recoveryEndsAt.difference(DateTime.now()).inSeconds.clamp(0, 999);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.local_hospital, size: 48, color: GameColors.emberRed),
            const SizedBox(height: 16),
            const Text(
              'You are recovering in town...',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              '$secondsLeft s remaining',
              style: const TextStyle(fontSize: 16, color: GameColors.parchmentDim),
            ),
            const SizedBox(height: 4),
            const Text(
              'No items were lost.',
              style: TextStyle(fontSize: 12, color: GameColors.parchmentDim),
            ),
          ],
        ),
      ),
    );
  }
}

class _ZonePicker extends ConsumerWidget {
  const _ZonePicker();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: kCombatZones.length,
      itemBuilder: (context, index) {
        final zone = kCombatZones[index];
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 6),
          child: ListTile(
            title: Text(zone.name, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(zone.description),
            trailing: ElevatedButton(
              onPressed: () {
                final error = ref.read(combatSessionProvider.notifier).start(zone.zoneId);
                if (error != null && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error)));
                }
              },
              child: const Text('Fight'),
            ),
          ),
        );
      },
    );
  }
}

class _FightView extends ConsumerWidget {
  final CombatState combat;
  final Player player;

  const _FightView({required this.combat, required this.player});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final monster = combat.monster!;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              HpBar(label: player.name, current: player.currentHp, max: player.maxHp),
              const SizedBox(height: 12),
              HpBar(
                label: '${monster.name} (Lvl ${monster.level})',
                current: combat.monsterHp.clamp(0, monster.hp),
                max: monster.hp,
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Kills: ${combat.kills}', style: const TextStyle(color: GameColors.gold)),
              OutlinedButton(
                onPressed: () => ref.read(combatSessionProvider.notifier).stop(),
                child: const Text('Retreat'),
              ),
            ],
          ),
        ),
        const Divider(height: 24, color: GameColors.slateLight),
        Expanded(
          child: ListView.builder(
            reverse: true,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: combat.log.length,
            itemBuilder: (context, index) {
              final entry = combat.log[combat.log.length - 1 - index];
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Text(entry.message, style: const TextStyle(fontSize: 13)),
              );
            },
          ),
        ),
      ],
    );
  }
}
