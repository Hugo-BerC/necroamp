import styles from './control-button.module.css';

export interface ControlButtonProps {
  readonly label: string;
  readonly onActivate: () => void;
  /** Unavailable controls stay focusable. They use aria-disabled, not the disabled attribute. */
  readonly unavailable?: boolean;
  /** Id of a visible element that explains why the control is unavailable. */
  readonly describedBy?: string;
  readonly part?: string;
  /** Toggle state. Omit for plain buttons. */
  readonly pressed?: boolean;
}

export function ControlButton({
  label,
  onActivate,
  unavailable = false,
  describedBy,
  part = 'control',
  pressed,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      className={styles.control}
      aria-disabled={unavailable ? true : undefined}
      aria-describedby={describedBy}
      aria-pressed={pressed}
      data-part={part}
      data-unavailable={unavailable ? 'true' : undefined}
      onClick={onActivate}
    >
      {label}
    </button>
  );
}
