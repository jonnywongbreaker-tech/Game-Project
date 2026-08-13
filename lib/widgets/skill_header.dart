import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../engine/xp_calculator.dart';

/// Level + XP progress bar shown at the top of a skill screen. Level and
/// progress are always derived live from [xp] via [XpCalculator] — nothing
/// here is a stored/cached value.
class SkillHeader extends StatelessWidget {
  final String skillName;
  final int xp;

  const SkillHeader({super.key, required this.skillName, required this.xp});

  @override
  Widget build(BuildContext context) {
    final level = XpCalculator.levelForXp(xp);
    final progress = XpCalculator.progressToNextLevel(xp);
    final toNext = XpCalculator.xpToNextLevel(xp);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                skillName,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              Text(
                'Level $level',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: GameColors.gold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(value: progress, minHeight: 8),
          ),
          const SizedBox(height: 4),
          Text(
            '$xp xp  •  $toNext xp to next level',
            style: const TextStyle(fontSize: 12, color: GameColors.parchmentDim),
          ),
        ],
      ),
    );
  }
}
