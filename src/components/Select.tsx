import {Check,ChevronDown} from 'lucide-react';
import {useEffect,useId,useRef,useState,type KeyboardEvent,type ReactNode} from 'react';
import {cx} from '../utils/cn.js';
import {translateUiSource} from '../i18n';
import {Popover} from './Popover.js';
import {OverlayScrollArea, findOverlayScrollport, measureOverlayContentHeight} from './OverlayScrollArea.js';
import {DisclosureChevron} from './DisclosureChevron.js';
import {SelectTriggerValue} from './SelectTriggerValue.js';
import type {Option} from './Tabs.js';
export type SelectProps={options:readonly Option[];value:string;onValueChange:(value:string)=>void;label:string;open?:boolean;onOpenChange?:(open:boolean)=>void;onBeforeOpen?:()=>Promise<boolean>;placeholder?:string;disabled?:boolean;invalid?:boolean;className?:string;width?:'content'|'full';matchPopoverWidth?:boolean;fitOptions?:boolean;popoverClassName?:string;selectionIndicator?:ReactNode};
export function Select({label,value,options,onValueChange,open:controlled,onOpenChange,onBeforeOpen,placeholder='请选择',disabled=false,invalid=false,className,width='full',matchPopoverWidth=true,fitOptions=false,popoverClassName,selectionIndicator}:SelectProps){
 const trigger=useRef<HTMLButtonElement>(null),popup=useRef<HTMLDivElement>(null),request=useRef(0);
 const placement=useRef<DOMRect|null>(null);
 const [internal,setInternal]=useState(false),[preparing,setPreparing]=useState(false);const open=controlled??internal,id=useId();
 const selected=options.findIndex(option=>option.value===value);
 const change=(next:boolean)=>{setInternal(next);onOpenChange?.(next)};
 const close=(restore=false)=>{request.current++;popup.current?.hidePopover();change(false);if(restore)trigger.current?.focus({preventScroll:true})};
 const available=()=>Array.from(popup.current?.querySelectorAll<HTMLButtonElement>('[role=option]:not(:disabled)')??[]);
 const focus = (index: number) => {
  const option = available()[Math.max(0, index)];
  const panel = popup.current;
  if (!option || !panel) return;
  const scrollport = findOverlayScrollport(panel) ?? panel;
  option.focus({preventScroll: true});
  const row = option.getBoundingClientRect();
  const viewport = scrollport.getBoundingClientRect();
  if (row.top < viewport.top) scrollport.scrollTop += row.top - viewport.top;
  else if (row.bottom > viewport.bottom) scrollport.scrollTop += row.bottom - viewport.bottom;
 };
 const show=async(index=selected)=>{
  if(disabled||preparing||!options.some(item=>!item.disabled))return;const sequence=++request.current;
  if(onBeforeOpen){setPreparing(true);let allowed=false;try{allowed=await onBeforeOpen()}catch{return}finally{setPreparing(false)}if(!allowed||sequence!==request.current)return;}
  const button=trigger.current,panel=popup.current;if(!button||!panel)return;
  const box = button.getBoundingClientRect();
  placement.current = box;
  panel.style.maxHeight = '';
  panel.style.maxWidth = '';
  const css = getComputedStyle(panel);
  const gap = parseFloat(css.getPropertyValue('--lui-popup-gap')) || 6;
  const edge = parseFloat(css.getPropertyValue('--lui-popup-edge')) || 12;
  const maxHeight = parseFloat(css.maxHeight) || 280;
  const viewportWidth = Math.max(0, innerWidth - edge * 2);
  const baseWidth = matchPopoverWidth ? box.width : Math.max(box.width, 200);
  panel.style.maxWidth = viewportWidth + 'px';
  panel.style.width = fitOptions ? 'max-content' : Math.min(baseWidth, viewportWidth) + 'px';
  panel.showPopover();
  const naturalWidth = fitOptions ? panel.getBoundingClientRect().width : baseWidth;
  const panelWidth = Math.min(Math.max(baseWidth, naturalWidth), viewportWidth);
  panel.style.width = panelWidth + 'px';
  const left = fitOptions ? box.left + (box.width - panelWidth) / 2 : box.left;
  panel.style.left = Math.max(edge, Math.min(left, innerWidth - panelWidth - edge)) + 'px';

  const below = Math.max(0, innerHeight - box.bottom - gap - edge);
  const above = Math.max(0, box.top - gap - edge);
  const naturalHeight = measureOverlayContentHeight(panel) ?? panel.scrollHeight + 2;
  const up = naturalHeight > below && above > below;
  const space = up ? above : below;
  const available = space < 48 ? Math.max(0, innerHeight - edge * 2) : space;
  const height = Math.min(naturalHeight, available, maxHeight);
  const top = up ? box.top - gap - height : box.bottom + gap;
  panel.style.maxHeight = height + 'px';
  panel.style.top = Math.max(edge, Math.min(top, innerHeight - edge - height)) + 'px';
  change(true);
  focus(index);
 };
 useEffect(()=>{const panel=popup.current!;const toggle=()=>{const next=panel.matches(':popover-open');setInternal(next);if(!next)onOpenChange?.(false)};panel.addEventListener('toggle',toggle);return()=>{panel.removeEventListener('toggle',toggle);request.current++}},[]);
 useEffect(()=>{if(controlled===true&&!popup.current?.matches(':popover-open'))void show();else if(controlled===false)popup.current?.hidePopover()},[controlled]);
 useEffect(()=>{if(disabled){request.current++;setPreparing(false);if(open)close()}},[disabled]);
 useEffect(() => {
  if (!open) return;
  const stop = () => close();
  const scroll = (event: Event) => {
   if (!(event.target instanceof Node) || popup.current?.contains(event.target)) return;
   const before = placement.current;
   const after = trigger.current?.getBoundingClientRect();
   // 浏览器可能在下拉打开后才派发已完成的滚动事件。
   if (!before || !after || Math.abs(before.left - after.left) > .5 || Math.abs(before.top - after.top) > .5) close();
  };
  window.addEventListener('resize', stop);
  document.addEventListener('scroll', scroll, true);
  return () => {
   window.removeEventListener('resize', stop);
   document.removeEventListener('scroll', scroll, true);
  };
 }, [open]);
 const keys=(event:KeyboardEvent<HTMLDivElement>)=>{const buttons=available(),index=buttons.indexOf(document.activeElement as HTMLButtonElement);if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true)}else if(event.key==='Tab')close();else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();focus(event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length)}else if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){const match=options.findIndex((option,i)=>i>index&&!option.disabled&&option.label.toLowerCase().startsWith(event.key.toLowerCase()));if(match>=0)focus(match)}};
 return <><button ref={trigger} type="button" role="combobox" aria-label={label} aria-expanded={open} aria-controls={id} aria-haspopup="listbox" aria-invalid={invalid||undefined} aria-busy={preparing||undefined} disabled={disabled||!options.length} className={cx('lui-input','lui-select',width==='content'&&'lui-select--content',className)} onClick={()=>open?close(true):void show()} onKeyDown={event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();void show(event.key==='Home'?0:event.key==='End'?options.length-1:selected)}}}><span>{options[selected]?.label??placeholder}</span><ChevronDown className={open?'is-open':''}/></button><div ref={popup} id={id} popover="auto" role="listbox" aria-label={label+'选项'} className={cx('lui-select-popup',popoverClassName)} onKeyDown={keys}><OverlayScrollArea className="lui-select-popup-options">{options.map(option=><button key={option.value} type="button" role="option" tabIndex={-1} disabled={option.disabled} aria-selected={option.value===value} className="lui-select-option" onClick={()=>{onValueChange(option.value);close(true)}}><span>{option.label}</span>{selectionIndicator!=null?<span className="lui-select-option-indicator" aria-hidden="true">{selectionIndicator}</span>:option.value===value&&<Check/>}</button>)}</OverlayScrollArea></div></>;
}
export type SelectFieldProps = {
  options: readonly Option[];
  label: string;
  description?: ReactNode;
  layout?: "stacked" | "inline" | "form-row";
  align?: "start" | "end";
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  matchPopoverWidth?: boolean;
  className?: string;
};

