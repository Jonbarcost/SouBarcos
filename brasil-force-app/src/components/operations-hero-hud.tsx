"use client";
import { useEffect, useRef, useState } from "react";
const lines = ["Preparação é a primeira ferramenta de cada jornada.", "Cada rota começa com uma escolha consciente.", "Explore com propósito. Equipe-se com responsabilidade.", "Conhecimento orienta. Equipamento acompanha."];
const stations = [{x:105,y:74,n:"NORTE"},{x:154,y:153,n:"CENTRO"},{x:192,y:231,n:"SUDESTE"},{x:152,y:292,n:"SUL"}];
export function OperationsHeroHUD() {
 const [clock,setClock]=useState("--:--:--"); const [phrase,setPhrase]=useState(0);

 const shell=useRef<HTMLDivElement>(null); const frame=useRef<number|null>(null); const visible=useRef(true); const last=useRef({x:0,y:0});
 useEffect(()=>{const tick=()=>setClock(new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date()));tick();const t=setInterval(tick,1000);const p=setInterval(()=>setPhrase(v=>(v+1)%lines.length),6500);return()=>{clearInterval(t);clearInterval(p);if(frame.current!==null)cancelAnimationFrame(frame.current)}},[]);
 useEffect(()=>{const el=shell.current;if(!el)return;const observer=new IntersectionObserver(([entry])=>{visible.current=entry.isIntersecting;if(!visible.current){if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;el.style.setProperty("--ops-x","0px");el.style.setProperty("--ops-y","0px")}});observer.observe(el);return()=>observer.disconnect()},[]);
 function move(e:React.PointerEvent<HTMLElement>){if(e.pointerType!=="mouse"||!visible.current||document.documentElement.classList.contains("ops-focus-mode")||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const r=e.currentTarget.getBoundingClientRect();last.current={x:((e.clientX-r.left)/r.width-.5)*10,y:((e.clientY-r.top)/r.height-.5)*10};if(frame.current===null)frame.current=requestAnimationFrame(()=>{frame.current=null;const el=shell.current;if(!el||!visible.current||document.documentElement.classList.contains("ops-focus-mode"))return;el.style.setProperty("--ops-x",last.current.x+"px");el.style.setProperty("--ops-y",last.current.y+"px")})}
 function reset(){if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;shell.current?.style.setProperty("--ops-x","0px");shell.current?.style.setProperty("--ops-y","0px")}
 return <div ref={shell} className="ops-hud-shell ops-surface ops-surface--grain" onPointerMove={move} onPointerLeave={reset}>
   <div className="ops-hud-top ops-hud"><span><i className="ops-led"/> BF / CENTRO DE OPERAÇÕES</span><span>BRASÍLIA · BRT {clock}</span></div>
   <div className="ops-hud-content">
     <div className="ops-hud-map">
       <svg viewBox="0 0 310 350" role="img" aria-label="Mapa ilustrativo do Brasil com quatro pontos de referência; não representa rastreamento real">
         <defs><pattern id="ops-map-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#b8d1ae" strokeOpacity=".1"/></pattern></defs>
         <rect width="310" height="350" fill="url(#ops-map-grid)"/>
         <path d="M110 15 154 27 184 50 215 49 245 83 270 96 264 126 282 151 259 180 240 198 230 231 210 249 197 279 174 302 159 335 139 312 130 282 108 258 89 237 77 205 55 184 49 153 29 136 48 107 52 80 78 65 81 39Z" fill="#293c303f" stroke="#f28b35" strokeWidth="1.5" strokeLinejoin="round"/>
         <path d="M105 74 154 153 192 231 152 292M105 74 192 231M154 153 152 292" fill="none" stroke="#e9e1d1" strokeOpacity=".36" strokeDasharray="4 7"/>
         {stations.map((s,i)=><g key={s.n}><circle cx={s.x} cy={s.y} r="13" fill="none" stroke="#f28b35" className="ops-pulse" style={{animationDelay:`${i*.6}s`}}/><circle cx={s.x} cy={s.y} r="4" fill="#f28b35"/><text x={s.x+10} y={s.y-9} fontSize="8" fill="#e9e1d1" fontFamily="monospace">{s.n}</text></g>)}
       </svg><span className="ops-map-label ops-hud">BR / MAPA ILUSTRATIVO — SEM DADOS OPERACIONAIS</span>
     </div>
     <div className="ops-hud-panels">
       <div className="ops-hud-panel"><span className="ops-hud">SISTEMA / 01</span><strong>PRÉ-ABERTURA</strong><small>Compras ainda indisponíveis</small></div>
       <div className="ops-hud-panel"><span className="ops-hud">COORDENADAS / ILUSTRATIVO</span><strong className="ops-coords">15°47′ S · 47°52′ W</strong><small>Referência ilustrativa — não é a localização do visitante</small></div>
       <div className="ops-hud-panel"><span className="ops-hud">CATÁLOGO / STATUS</span><strong>EM PREPARAÇÃO</strong><small>Anúncios sujeitos à moderação</small></div>
     </div>
   </div>
   <div className="ops-hud-ticker" aria-live="off"><span className="ops-hud">TRANSMISSÃO / {String(phrase+1).padStart(2,"0")}</span><p key={phrase}>{lines[phrase]}</p></div>
 </div>
}