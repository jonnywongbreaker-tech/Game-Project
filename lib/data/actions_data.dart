import '../models/skill_action.dart';
import 'mining_actions.dart';
import 'smithing_actions.dart';

/// Every action in the game, from every skill, in one flat registry. When a
/// new skill's data file is added, register its actions here — this is the
/// only place the skill engine needs to look to find "all actions for
/// skill X" or "the action with id Y".
final List<ActionDefinition> kAllActions = [
  ...kMiningActions,
  ...kSmithingActions,
];

final Map<String, ActionDefinition> _byId = {
  for (final action in kAllActions) action.id: action,
};

ActionDefinition actionById(String actionId) {
  final action = _byId[actionId];
  if (action == null) {
    throw ArgumentError('Unknown actionId: $actionId');
  }
  return action;
}

List<ActionDefinition> actionsForSkill(String skillId) =>
    kAllActions.where((a) => a.skillId == skillId).toList(growable: false);
