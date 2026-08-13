import '../models/item.dart';
import '../models/skill_action.dart';

/// Smithing actions: smelt ore (+coal, for steel) into bars, then forge
/// bars into gear. Two stages, same generic action shape — the engine
/// doesn't distinguish "smelting" from "forging", it's all just actions
/// with inputs and outputs.
final List<ActionDefinition> kSmithingActions = [
  // --- Smelting: ore -> bars ---
  const ActionDefinition(
    id: 'smelt_copper_bar',
    name: 'Smelt Copper Bar',
    skillId: 'smithing',
    levelRequired: 1,
    durationSeconds: 3,
    xpReward: 12,
    inputs: [ItemQty('copper_ore', 1)],
    outputs: [ItemQty('copper_bar', 1)],
  ),
  const ActionDefinition(
    id: 'smelt_iron_bar',
    name: 'Smelt Iron Bar',
    skillId: 'smithing',
    levelRequired: 10,
    durationSeconds: 4,
    xpReward: 25,
    inputs: [ItemQty('iron_ore', 1)],
    outputs: [ItemQty('iron_bar', 1)],
  ),
  const ActionDefinition(
    id: 'smelt_steel_bar',
    name: 'Smelt Steel Bar',
    skillId: 'smithing',
    levelRequired: 20,
    durationSeconds: 5,
    xpReward: 35,
    inputs: [ItemQty('iron_ore', 1), ItemQty('coal', 2)],
    outputs: [ItemQty('steel_bar', 1)],
  ),

  // --- Forging: bars -> gear ---
  const ActionDefinition(
    id: 'forge_copper_sword',
    name: 'Forge Copper Sword',
    skillId: 'smithing',
    levelRequired: 5,
    durationSeconds: 6,
    xpReward: 30,
    inputs: [ItemQty('copper_bar', 2)],
    outputs: [ItemQty('copper_sword', 1)],
  ),
  const ActionDefinition(
    id: 'forge_copper_platebody',
    name: 'Forge Copper Platebody',
    skillId: 'smithing',
    levelRequired: 8,
    durationSeconds: 8,
    xpReward: 45,
    inputs: [ItemQty('copper_bar', 4)],
    outputs: [ItemQty('copper_platebody', 1)],
  ),
  const ActionDefinition(
    id: 'forge_iron_sword',
    name: 'Forge Iron Sword',
    skillId: 'smithing',
    levelRequired: 15,
    durationSeconds: 7,
    xpReward: 55,
    inputs: [ItemQty('iron_bar', 2)],
    outputs: [ItemQty('iron_sword', 1)],
  ),
  const ActionDefinition(
    id: 'forge_iron_platebody',
    name: 'Forge Iron Platebody',
    skillId: 'smithing',
    levelRequired: 18,
    durationSeconds: 9,
    xpReward: 70,
    inputs: [ItemQty('iron_bar', 4)],
    outputs: [ItemQty('iron_platebody', 1)],
  ),
  const ActionDefinition(
    id: 'forge_steel_sword',
    name: 'Forge Steel Sword',
    skillId: 'smithing',
    levelRequired: 25,
    durationSeconds: 8,
    xpReward: 85,
    inputs: [ItemQty('steel_bar', 2)],
    outputs: [ItemQty('steel_sword', 1)],
  ),
  const ActionDefinition(
    id: 'forge_steel_platebody',
    name: 'Forge Steel Platebody',
    skillId: 'smithing',
    levelRequired: 28,
    durationSeconds: 10,
    xpReward: 100,
    inputs: [ItemQty('steel_bar', 4)],
    outputs: [ItemQty('steel_platebody', 1)],
  ),
];
