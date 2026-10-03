"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./ImageViewer.module.css";

type ImageViewerProps = {
  src: string;
  alt: string;
  onClose: () => void;
};

/** Mount to open; unmount to close. The caller retains its own selection/drafts. */
export default function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = document.activeElement;
    const previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.documentElement.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={alt || "Image viewer"}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <button type="button" className={styles.close} aria-label="Close image viewer" onClick={onClose}>
        <span aria-hidden="true">×</span>
      </button>
      {failed ? (
        <p className={styles.error} role="status">Image unavailable. Close the viewer and try refreshing the page.</p>
      ) : (
        <Image className={styles.image} src={src} alt={alt} width={1600} height={1200}
          unoptimized onError={() => setFailed(true)} />
      )}
    </dialog>
  );
}
