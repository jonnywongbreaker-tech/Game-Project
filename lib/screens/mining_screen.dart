import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

import '../data/actions_data.dart';
import '../state/player_notifier.dart';
import '../widgets/action_card.dart';
import '../widgets/skill_header.dart';

class MiningScreen extends ConsumerWidget {
  const MiningScreen({super.key});

  static const skillId = 'mining';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final xp = ref.watch(playerProvider.select((p) => p.xpFor(skillId)));
    final actions = actionsForSkill(skillId);

    return Scaffold(
      appBar: AppBar(title: const Text('Mining')),
      body: Column(
        children: [
          SkillHeader(skillName: 'Mining', xp: xp),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.only(bottom: 16),
              itemCount: actions.length,
              itemBuilder: (context, index) => ActionCard(action: actions[index]),
            ),
          ),
        ],
      ),
    );
  }
}
