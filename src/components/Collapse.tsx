import {useEffect,useState,type ReactNode} from 'react';
export function Collapse({open,children,lazy=false,className=''}:{open:boolean;children:ReactNode;lazy?:boolean;className?:string}){
  const [visited,setVisited]=useState(!lazy);useEffect(()=>{if(open)setVisited(true)},[open]);
  return <div className={'lui-collapse '+className} data-open={open&&visited} aria-hidden={!open} inert={!open||undefined}><div>{visited?children:null}</div></div>;
}
