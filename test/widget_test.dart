// Smoke test: the app should boot straight to the Mining tab with a fresh
// character and not crash wiring up Riverpod, the game tick stream, or the
// initial screen.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:idle_forge/app.dart';
import 'package:idle_forge/models/player.dart';
import 'package:idle_forge/state/player_notifier.dart';

void main() {
  testWidgets('boots to the Mining tab with starter state', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [initialPlayerProvider.overrideWithValue(Player.newGame())],
        child: const IdleForgeApp(),
      ),
    );
    await tester.pump();

    expect(find.text('Mining'), findsWidgets);
    expect(find.text('Mine Copper Ore'), findsOneWidget);
  });
}
