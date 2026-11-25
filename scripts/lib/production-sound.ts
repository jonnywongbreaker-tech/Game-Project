import {execFileSync} from 'node:child_process';
import {dirname, isAbsolute, resolve} from 'node:path';
import {record} from '../../src/script/validate';
import {issue,obj,list,number,text,type Schema} from '../../src/production/scene/schema';
import {SAMPLE_RATE,type AudioMix,type Narrator,type EpisodeInput} from '../../src/production/types';

const clip = obj({file:text(1024),at:number(0,86400),gainDb:number(-70,12),
  loop:{type:'boolean'},duration:number(.005,86400)},'file');
export const audioSchema = obj({music:clip,effects:list(clip,32),loudness:number(-30,-12),duck:{type:'boolean'}});
export const narratorSchema = obj({provider:text(80),voice:text(120),
  pronunciation:{type:'object'}},'provider','voice');

export function localFile(file:string) {
  if (isAbsolute(file) || /^[a-z][a-z0-9+.-]*:/i.test(file) || /[\\\r\n\u0000]/.test(file)) {
    throw new Error('Expected a local media path with forward slashes');
  }
  return file;
}

export function readAudio(raw:unknown): AudioMix | undefined {
  if (raw===undefined) return;
  const error=issue(raw,audioSchema,'episode.audio');
  if(error) throw new Error(error);
  const audio=raw as AudioMix;
  for(const item of [audio.music,...(audio.effects??[])]) if(item) localFile(item.file);
  return audio;
}

export function readNarrators(raw:unknown): Record<string,Narrator> | undefined {
  if(raw===undefined) return;
  if(!record(raw) || Object.keys(raw).length>32) throw new Error('Expected a narrator catalog');
  return Object.fromEntries(Object.entries(raw).map(([key,narrator])=>{
    if(!/^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/.test(key)) throw new Error('Invalid narrator ID');
    if(!record(narrator)) throw new Error('Invalid narrator');
    const {pronunciation,...fields}=narrator;
    const error=issue(fields,narratorSchema,`narrators.${key}`);
    if(error) throw new Error(error);
    if(pronunciation!==undefined && (!record(pronunciation) || Object.keys(pronunciation).length>64
      || Object.entries(pronunciation).some(([word,spoken])=>!/^\S{1,64}$/.test(word)
      || typeof spoken!=='string' || !spoken.trim() || spoken.length>100 || /[\r\n]/.test(spoken)))) {
      throw new Error(`Invalid pronunciation map for "${key}"`);
    }
    return [key,narrator as Narrator];
  }));
}

export function narrationRequests(episode:EpisodeInput) {
  return episode.shots.flatMap(({id,voice,tail})=>{
    if(!voice) return [];
    const narrator=voice.speaker ? episode.narrators?.[voice.speaker] : undefined;
    const substitute=(word:string)=>{
      const aliases=narrator?.pronunciation;
      return aliases && Object.hasOwn(aliases,word) ? aliases[word] : word;
    };
    const words=voice.text.split(/\s+/).map(text=>({
      text,spoken:text.replace(/[A-Za-z0-9][A-Za-z0-9'-]*/g,substitute),
    }));
    const spokenText=words.map(word=>word.spoken).join(' ');
    return [{shot:id,file:voice.file,provider:narrator?.provider??'local',voice:narrator?.voice,words,
      transcript:voice.text,spokenText,lead:voice.lead??0,tail:tail??0,alignmentFile:voice.file+'.timing.json'}];
  });
}

/** Decodes local stems to one fixed-length mono mix. The video never enters this filter graph. */
export function mixEpisodeAudio(voice:string, episodeFile:string, mix:AudioMix, seconds:number, output:string) {
  const inputs=['-f','s16le','-ar',String(SAMPLE_RATE),'-ac','1','-i',voice];
  const clips=[...(mix.music?[mix.music]:[]),...(mix.effects??[])];
  const filters:string[]=[];
  const duck=Boolean(mix.duck && mix.music);
  const limiter='alimiter=limit=0.75:level=0:latency=1';
  const voiceGain=mix.loudness===undefined?'anull':`loudnorm=I=${mix.loudness}:TP=-1.5:LRA=7`;
  filters.push(`[0:a]${voiceGain},aresample=48000,aformat=channel_layouts=mono,apad,atrim=duration=${seconds}${duck?',asplit=2[voice][side]':'[voice]'}`);
  const stems=['[voice]'];
  clips.forEach((item,index)=>{
    const remaining=seconds-(item.at??0);
    if(remaining<=0) throw new Error(`Audio clip starts outside episode: ${item.file}`);
    inputs.push(...(item.loop?['-stream_loop','-1']:[]),'-protocol_whitelist','file,pipe','-i',resolve(dirname(episodeFile),item.file));
    const stem=`stem${index}`;
    const delay=Math.round((item.at??0)*SAMPLE_RATE);
    filters.push(`[${index+1}:a:0]aresample=48000,aformat=channel_layouts=mono,atrim=duration=${Math.min(item.duration??remaining,remaining)},volume=${item.gainDb??-12}dB,adelay=${delay}S,apad,atrim=duration=${seconds}[${stem}]`);
    if(index===0 && duck){
      filters.push(`[${stem}][side]sidechaincompress=threshold=0.025:ratio=8:attack=18:release=260[bed]`);
      stems.push('[bed]');
    }else stems.push(`[${stem}]`);
  });
  filters.push(`${stems.join('')}amix=inputs=${stems.length}:normalize=0,${limiter},apad,atrim=duration=${seconds}[mix]`);
  execFileSync('ffmpeg',['-v','error','-nostdin','-y',...inputs,'-filter_complex',filters.join(';'),'-map','[mix]',
    '-ar',String(SAMPLE_RATE),'-ac','1','-f','s16le',output],{stdio:'inherit'});
}
