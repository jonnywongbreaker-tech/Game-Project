import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'models/player.dart';
import 'state/player_notifier.dart';
import 'state/save_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final savedPlayer = await SaveService.load();

  runApp(
    ProviderScope(
      overrides: [
        // Whatever the save file contained (or a fresh character if there
        // wasn't one) becomes PlayerNotifier's starting state.
        initialPlayerProvider.overrideWithValue(savedPlayer ?? Player.newGame()),
      ],
      child: const IdleForgeApp(),
    ),
  );
}
