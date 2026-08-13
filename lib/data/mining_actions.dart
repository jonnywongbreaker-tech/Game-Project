import '../models/item.dart';
import '../models/skill_action.dart';

/// Mining actions: pure gathering, no inputs, one ore type out. Three
/// tiers gated by level, mirroring the ore items defined in items_data.dart.
final List<ActionDefinition> kMiningActions = [
  const ActionDefinition(
    id: 'mine_copper_ore',
    name: 'Mine Copper Ore',
    skillId: 'mining',
    levelRequired: 1,
    durationSeconds: 3,
    xpReward: 10,
    outputs: [ItemQty('copper_ore', 1)],
  ),
  const ActionDefinition(
    id: 'mine_iron_ore',
    name: 'Mine Iron Ore',
    skillId: 'mining',
    levelRequired: 10,
    durationSeconds: 4,
    xpReward: 20,
    outputs: [ItemQty('iron_ore', 1)],
  ),
  const ActionDefinition(
    id: 'mine_coal',
    name: 'Mine Coal',
    skillId: 'mining',
    levelRequired: 20,
    durationSeconds: 5,
    xpReward: 30,
    outputs: [ItemQty('coal', 1)],
  ),
];
