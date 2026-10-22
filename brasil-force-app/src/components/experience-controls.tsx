"use client";
import { useEffect, useRef, useState } from "react";
import { Focus, Volume2, VolumeX } from "lucide-react";
export function ExperienceControls(){
 const [focus,setFocus]=useState(false);
 const [sound,setSound]=useState(false);
 const audio=useRef<AudioContext|null>(null);
 const nodes=useRef<{osc:OscillatorNode;gain:GainNode}[]>([]);
 useEffect(()=>{document.documentElement.classList.toggle("ops-focus-mode",focus);if(focus)setSound(false);return()=>document.documentElement.classList.remove("ops-focus-mode")},[focus]);
 useEffect(()=>{if(!sound){nodes.current.forEach(({osc,gain})=>{try{gain.gain.setTargetAtTime(0,osc.context.currentTime,.08);osc.stop(osc.context.currentTime+.3)}catch{}});nodes.current=[];void audio.current?.close().catch(()=>{});audio.current=null;return}
  if(document.hidden||focus){setSound(false);return}
  try{const context=new AudioContext();audio.current=context;
   // Locally synthesized ambient pad: no downloaded tracks, cookies or third-party services.
   [110,164.81,220].forEach((frequency,i)=>{const osc=context.createOscillator();const gain=context.createGain();osc.type="sine";osc.frequency.value=frequency;gain.gain.value=0;osc.connect(gain);gain.connect(context.destination);osc.start();gain.gain.setTargetAtTime(i===0?.009:.004,context.currentTime,.65);nodes.current.push({osc,gain})});
  }catch{setSound(false)}
  return()=>{nodes.current.forEach(({osc,gain})=>{try{gain.gain.setTargetAtTime(0,osc.context.currentTime,.05);osc.stop(osc.context.currentTime+.2)}catch{}});nodes.current=[];void audio.current?.close().catch(()=>{});audio.current=null}
 },[sound,focus]);
 useEffect(()=>{const stop=()=>{if(document.hidden)setSound(false)};document.addEventListener("visibilitychange",stop);return()=>document.removeEventListener("visibilitychange",stop)},[]);
 return <div className="ops-experience-controls" role="group" aria-label="Controles da experiência visual e sonora">
  <button type="button" aria-pressed={focus} onClick={()=>setFocus(v=>!v)} title="Desativar animações e efeitos visuais"><Focus size={16} aria-hidden="true"/><span>{focus?"Sair do foco":"Modo foco"}</span></button>
  <button type="button" aria-pressed={sound} disabled={focus} onClick={()=>setSound(v=>!v)} title="Ativar ou desligar som ambiente opcional">{sound?<Volume2 size={16} aria-hidden="true"/>:<VolumeX size={16} aria-hidden="true"/>}<span>{sound?"Som ligado":"Som desligado"}</span></button>
 </div>;
}