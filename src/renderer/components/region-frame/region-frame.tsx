import styles from './region-frame.module.css';
import type { ReactNode } from 'react';
import type { RegionId } from './region-ids';

export interface RegionFrameProps {
  readonly id: RegionId;
  readonly titleId: string;
  readonly heading: string;
  readonly children: ReactNode;
}

/** Labelled section for one region. Owns no position or color (skins restyle it later). */
export function RegionFrame({ id, titleId, heading, children }: RegionFrameProps) {
  return (
    <section
      className={styles.frame}
      aria-labelledby={titleId}
      data-testid={id}
      data-region={id}
      data-part="frame"
    >
      <h2 id={titleId} data-part="heading">
        {heading}
      </h2>
      <div data-part="body">{children}</div>
    </section>
  );
}
