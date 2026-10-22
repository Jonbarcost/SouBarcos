"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";

type Props={href:string;title:string;description:string;image:string;index:number;icon:ReactNode};
export function MissionModule({href,title,description,image,index,icon}:Props){
 const router=useRouter();const [leaving,setLeaving]=useState(false);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);const navigating=useRef(false);const anchor=useRef<HTMLAnchorElement>(null);const frame=useRef<number|null>(null);const visible=useRef(true);const last=useRef({x:0,y:0});
 useEffect(()=>{const el=anchor.current;if(!el)return;const observer=new IntersectionObserver(([entry])=>{visible.current=entry.isIntersecting;if(!visible.current){if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;el.style.setProperty("--ops-tilt-x","0deg");el.style.setProperty("--ops-tilt-y","0deg")}});observer.observe(el);return()=>{observer.disconnect();if(frame.current!==null)cancelAnimationFrame(frame.current);if(timer.current)clearTimeout(timer.current)}},[]);
 function move(e:PointerEvent<HTMLAnchorElement>){if(e.pointerType!=="mouse"||!visible.current||document.documentElement.classList.contains("ops-focus-mode")||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const b=e.currentTarget.getBoundingClientRect();last.current={x:((e.clientY-b.top)/b.height-.5)*-9,y:((e.clientX-b.left)/b.width-.5)*9};if(frame.current===null)frame.current=requestAnimationFrame(()=>{frame.current=null;const el=anchor.current;if(!el||!visible.current||document.documentElement.classList.contains("ops-focus-mode"))return;el.style.setProperty("--ops-tilt-x",last.current.x+"deg");el.style.setProperty("--ops-tilt-y",last.current.y+"deg")})}
 function reset(){if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;anchor.current?.style.setProperty("--ops-tilt-x","0deg");anchor.current?.style.setProperty("--ops-tilt-y","0deg")}
 function navigate(e:MouseEvent<HTMLAnchorElement>){if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.currentTarget.target==="_blank"||e.detail===0||document.documentElement.classList.contains("ops-focus-mode")||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(navigating.current){e.preventDefault();return}e.preventDefault();navigating.current=true;setLeaving(true);timer.current=setTimeout(()=>router.push(href),260)}

 return <>
 <Link href={href} onClick={navigate} ref={anchor} onPointerMove={move} onPointerLeave={reset} className="bf-category-card ops-mission-module" aria-label={title+" — explorar categoria"}>
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
