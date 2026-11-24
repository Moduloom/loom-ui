import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import { prefersReducedMotion } from "../utils/reducedMotion.js";
import { TAU, fitWheel, roundedSector, sectors, type Box } from "./shortcutWheelGeometry.js";

export type ShortcutWheelItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  display?: "icon" | "text" | "both";
  disabled?: boolean;
  shortcut?: string;
};

export type ShortcutWheelProps = {
  items: readonly ShortcutWheelItem[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string) => void;
  onAction?: (item: ShortcutWheelItem) => void;
  onCancel?: () => void;
  label?: string;
  centerLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
  autoExpand?: boolean;
  minDiameter?: number;
  maxDiameter?: number;
  iconSize?: number;
  gap?: number;
  hoverScale?: number;
  motion?: "auto" | "always" | "none";
  className?: string;
  style?: CSSProperties;
};

type Geo = { start: number; end: number; dx: number; dy: number; scale: number };
type GeoField = "start" | "end" | "dx" | "dy" | "scale";
const GEO_FIELDS: readonly GeoField[] = ["start", "end", "dx", "dy", "scale"];

const OMEGA_LIFT = 17; // 抬升（scale>1）较缓，约 280ms 到 95%
const OMEGA_RETURN = 27; // 回落更快
const HYSTERESIS = (3 * Math.PI) / 180; // 约 3° 迟滞
const ZERO_GEO: Geo = { start: 0, end: 0, dx: 0, dy: 0, scale: 0 };

function nearestTurn(target: number, current: number): number {
  let t = target;
  while (t - current > Math.PI) t -= TAU;
  while (current - t > Math.PI) t += TAU;
  return t;
}

function normAngle(a: number): number {
  const r = a % TAU;
  return r < 0 ? r + TAU : r;
}

function displayOf(item: ShortcutWheelItem): "icon" | "text" | "both" {
  const d = item.display ?? (item.icon ? "both" : "text");
  if (d === "icon" && !item.icon) return "text";
  return d;
}

const SETTLE_TOL: Record<GeoField, number> = {
  start: 0.003,
  end: 0.003,
  dx: 0.1,
  dy: 0.1,
  scale: 0.0005,
};
const SETTLE_VTOL: Record<GeoField, number> = {
  start: 0.08,
  end: 0.08,
  dx: 0.8,
  dy: 0.8,
  scale: 0.005,
};