/** A form-compatible, fully styled select field backed by the shared listbox. */
export function SelectField({
  options,
  label,
  description,
  layout = "stacked",
  align,
  name,
  value,
  defaultValue = "",
  onValueChange,
  placeholder,
  disabled,
  invalid,
  matchPopoverWidth = true,
  className,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const inline = layout !== "stacked";
  const [internalValue, setInternalValue] = useState(defaultValue);
  const resolvedValue = value ?? internalValue;

  useEffect(() => {
    if (value === undefined) setInternalValue(defaultValue);
  }, [defaultValue, value]);

  const changeValue = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <div
      className={cx(
        "lui-select-field",
        inline && "lui-settings-control-row lui-select-field--inline",
        layout === "form-row" && "lui-select-field--form-row",
        className,
      )}
    >
      <span className="lui-settings-control-row__copy lui-select-field__copy">
        <span className="lui-settings-control-row__title lui-select-field__label">{label}</span>
        {description ? <span className="lui-select-field__description">{description}</span> : null}
      </span>
      <div
        className={cx(
          "lui-settings-control-row__control",
          (align ?? (inline ? "end" : "start")) === "end"
            ? "lui-settings-control-row__control--end"
            : "lui-settings-control-row__control--start",
        )}
      >
        {name ? (
          <input type="hidden" name={name} value={resolvedValue} disabled={disabled} />
        ) : null}
        <Select
          options={options}
          value={resolvedValue}
          onValueChange={changeValue}
          label={label}
          open={open}
          onOpenChange={setOpen}
          disabled={disabled}
          invalid={invalid}
          width="content"
          matchPopoverWidth={matchPopoverWidth}
          {...(placeholder === undefined ? {} : { placeholder })}
        />
      </div>
    </div>
  );
}

