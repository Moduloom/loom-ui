import {prefersReducedMotion} from '../utils/reducedMotion.js';
import {Info,TriangleAlert,X} from 'lucide-react';
import {cloneElement,isValidElement,useLayoutEffect,useEffect,useId,useRef,useState,type ReactNode,type RefObject,type ButtonHTMLAttributes,type ReactElement} from 'react';
import {cx} from '../utils/cn.js';
import {translateUiSource} from '../i18n';
import {IconButton} from './IconButton.js';
import type {AccentPreference} from '../theme/ThemeProvider.js';
export type DialogProps={open:boolean;onOpenChange:(open:boolean)=>void;onExitComplete?:()=>void;title:string;description?:string;trigger?:ReactNode;children:ReactNode;footer?:ReactNode;closeLabel?:string;className?:string;overlayClassName?:string;hideHeader?:boolean;bodyClassName?:string;headerClassName?:string;size?:'standard'|'medium'|'wide';backdrop?:'default'|'blurred'|'opaque';layer?:'base'|'nested';dismissible?:boolean;initialOpening?:'animated'|'immediate';accent?:AccentPreference;returnFocusTarget?:RefObject<HTMLElement|null>;closing?:boolean};
export function Dialog({open,onOpenChange,onExitComplete,title,description,trigger,children,footer,closeLabel='关闭',className,overlayClassName,hideHeader=false,bodyClassName,headerClassName,size='standard',backdrop='default',layer='base',dismissible=true,initialOpening='animated',accent,returnFocusTarget,closing=false}:DialogProps){
 const ref=useRef<HTMLDialogElement>(null),previous=useRef<HTMLElement|null>(null),titleId=useId(),descriptionId=useId(),[exiting,setExiting]=useState(false);
 const callbacks=useRef({onExitComplete,onOpenChange});callbacks.current={onExitComplete,onOpenChange};
 useLayoutEffect(()=>{const node=ref.current!;if(open){setExiting(false);if(!node.open){previous.current=document.activeElement as HTMLElement;node.showModal();node.querySelector<HTMLElement>('input:not(:disabled),textarea:not(:disabled)')?.focus({preventScroll:true})}}else if(node.open)setExiting(true)},[open]);
 useEffect(()=>{if(!exiting)return;const node=ref.current!,duration=prefersReducedMotion()?0:parseFloat(getComputedStyle(node).getPropertyValue('--lui-duration-standard'))||160;const timer=setTimeout(()=>{node.close();setExiting(false);const target=returnFocusTarget?.current??previous.current;if(target?.isConnected)target.focus({preventScroll:true});callbacks.current.onExitComplete?.()},duration);return()=>clearTimeout(timer)},[exiting]);
 useEffect(()=>()=>{ref.current?.close();const target=returnFocusTarget?.current??previous.current;if(target?.isConnected)target.focus({preventScroll:true})},[]);
 const close=()=>{if(dismissible&&!closing&&!exiting)callbacks.current.onOpenChange(false)};
 const triggerNode=isValidElement(trigger)?cloneElement(trigger as ReactElement<any>,{onClick:(event:any)=>{(trigger as ReactElement<any>).props.onClick?.(event);if(!event.defaultPrevented)onOpenChange(true)}}):trigger;
 return <>{triggerNode}<dialog ref={ref} className={cx('lui-dialog','lui-dialog--'+size,'lui-dialog--'+backdrop,(closing||exiting)&&'is-closing',className,overlayClassName)} data-lui-accent={accent} data-immediate={initialOpening==='immediate'||undefined} data-layer={layer} inert={closing||exiting||undefined} aria-labelledby={titleId} aria-describedby={description?descriptionId:undefined} onCancel={event=>{event.preventDefault();close()}} onClick={event=>{if(event.target!==event.currentTarget)return;const box=event.currentTarget.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close()}}><header className={cx(hideHeader&&'lui-visually-hidden',headerClassName)}><div><h2 id={titleId}>{title}</h2>{description&&<p id={descriptionId}>{description}</p>}</div>{!hideHeader&&dismissible&&<IconButton label={closeLabel} onClick={close}><X/></IconButton>}</header><div className={cx('lui-dialog-body',bodyClassName)}>{children}</div>{footer&&<footer>{footer}</footer>}</dialog></>;
}
export function DialogNotice({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "danger";
}) {
  const Icon = tone === "danger" ? TriangleAlert : Info;

  return (
    <div className={cx("lui-dialog-notice", `lui-dialog-notice--${tone}`)}>
      <span className="lui-dialog-notice__icon" aria-hidden="true">
        <Icon />
      </span>
      <div className="lui-dialog-notice__content">{children}</div>
    </div>
  );
}

export type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExitComplete?: () => void;
  title: string;
  navigationLabel: string;
  navigation: ReactNode;
  contentLabel: string;
  children: ReactNode;
  auxiliary?: ReactNode;
  auxiliaryLabel?: string;
  busy?: boolean;
  navigationClassName?: string;
  contentClassName?: string;
  contentWidth?: "standard" | "wide" | "full";
};

