import {prefersReducedMotion} from '../utils/reducedMotion.js';
import { useEffect, useState, type RefObject } from 'react';
export function useDrawerPresence(open:boolean) {
  const [present,setPresent]=useState(open);
  useEffect(()=>{if(open){setPresent(true);return}const reduced=prefersReducedMotion();const duration=reduced?0:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lui-duration-standard'))||160;const timer=setTimeout(()=>setPresent(false),duration);return()=>clearTimeout(timer)},[open]);
  return present||open;
}
export function useDrawerFocus(open:boolean,ref:RefObject<HTMLElement|null>,onClose:()=>void) {
  useEffect(()=>{
    if(!open)return;
    const panel=ref.current;if(!panel)return;
    const previous=document.activeElement as HTMLElement;
    const focusable=()=>Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')).filter(el=>!el.closest('[inert]')&&el.getClientRects().length);
    focusable()[0]?.focus({preventScroll:true});
    const keys=(event:KeyboardEvent)=>{if(event.defaultPrevented||document.querySelector('dialog[open]')||document.querySelector('.lui-select-popup:popover-open'))return;if(event.key==='Escape'){event.preventDefault();onClose();return}if(event.key!=='Tab')return;const controls=focusable();if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&(document.activeElement===first||!panel.contains(document.activeElement))){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}};
    document.addEventListener('keydown',keys);
    return()=>{document.removeEventListener('keydown',keys);if(previous?.isConnected&&previous.getClientRects().length)previous.focus({preventScroll:true})};
  },[open,ref,onClose]);
}
