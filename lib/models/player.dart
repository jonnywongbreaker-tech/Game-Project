import '../engine/xp_calculator.dart';
import 'equipment.dart';
import 'inventory.dart';
import 'skill_action.dart';

/// Root save-state for the player: every skill's XP, held items, worn gear,
/// and combat vitals. Combat level stats (attack/strength/defence) are
/// *not* separate skills for the MVP — they come from equipped gear only,
/// since there's no dedicated combat-training skill yet. That keeps the
/// generic skill engine focused purely on Mining/Smithing-shaped
/// gather-and-craft skills.
class Player {
  final String name;
  final Map<String, SkillProgress> skills;
  final Inventory inventory;
  final Equipment equipment;

  /// Current HP out of [maxHp]. Persisted so a mid-fight app close doesn't
  /// magically heal the player.
  final int currentHp;

  /// If set, the player is retreating/recovering after a death and cannot
  /// start a new fight until this time passes.
  final DateTime? recoveryEndsAt;

  const Player({
    required this.name,
    required this.skills,
    required this.inventory,
    required this.equipment,
    required this.currentHp,
    this.recoveryEndsAt,
  });

  factory Player.newGame({String name = 'Adventurer'}) => Player(
        name: name,
        skills: const {},
        // A few starter rations so the auto-eat stub has something to work
        // with before Cooking exists — see data/items_data.dart.
        inventory: Inventory.empty().add('stale_bread', 3),
        equipment: Equipment.empty(),
        currentHp: baseMaxHp,
      );

  /// Flat base HP pool for the MVP (no Hitpoints skill yet). Revisit once
  /// a Hitpoints/Constitution skill exists.
  static const int baseMaxHp = 50;
  int get maxHp => baseMaxHp;

  int xpFor(String skillId) => skills[skillId]?.xp ?? 0;
  int levelFor(String skillId) => XpCalculator.levelForXp(xpFor(skillId));

  bool get isRecovering =>
      recoveryEndsAt != null && recoveryEndsAt!.isAfter(DateTime.now());

  Player copyWith({
    String? name,
    Map<String, SkillProgress>? skills,
    Inventory? inventory,
    Equipment? equipment,
    int? currentHp,
    DateTime? recoveryEndsAt,
    bool clearRecovery = false,
  }) {
    return Player(
      name: name ?? this.name,
      skills: skills ?? this.skills,
      inventory: inventory ?? this.inventory,
      equipment: equipment ?? this.equipment,
      currentHp: currentHp ?? this.currentHp,
      recoveryEndsAt: clearRecovery ? null : (recoveryEndsAt ?? this.recoveryEndsAt),
    );
  }

  Player grantXp(String skillId, int amount) {
    final existing = skills[skillId] ?? SkillProgress(skillId: skillId);
    final next = Map<String, SkillProgress>.from(skills);
    next[skillId] = existing.copyWith(xp: existing.xp + amount);
    return copyWith(skills: next);
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'skills': skills.map((k, v) => MapEntry(k, v.toJson())),
        'inventory': inventory.toJson(),
        'equipment': equipment.toJson(),
        'currentHp': currentHp,
        'recoveryEndsAt': recoveryEndsAt?.toIso8601String(),
      };

  factory Player.fromJson(Map<String, dynamic> json) => Player(
        name: json['name'] as String? ?? 'Adventurer',
        skills: (json['skills'] as Map<String, dynamic>? ?? {}).map(
          (k, v) => MapEntry(k, SkillProgress.fromJson(v as Map<String, dynamic>)),
        ),
        inventory: Inventory.fromJson(json['inventory'] as Map<String, dynamic>? ?? {}),
        equipment: Equipment.fromJson(json['equipment'] as Map<String, dynamic>? ?? {}),
        currentHp: json['currentHp'] as int? ?? baseMaxHp,
        recoveryEndsAt: json['recoveryEndsAt'] != null
            ? DateTime.parse(json['recoveryEndsAt'] as String)
            : null,
      );
}
