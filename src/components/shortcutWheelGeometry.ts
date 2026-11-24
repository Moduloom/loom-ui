export const TAU = Math.PI * 2;

export type Box = {
  width: number;
  height: number;
  /** 可选分块测量：x/y 为 part 中心相对组中心的偏移，省略时按整体矩形测量 */
  parts?: readonly { width: number; height: number; x: number; y: number }[];
};

export type Sector = { start: number; end: number; mid: number };

export type WheelLayout = {
  radius: number;
  inner: number;
  contentRadius: number;
  overflow: boolean;
};

const EPS = 1e-6;

function pt(cx: number, cy: number, r: number, a: number): [number, number] {
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/**
 * 圆角环形扇区 SVG path：4 个角用 Q，内外弧用 A，径向边为短直线段。
 * 角度制为屏幕坐标（y 向下，角度增大即顺时针）。
 */
export function roundedSector(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  start: number,
  end: number,
  corner = 6,
): string {
  if (!(outer > inner) || !(inner > 0)) return '';
  const sweep = end - start;
  if (!(sweep > EPS)) return '';

  const f = (n: number) => n.toFixed(3);

  // 单扇区接近完整 2π：退化为外整圆 + 内整圆（反向）两个闭合子路径
  if (sweep >= TAU - 1e-4) {
    const [ox, oy] = pt(cx, cy, outer, start);
    const [ix, iy] = pt(cx, cy, inner, start);
    const [ox2, oy2] = pt(cx, cy, outer, start + Math.PI);
    const [ix2, iy2] = pt(cx, cy, inner, start + Math.PI);
    return (
      `M ${f(ox)} ${f(oy)}` +
      ` A ${f(outer)} ${f(outer)} 0 1 1 ${f(ox2)} ${f(oy2)}` +
      ` A ${f(outer)} ${f(outer)} 0 1 1 ${f(ox)} ${f(oy)} Z` +
      ` M ${f(ix)} ${f(iy)}` +
      ` A ${f(inner)} ${f(inner)} 0 1 0 ${f(ix2)} ${f(iy2)}` +
      ` A ${f(inner)} ${f(inner)} 0 1 0 ${f(ix)} ${f(iy)} Z`
    );
  }

  const c = Math.min(corner, (outer - inner) / 4, (sweep * inner) / 5);
  const largeOuter = sweep - (2 * c) / outer > Math.PI ? 1 : 0;
  const largeInner = sweep - (2 * c) / inner > Math.PI ? 1 : 0;

  // 外弧起点/终点（角度各退一角），径向角点用半径偏移 c
  const [x1, y1] = pt(cx, cy, outer, start + c / outer);
  const [x2, y2] = pt(cx, cy, outer, end - c / outer);
  const [ocx, ocy] = pt(cx, cy, outer, end);
  const [roE_x, roE_y] = pt(cx, cy, outer - c, end);
  const [riE_x, riE_y] = pt(cx, cy, inner + c, end);
  const [icx, icy] = pt(cx, cy, inner, end);
  const [x3, y3] = pt(cx, cy, inner, end - c / inner);
  const [x4, y4] = pt(cx, cy, inner, start + c / inner);
  const [icx2, icy2] = pt(cx, cy, inner, start);
  const [riS_x, riS_y] = pt(cx, cy, inner + c, start);
  const [roS_x, roS_y] = pt(cx, cy, outer - c, start);
  const [ocx2, ocy2] = pt(cx, cy, outer, start);

  return (
    `M ${f(x1)} ${f(y1)}` +
    ` A ${f(outer)} ${f(outer)} 0 ${largeOuter} 1 ${f(x2)} ${f(y2)}` +
    ` Q ${f(ocx)} ${f(ocy)} ${f(roE_x)} ${f(roE_y)}` +
    ` L ${f(riE_x)} ${f(riE_y)}` +
    ` Q ${f(icx)} ${f(icy)} ${f(x3)} ${f(y3)}` +
    ` A ${f(inner)} ${f(inner)} 0 ${largeInner} 0 ${f(x4)} ${f(y4)}` +
    ` Q ${f(icx2)} ${f(icy2)} ${f(riS_x)} ${f(riS_y)}` +
    ` L ${f(roS_x)} ${f(roS_y)}` +
    ` Q ${f(ocx2)} ${f(ocy2)} ${f(x1)} ${f(y1)} Z`
  );
}

/**
 * 静态均分扇区：从 -π/2 起把整圆均分为 count 份。
 */
export function sectors(count: number): Sector[] {
  const out: Sector[] = [];
  if (!(count > 0)) return out;
  const base = TAU / count;
  let a = -Math.PI / 2;
  for (let i = 0; i < count; i++) {
    out.push({ start: a, end: a + base, mid: a + base / 2 });
    a += base;
  }
  return out;
}

function boxFits(
  box: Box,
  index: number,
  count: number,
  inner: number,
  R: number,
  contentRadius: number,
  gap: number,
): boolean {
  const pad = 6;
  const halfAngle = Math.PI / count;
  const gapAngle = Math.min(gap / (2 * inner), halfAngle / 2);
  // 内容保持正向（不随扇区旋转），按该槽位中线角度旋转后测径向/切向余量
  const mid = -Math.PI / 2 + (index + 0.5) * TAU / count;
  const cos = Math.cos(mid);
  const sin = Math.sin(mid);

  // 有 parts 时按各分块（如 icon 矩形、label 矩形）分别测四角，避免组整体的空白导致过度保守
  const rects = box.parts && box.parts.length
    ? box.parts.map(part => ({ x: part.x, y: part.y, w: part.width, h: part.height }))
    : [{ x: 0, y: 0, w: box.width, h: box.height }];

  for (const rect of rects) {
    for (const dx of [rect.x - (rect.w / 2 + pad), rect.x + rect.w / 2 + pad]) {
      for (const dy of [rect.y - (rect.h / 2 + pad), rect.y + rect.h / 2 + pad]) {
        const u = dx * cos + dy * sin;
        const v = -dx * sin + dy * cos;
        const rr = Math.hypot(contentRadius + u, v);
        if (rr < inner + 4 || rr > R - 4) return false;
        if (Math.abs(Math.atan2(v, contentRadius + u)) > halfAngle - gapAngle) return false;
      }
    }
  }
  return true;
}

/**
 * 求容纳全部 boxes 的最小轮半径与统一内容半径。
 * 空穴半径 = 0.52R；autoExpand=false 时仅尝试最小直径。
 */
export function fitWheel(
  boxes: readonly Box[],
  minDiameter: number,
  maxDiameter: number,
  autoExpand: boolean,
  gap: number,
): WheelLayout {
  const min = Number.isFinite(minDiameter) && minDiameter > 0 ? minDiameter : 320;
  const max = Number.isFinite(maxDiameter) && maxDiameter > 0 ? maxDiameter : 640;
  const Rbase = min / 2;
  const Rcap = Math.max(max / 2, Rbase);

  if (boxes.length === 0) {
    const inner = 0.52 * Rbase;
    return { radius: Rbase, inner, contentRadius: (inner + Rbase) / 2, overflow: false };
  }

  const count = boxes.length;

  const tryR = (R: number): WheelLayout | null => {
    const inner = 0.52 * R;
    if (R - inner < 16) return null;
    const candidates: number[] = [(inner + R) / 2];
    for (let cr = inner + 8; cr <= R - 8; cr += 4) candidates.push(cr);
    for (const cr of candidates) {
      if (boxes.every((b, i) => boxFits(b, i, count, inner, R, cr, gap))) {
        return { radius: R, inner, contentRadius: cr, overflow: false };
      }
    }
    return null;
  };

  const radii: number[] = [];
  if (autoExpand) {
    for (let R = Rbase; R <= Rcap + EPS; R += 2) radii.push(R);
  } else {
    radii.push(Rbase);
  }
  for (const R of radii) {
    const fit = tryR(R);
    if (fit) return fit;
  }

  // autoExpand=false 或扩容到上限仍放不下：autoExpand 时保持上限半径，否则保持基础半径，均标记溢出
  const R = autoExpand ? Rcap : Rbase;
  const inner = 0.52 * R;
  return { radius: R, inner, contentRadius: (inner + R) / 2, overflow: true };
}
