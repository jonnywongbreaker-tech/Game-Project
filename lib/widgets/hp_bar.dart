import 'package:flutter/material.dart';

import '../core/theme.dart';

/// A labeled health bar. Used for both the player's HP and a monster's HP
/// during combat — color shifts toward red as the fraction drops so low
/// health reads at a glance.
class HpBar extends StatelessWidget {
  final String label;
  final int current;
  final int max;

  const HpBar({super.key, required this.label, required this.current, required this.max});

  @override
  Widget build(BuildContext context) {
    final fraction = max == 0 ? 0.0 : (current / max).clamp(0.0, 1.0);
    final color = fraction < 0.3
        ? GameColors.emberRed
        : (fraction < 0.6 ? GameColors.gold : GameColors.forestGreen);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
            Text('$current / $max HP', style: const TextStyle(color: GameColors.parchmentDim)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: fraction,
            minHeight: 10,
            color: color,
            backgroundColor: GameColors.slate,
          ),
        ),
      ],
    );
  }
}
