import {type ReactNode,type KeyboardEvent} from 'react';
import {cx} from '../utils/cn.js';
import {SettingsControlRow,type SettingsControlRowProps} from './SettingsControlRow.js';
export type Option={value:string;label:string;disabled?:boolean};
export type TabsProps={items:readonly (Omit<Option,'label'>&{label:ReactNode;badge?:ReactNode;icon?:ReactNode;ariaLabel?:string})[];value:string;onValueChange:(value:string)=>void;label:string;className?:string;variant?:'line'|'toolbar'};
export type SegmentedControlProps=TabsProps;
export function Tabs({items,value,onValueChange,label,className,variant='line'}:TabsProps){
 const enabled=items.filter(item=>!item.disabled),active=enabled.some(item=>item.value===value)?value:enabled[0]?.value;
 const keys=(event:KeyboardEvent<HTMLDivElement>)=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=enabled[event.key==='Home'?0:event.key==='End'?enabled.length-1:(enabled.findIndex(item=>item.value===value)+(event.key==='ArrowRight'?1:-1)+enabled.length)%enabled.length];if(next){onValueChange(next.value);Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]')).find(node=>node.dataset.value===next.value)?.focus({preventScroll:true})}};
 return <div role="tablist" aria-label={label} className={cx('lui-tabs','lui-tabs--'+variant,className)} onKeyDown={keys}>{items.map(item=><button type="button" role="tab" key={item.value} data-value={item.value} aria-label={item.ariaLabel} title={item.ariaLabel??(typeof item.label==='string'?item.label:undefined)} aria-selected={value===item.value} tabIndex={item.value===active?0:-1} disabled={item.disabled} onClick={()=>onValueChange(item.value)}>{item.icon}<span className="lui-tabs__label">{item.label}</span>{item.badge!=null&&<span className="lui-tabs__badge">{item.badge}</span>}</button>)}</div>;
}
export function SegmentedControl(props:SegmentedControlProps){return <Tabs {...props} className={cx('lui-segmented-control',props.className)}/>}
export type SegmentedControlFieldProps = SegmentedControlProps & {
  title: ReactNode;
  description?: ReactNode;
  presentation?: "row" | "card" | "inline";
  tone?: "accent" | "neutral";
  density?: SettingsControlRowProps["density"];
};

export function SegmentedControlField({
  title,
  description,
  presentation = "row",
  tone = "accent",
  density,
  ...props
}: SegmentedControlFieldProps) {
  return (
    <SettingsControlRow
      title={title}
      description={description}
      {...(density ? { density } : {})}
      className={cx(
        "lui-segmented-control-field",
        presentation === "card" && "lui-segmented-control-field--card",
        presentation === "inline" && "lui-segmented-control-field--inline",
        tone === "neutral" && "lui-segmented-control-field--neutral",
        props.items.length >= 3 &&
          presentation !== "inline" &&
          "lui-segmented-control-field--stacked",
      )}
    >
      <SegmentedControl {...props} />
    </SettingsControlRow>
  );
}
