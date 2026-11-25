import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseEpisode,planEpisode,subtitles} from '../scripts/lib/production-plan';
import {inspectPlan,sampleFrames,segmentsCross} from '../scripts/lib/production-qc';
import {narrationRequests} from '../scripts/lib/production-sound';

const scene={camera:{position:[0,2,8],target:[0,2,0]},
  entities:[{id:'edge',asset:'box',position:[9,0,0]}],
  annotations:[{text:'Long words at the edge of the viewport',atScreen:[0,0]}]};
const episode=(contents:unknown=scene)=>({id:'test',title:'Test',shots:[{id:'a',template:'scene',duration:4,scene:contents}]});

test('nested groups compose transforms, variants and dressing without mutating assets',()=>{
  const doc={...episode({...scene,groups:[{id:'outer',group:'whole',position:[3,0,0],scale:2,rotation:90,dressing:false}]}),
    library:{whole:{groups:[{id:'inner',group:'part',variant:'blue'}]},
      part:{entities:[{id:'object',asset:'box',position:[0,0,1]}],dressing:[{id:'extra',asset:'box'}],
        variants:{blue:{object:{color:'#0000FF'}}}}}};
  const plan=planEpisode('test.json',parseEpisode(doc));
  const asset=plan.shots[0].visual.scene!.entities.find(entity=>entity.id==='outer-inner-object')!;
  assert.equal(asset.scale,2);
  assert.equal(asset.color,'#0000FF');
  assert.ok(Math.abs(asset.position![0]-5)<1e-8);
  assert.equal(plan.shots[0].visual.scene!.entities.length,2);
  assert.throws(()=>parseEpisode({...doc,library:{whole:{groups:[{id:'loop',group:'whole'}]}}}),/Cyclic/);
});

test('style overrides can tune composed camera, geometry, material and typography',()=>{
  const plan=planEpisode('test.json',parseEpisode({...episode(),style:{profile:'editorial',fovScale:1.1,
    palette:{surface:'#FF0000'},geometryDepth:2.5}}));
  const visual=plan.shots[0].visual;
  assert.equal(visual.profile?.transition,'cut');
  assert.equal(visual.scene!.entities[0].color,'#FF0000');
  assert.equal(visual.scene!.entities[0].size?.[2],2.5);
  assert.ok(Math.abs(visual.scene!.camera.fov!-46.2)<1e-8);
  assert.equal(visual.scene!.typography?.font,'serif');
  assert.equal(planEpisode('test.json',parseEpisode(episode())).shots[0].visual.profile,undefined);
});

test('narration requests expand pronunciations and lead delays captions',()=>{
  const input=parseEpisode({...episode(),narrators:{reader:{provider:'external',voice:'test-model',pronunciation:{cutout:'cut out'}}},
    shots:[{id:'a',template:'scene',scene,voice:{file:'clip.wav',text:'A cutout.',speaker:'reader',lead:.3},tail:.7}]});
  const [request]=narrationRequests(input);
  assert.equal(request.spokenText,'A cut out.');
  assert.equal(request.transcript,'A cutout.');
  assert.equal(request.voice,'test-model');
  const plan=planEpisode('test.json',input,()=>2);
  assert.equal(plan.totalFrames,90);
  assert.match(subtitles(plan),/00:00:00,300/);
});

test('multi-frame QC separates measured clipping and intersections from text risks',()=>{
  assert.deepEqual(sampleFrames(120,3),[0,60,119]);
  assert.equal(segmentsCross({x:0,y:0},{x:2,y:2},{x:0,y:2},{x:2,y:0}),true);
  const plan=planEpisode('test.json',parseEpisode(episode({...scene,paths:[
    {points:[[-1,1,0],[1,3,0]]},{points:[[-1,3,0],[1,1,0]]},
  ]})));
  const qc=inspectPlan(plan,3);
  assert.equal(qc.samples[0].frames.length,3);
  assert.ok(qc.issues.some(issue=>issue.kind==='frame-edge'&&issue.classification==='measurement'));
  assert.ok(qc.issues.some(issue=>issue.kind==='diagram-intersection'));
  assert.ok(qc.issues.some(issue=>issue.kind==='text-overflow-risk'&&issue.classification==='review'));
});
