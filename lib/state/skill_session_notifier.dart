import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/actions_data.dart';
import '../models/skill_action.dart';
import 'combat_notifier.dart';
import 'game_tick_provider.dart';
import 'player_notifier.dart';

enum SkillSessionStatus { idle, running, stalled }

/// Runtime (not persisted) state of the player's current gathering/crafting
/// loop. Only one action can run at a time — same character, one activity,
/// same as combat.
class SkillSessionState {
  final SkillSessionStatus status;
  final ActionDefinition? action;
  final DateTime? startedAt;
  final int completions;

  /// Progress (0.0-1.0) through the current in-flight cycle.
  final double progress;

  final String? message;

  const SkillSessionState({
    this.status = SkillSessionStatus.idle,
    this.action,
    this.startedAt,
    this.completions = 0,
    this.progress = 0,
    this.message,
  });

  static const idle = SkillSessionState();

  bool get isRunning => status == SkillSessionStatus.running;
  bool get isStalled => status == SkillSessionStatus.stalled;

  SkillSessionState copyWith({
    SkillSessionStatus? status,
    ActionDefinition? action,
    DateTime? startedAt,
    int? completions,
    double? progress,
    String? message,
  }) {
    return SkillSessionState(
      status: status ?? this.status,
      action: action ?? this.action,
      startedAt: startedAt ?? this.startedAt,
      completions: completions ?? this.completions,
      progress: progress ?? this.progress,
      message: message,
    );
  }
}

final skillSessionProvider =
    NotifierProvider<SkillSessionNotifier, SkillSessionState>(SkillSessionNotifier.new);

/// Drives the generic skill/action loop described in the design doc: start
/// an action, tick toward completion in real time, and on each completion
/// grant XP + items — all skill-agnostic, so Mining and Smithing (and any
/// future skill) run through this exact same code path.
class SkillSessionNotifier extends Notifier<SkillSessionState> {
  @override
  SkillSessionState build() {
    ref.listen(gameTickProvider, (previous, next) {
      final now = next.value;
      if (now != null) _onTick(now);
    });
    return SkillSessionState.idle;
  }

  /// Returns null on success, or a user-facing reason the action can't
  /// start (used by the UI to grey out / explain locked actions).
  String? start(String actionId) {
    final action = actionById(actionId);
    final player = ref.read(playerProvider);

    if (player.levelFor(action.skillId) < action.levelRequired) {
      return '${action.name} requires level ${action.levelRequired}';
    }
    if (!ref.read(playerProvider.notifier).hasItems(action.inputs)) {
      return 'Not enough materials for ${action.name}';
    }

    // Only one activity at a time — starting a skill action interrupts combat.
    ref.read(combatSessionProvider.notifier).stop();

    state = SkillSessionState(
      status: SkillSessionStatus.running,
      action: action,
      startedAt: DateTime.now(),
      completions: 0,
    );
    return null;
  }

  void stop() {
    state = SkillSessionState.idle;
  }

  void _onTick(DateTime now) {
    final action = state.action;
    final startedAt = state.startedAt;
    if (action == null || startedAt == null || state.status == SkillSessionStatus.idle) {
      return;
    }

    final durationMs = action.durationSeconds * 1000;
    final elapsedMs = now.difference(startedAt).inMilliseconds;
    final targetCompletions = elapsedMs ~/ durationMs;

    final playerNotifier = ref.read(playerProvider.notifier);
    var applied = state.completions;
    String? stallMessage;

    while (applied < targetCompletions) {
      if (!playerNotifier.hasItems(action.inputs)) {
        stallMessage = 'Out of materials for ${action.name}';
        break;
      }
      playerNotifier.applyActionCompletion(
        consume: action.inputs,
        produce: action.outputs,
        skillId: action.skillId,
        xp: action.xpReward,
      );
      applied++;
    }

    if (stallMessage != null) {
      state = state.copyWith(
        status: SkillSessionStatus.stalled,
        completions: applied,
        message: stallMessage,
      );
      return;
    }

    final cycleElapsedMs = elapsedMs - applied * durationMs;
    final progress = (cycleElapsedMs / durationMs).clamp(0.0, 1.0);
    state = state.copyWith(
      status: SkillSessionStatus.running,
      completions: applied,
      progress: progress,
      message: null,
    );
  }
}
