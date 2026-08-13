import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../data/items_data.dart';
import '../models/skill_action.dart';
import '../state/player_notifier.dart';
import '../state/skill_session_notifier.dart';

/// One row in a skill screen's action list: shows what the action costs
/// and yields, whether it's locked, and — if it's the action currently
/// running — a live progress bar ticking toward the next completion.
class ActionCard extends ConsumerWidget {
  final ActionDefinition action;

  const ActionCard({super.key, required this.action});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final player = ref.watch(playerProvider);
    final session = ref.watch(skillSessionProvider);

    final level = player.levelFor(action.skillId);
    final locked = level < action.levelRequired;
    final hasInputs = ref.watch(playerProvider.notifier).hasItems(action.inputs);
    final isActive = session.action?.id == action.id && session.status != SkillSessionStatus.idle;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    action.name,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: locked ? GameColors.parchmentDim : GameColors.parchment,
                    ),
                  ),
                ),
                Text(
                  'Lvl ${action.levelRequired}',
                  style: TextStyle(
                    color: locked ? GameColors.emberRed : GameColors.parchmentDim,
                    fontWeight: locked ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            _ioRow(action),
            const SizedBox(height: 4),
            Text(
              '${action.durationSeconds}s  •  +${action.xpReward} xp',
              style: const TextStyle(fontSize: 12, color: GameColors.parchmentDim),
            ),
            const SizedBox(height: 10),
            if (isActive) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(value: session.progress, minHeight: 6),
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    session.isStalled
                        ? (session.message ?? 'Stalled')
                        : '${session.completions} completed',
                    style: TextStyle(
                      fontSize: 12,
                      color: session.isStalled ? GameColors.emberRed : GameColors.parchmentDim,
                    ),
                  ),
                  OutlinedButton(
                    onPressed: () => ref.read(skillSessionProvider.notifier).stop(),
                    child: const Text('Stop'),
                  ),
                ],
              ),
            ] else
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (locked || !hasInputs)
                      ? null
                      : () => ref.read(skillSessionProvider.notifier).start(action.id),
                  child: Text(
                    locked
                        ? 'Requires level ${action.levelRequired}'
                        : (hasInputs ? 'Start' : 'Missing materials'),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _ioRow(ActionDefinition action) {
    final parts = <String>[];
    if (action.inputs.isNotEmpty) {
      parts.add(action.inputs.map((i) => '${i.qty}x ${itemById(i.itemId).name}').join(', '));
    }
    final outputs = action.outputs.map((o) => '${o.qty}x ${itemById(o.itemId).name}').join(', ');

    return Row(
      children: [
        if (parts.isNotEmpty) ...[
          Flexible(child: Text(parts.first, style: const TextStyle(fontSize: 13))),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 6),
            child: Icon(Icons.arrow_forward, size: 14, color: GameColors.parchmentDim),
          ),
        ],
        Flexible(
          child: Text(
            outputs,
            style: const TextStyle(fontSize: 13, color: GameColors.gold),
          ),
        ),
      ],
    );
  }
}
