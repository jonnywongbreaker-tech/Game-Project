import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/player.dart';

/// Thin persistence layer over shared_preferences. The whole [Player] is
/// serialized to a single JSON blob — fine at this scale, and trivial to
/// swap for a real database later without touching callers.
class SaveService {
  SaveService._();

  static const _key = 'idle_forge_player_save_v1';

  static Future<Player?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return null;
    try {
      return Player.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      // Corrupt or incompatible save — start fresh rather than crash.
      return null;
    }
  }

  static Future<void> save(Player player) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(player.toJson()));
  }
}
