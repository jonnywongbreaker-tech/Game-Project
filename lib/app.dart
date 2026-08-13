import 'package:flutter/material.dart';

import 'core/theme.dart';
import 'screens/home_shell.dart';

class IdleForgeApp extends StatelessWidget {
  const IdleForgeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Idle Forge',
      debugShowCheckedModeBanner: false,
      theme: buildGameTheme(),
      home: const HomeShell(),
    );
  }
}
