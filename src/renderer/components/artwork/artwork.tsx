import { useState } from 'react';
import { STRINGS } from '@renderer/app/strings/en';
import styles from './artwork.module.css';

export interface ArtworkProps {
  /** media://art/<token> or 
ull for the placeholder. */
  readonly url: string | null;
  /** Empty string marks the image as decorative (list rows already show the title). */
  readonly alt: string;
  readonly part?: string;
}

/** Album art with a text-free placeholder. A failed load falls back to the placeholder. */
export function Artwork({ url, alt, part = 'artwork' }: ArtworkProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = url !== null && failedUrl !== url;
  return (
    <span className={styles.frame} data-part={part} data-has-art={showImage ? 'true' : 'false'}>
      {showImage ? (
        <img
          className={styles.image}
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => {
            setFailedUrl(url);
          }}
        />
      ) : (
        <span
          className={styles.placeholder}
          {...(alt === ''
            ? { 'aria-hidden': true }
            : { role: 'img', 'aria-label': STRINGS.playlist.noArtwork })}
        />
      )}
    </span>
  );
}
