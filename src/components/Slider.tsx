import { type CSSProperties, type InputHTMLAttributes, type PointerEvent, useId } from "react";
import { cx } from "../utils/cn.js";

export type SliderProps = {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  className?: string;
};

export type VolumeSliderInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "type"
  | "value"
  | "min"
  | "max"
  | "step"
  | "onChange"
  | "onPointerDown"
  | "onPointerMove"
  | "onPointerUp"
  | "onPointerCancel"
> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  orientation?: "horizontal" | "vertical";
  blurOnPointerUp?: boolean;
};

export function VolumeSliderInput({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  orientation = "horizontal",
  blurOnPointerUp = false,
  className,
  style,
  ...props
}: VolumeSliderInputProps) {
  const updateFromPointer = (event: PointerEvent<HTMLInputElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const thumbSize =
      Number.parseFloat(
        getComputedStyle(event.currentTarget).getPropertyValue("--lui-slider-thumb-size"),
      ) || 14;
    const thumbRadius = thumbSize / 2;
    const available = (orientation === "vertical" ? rect.height : rect.width) - thumbSize;
    if (available <= 0) return;
    const position =
      orientation === "vertical"
        ? rect.bottom - thumbRadius - event.clientY
        : event.clientX - rect.left - thumbRadius;
    const ratio = Math.max(0, Math.min(1, position / available));
    const rawValue = min + ratio * (max - min);
    const steppedValue = min + Math.round((rawValue - min) / step) * step;
    onValueChange(Math.max(min, Math.min(max, steppedValue)));
  };

  return (
    <input
      {...props}
      className={cx("lui-slider lui-volume-slider", className)}
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      aria-orientation={orientation}
      style={
        {
          ...style,
          "--lui-slider-progress": `${((value - min) / Math.max(1, max - min)) * 100}%`,
        } as CSSProperties
      }
      onChange={(event) => onValueChange(event.currentTarget.valueAsNumber)}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          updateFromPointer(event);
        }
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          updateFromPointer(event);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        if (blurOnPointerUp) event.currentTarget.blur();
      }}
      onPointerCancel={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        if (blurOnPointerUp) event.currentTarget.blur();
      }}
    />
  );
}

export function Slider({
  value,
  onValueChange,
  label,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  showValue = false,
  className,
}: SliderProps) {
  const inputId = useId();
  return (
    <label className={cx("lui-slider-field", className)} htmlFor={inputId}>
      <span className="lui-slider-field__label">
        {label}
        {showValue ? <output>{value}</output> : null}
      </span>
      <VolumeSliderInput
        id={inputId}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={label}
        onValueChange={onValueChange}
      />
    </label>
  );
}
