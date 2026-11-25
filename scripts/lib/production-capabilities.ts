import {sceneSchema} from '../../src/production/scene/schema';
import {ENVIRONMENTS, PROPS} from '../../src/production/scene/types';
import {FPS, HEIGHT, TEMPLATES, WIDTH} from '../../src/production/types';

const templates = {
  card: {description: 'Static headline card', required: ['headline'], optional: []},
  flow: {description: 'Two to four progressively highlighted steps', required: ['headline', 'labels'], optional: []},
  urban: {description: 'Moving traffic and pedestrians in a geometric city', required: [], optional: ['headline']},
  machine: {description: 'Cinematic cutaway of moving gears and piston', required: [], optional: ['headline']},
  nature: {description: 'Procedural woodland and river', required: [], optional: ['headline']},
  scene: {description: 'Compose named 3D subjects, timed actions, a camera and education overlays', required: ['scene'], optional: []},
  abstract: {description: 'Procedural geometric formation', required: [], optional: ['headline']},
} satisfies Record<(typeof TEMPLATES)[number], {description: string; required: string[]; optional: string[]}>;

export const commands = {
  capabilities: {arguments: '', flags: [], description: 'Print this machine-readable registry'},
  check: {arguments: '<episode.json>', flags: ['require-alignment'], description: 'Validate assets and print the frame plan with caption timing sources'},
  preview: {arguments: '<episode.json> <shot-id>', flags: ['frame', 'width', 'out'], description: 'Render a low-resolution PNG at a local shot frame'},
  contact: {arguments: '<episode.json>', flags: ['out'], description: 'Render ordered thumbnail sheets and a shot-to-cell index'},
  render: {arguments: '<episode.json> <shot-id>', flags: ['force', 'concurrency', 'out'], description: 'Render or reuse one shot and export it with audio'},
  assemble: {arguments: '<episode.json>', flags: ['concurrency', 'out', 'require-alignment'], description: 'Reuse valid cached pictures and assemble MP4, SRT, and manifest'},
  srt: {arguments: '<episode.json>', flags: ['out', 'require-alignment'], description: 'Export subtitle cues without rendering pictures'},
} satisfies Record<string, {arguments: string; flags: string[]; description: string}>;

export const capabilities = {
  version: 2,
  video: {width: WIDTH, height: HEIGHT, fps: FPS, container: 'mp4', videoCodec: 'h264', audioCodec: 'aac'},
  preview: {defaultWidth: 480, minWidth: 160, maxWidth: WIDTH, defaultFrame: 'midpoint', contactColumns: 4, contactRows: 6},
  commands,
  flags: {
    out: 'Output directory. Defaults to out/production/<episode-id>.',
    frame: 'Zero-based frame within the selected shot.',
    width: 'Preview width in pixels. Height scales with it.',
    force: 'Regenerate the selected picture even if its cache entry is valid.',
    concurrency: 'Number of rendering workers, from 1 to 32. Default is 2.',
    'require-alignment': 'Fail if any narrated shot has no valid word timing.',
  },
  episode: {
    required: ['id', 'title', 'shots'],
    shot: {required: ['id', 'template'], optional: ['headline', 'labels', 'voice', 'duration', 'tail', 'scene']},
    limits: {id: 64, title: 120, headline: 72, labels: 4, label: 26, transcript: 160, tailSeconds: 10},
    templates,
    scene: {
      schema: sceneSchema,
      coordinateSystem: 'Right-handed metres. Y is up. Position anchors an asset at its base. Rotation is yaw in degrees.',
      timeUnit: 'Seconds from shot start',
      assets: {props: PROPS, environments: ENVIRONMENTS, characters: ['person']},
      defaults: {
        entity: {position: [0, 0, 0], scale: 1, rotation: 0, visible: true, opacity: 1, highlight: 0, pose: 'idle', expression: 'neutral'},
        camera: {fov: 42, roll: 0},
        scene: {lights: 'Hemisphere fill plus directional key', atmosphere: 'No fog'},
      },
      actions: {
        move: ['position'], rotate: ['rotation'], resize: ['scale'], reveal: ['opacity', 'visible'],
        transform: ['position', 'rotation', 'scale', 'color', 'asset'], highlight: ['highlight'],
        character: ['pose', 'expression'], interact: ['attach', 'position'],
      },
      semantics: [
        'Entity IDs are unique within the shot and resolve action, camera, annotation and link subjects.',
        'Numeric, vector and color channels interpolate over duration. Boolean, pose, expression, asset and attach changes step at their start.',
        'Actions cannot overlap on the same subject property. Different properties can animate concurrently.',
        'Only props can change asset, and only to another prop. Asset changes are cuts.',
        'Person size is controlled by uniform scale. Mesh size multipliers and material overrides apply to non-person assets.',
        'Attach puts a prop position in person-relative coordinates. Set attach to null and give a world position to release.',
        'Attach changes must provide position and omit duration or set it to zero. They are not hand IK.',
        'Camera keys increase strictly after zero and inherit omitted fields. A named target follows its sampled position plus an optional world-space offset.',
        'An annotation needs exactly one anchor. Screen anchors are normalized; offsets and text sizes are output pixels.',
        'A link joins two named subjects over the picture. Reveal grows links and fades annotations.',
        'Action, camera and overlay times must fit the measured shot duration including its tail.',
      ],
    },
    timing: 'For voiced shots use voice.file, voice.text, and optional tail. For silent shots use duration. Paths are relative to the episode.',
    alignment: {
      file: '<voice.file>.timing.json', required: ['version', 'source', 'audioSha256', 'transcript', 'words'],
      word: ['text', 'start', 'end'], unit: 'seconds from audio start',
      withoutSidecar: 'Estimated captions unless --require-alignment is set.',
    },
  },
  utilities: {
    voice: 'npm run production:voice -- <episode.json>',
    benchmark: 'npm run production:benchmark -- <episode.json> <new-output-dir> [concurrency]',
  },
  examples: ['examples/pilot/episode.json', 'examples/river/episode.json', 'examples/composed/episode.json'],
};
