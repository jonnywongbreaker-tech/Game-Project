# ToonScript format

An episode is one JSON file in `src/episodes/`, registered in `src/episodes/scripts.ts`.
Run `npm run check` after editing: it explains any mistake in plain words.

```json
{
  "id": "Ep003",
  "title": "Why Cats Knock Things Over",
  "cast": {"mia": "mia", "leo": "leo"},
  "thumbnail": {"at": 12, "text": "CATS?!"},
  "scenes": [
    {
      "backdrop": "room",
      "title": "Why Cats Knock Things Over",
      "actors": {"mia": {"x": 700}, "leo": {"x": 1250}},
      "beats": [
        {"narrate": "Every cat owner has seen it happen."},
        {"say": "mia", "text": "Why do they DO that?", "pose": "shrug", "expression": "angry"},
        {"do": [{"actor": "leo", "walkTo": 950}]},
        {"say": "leo", "text": "Science has an answer.", "pose": "point", "camera": {"zoom": 1.3, "focus": "leo"}}
      ]
    }
  ]
}
```

## Episode fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Letters, digits, dashes. Becomes `<id>-Long`, `<id>-Short`, `<id>-Thumb`. |
| `title` | yes | Human title. |
| `cast` | yes | `actorId → preset` (`mia`, `leo`, `ada`, `ben`, `zoe`) or a full design object (see `src/engine/designs.ts`). |
| `scenes` | yes | List of scenes, played in order with a quick fade between them. |
| `thumbnail` | no | `{"at": seconds, "text": "BIG WORDS"}` |
| `subtitles` | no | `"both"` (default), `"long"`, `"short"`, `"none"` |
| `music` | no | `{"src": "music/theme.mp3", "volume": 0.15}`, looped |
| `accent` | no | Colour for title cards and notes. |
| `cps` | no | Speaking speed for estimated timing (default 15 characters/second). |
| `pause` | no | Silence after each spoken line (default 0.35 s). |

## Scenes

| Field | Meaning |
| --- | --- |
| `backdrop` | `park`, `room`, `city`, `studio` |
| `tint` | Studio colour, e.g. `"#c9a7ff"` |
| `title` | Chapter card shown for the first 2 seconds |
| `actors` | Who is in the scene and their starting state (below) |
| `camera` | Starting camera (below) |
| `beats` | What happens, in order |

The world is 1920 wide; `x: 960` is centre. Characters are ~200 wide, so keep them **300+ apart**.
Unplaced actors are spread evenly, and by default they face each other.

### Actor state (in `actors` and in actions)

`x`, `facing` (`"left"`/`"right"`), `pose`, `expression`, `emote`, `look` (-1…1), `scale`, `y` (negative = higher).

- **Poses:** `idle`, `wave`, `point`, `shrug`, `cheer`, `think`, `hips`, `present`.
  `wave`, `point`, `shrug`, `cheer` and `present` are gestures that return to `idle` when the beat ends.
  `think` and `hips` stay until changed.
- **Expressions:** `neutral`, `happy`, `laugh`, `sad`, `angry`, `surprised`, `smug`. These stay until changed.
- **Emotes:** a bubble above the head, e.g. `"!"`, `"?"`, `"..."`, `"♥"`. It hides after ~2 s.

## Beats

Beats run one after another. A beat is any combination of:

| Field | Meaning |
| --- | --- |
| `say` + `text` | A character speaks: mouth moves, name shows in the subtitle. Use `"say": "narrator"` for an off-screen voice. |
| `narrate` | Shorthand for an off-screen narrator line (faceless style). |
| `audio` | Voice clip for this line, e.g. `"vo/ep003/001.mp3"`. Run `npm run sync-audio` after adding clips. |
| `pose`, `expression`, `emote` | Applied to **the speaker** for this line. |
| `do` | List of actions for any actors, starting with the beat (below). |
| `camera` | Camera move starting with the beat (below). |
| `caption` | On-screen text: `"BIG WORDS"` or `{"text": "1. TEACH IT", "style": "note", "hold": 6}`. Styles: `big`, `title`, `note`. |
| `sfx` | Sound effect, e.g. `"sfx/pop.wav"` |
| `dur` | Force the beat's length (seconds). |
| `pause` | Silence after the beat. |

**Timing:** a spoken beat lasts as long as its audio, or an estimate from the text when there is no audio.
A silent beat with walking lasts until the walk ends. Put `do` on a spoken beat to make actions
happen *while* someone talks.

### Actions (`do`)

```json
{"actor": "leo", "walkTo": 1200}
{"actor": "leo", "enter": "left"}
{"actor": "leo", "exit": "right", "speed": 600}
{"actor": "mia", "pose": "cheer", "expression": "laugh", "emote": "!"}
{"actor": "mia", "facing": "left"}
```

`enter` starts the actor off-screen and walks them to `walkTo`, or to their scene `x`.

### Camera

```json
{"camera": {"zoom": 1.3, "focus": "mia"}}
{"camera": {"zoom": 1, "focus": "auto"}}
```

- `focus`: `"auto"` (default) shows the whole stage in 16:9 and follows whoever is speaking in 9:16.
  Also accepts `"speaker"`, `"center"`, an actor id, or a world x number.
- `zoom`: 1 = default framing. Moves ease over 0.8 s.
- `y`: world height to centre on (lower numbers = higher up; ~520 frames faces when zoomed).

## Writing tips (also used by `npm run check`)

- Change the camera or show a caption at least every ~10–12 seconds.
- Keep lines under ~120 characters; split long narration into several beats.
- Shorts must be 3 minutes or less.
- Start with estimated timing, preview in the studio, then record the voice-over and run `npm run sync-audio`.
