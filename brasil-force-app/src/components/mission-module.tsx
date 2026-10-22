"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";

type Props={href:string;title:string;description:string;image:string;index:number;icon:ReactNode};
export function MissionModule({href,title,description,image,index,icon}:Props){
 const router=useRouter();const [tilt,setTilt]=useState({x:0,y:0});const [leaving,setLeaving]=useState(false);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 function move(e:PointerEvent<HTMLAnchorElement>){if(e.pointerType!=="mouse"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const b=e.currentTarget.getBoundingClientRect();setTilt({x:((e.clientY-b.top)/b.height-.5)*-9,y:((e.clientX-b.left)/b.width-.5)*9})}
 function navigate(e:MouseEvent<HTMLAnchorElement>){if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;e.preventDefault();if(leaving)return;setLeaving(true);timer.current=setTimeout(()=>router.push(href),260)}
 const style={"--ops-tilt-x":tilt.x+"deg","--ops-tilt-y":tilt.y+"deg"} as CSSProperties;
 return <>
 <Link href={href} onClick={navigate} onPointerMove={move} onPointerLeave={()=>setTilt({x:0,y:0})} className="bf-category-card ops-mission-module" style={style} aria-label={title+" — explorar módulo de missão"}>
  <span className="bf-category-media" style={{backgroundImage:`url("${image}")`}} aria-hidden="true"/>
  <span className="ops-module-scan" aria-hidden="true"/>
  <span className="bf-category-index ops-hud">MÓDULO / {String(index+1).padStart(2,"0")}</span>
  <span className="bf-category-icon">{icon}</span>
  <span className="bf-category-title">{title}</span>
  <span className="bf-category-desc">{description}</span>
  <span className="bf-category-link" aria-hidden="true">↗</span>
 </Link>
 {leaving&&<span className="ops-route-scan" aria-hidden="true"/>}
 </>;
}
