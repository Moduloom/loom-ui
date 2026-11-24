import {
  cloneElement, useLayoutEffect, useRef, type ComponentPropsWithRef, type HTMLAttributes,
  type PointerEvent, type ReactElement, type ReactNode, type Ref,
} from 'react';
import {cx} from '../utils/cn.js';

const endInset = 2;
const minimumThumb = 20;
const directions = ['y', 'x'] as const;
type Axis = typeof directions[number];
type Travel = {scrollRange: number; thumbRange: number; direction: number};
type Drag = {axis: Axis; pointerId: number; origin: number; scroll: number};
type ViewportProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'>;
type TextareaViewport = ReactElement<ComponentPropsWithRef<'textarea'>, 'textarea'>;

export function OverlayScrollArea({
  children, className, areaClassName, viewportProps, viewportRef, textarea, horizontal = false,
}: {
  children?: ReactNode; className?: string; areaClassName?: string; textarea?: TextareaViewport;
  viewportProps?: ViewportProps; viewportRef?: Ref<HTMLDivElement>; horizontal?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const thumbs = useRef<Partial<Record<Axis, HTMLDivElement | null>>>({});
  const travel = useRef<Partial<Record<Axis, Travel>>>({});
  const drag = useRef<Drag | null>(null);
  const refresh = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    const area = root.current;
    const port = viewport.current;
    const body = content.current ?? port;
    if (!area || !port || !body) return;
    let frame = 0;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const thumbElements = directions.flatMap(axis => {
      const element = thumbs.current[axis];
      return element ? [{axis, element}] : [];
    });

    const paint = () => {
      frame = 0;
      const both = horizontal && port.scrollWidth > port.clientWidth && port.scrollHeight > port.clientHeight;
      for (const {axis, element} of thumbElements) {
        const vertical = axis === 'y';
        const visible = vertical ? port.clientHeight : port.clientWidth;
        const total = vertical ? port.scrollHeight : port.scrollWidth;
        const scrollRange = Math.max(0, total - visible);
        const hitWidth = both ? element.getBoundingClientRect()[vertical ? 'width' : 'height'] : 0;
        const length = Math.max(0, visible - 2 * endInset - hitWidth);
        element.hidden = scrollRange === 0 || length === 0;
        if (element.hidden) {
          delete travel.current[axis];
          continue;
        }
        const direction = !vertical && getComputedStyle(port).direction === 'rtl' ? -1 : 1;
        const size = Math.min(length, Math.max(minimumThumb, length * visible / total));
        const thumbRange = length - size;
        const offset = vertical ? port.scrollTop : port.scrollLeft * direction;
        const progress = Math.max(0, Math.min(1, offset / scrollRange));
        travel.current[axis] = {scrollRange, thumbRange, direction};
        element.style[vertical ? 'height' : 'width'] = size + 'px';
        element.style.transform = (vertical ? 'translateY(' : 'translateX(') + progress * thumbRange * direction + 'px)';
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    refresh.current = schedule;
    const onScroll = () => {
      area.dataset.scrolling = '';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {delete area.dataset.scrolling;}, 650);
      schedule();
    };
    const onWheel = (event: WheelEvent) => {
      const axis = (event.currentTarget as HTMLDivElement).dataset.axis as Axis;
      const offset = axis === 'y' ? event.deltaY : event.deltaX || (event.shiftKey ? event.deltaY : 0);
      if (!offset || !travel.current[axis]) return;
      const page = axis === 'y' ? port.clientHeight : port.clientWidth;
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 :
        event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? page : 1;
      if (axis === 'y') port.scrollTop += offset * unit;
      else port.scrollLeft += offset * unit;
      event.preventDefault();
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(port);
    observer.observe(body);
    const trackChildren = () => {
      observer.disconnect();
      observer.observe(port);
      observer.observe(body);
      for (const child of body.children) observer.observe(child);
      schedule();
    };
    const childChanges = horizontal ? new MutationObserver(trackChildren) : undefined;
    if (childChanges) {
      childChanges.observe(body, {childList: true});
      trackChildren();
    }
    port.addEventListener('scroll', onScroll, {passive: true});
    if (textarea) port.addEventListener('input', schedule);
    for (const {element} of thumbElements) element.addEventListener('wheel', onWheel, {passive: false});
    paint();
    return () => {
      port.removeEventListener('scroll', onScroll);
      port.removeEventListener('input', schedule);
      refresh.current = null;
      for (const {element} of thumbElements) element.removeEventListener('wheel', onWheel);
      observer.disconnect();
      childChanges?.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(hideTimer);
      delete area.dataset.scrolling;
      delete area.dataset.dragging;
      drag.current = null;
    };
  }, [horizontal, Boolean(textarea)]);
  useLayoutEffect(() => {if (textarea) refresh.current?.();});

  function begin(event: PointerEvent<HTMLDivElement>, axis: Axis) {
    const port = viewport.current;
    if (!port || event.button !== 0 || drag.current || !travel.current[axis]?.thumbRange) return;
    event.preventDefault();
    drag.current = {axis, pointerId: event.pointerId, origin: axis === 'y' ? event.clientY : event.clientX,
      scroll: axis === 'y' ? port.scrollTop : port.scrollLeft};
    event.currentTarget.setPointerCapture(event.pointerId);
    root.current?.setAttribute('data-dragging', '');
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    const port = viewport.current;
    if (!active || active.pointerId !== event.pointerId || !port) return;
    const range = travel.current[active.axis];
    if (!range?.thumbRange) return;
    const position = active.axis === 'y' ? event.clientY : event.clientX;
    port[active.axis === 'y' ? 'scrollTop' : 'scrollLeft'] =
      active.scroll + (position - active.origin) * range.scrollRange / range.thumbRange;
  }
  function finish(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    root.current?.removeAttribute('data-dragging');
  }
  function thumb(axis: Axis) {
    return <div ref={value => {thumbs.current[axis] = value;}} className="lui-overlay-scroll-thumb"
      data-axis={axis} aria-hidden="true" hidden onPointerDown={event => begin(event, axis)}
      onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}/>;
  }

  return <div className={cx('lui-overlay-scroll-area', areaClassName)} ref={root}>
    {textarea ? cloneElement(textarea, {
      className: cx('lui-overlay-scrollport', textarea.props.className),
      ref: (value: HTMLTextAreaElement | null) => {
        viewport.current = value;
        const ref = textarea.props.ref;
        if (typeof ref === 'function') return ref(value);
        if (ref) ref.current = value;
      },
      ...{'data-lui-overlay-scrollport': '', 'data-scroll-x': horizontal || undefined},
    }) : <div {...viewportProps}
      className={cx('lui-overlay-scrollport', viewportProps?.className)}
      data-lui-overlay-scrollport="" data-scroll-x={horizontal || undefined}
      ref={value => {
        viewport.current = value;
        if (typeof viewportRef === 'function') return viewportRef(value);
        if (viewportRef) viewportRef.current = value;
      }}>
      <div className={cx('lui-overlay-scroll-content', className)} ref={content}>{children}</div>
    </div>}
    {thumb('y')}
    {horizontal && thumb('x')}
  </div>;
}

export function findOverlayScrollport(host: HTMLElement): HTMLElement | null {
  return host.querySelector(':scope > .lui-overlay-scroll-area > [data-lui-overlay-scrollport]');
}

export function measureOverlayContentHeight(host: HTMLElement): number | undefined {
  const scrollport = findOverlayScrollport(host);
  if (!scrollport) return undefined;
  const content = scrollport.firstElementChild;
  const style = getComputedStyle(host);
  const contentHeight = content instanceof HTMLElement
    ? Math.max(content.getBoundingClientRect().height, content.scrollHeight)
    : scrollport.scrollHeight;
  return contentHeight +
    parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) +
    parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
}