export function ShortcutWheel({
  items,
  value,
  defaultValue = null,
  onValueChange,
  onAction,
  onCancel,
  label = "快捷操作",
  centerLabel = "快捷操作",
  cancelLabel = "Esc 取消",
  disabled = false,
  autoExpand = true,
  minDiameter = 320,
  maxDiameter = 640,
  iconSize = 24,
  gap = 5,
  hoverScale = 1.18,
  motion = "auto",
  className,
  style,
}: ShortcutWheelProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [keyboardFocusId, setKeyboardFocusId] = useState<string | null>(null);
  const [innerValue, setInnerValue] = useState<string | null>(defaultValue);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const reducedMotion =
    motion === "none" || (motion === "auto" && systemReducedMotion);
  const isControlled = value !== undefined;
  const selectedId = isControlled ? value : innerValue;

  const measureRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef(new Map<string, HTMLDivElement>());
  const pathRefs = useRef(new Map<string, SVGPathElement>());
  const gRefs = useRef(new Map<string, SVGGElement>());
  const contentRefs = useRef(new Map<string, HTMLSpanElement>());
  const clipEls = useRef(new Map<number, SVGPathElement>());
  const hitRefs = useRef(new Map<string, HTMLButtonElement>());
  const geoCache = useRef(new Map<string, Geo>()); // 当前几何
  const velCache = useRef(new Map<string, Geo>()); // 每字段速度，target 改变不清
  const targetsRef = useRef(new Map<string, Geo>());
  const runningRef = useRef(false);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const sizeKeyRef = useRef("");
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<{ rect: DOMRect; dirty: boolean } | null>(null);
  const applyRef = useRef<(t: Map<string, Geo>) => void>(() => {});
  // DOM 写入签名缓存：几何未变不重写 path/transform/变量
  const domSignaturesRef = useRef(new WeakMap<Element, Map<string, string>>());

  const layout = useMemo(
    () => fitWheel(boxes, minDiameter, maxDiameter, autoExpand, gap),
    [boxes, minDiameter, maxDiameter, autoExpand, gap],
  );

  // 有效的 active：hover/键盘焦点任一，但禁用或已移除时为 null
  const rawActiveId = hoverId ?? keyboardFocusId;
  const activeDef = items.find((it) => it.id === rawActiveId);
  const activeId =
    activeDef && !activeDef.disabled && !disabled ? activeDef.id : null;

  // 放大余量仅按 scale 增量估计，无外抽位移
  const padding =
    layout.radius * Math.max(0, hoverScale - 1) + 16;
  const size = 2 * (layout.radius + padding);
  const cx = size / 2;
  const cy = size / 2;
  const cr = layout.contentRadius;
  const hubRadius = layout.inner * 0.84;

  // ---- 中心文案：可中断交叉淡入淡出（Web Animations API），45ms 合并窗口 ----
  type Caption = { id: number; key: string; label: string; hint: string; isKey: boolean };
  const desiredLabel = activeDef && activeId === activeDef.id ? activeDef.label : centerLabel;
  const desiredHint =
    activeId != null && activeDef ? activeDef.shortcut || "点击执行" : cancelLabel;
  const desiredIsKey = activeId != null && !!activeDef?.shortcut;
  const captionKey = `${desiredLabel}\u0000${desiredHint}\u0000${desiredIsKey ? "1" : "0"}`;
  const captionSeq = useRef(0);
  const [captions, setCaptions] = useState<Caption[]>(() => [
    { id: 0, key: captionKey, label: desiredLabel, hint: desiredHint, isKey: desiredIsKey },
  ]);
  const captionsRef = useRef(captions);
  captionsRef.current = captions;
  const captionTimerRef = useRef<number>(0);
  const captionAnimsRef = useRef(new Map<number, Animation>());
  const captionElsRef = useRef(new Map<number, HTMLSpanElement>());
  const captionPhaseRef = useRef(new Map<number, "current" | "leaving">());

  useLayoutEffect(() => {
    window.clearTimeout(captionTimerRef.current);
    if (captionsRef.current[0]?.key === captionKey) return;
    const next = (): Caption => {
      captionSeq.current += 1;
      return { id: captionSeq.current, key: captionKey, label: desiredLabel, hint: desiredHint, isKey: desiredIsKey };
    };
    if (reducedMotion || captionsRef.current.length === 0) {
      window.clearTimeout(captionTimerRef.current);
      setCaptions([next()]);
      return;
    }
    // 极短合并窗口：指针快速掠过不逐格闪字；扇区动效不经过此延迟
    captionTimerRef.current = window.setTimeout(() => {
      if (captionsRef.current[0]?.key === captionKey) return;
      setCaptions((p) => [next(), ...p].slice(0, 4));
    }, 45);
    return () => window.clearTimeout(captionTimerRef.current);
  }, [captionKey, desiredLabel, desiredHint, desiredIsKey, reducedMotion]);

  // reduced-motion：只留单层，清除定时器与进行中的动画
  useEffect(() => {
    if (!reducedMotion) return;
    window.clearTimeout(captionTimerRef.current);
    for (const a of captionAnimsRef.current.values()) a.cancel();
    captionAnimsRef.current.clear();
    setCaptions((p) => (p.length > 1 ? p.slice(0, 1) : p));
  }, [reducedMotion]);

  // 提交后启动入场/离场动画；离场从真实 computed 值接着走，可中断、不从 1 重启
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const live = new Set(captions.map((cap) => cap.id));
    for (const [id, animation] of captionAnimsRef.current) {
      if (!live.has(id)) {
        animation.cancel();
        captionAnimsRef.current.delete(id);
      }
    }
    for (const id of captionPhaseRef.current.keys()) {
      if (!live.has(id)) captionPhaseRef.current.delete(id);
    }
    for (let i = 0; i < captions.length; i++) {
      const cap = captions[i];
      const phase = i === 0 ? "current" : "leaving";
      if (captionPhaseRef.current.get(cap.id) === phase) continue;
      captionPhaseRef.current.set(cap.id, phase);
      const el = captionElsRef.current.get(cap.id);
      if (!el || typeof el.animate !== "function") continue;
      if (i === 0) {
        if (captions.length > 1)
          captionAnimsRef.current.set(
            cap.id,
            el.animate(
              [
                { opacity: "0", transform: "translateY(2px)" },
                { opacity: "1", transform: "translateY(0px)" },
              ],
              { duration: 100, easing: "ease", fill: "both" },
            ),
          );
      } else {
        const cs = getComputedStyle(el);
        const fromOpacity = cs.opacity;
        const fromT = cs.transform && cs.transform !== "none" ? cs.transform : "translateY(0px)";
        captionAnimsRef.current.get(cap.id)?.cancel();
        const exit = el.animate(
          [
            { opacity: fromOpacity, transform: fromT },
            { opacity: "0", transform: "translateY(-2px)" },
          ],
          { duration: 100, easing: "ease", fill: "both" },
        );
        captionAnimsRef.current.set(cap.id, exit);
        exit.onfinish = () => {
          captionAnimsRef.current.delete(cap.id);
          captionElsRef.current.delete(cap.id);
          captionPhaseRef.current.delete(cap.id);
          setCaptions((p) => p.filter((c) => c.id !== cap.id));
        };
      }
    }
  }, [captions, reducedMotion]);
  const uid = `lui-sw${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const baseSlots = useMemo(() => sectors(items.length), [items.length]);

  // 最近活动绘制顺序：活动项移到末尾，离开时保留顺序（回落中的扇区不扔回基础位置）
  const [order, setOrder] = useState<string[]>(() => items.map((it) => it.id));
  const orderRef = useRef<string[]>(order);
  useLayoutEffect(() => {
    const ids = items.map((it) => it.id);
    const idSet = new Set(ids);
    let next = orderRef.current.filter((id) => idSet.has(id));
    for (const id of ids) if (!next.includes(id)) next.push(id);
    if (activeId) next = [...next.filter((id) => id !== activeId), activeId];
    if (next.join("\u0000") !== orderRef.current.join("\u0000")) {
      orderRef.current = next;
      setOrder(next);
    }
  }, [items, activeId]);
  const orderIndexById = useMemo(
    () => new Map(order.map((id, i) => [id, i] as const)),
    [order],
  );

  const surfaceOrder = useMemo(
    () => [...items].sort((a, b) => (orderIndexById.get(a.id) ?? items.length) - (orderIndexById.get(b.id) ?? items.length)),
    [items, orderIndexById],
  );
  // id -> 原始索引，供 use/clip 引用，避免 O(n²) indexOf
  const indexById = useMemo(
    () => new Map(items.map((it, i) => [it.id, i] as const)),
    [items],
  );

  // ---- 写 DOM：path d / g transform / content transform / hit clipPath / lift 变量 ----
  // 每项写入前比对签名（完整几何布局、角度、gap、padding），未变化不重写
  const apply = (t: Map<string, Geo>) => {
    // 按节点身份缓存；同 id 重新挂载也会完整初始化，移除节点由 WeakMap 自动回收。
    const changed = (node: Element, key: string, value: string) => {
      let signature = domSignaturesRef.current.get(node);
      if (!signature) {
        signature = new Map();
        domSignaturesRef.current.set(node, signature);
      }
      if (signature.get(key) === value) return false;
      signature.set(key, value);
      return true;
    };
    const liftDen = Math.max(1e-3, hoverScale - 1);
    let focus = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const g = t.get(item.id);
      if (!g) continue;
      const span = g.end - g.start;
      const gapAngle = Math.min(gap / (2 * layout.inner), span / 4);
      const a0 = g.start + gapAngle;
      const a1 = g.end - gapAngle;
      const path = pathRefs.current.get(item.id);
      if (path) {
        const sig = `${cx.toFixed(1)}|${cy.toFixed(1)}|${layout.inner.toFixed(2)}|${layout.radius.toFixed(2)}|${a0.toFixed(4)}|${a1.toFixed(4)}`;
        if (changed(path, "d", sig)) {
          path.setAttribute(
            "d",
            span > 0.02 ? roundedSector(cx, cy, layout.inner, layout.radius, a0, a1, 6) : "",
          );
        }
      }

      const mid = (g.start + g.end) / 2;
      const originX = cx + cr * Math.cos(mid);
      const originY = cy + cr * Math.sin(mid);
      const oX = originX.toFixed(2);
      const oY = originY.toFixed(2);
      const gg = gRefs.current.get(item.id);
      if (gg) {
        const tf = `translate(${g.dx.toFixed(2)} ${g.dy.toFixed(2)}) translate(${oX} ${oY}) scale(${g.scale.toFixed(3)}) translate(${(-originX).toFixed(2)} ${(-originY).toFixed(2)})`;
        if (changed(gg, "transform", tf)) {
          gg.setAttribute("transform", tf);
        }
      }

      const content = contentRefs.current.get(item.id);
      if (content) {
        const tf = `translate(${(originX + g.dx).toFixed(2)}px, ${(originY + g.dy).toFixed(2)}px) translate(-50%, -50%) scale(${g.scale.toFixed(3)})`;
        if (changed(content, "transform", tf)) {
          content.style.transform = tf;
        }
      }

      // lift：0..1 抬升进度，同一 spring 推导，驱动阴影/面色/高光/虚化
      const lift = Math.min(1, Math.max(0, (g.scale - 1) / liftDen)).toFixed(3);
      if (gg && changed(gg, "lift", lift)) gg.style.setProperty("--lui-wheel-lift", lift);
      if (content && changed(content, "lift", lift)) content.style.setProperty("--lui-wheel-lift", lift);
      const liftNum = Number(lift);
      if (liftNum > focus) focus = liftNum;

      // hit 楔形：原始槽位与当前角度（对齐同一圈）的并集
      const base = baseSlots[i];
      const bs = nearestTurn(base.start, g.start);
      const be = bs + (base.end - base.start);
      const ws = Math.min(bs, g.start);
      const we = Math.max(be, g.end);
      const clip = clipEls.current.get(i);
      if (clip) {
        const sig = `${cx.toFixed(1)}|${cy.toFixed(1)}|${layout.inner.toFixed(2)}|${(layout.radius + padding).toFixed(2)}|${ws.toFixed(4)}|${we.toFixed(4)}`;
        if (changed(clip, "d", sig)) {
          clip.setAttribute(
            "d",
            roundedSector(cx, cy, layout.inner - 10, layout.radius + padding, ws, Math.max(we, ws + 0.02), 0),
          );
        }
      }
    }
    // canvas 全局 focus 进度 = 当前最大 lift
    const focusSig = focus.toFixed(3);
    const canvas = canvasElRef.current;
    if (canvas && changed(canvas, "focus", focusSig)) canvas.style.setProperty("--lui-wheel-focus", focusSig);
  };
  applyRef.current = apply;

  // ---- 临界阻尼弹簧：连续、可打断、保留速度 ----
  // 临界阻尼闭式解直接按真实经过时间推进，无需每帧重复子步积分。
  const tick = (now: number) => {
    let dt = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 1 / 60;
    lastTimeRef.current = now;
    dt = Math.min(Math.max(dt, 0), 0.25);
    const targets = targetsRef.current;
    const frame = new Map<string, Geo>();
    const nextVel = new Map<string, Geo>();
    let settled = true;
    for (const [id, tg] of targets) {
      const omega = tg.scale > 1 ? OMEGA_LIFT : OMEGA_RETURN;
      const decay = Math.exp(-omega * dt);
      const cur = geoCache.current.get(id) ?? tg;
      const v = velCache.current.get(id) ?? ZERO_GEO;
      const g: Geo = { ...cur };
      const nv: Geo = { ...ZERO_GEO };
      let done = true;
      for (const f of GEO_FIELDS) {
        const delta = cur[f] - tg[f];
        const b = v[f] + omega * delta;
        const xN = tg[f] + (delta + b * dt) * decay;
        const vN = (v[f] - omega * b * dt) * decay;
        g[f] = xN;
        nv[f] = vN;
        if (
          Math.abs(xN - tg[f]) > SETTLE_TOL[f] ||
          Math.abs(vN) > SETTLE_VTOL[f]
        ) done = false;
      }
      if (done) {
        Object.assign(g, tg);
        nv.start = nv.end = nv.dx = nv.dy = nv.scale = 0;
      } else settled = false;
      frame.set(id, g);
      nextVel.set(id, nv);
    }
    applyRef.current(frame);
    geoCache.current = frame;
    velCache.current = nextVel;
    if (settled) {
      runningRef.current = false;
      lastTimeRef.current = 0;
      rafRef.current = 0;
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  };
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useLayoutEffect(() => {
    const n = items.length;
    if (n === 0) {
      geoCache.current.clear();
      velCache.current.clear();
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const activeIndex = activeId != null ? items.findIndex((it) => it.id === activeId) : -1;
    const target = baseSlots;
    const targets = new Map<string, Geo>();
    for (let i = 0; i < n; i++) {
      const s = target[i];
      targets.set(
        items[i].id,
        activeIndex === i
          ? { start: s.start, end: s.end, dx: 0, dy: 0, scale: hoverScale }
          : { start: s.start, end: s.end, dx: 0, dy: 0, scale: 1 },
      );
    }

    // 跨 2π 时对齐旧 mid，防整圈旋转
    for (const item of items) {
      const tg = targets.get(item.id)!;
      const old = geoCache.current.get(item.id);
      if (old) {
        const shift =
          nearestTurn((tg.start + tg.end) / 2, (old.start + old.end) / 2) -
          (tg.start + tg.end) / 2;
        if (shift) targets.set(item.id, { ...tg, start: tg.start + shift, end: tg.end + shift });
      }
    }

    const sizeKey = `${layout.radius}|${layout.inner}|${cr}`;
    const idsSame =
      geoCache.current.size === n && items.every((it) => geoCache.current.has(it.id));
    const hardReset = !idsSame || sizeKeyRef.current !== sizeKey;
    sizeKeyRef.current = sizeKey;
    targetsRef.current = targets;

    if (reducedMotion || hardReset) {
      // 布局/集合替换或 reduced-motion：直接落终态，速度清零
      cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
      lastTimeRef.current = 0;
      velCache.current = new Map();
      applyRef.current(targets);
      geoCache.current = new Map(targets);
      return;
    }

    // 新目标从当前 current+velocity 继续，不重启进度
    if (!runningRef.current) {
      runningRef.current = true;
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame((ts) => tickRef.current(ts));
    }
  }, [activeId, items, layout, reducedMotion, cr, hoverScale, gap, padding]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(captionTimerRef.current);
      for (const a of captionAnimsRef.current.values()) a.cancel();
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setSystemReducedMotion(prefersReducedMotion());
    onChange();
    mql.addEventListener("change", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ---- measure ----
  const remeasure = useCallback(() => {
    const partEls = (g: HTMLDivElement) =>
      Array.from(
        g.querySelectorAll<HTMLElement>(
          ":scope > .lui-shortcut-wheel__icon, :scope > .lui-shortcut-wheel__label",
        ),
      );
    const partsSame = (
      a: readonly { width: number; height: number; x: number; y: number }[] | undefined,
      b: readonly { width: number; height: number; x: number; y: number }[] | undefined,
    ) => {
      const pa = a ?? [];
      const pb = b ?? [];
      if (pa.length !== pb.length) return false;
      for (let i = 0; i < pa.length; i++)
        if (
          Math.abs(pa[i].width - pb[i].width) > 0.5 ||
          Math.abs(pa[i].height - pb[i].height) > 0.5 ||
          Math.abs(pa[i].x - pb[i].x) > 0.5 ||
          Math.abs(pa[i].y - pb[i].y) > 0.5
        )
          return false;
      return true;
    };
    const next: Box[] = [];
    for (const item of items) {
      const g = groupRefs.current.get(item.id);
      const gr = g?.getBoundingClientRect();
      const parts = (g ? partEls(g) : []).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          width: r.width,
          height: r.height,
          x: r.left + r.width / 2 - ((gr?.left ?? 0) + (gr?.width ?? 0) / 2),
          y: r.top + r.height / 2 - ((gr?.top ?? 0) + (gr?.height ?? 0) / 2),
        };
      });
      next.push({ width: gr?.width ?? 0, height: gr?.height ?? 0, parts });
    }
    let changed = next.length !== boxes.length;
    if (!changed)
      for (let i = 0; i < next.length; i++)
        if (
          Math.abs(next[i].width - boxes[i].width) > 0.5 ||
          Math.abs(next[i].height - boxes[i].height) > 0.5 ||
          !partsSame(next[i].parts, boxes[i].parts)
        ) {
          changed = true;
          break;
        }
    if (changed) setBoxes(next);
  }, [items, boxes]);

  useLayoutEffect(remeasure, [remeasure]);

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const container = measureRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => remeasure());
    ro.observe(container);
    for (const g of groupRefs.current.values()) ro.observe(g);
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    let cancelled = false;
    const again = () => !cancelled && remeasure();
    fonts?.ready.then(again);
    fonts?.addEventListener?.("loadingdone", again);
    return () => {
      cancelled = true;
      ro.disconnect();
      fonts?.removeEventListener?.("loadingdone", again);
    };
  }, [remeasure]);

  // items/禁用变化后校正悬停、键盘焦点与失效几何
  useLayoutEffect(() => {
    const live = new Map(items.map((it) => [it.id, it]));
    if (hoverId) {
      const it = live.get(hoverId);
      if (!it || it.disabled || disabled) setHoverId(null);
    }
    if (keyboardFocusId) {
      const it = live.get(keyboardFocusId);
      if (!it || it.disabled) setKeyboardFocusId(null);
    }
    const ids = new Set(live.keys());
    for (const id of [...geoCache.current.keys()]) if (!ids.has(id)) geoCache.current.delete(id);
    for (const id of [...velCache.current.keys()]) if (!ids.has(id)) velCache.current.delete(id);
  }, [items, hoverId, keyboardFocusId, disabled]);

  // canvas rect 缓存：任何提交后 DOM 可能被父级移动/重排（含 size/layout 变化），
  // 统一置空，下次 pointermove 按已有逻辑重新量一次；不读 DOM
  useLayoutEffect(() => {
    rectRef.current = null;
  });

  useEffect(() => {
    const markDirty = () => {
      if (rectRef.current) rectRef.current.dirty = true;
    };
    window.addEventListener("scroll", markDirty, true);
    window.addEventListener("resize", markDirty);
    return () => {
      window.removeEventListener("scroll", markDirty, true);
      window.removeEventListener("resize", markDirty);
    };
  }, []);

  // ---- hover：canvas pointermove + 固定均分槽位极角判定 ----
  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const el = canvasElRef.current;
    if (!el) return;
    let r = rectRef.current;
    if (!r || r.dirty) {
      r = { rect: el.getBoundingClientRect(), dirty: false };
      rectRef.current = r;
    }
    const x = e.clientX - (r.rect.left + r.rect.width / 2);
    const y = e.clientY - (r.rect.top + r.rect.height / 2);
    const rr = Math.hypot(x, y);
    if (rr < hubRadius || rr > layout.radius + padding) {
      setHoverId(null);
      return;
    }
    const n = items.length;
    if (!n) return;
    // 0 角为 -PI/2，固定均分边界，不随动画变化
    const ang = normAngle(Math.atan2(y, x) + Math.PI / 2);
    const slotSpan = TAU / n;
    if (hoverId) {
      const ci = items.findIndex((it) => it.id === hoverId);
      if (ci >= 0) {
        const cs = ci * slotSpan;
        const ce = (ci + 1) * slotSpan;
        const localAngle = nearestTurn(ang, (cs + ce) / 2);
        if (localAngle >= cs - HYSTERESIS && localAngle <= ce + HYSTERESIS) {
          if (items[ci].disabled || disabled) setHoverId(null);
          return;
        }
      }
    }
    const idx = Math.min(n - 1, Math.floor(ang / slotSpan));
    const it = items[idx];
    setHoverId(!it || it.disabled || disabled ? null : it.id);
  };

  // ---- interaction ----
  const pick = (item: ShortcutWheelItem) => {
    if (disabled || item.disabled) return;
    if (!isControlled) setInnerValue(item.id);
    onValueChange?.(item.id);
    onAction?.(item);
  };

  const cancel = () => {
    setHoverId(null);
    setKeyboardFocusId(null);
    onCancel?.();
  };

  const onHitKeyDown = (e: React.KeyboardEvent, index: number) => {
    const n = items.length;
    const move = (dir: number | "home" | "end") => {
      e.preventDefault();
      let next = -1;
      if (dir === "home") {
        for (let i = 0; i < n; i++) if (!items[i].disabled) { next = i; break; }
      } else if (dir === "end") {
        for (let i = n - 1; i >= 0; i--) if (!items[i].disabled) { next = i; break; }
      } else {
        for (let s = 1; s <= n; s++) {
          const i = (index + dir * s + n * 2) % n;
          if (!items[i].disabled) { next = i; break; }
        }
      }
      if (next < 0) return;
      const id = items[next].id;
      setKeyboardFocusId(id);
      setHoverId(null);
      hitRefs.current.get(id)?.focus();
    };
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(-1);
    else if (e.key === "ArrowRight" || e.key === "ArrowDown") move(1);
    else if (e.key === "Home") move("home");
    else if (e.key === "End") move("end");
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancel();
    }
  };

  const canvasStyle: CSSProperties = {
    ["--lui-wheel-size" as string]: `${size.toFixed(1)}px`,
    ["--lui-wheel-icon-size" as string]: `${iconSize}px`,
    ["--lui-wheel-hub-size" as string]: `${(hubRadius * 2).toFixed(1)}px`,
  } as CSSProperties;

  const contentInner = (it: ShortcutWheelItem) => {
    const d = displayOf(it);
    return (
      <>
        {d !== "text" ? (
          <span className="lui-shortcut-wheel__icon" aria-hidden="true">{it.icon}</span>
        ) : null}
        {d !== "icon" ? (
          <span className="lui-shortcut-wheel__label">{it.label}</span>
        ) : null}
      </>
    );
  };

  return (
    <div
      ref={rootRef}
      className={["lui-shortcut-wheel", className].filter(Boolean).join(" ")}
      style={{ maxWidth: "100%", overflow: "auto", ...style }}
      role="group"
      aria-label={label}
      data-content-overflow={layout.overflow ? "true" : "false"}
      data-active={activeId ? "true" : "false"}
      data-motion={reducedMotion ? "reduced" : "full"}
      onPointerLeave={() => setHoverId(null)}
      onPointerDownCapture={() => setKeyboardFocusId(null)}
      onBlur={(e) => {
        if (!e.relatedTarget || !rootRef.current?.contains(e.relatedTarget)) {
          setKeyboardFocusId(null);
        }
      }}
    >
      <div
        ref={canvasElRef}
        className="lui-shortcut-wheel__canvas"
        style={canvasStyle}
        onPointerMove={onCanvasPointerMove}
      >
        <svg
          className="lui-shortcut-wheel__visual"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
          style={{ pointerEvents: "none", position: "absolute", inset: 0 }}
        >
          <defs>
            <linearGradient id={`${uid}-finish`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="lui-shortcut-wheel__finish-top" />
              <stop offset="0.55" className="lui-shortcut-wheel__finish-mid" />
              <stop offset="1" className="lui-shortcut-wheel__finish-bottom" />
            </linearGradient>
            {items.map((it, i) => (
              <path
                id={`${uid}-shape-${i}`}
                key={`s-${it.id}`}
                ref={(p) => { if (p) pathRefs.current.set(it.id, p); else pathRefs.current.delete(it.id); }}
              />
            ))}
            {items.map((it, i) => (
              <clipPath id={`${uid}-hit-${i}`} key={`c-${it.id}`}>
                <path
                  ref={(p) => { if (p) clipEls.current.set(i, p); else clipEls.current.delete(i); }}
                />
              </clipPath>
            ))}
          </defs>
          {surfaceOrder.map((it) => {
            const i = indexById.get(it.id)!;
            const stateClasses = [
              it.disabled || disabled ? "is-disabled" : "",
            ].filter(Boolean).join(" ");
            return (
              <g
                key={it.id}
                className={["lui-shortcut-wheel__sector", stateClasses].filter(Boolean).join(" ")}
                ref={(g) => { if (g) gRefs.current.set(it.id, g); else gRefs.current.delete(it.id); }}
              >
                <use
                  href={`#${uid}-shape-${i}`}
                  className={[
                    "lui-shortcut-wheel__surface",
                    stateClasses,
                    keyboardFocusId === it.id ? "is-focused" : "",
                  ].filter(Boolean).join(" ")}
                />
                <use
                  href={`#${uid}-shape-${i}`}
                  className="lui-shortcut-wheel__finish"
                  fill={`url(#${uid}-finish)`}
                />
              </g>
            );
          })}
        </svg>

        {items.map((it) => (
          <span
            key={it.id}
            aria-hidden="true"
            className={[
              "lui-shortcut-wheel__content",
              it.disabled || disabled ? "is-disabled" : "",
            ].filter(Boolean).join(" ")}
            ref={(el) => { if (el) contentRefs.current.set(it.id, el); else contentRefs.current.delete(it.id); }}
            style={{ position: "absolute", left: 0, top: 0, zIndex: 1 + (orderIndexById.get(it.id) ?? 0) }}
          >
            {contentInner(it)}
          </span>
        ))}

        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            className={[
              "lui-shortcut-wheel__hit",
              activeId === it.id ? "is-active" : "",
              it.disabled || disabled ? "is-disabled" : "",
            ].filter(Boolean).join(" ")}
            ref={(b) => { if (b) hitRefs.current.set(it.id, b); else hitRefs.current.delete(it.id); }}
            style={{ position: "absolute", inset: 0, clipPath: `url(#${uid}-hit-${i})` }}
            aria-label={it.shortcut ? `${it.label}（${it.shortcut}）` : it.label}
            aria-pressed={selectedId === it.id}
            disabled={disabled || it.disabled}
            onFocus={(e) => {
              if (e.currentTarget.matches?.(":focus-visible")) setKeyboardFocusId(it.id);
            }}
            onKeyDown={(e) => onHitKeyDown(e, i)}
            onClick={() => pick(it)}
          />
        ))}

        <button
          type="button"
          className="lui-shortcut-wheel__center"
          style={{ position: "absolute", left: cx, top: cy }}
          disabled={disabled}
          aria-label={`${desiredLabel}，${desiredHint}`}
          onPointerEnter={() => setHoverId(null)}
          onClick={cancel}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
        >
          <span className="lui-shortcut-wheel__center-copy">
            {captions.map((cap, i) => (
              <span
                key={cap.id}
                aria-hidden="true"
                ref={(el) => { if (el) captionElsRef.current.set(cap.id, el); else captionElsRef.current.delete(cap.id); }}
                className={
                  i === 0
                    ? "lui-shortcut-wheel__center-layer is-current"
                    : "lui-shortcut-wheel__center-layer is-leaving"
                }
              >
                <span className="lui-shortcut-wheel__center-label">{cap.label}</span>
                <span
                  className={[
                    "lui-shortcut-wheel__center-hint",
                    cap.isKey ? "is-key" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {cap.hint}
                </span>
              </span>
            ))}
          </span>
        </button>

        {/* 隐藏测量组：visibility 隐藏但参与布局，结构与可见 content 一致 */}
        <div
          ref={measureRef}
          className="lui-shortcut-wheel__measure"
          aria-hidden="true"
          style={{ visibility: "hidden", position: "absolute", pointerEvents: "none" }}
        >
          {items.map((it) => (
            <div
              key={it.id}
              className="lui-shortcut-wheel__content"
              ref={(g) => { if (g) groupRefs.current.set(it.id, g); else groupRefs.current.delete(it.id); }}
            >
              {contentInner(it)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
