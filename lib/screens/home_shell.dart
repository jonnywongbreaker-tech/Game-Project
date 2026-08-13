import 'package:flutter/material.dart';

import 'combat_screen.dart';
import 'inventory_screen.dart';
import 'mining_screen.dart';
import 'smithing_screen.dart';

/// Top-level navigation shell. The character can only be doing one thing
/// at a time (mining, smithing, or fighting), but switching tabs is just
/// switching *view* — starting a new activity from another tab is what
/// actually interrupts the current one (see skill_session_notifier.dart /
/// combat_notifier.dart), matching a real "one character, one job" idle
/// game.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _screens = [
    MiningScreen(),
    SmithingScreen(),
    CombatScreen(),
    InventoryScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.terrain), label: 'Mining'),
          NavigationDestination(icon: Icon(Icons.hardware), label: 'Smithing'),
          NavigationDestination(icon: Icon(Icons.sports_kabaddi), label: 'Combat'),
          NavigationDestination(icon: Icon(Icons.backpack), label: 'Inventory'),
        ],
      ),
    );
  }
}
