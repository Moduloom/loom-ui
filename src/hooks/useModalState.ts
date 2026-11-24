import {prefersReducedMotion} from '../utils/reducedMotion.js';
import { useCallback, useEffect, useRef, useState } from 'react';
export function useModalState<T extends string>() {
  const [modal,setCurrent]=useState<T|null>(null);
  const [closing,setClosing]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const setModal=useCallback((next:T|null)=>{if(timer.current)clearTimeout(timer.current);if(next!==null){setClosing(false);setCurrent(next);return}setClosing(true);const reduced=prefersReducedMotion();const duration=reduced?0:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lui-duration-standard'))||160;timer.current=setTimeout(()=>{setCurrent(null);setClosing(false);timer.current=null},duration)},[]);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
  return [modal,setModal,closing] as const;
}
