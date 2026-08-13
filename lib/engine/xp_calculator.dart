import 'dart:math' as math;

/// Computes level <-> XP using the exact OSRS XP formula, live, rather than
/// a static lookup table:
///
///   XP(level) = floor( (1/4) * sum_{n=1}^{level-1} floor(n + 300 * 2^(n/7)) )
///
/// This is deliberately *not* pre-baked into a table so the curve keeps
/// working unmodified past level 99 if/when higher content is added —
/// there's nothing capping `level` here.
///
/// The per-level increment `floor(n + 300 * 2^(n/7))` is cached
/// incrementally as a running cumulative sum, so repeated calls (e.g. the
/// UI re-deriving a level every tick) are O(1) amortized instead of
/// recomputing the whole sum from scratch each time.
class XpCalculator {
  XpCalculator._();

  /// _cumulative[k] = sum_{n=1}^{k} floor(n + 300 * 2^(n/7)), with
  /// _cumulative[0] = 0.
  static final List<int> _cumulative = [0];

  static int _incrementFor(int n) {
    return (n + 300 * math.pow(2, n / 7)).floor();
  }

  static void _ensureCumulative(int k) {
    while (_cumulative.length <= k) {
      final n = _cumulative.length; // next n to append
      _cumulative.add(_cumulative.last + _incrementFor(n));
    }
  }

  /// Total XP required to *reach* [level]. Level 1 always requires 0 XP.
  static int xpForLevel(int level) {
    if (level <= 1) return 0;
    final k = level - 1;
    _ensureCumulative(k);
    return (_cumulative[k] / 4).floor();
  }

  /// Derives the current level from a raw XP total. [maxLevel] is a search
  /// bound, not a hard game cap — raise it freely for future content.
  static int levelForXp(int xp, {int maxLevel = 300}) {
    if (xp <= 0) return 1;
    int level = 1;
    while (level < maxLevel && xpForLevel(level + 1) <= xp) {
      level++;
    }
    return level;
  }

  /// XP still needed to reach the next level from [xp].
  static int xpToNextLevel(int xp) {
    final level = levelForXp(xp);
    return xpForLevel(level + 1) - xp;
  }

  /// Fractional progress (0.0-1.0) through the current level, for progress
  /// bars in the UI.
  static double progressToNextLevel(int xp) {
    final level = levelForXp(xp);
    final currentLevelXp = xpForLevel(level);
    final nextLevelXp = xpForLevel(level + 1);
    if (nextLevelXp <= currentLevelXp) return 1.0;
    return (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
  }
}
