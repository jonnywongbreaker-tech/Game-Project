import 'item.dart';

/// Generic definition of a single "thing you can do" for a skill — mining a
/// copper rock, smelting a bar, smithing a sword, etc. Every skill in the
/// game (present and future) reuses this exact shape, which is what lets
/// the skill engine stay skill-agnostic: it never needs to know it's
/// "mining" vs. "fishing", only that an action has a duration, an XP
/// reward, and optional item inputs/outputs.
class ActionDefinition {
  /// Globally unique id, e.g. `mining_copper_ore`.
  final String id;
  final String name;

  /// Which skill this action grants XP toward, e.g. `mining`, `smithing`.
  final String skillId;

  final int levelRequired;
  final int durationSeconds;
  final int xpReward;

  /// Items consumed from the inventory each time the action completes.
  /// Empty for gathering actions (mining ore costs nothing but time).
  final List<ItemQty> inputs;

  /// Items granted to the inventory each time the action completes.
  final List<ItemQty> outputs;

  /// Optional icon/asset key for UI use; not gameplay-relevant.
  final String? iconKey;

  const ActionDefinition({
    required this.id,
    required this.name,
    required this.skillId,
    required this.levelRequired,
    required this.durationSeconds,
    required this.xpReward,
    this.inputs = const [],
    this.outputs = const [],
    this.iconKey,
  });

  @override
  String toString() => 'ActionDefinition($id, lvl $levelRequired, ${durationSeconds}s)';
}

/// A player's progress in one skill. Level is always derived live from
/// [xp] via [XpCalculator] rather than stored — see engine/xp_calculator.dart.
class SkillProgress {
  final String skillId;
  final int xp;

  const SkillProgress({required this.skillId, this.xp = 0});

  SkillProgress copyWith({int? xp}) => SkillProgress(
        skillId: skillId,
        xp: xp ?? this.xp,
      );

  Map<String, dynamic> toJson() => {'skillId': skillId, 'xp': xp};

  factory SkillProgress.fromJson(Map<String, dynamic> json) => SkillProgress(
        skillId: json['skillId'] as String,
        xp: json['xp'] as int? ?? 0,
      );
}

/// Metadata for a skill itself (as opposed to a player's progress in it, or
/// one of its actions). Registering a new skill here plus a handful of
/// [ActionDefinition]s in a data file is all that's needed to add a new
/// skill to the game — the engine and UI both drive off this list rather
/// than hardcoding "mining" / "smithing" anywhere.
class SkillDefinition {
  final String skillId;
  final String displayName;
  final String description;
  final String iconKey;

  const SkillDefinition({
    required this.skillId,
    required this.displayName,
    required this.description,
    required this.iconKey,
  });
}