export function SettingsDialog({
  open,
  onOpenChange,
  onExitComplete,
  title,
  navigationLabel,
  navigation,
  contentLabel,
  children,
  auxiliary,
  auxiliaryLabel,
  busy = false,
  navigationClassName,
  contentClassName,
  contentWidth = "standard",
}: SettingsDialogProps) {
  const contentRef = useRef<HTMLElement>(null);
  const previousContentIdentityRef = useRef("");
  const [contentTransitionEpoch, setContentTransitionEpoch] = useState(0);
  const contentIdentity = contentLabel;

  useLayoutEffect(() => {
    if (!open) {
      previousContentIdentityRef.current = "";
      setContentTransitionEpoch(0);
      return;
    }
    if (previousContentIdentityRef.current === contentIdentity || !contentRef.current) {
      return;
    }
    const previousContentIdentity = previousContentIdentityRef.current;
    const content = contentRef.current;
    previousContentIdentityRef.current = contentIdentity;
    content.scrollTop = 0;
    content.scrollLeft = 0;
    if (previousContentIdentity) {
      setContentTransitionEpoch((current) => current + 1);
    }
  }, [contentIdentity, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      {...(onExitComplete ? { onExitComplete } : {})}
      title={title}
      hideHeader
      backdrop="opaque"
      dismissible={!busy}
      bodyClassName="lui-settings-dialog__body"
      className="lui-settings-dialog"
      overlayClassName="lui-settings-dialog-overlay"
    >
      <div className={cx("lui-settings-shell", `lui-settings-shell--${contentWidth}`)}>
        <button
          type="button"
          className="lui-settings-shell__close"
          aria-label={translateUiSource("返回")}
          disabled={busy}
          onClick={() => onOpenChange(false)}
        >
          <X aria-hidden="true" />
        </button>
        <nav
          className={cx(
            "lui-settings-shell__navigation md:!w-[min(100%,18rem)]",
            navigationClassName,
          )}
          aria-label={navigationLabel}
        >
          {navigation}
        </nav>
        <main
          ref={contentRef}
          className={cx(
            "lui-settings-shell__content",
            contentTransitionEpoch > 0 &&
              `lui-settings-shell__content--transition-${contentTransitionEpoch % 2 ? "a" : "b"}`,
            contentClassName,
          )}
          aria-label={contentLabel}
        >
          {auxiliary ? (
            <div className="lui-settings-shell__content-grid">
              <div className="lui-settings-shell__primary">{children}</div>
              <aside
                className="lui-settings-shell__auxiliary"
                {...(auxiliaryLabel ? { "aria-label": auxiliaryLabel } : {})}
              >
                {auxiliary}
              </aside>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </Dialog>
  );
}

export function SettingsNavItem({
  active,
  icon,
  tone = "neutral",
  children,
  className,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  icon?: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <button
      type="button"
      className={cx(
        "lui-settings-nav-item",
        "md:!mb-1.5 md:!min-h-[48px] md:!gap-3 md:!px-3 md:!py-3 md:!text-[16px] md:!leading-6",
        tone === "danger" && "lui-settings-nav-item--danger",
        active && "is-active",
        className,
      )}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      {...props}
    >
      {icon ? <span className="lui-settings-nav-item__icon">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

export function DialogActionRow({
  title,
  description,
  children,
  danger = false,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={cx("lui-dialog-action-row", danger && "lui-dialog-action-row--danger")}>
      <span className="lui-dialog-action-row__copy">
        {title ? <strong>{title}</strong> : null}
        {description ? <small>{description}</small> : null}
      </span>
      <span className="lui-dialog-action-row__actions">{children}</span>
    </div>
  );
}

export function DialogFormFooter({
  children,
  spacing = "default",
}: {
  children: ReactNode;
  spacing?: "default" | "grouped";
}) {
  return (
    <footer
      className={cx(
        "lui-dialog-form-footer",
        spacing === "grouped" && "lui-dialog-form-footer--grouped",
      )}
    >
      {children}
    </footer>
  );
}

export function SettingsSectionHeader({
  title,
  description,
  actions,
  actionsPlacement = "edge",
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  actionsPlacement?: "edge" | "inline" | "description";
}) {
  return (
    <header className="lui-settings-section-header">
      <span className="lui-settings-section-header__copy">
        <span className="lui-settings-section-header__title-row">
          <h2>{title}</h2>
          {actions && actionsPlacement === "inline" ? (
            <span className="lui-settings-section-header__actions">{actions}</span>
          ) : null}
        </span>
        {description ? (
          <span className="lui-settings-section-header__description-row">
            <p>{description}</p>
            {actions && actionsPlacement === "description" ? (
              <span className="lui-settings-section-header__actions">{actions}</span>
            ) : null}
          </span>
        ) : null}
      </span>
      {actions && actionsPlacement === "edge" ? (
        <span className="lui-settings-section-header__actions">{actions}</span>
      ) : null}
    </header>
  );
}

export function SettingsFormFooter({ children }: { children: ReactNode }) {
  return <footer className="lui-settings-form-footer">{children}</footer>;
}
