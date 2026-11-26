import type { ReactNode } from 'react';
import styles from './status-text.module.css';

export type StatusTone = 'neutral' | 'warning' | 'danger';

export interface StatusTextProps {
  readonly children?: ReactNode;
  readonly tone?: StatusTone;
  readonly id?: string;
}

/** Polite live region. Content changes are announced by screen readers. */
export function StatusText({ children, tone = 'neutral', id }: StatusTextProps) {
  return (
    <p id={id} className={styles.status} role="status" data-part="status" data-tone={tone}>
      {children}
    </p>
  );
}
