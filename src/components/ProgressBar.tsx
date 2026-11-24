export function ProgressBar({ value, label }: { value: number; label: string }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="lui-progress-bar" role="progressbar" aria-label={label}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div className="lui-progress-bar__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
