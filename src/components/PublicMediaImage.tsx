"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import ImageViewer from "./ImageViewer";
import styles from "./PublicMedia.module.css";

type Props = {
  src: string | null;
  alt: string;
  poster?: boolean;
  onOpen?: () => void;
};

/** Only the thumbnail owns viewer state; the surrounding card stays mounted. */
export default function PublicMediaImage({ src, alt, poster = false, onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const opened = useRef(false);
  function openViewer() {
    if (opened.current) return;
    opened.current = true;
    setOpen(true);
    onOpen?.();
  }
  function closeViewer() {
    opened.current = false;
    setOpen(false);
  }
  const frameClass = `${styles.imageFrame} ${poster ? styles.poster : styles.photo}`;

  if (!src || failed) {
    return (
      <div className={frameClass}>
        <div className={styles.placeholder}>
          <span aria-hidden="true">◇</span>
          <strong>{failed ? "Image unavailable" : poster ? "No cover yet" : "No image yet"}</strong>
          <span>{alt}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`${frameClass} ${styles.imageButton}`}
        aria-label={`View image: ${alt}`}
        aria-haspopup="dialog"
        onClick={openViewer}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={poster
            ? "(max-width: 480px) 50vw, (max-width: 800px) 33vw, 220px"
            : "(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 370px"}
          className={styles.image}
          onError={() => setFailed(true)}
        />
        <span className={styles.viewHint} aria-hidden="true">View image</span>
      </button>
      {open ? <ImageViewer src={src} alt={alt} onClose={closeViewer} /> : null}
    </>
  );
}
