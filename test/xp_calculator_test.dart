// Verifies XpCalculator against known OSRS XP-table values. These numbers
// are the well-documented reference points for the exact formula the game
// spec calls for — they are NOT special-cased in the implementation, which
// computes everything live from the formula.
import 'package:flutter_test/flutter_test.dart';
import 'package:idle_forge/engine/xp_calculator.dart';

void main() {
  group('XpCalculator.xpForLevel', () {
    test('level 1 requires 0 xp', () {
      expect(XpCalculator.xpForLevel(1), 0);
    });

    test('matches known OSRS xp thresholds', () {
      expect(XpCalculator.xpForLevel(2), 83);
      expect(XpCalculator.xpForLevel(10), 1154);
      expect(XpCalculator.xpForLevel(50), 101333);
      expect(XpCalculator.xpForLevel(92), 6517253);
      expect(XpCalculator.xpForLevel(99), 13034431);
    });

    test('extends smoothly past level 99 (no static table cutoff)', () {
      final xp100 = XpCalculator.xpForLevel(100);
      final xp120 = XpCalculator.xpForLevel(120);
      expect(xp100, greaterThan(XpCalculator.xpForLevel(99)));
      expect(xp120, greaterThan(xp100));
    });
  });

  group('XpCalculator.levelForXp', () {
    test('round-trips with xpForLevel at level boundaries', () {
      for (final level in [1, 2, 10, 50, 99, 105]) {
        final xp = XpCalculator.xpForLevel(level);
        expect(XpCalculator.levelForXp(xp), level);
      }
    });

    test('xp just below a threshold stays at the previous level', () {
      final xpFor10 = XpCalculator.xpForLevel(10);
      expect(XpCalculator.levelForXp(xpFor10 - 1), 9);
    });

    test('zero xp is level 1', () {
      expect(XpCalculator.levelForXp(0), 1);
    });
  });

  group('XpCalculator.progressToNextLevel', () {
    test('is 0.0 exactly at a level threshold', () {
      final xp = XpCalculator.xpForLevel(10);
      expect(XpCalculator.progressToNextLevel(xp), 0.0);
    });

    test('is between 0 and 1 mid-level', () {
      final xp = XpCalculator.xpForLevel(10) + 50;
      final progress = XpCalculator.progressToNextLevel(xp);
      expect(progress, greaterThan(0.0));
      expect(progress, lessThan(1.0));
    });
  });
}
