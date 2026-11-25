import {geometry,placeGeometry} from '../../src/production/scene/geometry';
import {compileScene,overlayProgress} from '../../src/production/scene/timeline';
import {add, makeView,projectPoint,type V3} from '../../src/kit/space';
import {FPS,WIDTH,HEIGHT} from '../../src/production/types';
import type {EpisodePlan} from './production-plan';

type XY={x:number;y:number};
type Bounds={id:string;left:number;right:number;top:number;bottom:number};
const cross=(a:XY,b:XY,c:XY)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
export const segmentsCross=(a:XY,b:XY,c:XY,d:XY)=>cross(a,b,c)*cross(a,b,d)<0 && cross(c,d,a)*cross(c,d,b)<0;
const extent=(id:string,p:XY[]):Bounds=>({id,left:Math.min(...p.map(q=>q.x)),right:Math.max(...p.map(q=>q.x)),
  top:Math.min(...p.map(q=>q.y)),bottom:Math.max(...p.map(q=>q.y))});
const outside=(b:Bounds)=>b.left<0||b.right>WIDTH||b.top<0||b.bottom>HEIGHT;
const area=(b:Bounds)=>Math.max(0,b.right-b.left)*Math.max(0,b.bottom-b.top);
export function sampleFrames(frames:number,count:number) {
  return count===1 ? [Math.floor(frames/2)] :
    [...new Set(Array.from({length:count},(_,i)=>Math.round((frames-1)*i/(count-1))))];
}

export function inspectPlan(plan:EpisodePlan,count:number) {
  const issues:{shot:string;frame:number;kind:string;subjects:string[];classification:'measurement'|'review'}[]=[];
  const samples:{shot:string;frames:number[];supported:boolean}[]=[];
  for(const shot of plan.shots){
    const scene=shot.visual.scene;
    const scheduled=[...(scene?.actions??[]).flatMap(a=>[a.at,a.at+(a.duration??0)]),
      ...(scene?.camera.keys??[]).map(key=>key.at)];
    const frames=[...new Set([...sampleFrames(shot.visual.frames,count),...scheduled.flatMap(s=>
      [Math.ceil(s*FPS)-1,Math.ceil(s*FPS)].filter(f=>f>=0&&f<shot.visual.frames))])].sort((a,b)=>a-b);
    samples.push({shot:shot.id,frames,supported:Boolean(scene)});
    if(!scene) continue;
    const sampler=compileScene(scene);
    const meshes=new Map<string,ReturnType<typeof geometry>>();
    for(const frame of frames){
      const time=frame/FPS;
      const view=makeView(sampler.camera(time),WIDTH,HEIGHT);
      const project=(p:V3)=>projectPoint(view,p);
      const emit=(kind:string,subjects:string[],classification:'measurement'|'review')=>
        issues.push({shot:shot.id,frame,kind,subjects,classification});
      const bounds:Bounds[]=[];
      for(const entity of scene.entities){
        const state=sampler.sample(entity.id,time);
        if(!state.visible||state.opacity<.1||entity.asset==='ground') continue;
        let vertices:V3[];
        if(state.asset==='person'){
          vertices=[[-.38,0,0],[.38,0,0],[-.38,1.8,0],[.38,1.8,0]].map(([x,y,z])=>
            add(state.position,[x*state.scale,y*state.scale,z*state.scale]));
        }else{
          const meshKey=entity.id+':'+state.asset;
          if(!meshes.has(meshKey)) meshes.set(meshKey,geometry(state.asset,entity));
          vertices=placeGeometry(meshes.get(meshKey)!,entity,state).flatMap(face=>face.pts);
        }
        const pts=vertices.map(project).filter((p):p is NonNullable<typeof p>=>p!==null);
        if(pts.length!==vertices.length) emit('near-plane', [entity.id],'measurement');
        if(pts.length){
          const box=extent(entity.id,pts);
          bounds.push(box);
          if(outside(box)) emit('frame-edge',[entity.id],'measurement');
        }
        if(frame){
          const prev=sampler.sample(entity.id,(frame-1)/FPS);
          const center=project(state.position);
          const previous=project(prev.position);
          if(prev.visible&&prev.opacity>=.1&&center&&previous&&Math.hypot(center.x-previous.x,center.y-previous.y)>WIDTH*.12)
            emit('subject-jump',[entity.id],'measurement');
        }
      }
      if(frame){
        const prior=makeView(sampler.camera((frame-1)/FPS),WIDTH,HEIGHT);
        if(Math.hypot(...view.pos.map((v,i)=>v-prior.pos[i]))>1
          || view.forward.reduce((dot,value,index)=>dot+value*prior.forward[index],0)<.94)
          emit('camera-jump',[],'measurement');
      }
      for(const [i,a] of bounds.entries()) for(const b of bounds.slice(i+1)){
        const overlap=area({id:'',left:Math.max(a.left,b.left),right:Math.min(a.right,b.right),
          top:Math.max(a.top,b.top),bottom:Math.min(a.bottom,b.bottom)});
        const smaller=Math.min(area(a),area(b));
        if(smaller>0&&overlap/smaller>.5) emit('projected-overlap',[a.id,b.id],'review');
      }
      const paths:(XY|null)[][]=(scene.paths??[]).filter(path=>overlayProgress(path,time)>.95)
        .map(path=>path.points.map(project));
      for(const link of scene.links??[]){
        if(overlayProgress(link,time)<=.95) continue;
        const from=sampler.sample(link.from,time), to=sampler.sample(link.to,time);
        if(from.visible&&to.visible) paths.push([project(from.position),project(to.position)]);
      }
      for(const [i,a] of paths.entries()) for(const [j,b] of paths.entries()){
        if(j<i) continue;
        if(a.some((p,k)=>k>0&&p&&a[k-1]&&b.some((q,n)=>n>0&&Math.abs(k-n)>=(i===j?2:0)&&q&&b[n-1]&&segmentsCross(a[k-1]!,p,b[n-1]!,q))))
          emit('diagram-intersection',[String(i+1),String(j+1)],'measurement');
      }
      for(const label of scene.annotations??[]){
        if(overlayProgress(label,time)<=.1) continue;
        const subject=label.subject&&sampler.sample(label.subject,time);
        if(subject&&(!subject.visible||subject.opacity<=0)) continue;
        const point=subject ? project(add(subject.position,[0,subject.scale*.8,0])) : null;
        if(subject&&!point) continue;
        const [dx,dy]=label.offset??(label.atScreen?[0,0]:[100,-100]);
        const x=(point?.x??label.atScreen![0]*WIDTH)+dx, y=(point?.y??label.atScreen![1]*HEIGHT)+dy;
        const size=label.size??scene.typography?.size??38;
        const width=label.text.length*size*.56+26, lines=Math.ceil(width/690);
        const halfWidth=Math.min(360,width/2);
        if(lines>2||outside({id:'',left:x-halfWidth,right:x+halfWidth,top:y-size,bottom:y-size+lines*size*1.12}))
          emit('text-overflow-risk',[label.text],'review');
      }
    }
  }
  return {episode:plan.id,samples,issues,limits:[
    'Measurement means reproducible sampled projection data. Crops, crossings, and cuts may be intentional.',
    'Overlap uses projected bounding boxes. Text uses approximate metrics; confirm font shaping and readability in the sheets.',
    'Diagram path checks sample fully revealed paths; link anchors are approximate. Occlusion and subjective quality require review.',
  ]};
}
