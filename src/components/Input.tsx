import {forwardRef,useEffect,useState,type InputHTMLAttributes,type TextareaHTMLAttributes,type ReactNode} from 'react';
import {cx} from '../utils/cn.js';

export const Input=forwardRef<HTMLInputElement,InputHTMLAttributes<HTMLInputElement>>(function Input({className,type,...props},ref){return <input {...props} type={type} ref={ref} className={cx(type==='checkbox'||type==='radio'?'lui-native-choice':'lui-input',className)}/>});
export const TextareaInput=forwardRef<HTMLTextAreaElement,TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextareaInput({className,...props},ref){return <textarea {...props} ref={ref} className={cx('lui-input','lui-textarea-input',className)}/>});
export function Field({label,code,action,children,className,wrapLabel=false}:{label:string;code?:string;action?:ReactNode;className?:string;wrapLabel?:boolean;children:ReactNode}){return <div className={cx('lui-control-field',className)}><div className={cx('lui-control-field__label',wrapLabel&&'lui-control-field__label--wrap')}><span>{label}</span>{code&&<code>{code}</code>}{action}</div>{children}</div>}
export function NumberInput({label,value,min=0,max=100,step=1,unit,onValueChange}:{label:string;value:number;min?:number;max?:number;step?:number;unit?:string;onValueChange:(value:number)=>void}){
  const [draft,setDraft]=useState(String(value));useEffect(()=>setDraft(String(value)),[value]);
  const input=<Input aria-label={label} type="number" min={min} max={max} step={step} value={draft} onChange={event=>{const text=event.currentTarget.value;setDraft(text);const next=Number(text);if(text&&Number.isFinite(next)&&next>=min&&next<=max)onValueChange(next)}} onBlur={()=>{const next=Number(draft);if(!draft||!Number.isFinite(next))setDraft(String(value));else{const bounded=Math.max(min,Math.min(max,next));setDraft(String(bounded));onValueChange(bounded)}}}/>;
  return unit?<span className="lui-number-input">{input}<span className="lui-number-input__unit" aria-hidden="true">{unit}</span></span>:input;
}
