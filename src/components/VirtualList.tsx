import {
  type HTMLAttributes,
  type ReactNode,
  type UIEventHandler,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../utils/cn.js";
import { OverlayScrollArea } from './OverlayScrollArea.js';

export type VirtualListProps<Item> = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  items: readonly Item[];
  itemHeight: number;
  getItemKey: (item: Item, index: number) => string;
  renderItem: (item: Item, index: number) => ReactNode;
  overscan?: number;
  overlayScroll?: boolean;
};

export function VirtualList<Item>({
  items,
  itemHeight,
  getItemKey,
  renderItem,
  overscan = 4,
  overlayScroll = false,
  className,
  onScroll,
  role = "list",
  ...props
}: VirtualListProps<Item>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, 0]);
  const totalHeight = items.length * itemHeight;
  const [firstVisibleIndex, lastVisibleIndex] = visibleRange;
  const updateRange = (scrollTop: number, height: number) => {
    const first = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const last = Math.min(
      items.length,
      Math.ceil((scrollTop + height) / itemHeight) + overscan,
    );
    setVisibleRange((current) =>
      current[0] === first && current[1] === last ? current : [first, last],
    );
  };
  const handleScroll: UIEventHandler<HTMLDivElement> = (event) => {
    scrollTopRef.current = event.currentTarget.scrollTop;
    updateRange(scrollTopRef.current, event.currentTarget.clientHeight);
    onScroll?.(event);
  };

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const maximumScrollTop = Math.max(0, totalHeight - viewport.clientHeight);
      if (viewport.scrollTop > maximumScrollTop) {
        viewport.scrollTop = maximumScrollTop;
      }
      scrollTopRef.current = viewport.scrollTop;
      updateRange(scrollTopRef.current, viewport.clientHeight);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
    // biome-ignore lint/correctness/useExhaustiveDependencies: range depends on item geometry, not identity of updateRange.
  }, [totalHeight, itemHeight, overscan, items.length]);

  const content = (
      <div className="lui-virtual-list__spacer" style={{ height: totalHeight }}>
        {items.slice(firstVisibleIndex, lastVisibleIndex).map((item, offset) => {
          const index = firstVisibleIndex + offset;
          return (
            // Virtualized items must stay positioned inside the measured spacer element.
            // biome-ignore lint/a11y/useSemanticElements: ARIA preserves list semantics without invalid li nesting.
            <div
              key={getItemKey(item, index)}
              className="lui-virtual-list__item"
              role="listitem"
              aria-posinset={index + 1}
              aria-setsize={items.length}
              style={{ height: itemHeight, transform: `translateY(${index * itemHeight}px)` }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
  );
  if (overlayScroll) {
    return <OverlayScrollArea areaClassName={className} viewportRef={viewportRef}
      viewportProps={{...props, role, onScroll: handleScroll, className: 'lui-virtual-list'}}>{content}</OverlayScrollArea>;
  }
  return <div {...props} ref={viewportRef} className={cx('lui-virtual-list', className)}
    role={role} onScroll={handleScroll}>{content}</div>;
}
