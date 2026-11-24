import {Check,Info,TriangleAlert} from 'lucide-react';
import {useEffect,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import type {FeedbackTone} from './FeedbackIcon.js';
export type ToastProps={open:boolean;tone?:FeedbackTone;title:ReactNode;description?:string;onDismiss?:()=>void;durationLabel?:string;className?:string};
export function Toast({open,tone='success',title,description,onDismiss,durationLabel,className=''}:ToastProps){
 const ref=useRef<HTMLDivElement>(null),dismiss=useRef(onDismiss);dismiss.current=onDismiss;
 useEffect(()=>{const node=ref.current;if(!node)return;if(open){node.showPopover();const timer=setTimeout(()=>{node.hidePopover();dismiss.current?.()},tone==='danger'||tone==='warning'?5000:3000);return()=>clearTimeout(timer)}node.hidePopover()},[open,title,description,tone]);
 if(typeof document==='undefined')return null;const Icon=tone==='success'?Check:tone==='danger'||tone==='warning'?TriangleAlert:Info;
 return createPortal(<div ref={ref} popover="manual" role="status" className={'lui-toast lui-toast--'+tone+' '+className}><Icon/><div><div>{title}{durationLabel&&<small>{durationLabel}</small>}</div>{description&&<p>{description}</p>}</div></div>,document.body);
}
