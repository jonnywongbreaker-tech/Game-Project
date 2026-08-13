import 'package:flutter_riverpod/flutter_riverpod.dart';

/// A single shared heartbeat for every real-time system in the game
/// (skill actions, combat). Rather than each system running its own
/// `Timer.periodic`, they all listen to this one stream and recompute
/// their state from wall-clock timestamps on each tick.
///
/// Driving everything off wall-clock time (rather than counting ticks) is
/// what makes this an honest "real-time" idle game instead of a fake one:
/// progress is always `elapsed = DateTime.now() - startedAt`, so it's
/// correct even if a tick is late, dropped, or the app was backgrounded
/// and comes back minutes later — the UI just catches up on the next
/// tick instead of losing time.
final gameTickProvider = StreamProvider<DateTime>((ref) {
  return Stream<DateTime>.periodic(const Duration(milliseconds: 200), (_) => DateTime.now());
});
