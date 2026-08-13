import 'package:flutter/material.dart';

/// Medieval-fantasy palette: parchment text on deep slate/ink backgrounds
/// with a gold accent for anything "important" (levels, gold value,
/// primary actions). Centralized here so screens never hardcode colors.
class GameColors {
  GameColors._();

  static const ink = Color(0xFF1B1712);
  static const slate = Color(0xFF241F19);
  static const slateLight = Color(0xFF322A21);
  static const parchment = Color(0xFFEFE3C8);
  static const parchmentDim = Color(0xFFBBAE8E);
  static const gold = Color(0xFFCBA135);
  static const emberRed = Color(0xFFB33A2E);
  static const forestGreen = Color(0xFF4C7A3A);
  static const steelBlue = Color(0xFF5B7A96);
}

ThemeData buildGameTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: GameColors.ink,
    colorScheme: base.colorScheme.copyWith(
      primary: GameColors.gold,
      secondary: GameColors.emberRed,
      surface: GameColors.slate,
      onSurface: GameColors.parchment,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: GameColors.slate,
      foregroundColor: GameColors.parchment,
      elevation: 0,
      centerTitle: true,
    ),
    cardTheme: CardThemeData(
      color: GameColors.slateLight,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: Color(0x33CBA135)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: GameColors.slate,
      indicatorColor: GameColors.gold.withValues(alpha: 0.25),
      labelTextStyle: WidgetStateProperty.all(
        const TextStyle(color: GameColors.parchment, fontSize: 12),
      ),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: GameColors.gold,
      linearTrackColor: GameColors.slate,
    ),
    textTheme: base.textTheme.apply(
      bodyColor: GameColors.parchment,
      displayColor: GameColors.parchment,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: GameColors.gold,
        foregroundColor: GameColors.ink,
        disabledBackgroundColor: GameColors.slateLight,
        disabledForegroundColor: GameColors.parchmentDim,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),
  );
}
