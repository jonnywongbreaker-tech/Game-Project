import '../models/skill_action.dart';

/// Every skill registered in the game. Add a new [SkillDefinition] here and
/// a matching list of [ActionDefinition]s in a new data file (see
/// mining_actions.dart / smithing_actions.dart for the pattern) to add a
/// new skill without touching the engine.
final List<SkillDefinition> kSkills = [
  const SkillDefinition(
    skillId: 'mining',
    displayName: 'Mining',
    description: 'Swing a pickaxe at rocks to gather ore.',
    iconKey: 'mining',
  ),
  const SkillDefinition(
    skillId: 'smithing',
    displayName: 'Smithing',
    description: 'Smelt ore into bars, then forge bars into gear.',
    iconKey: 'smithing',
  ),
];

SkillDefinition skillById(String skillId) =>
    kSkills.firstWhere((s) => s.skillId == skillId);
