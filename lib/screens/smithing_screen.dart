import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../data/actions_data.dart';
import '../state/player_notifier.dart';
import '../widgets/action_card.dart';
import '../widgets/skill_header.dart';

class SmithingScreen extends ConsumerWidget {
  const SmithingScreen({super.key});

  static const skillId = 'smithing';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final xp = ref.watch(playerProvider.select((p) => p.xpFor(skillId)));
    final actions = actionsForSkill(skillId);
    final smelting = actions.where((a) => a.id.startsWith('smelt_')).toList();
    final forging = actions.where((a) => a.id.startsWith('forge_')).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Smithing')),
      body: Column(
        children: [
          SkillHeader(skillName: 'Smithing', xp: xp),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.only(bottom: 16),
              children: [
                _sectionLabel('Smelting'),
                ...smelting.map((a) => ActionCard(action: a)),
                _sectionLabel('Forging'),
                ...forging.map((a) => ActionCard(action: a)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionLabel(String label) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
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
