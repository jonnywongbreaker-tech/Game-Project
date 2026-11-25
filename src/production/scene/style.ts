import type {Light, Look, Material} from '../../kit/space';
import type {Easing} from './types';

export const styleNames = ['editorial', 'cinematic', 'illustrated'] as const;
export type StyleName = typeof styleNames[number];
export type Profile = {
  palette: Record<'background' | 'surface' | 'primary' | 'accent' | 'ink', string>;
  material: Material['kind'];
  lights: Light[];
  look: Look;
  font: 'serif' | 'sans';
  textSize: number;
  lineWidth: number;
  character: 'coat' | 'jacket' | 'sweater';
  geometryDepth: number;
  fovScale: number;
  ease: Easing;
  shadow: number;
  transition: 'cut' | 'fade' | 'wipe';
  transitionSeconds: number;
};
export type StyleInput = {profile: StyleName} & Partial<Omit<Profile, 'palette'>> & {palette?: Partial<Profile['palette']>};

export const profiles: Record<StyleName, Profile> = {
  editorial: {
    palette: {background:'#F4EEE3', surface:'#D9D4C8', primary:'#253943', accent:'#BE4A30', ink:'#203039'},
    material:'flat', lights:[{kind:'hemisphere',sky:'#FFFFFF',ground:'#D5D2CA',intensity:.9}],
    look:{bands:0,shadowTint:'#AAA3A0',lightTint:'#FFFFFF',tintStrength:0},
    font:'serif',textSize:48,lineWidth:3,character:'sweater',geometryDepth:.38,
    fovScale:.90,ease:'inOut',shadow:.11,transition:'cut',transitionSeconds:0,
  },
  cinematic: {
    palette: {background:'#172237',surface:'#566983',primary:'#70B5C9',accent:'#FFBE68',ink:'#FFECCF'},
    material:'metal',lights:[
      {kind:'hemisphere',sky:'#829EDA',ground:'#5B476A',intensity:.67},
      {kind:'directional',dir:[-.7,-.8,-.2],color:'#FFD0A0',intensity:1.15},
      {kind:'point',pos:[1.5,2,4],color:'#87D0FF',intensity:.65,range:10}],
    look:{bands:5,shadowTint:'#3C5192',lightTint:'#FFD39E',tintStrength:.35},
    font:'serif',textSize:42,lineWidth:5,character:'coat',geometryDepth:1.7,
    fovScale:1.05,ease:'inOut',shadow:.32,transition:'fade',transitionSeconds:.28,
  },
  illustrated: {
    palette: {background:'#D4EBE6',surface:'#A9CDD0',primary:'#4B688C',accent:'#EF815D',ink:'#233F55'},
    material:'matte',lights:[
      {kind:'hemisphere',sky:'#FFFFFF',ground:'#A2BDD7',intensity:.91},
      {kind:'directional',dir:[.55,-.85,-.3],color:'#FFEECC',intensity:.56}],
    look:{bands:3,shadowTint:'#758CC3',lightTint:'#FFF6C8',tintStrength:.25},
    font:'sans',textSize:52,lineWidth:8,character:'jacket',geometryDepth:.78,
    fovScale:1.13,ease:'out',shadow:.17,transition:'wipe',transitionSeconds:.32,
  },
};

export function resolveStyle(input: StyleName | StyleInput | undefined): Profile | undefined {
  if (!input) return;
  if (typeof input === 'string') return profiles[input];
  const {profile, palette, ...overrides} = input;
  return {...profiles[profile], ...overrides, palette:{...profiles[profile].palette,...palette}};
}
