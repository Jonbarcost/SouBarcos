"use client";
import { useEffect, useRef, useState } from "react";
import { Focus, Volume2, VolumeX } from "lucide-react";
type Pad = {osc:OscillatorNode;gain:GainNode};
export function ExperienceControls(){
 const [focus,setFocus]=useState(false);
 const [sound,setSound]=useState(false);
 const audio=useRef<AudioContext|null>(null);
 const nodes=useRef<Pad[]>([]);
 const enabled=useRef(false);
 const stop=()=>{enabled.current=false;setSound(false);const ctx=audio.current;nodes.current.forEach(({osc,gain})=>{try{gain.gain.setTargetAtTime(0,ctx?.currentTime??0,.05);osc.stop((ctx?.currentTime??0)+.2)}catch{}});nodes.current=[];audio.current=null;if(ctx)void ctx.close().catch(()=>{})};
 async function toggleSound(){
  if(enabled.current){stop();return}
  if(focus||document.hidden)return;
  // The AudioContext is created synchronously in the user's click handler.
  try{
   const ctx=new AudioContext();audio.current=ctx;enabled.current=true;
   [110,164.81,220].forEach((frequency,i)=>{const osc=ctx.createOscillator();const gain=ctx.createGain();osc.type="sine";osc.frequency.value=frequency;gain.gain.value=0;osc.connect(gain);gain.connect(ctx.destination);osc.start();gain.gain.setTargetAtTime(i===0?.009:.004,ctx.currentTime,.65);nodes.current.push({osc,gain})});
   await ctx.resume();if(!enabled.current)return;setSound(true);
  }catch{stop()}
 }
 useEffect(()=>{document.documentElement.classList.toggle("ops-focus-mode",focus);if(focus)stop();return()=>document.documentElement.classList.remove("ops-focus-mode")},[focus]);
 useEffect(()=>{const onVisibility=()=>{const ctx=audio.current;if(!ctx)return;if(document.hidden){void ctx.suspend().catch(()=>{});setSound(false)}else if(enabled.current&&!document.documentElement.classList.contains("ops-focus-mode")){void ctx.resume().then(()=>setSound(true)).catch(()=>stop())}};document.addEventListener("visibilitychange",onVisibility);return()=>{document.removeEventListener("visibilitychange",onVisibility);const ctx=audio.current;nodes.current.forEach(({osc})=>{try{osc.stop()}catch{}});nodes.current=[];audio.current=null;if(ctx)void ctx.close().catch(()=>{})}},[]);
 return <div className="ops-experience-controls" role="group" aria-label="Controles da experiência visual e sonora">
 <button type="button" aria-pressed={focus} onClick={()=>setFocus(v=>!v)} title="Desativar animações e efeitos visuais"><Focus size={16} aria-hidden="true"/><span>{focus?"Sair do foco":"Modo foco"}</span></button>
 <button type="button" aria-pressed={sound} disabled={focus} onClick={()=>{void toggleSound()}} title="Ativar ou desligar som ambiente opcional">{sound?<Volume2 size={16} aria-hidden="true"/>:<VolumeX size={16} aria-hidden="true"/>}<span>{sound?"Som ligado":"Som desligado"}</span></button>
 </div>;
}
