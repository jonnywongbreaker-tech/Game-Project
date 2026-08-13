import 'package:collection/collection.dart';

/// Immutable snapshot of the player's held items, keyed by itemId -> qty.
/// Wrapped in its own class (rather than a bare Map) so state notifiers can
/// expose small, well-named mutation helpers that always return a new
/// instance, matching the immutable-state pattern used everywhere else.
class Inventory {
  final Map<String, int> _stacks;

  const Inventory._(this._stacks);

  factory Inventory.empty() => const Inventory._({});

  factory Inventory.fromJson(Map<String, dynamic> json) =>
      Inventory._(json.map((k, v) => MapEntry(k, v as int)));

  Map<String, dynamic> toJson() => Map<String, dynamic>.from(_stacks);

  /// Read-only view of everything currently held (itemId -> qty).
  Map<String, int> get stacks => Map.unmodifiable(_stacks);

  int quantityOf(String itemId) => _stacks[itemId] ?? 0;

  bool has(String itemId, int qty) => quantityOf(itemId) >= qty;

  bool hasAll(List<({String itemId, int qty})> requirements) =>
      requirements.every((r) => has(r.itemId, r.qty));

  Inventory add(String itemId, int qty) {
    if (qty <= 0) return this;
    final next = Map<String, int>.from(_stacks);
    next[itemId] = (next[itemId] ?? 0) + qty;
    return Inventory._(next);
  }

  Inventory addAll(Map<String, int> items) {
    var result = this;
    for (final entry in items.entries) {
      result = result.add(entry.key, entry.value);
    }
    return result;
  }

  /// Removes [qty] of [itemId]. Throws a [StateError] if insufficient —
  /// callers should check [has] first; the engine always does this before
  /// consuming action inputs so this should never trigger in practice.
  Inventory remove(String itemId, int qty) {
    if (qty <= 0) return this;
    final current = quantityOf(itemId);
    if (current < qty) {
      throw StateError('Cannot remove $qty x $itemId: only $current held');
    }
    final next = Map<String, int>.from(_stacks);
    final remaining = current - qty;
    if (remaining <= 0) {
      next.remove(itemId);
    } else {
      next[itemId] = remaining;
    }
    return Inventory._(next);
  }

  @override
  bool operator ==(Object other) =>
      other is Inventory && const MapEquality<String, int>().equals(other._stacks, _stacks);

  @override
  int get hashCode => const MapEquality<String, int>().hash(_stacks);
}
