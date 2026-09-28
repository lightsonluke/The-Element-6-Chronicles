import { saveReplayBlob, trimClips } from './clipStorage.js';
import { music } from './music.js';

let active=null;
let chunks=[];
let startedAt=0;
let canvas=null;
let timer=null;

function supported(){return typeof MediaRecorder!=='undefined' && !!MediaRecorder.isTypeSupported && ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x))||''}

export function startMatchReplay(canvasEl, meta={}) {
  if(!canvasEl?.captureStream||!supported()) return false;
  if(active&&canvas===canvasEl)return true;
  stopMatchReplay().catch(()=>{});
  canvas=canvasEl; chunks=[]; startedAt=Date.now();
  try {
    const stream=canvas.captureStream(60);
    try { const audio=music.getRecordingAudioStream?.()?.getAudioTracks?.()[0]; if(audio) stream.addTrack(audio); } catch {}
    const mime=supported();
    const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:7000000});
    rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
    rec.start(500);
    active=rec;
    window.__e6MatchReplayRecording=true;
    timer=setTimeout(()=>stopMatchReplay().catch(()=>{}),30*60*1000);
    return true;
  } catch { active=null; canvas=null; return false; }
}

export async function stopMatchReplay() {
  if(timer){clearTimeout(timer);timer=null}
  const rec=active; active=null; window.__e6MatchReplayRecording=false;
  if(!rec){canvas=null;chunks=[];return null}
  return new Promise(resolve=>{
    const finish=async()=>{
      try {
        const blob=new Blob(chunks,{type:rec.mimeType||'video/webm'});
        if(blob.size<1000){resolve(null);return}
        const meta=window.__e6MatchReplayMeta||{};
        const id=`replay_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        await saveReplayBlob(id,blob,{duration:(Date.now()-startedAt)/1000,replayMeta:{...meta,createdAt:startedAt,endedAt:Date.now()}});
        await trimClips(80).catch(()=>{});
        window.dispatchEvent(new CustomEvent('replaySaved',{detail:{id,replay:true}}));
        resolve(id);
      }catch{resolve(null)} finally {canvas=null;chunks=[]}
    };
    rec.onstop=finish;
    try{if(rec.state!=='inactive')rec.stop();else finish()}catch{finish()}
  });
}
export function isMatchReplayActive(){return !!active}