export type MultiSelectFieldProps = {
  options: readonly Option[];
  values: readonly string[];
  onValuesChange: (values: string[]) => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  closeOnSelect?: boolean;
  selectionIndicator?: ReactNode;
  animatePresence?: boolean;
  chevron?: ReactNode;
};

export function MultiSelectField({
  options,
  values,
  onValuesChange,
  label,
  description,
  disabled,
  placeholder = translateUiSource("请选择"),
  className,
  closeOnSelect = false,
  selectionIndicator,
  animatePresence,
  chevron,
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((option) => values.includes(option.value));
  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]?.label
        : translateUiSource("{{p0}} 项已选择", { p0: selected.length });
  return (
    <div className={cx("lui-settings-control-row lui-select-field--inline", className)}>
      <span className="lui-settings-control-row__copy">
        <span className="lui-settings-control-row__title">{label}</span>
        {description ? (
          <span className="lui-settings-control-row__description">{description}</span>
        ) : null}
      </span>
      <div className="lui-settings-control-row__control lui-settings-control-row__control--end">
        <Popover
          open={open}
          onOpenChange={setOpen}
          label={label}
          matchTriggerWidth
          anchorClassName="lui-select-anchor lui-select-anchor--content"
          className="lui-select-popover"
          animatePresence={animatePresence}
          trigger={
            <button
              type="button"
              className="lui-select lui-select--content"
              disabled={disabled}
              aria-label={label}
              aria-haspopup="listbox"
            >
              <SelectTriggerValue
                value={summary}
                placeholder={!selected.length}
                labels={[
                  placeholder,
                  ...options.map((option) => option.label),
                  translateUiSource("{{p0}} 项已选择", { p0: options.length }),
                ]}
              />
              {chevron ?? <DisclosureChevron expanded={open} />}
            </button>
          }
        >
          <OverlayScrollArea>
            <div
              className="lui-select-options"
              role="listbox"
              aria-label={label}
              aria-multiselectable="true"
            >
              {options.map((option) => {
                const checked = values.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    disabled={disabled || option.disabled}
                    className="lui-select-options__item"
                    onClick={() => {
                      onValuesChange(
                        checked
                          ? values.filter((value) => value !== option.value)
                          : [...values, option.value],
                      );
                      if (closeOnSelect) setOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    <span className="lui-select-options__check" aria-hidden="true">
                      {selectionIndicator ?? (checked ? <Check /> : null)}
                    </span>
                  </button>
                );
              })}
            </div>
          </OverlayScrollArea>
        </Popover>
      </div>
    </div>
  );
}
