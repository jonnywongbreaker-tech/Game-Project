# Idle Forge

A medieval-fantasy idle RPG for iOS/Android, built with Flutter. Mine ore,
smith gear, and send your character off to auto-fight monsters — all
idle/real-time, no combat micromanagement.

## Core loop

**Mining → Smithing → Combat**, all built on one generic skill/action
engine so new skills (Fishing, Woodcutting, ...) drop in as data, not code.

## Getting started

```bash
flutter pub get
flutter run
flutter test      # xp curve + smoke test
flutter analyze
```

## Architecture

```
lib/
  models/     Plain data classes: Item, ActionDefinition, Monster, Player,
              Inventory, Equipment. No Flutter, no Riverpod — just shapes.
  data/       Static content: every item, action, monster, and zone in the
              game, as const/final registries keyed by id. This is the
              only place you touch to add content.
  engine/     Pure game-logic functions with no state/timers: the OSRS xp
              formula, combat math, loot table rolling. Trivially unit
              testable.
  state/      Riverpod Notifiers that own runtime state and wire the pure
              engine functions to real-time ticks: PlayerNotifier (save
              data), SkillSessionNotifier (generic gather/craft loop),
              CombatNotifier (auto-fight loop), plus a shared game tick
              stream both loops listen to.
  screens/    One screen per tab (Mining, Smithing, Combat, Inventory) plus
              the bottom-nav shell.
  widgets/    Reusable UI: action cards, HP bars, skill headers.
  core/       Theme/palette.
```

### Why one skill engine for every skill

`ActionDefinition` (id, skillId, levelRequired, durationSeconds, xpReward,
inputs, outputs) is the same shape whether it's "mine copper ore" or
"forge a steel platebody" — mining just has empty `inputs`. Adding
Fishing later means: add `SkillDefinition` to `data/skills_data.dart`, add
a `data/fishing_actions.dart` with a few `ActionDefinition`s, register it
in `data/actions_data.dart`. `SkillSessionNotifier` never needs to change.

### Why state management is Riverpod

- **Testable without widgets.** The tick-driven engines (skill loop, combat
  loop) are `Notifier`s that can be constructed and driven in a plain Dart
  test via `ProviderContainer` — no `pumpWidget` needed to verify combat
  math or xp gain.
- **No `BuildContext` threading.** A background game loop reacting to a
  shared tick stream reads/writes other notifiers directly (`ref.read(...)`)
  — Provider's `context.read` pattern gets awkward here since the "reader"
  isn't a widget.
- **Less ceremony than Bloc** for this scale of app — no event/state class
  pairs for every interaction — while still being far more structured and
  testable than raw `setState`/`ChangeNotifier` scattered across widgets.
- `ref.listen` on a single shared `gameTickProvider` stream lets both the
  skill loop and combat loop tick off one heartbeat instead of each owning
  a `Timer`.

### Real-time, not simulated

Every timed system (`SkillSessionNotifier`, `CombatNotifier`) anchors on a
wall-clock `DateTime` (`startedAt` / `exchangeAnchor`) and recomputes
`elapsed = now - anchor` on each tick, rather than counting down a ticked
timer. That means progress is always correct even if a tick is late,
dropped, or the app was backgrounded and resumed later — the next tick
just catches up (bounded by a safety cap in combat so a very long
backgrounding doesn't spin).

### Design decisions worth knowing about

- **XP is computed live**, not from a static table (`engine/xp_calculator.dart`),
  per the OSRS formula, with an incrementally-cached cumulative sum so
  repeated lookups stay O(1) amortized. Nothing caps level at 99.
- **One activity at a time.** Starting a skill action stops any active
  combat and vice versa (`SkillSessionNotifier.start` /
  `CombatNotifier.start` each stop the other) — one character, one job.
- **Combat stats come from equipped gear only** — there's no Attack/
  Strength/Defence *skill* yet (no XP grind to raise them), since the spec
  didn't call for one and it keeps the MVP scope tight. Equip better gear
  to hit harder. Slot into `data/skills_data.dart` + a training loop later
  if/when combat leveling is wanted.
- **Auto-eat is a real code path with no real food yet.** There's no
  Cooking skill, so `CombatNotifier._tryAutoEat` looks for any
  `ItemCategory.consumable` in the inventory and eats it below 30% HP. One
  stub item (Stale Bread, 3x in the starting inventory) exists purely so
  this is exercised out of the box; real food slots in later without
  touching the combat engine.
- **Death has no item loss**, per spec: HP goes to 0, a 30–60s recovery
  timer starts, and the player is fully healed when it elapses
  (`PlayerNotifier.checkRecoveryComplete`, ticked every game tick).

## Content in this MVP

- **Mining**: Copper (lvl 1) → Iron (lvl 10) → Coal (lvl 20).
- **Smithing**: smelt ore into bars (copper/iron/steel — steel needs iron +
  coal), forge bars into a sword + platebody per tier.
- **Combat**: 4 zones (Giant Rat → Goblin → Bandit → Skeleton Warrior),
  each with its own loot table.
- **Inventory/Equipment**: weapon + body slots, equip/unequip, eat food.

## Not in scope yet (by design)

Ads/IAP, Cooking (and therefore real food), an Attack/Strength/Defence
training skill, offline-progress UI (the engine *can* catch up past
progress on resume, but nothing surfaces "while you were away" yet),
persistence beyond a single local save slot.
