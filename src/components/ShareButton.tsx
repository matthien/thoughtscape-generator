"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ShareButton.module.css";

// Matches the toast's keyframes in ShareButton.module.css; it unmounts once
// the fade-out finishes.
const TOAST_DURATION = 3200;

// The server makes the link (it needs the signing secret), but the clipboard
// write has to start inside the click or Safari refuses it. A ClipboardItem
// holding a promise starts the write now and fills it in when the link
// arrives; browsers without that fall back to writing once it's back.
async function copyShareLink(action: () => Promise<{ path: string; days: number }>) {
  const link = action().then((r) => ({ url: new URL(r.path, window.location.origin).href, days: r.days }));
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": link.then(({ url }) => new Blob([url], { type: "text/plain" })),
      }),
    ]);
  } catch {
    await navigator.clipboard.writeText((await link).url);
  }
  return link;
}

export default function ShareButton({
  action,
  className,
}: {
  /** Server action that signs a fresh link for the current usernames. */
  action: () => Promise<{ path: string; days: number }>;
  className?: string;
}) {
  const [toastDays, setToastDays] = useState<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const restartTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(hideTimer.current);
      clearTimeout(restartTimer.current);
    },
    []
  );

  async function onClick() {
    let days: number;
    try {
      ({ days } = await copyShareLink(action));
    } catch {
      // Nothing was copied, so there's nothing to confirm.
      return;
    }
    clearTimeout(hideTimer.current);
    clearTimeout(restartTimer.current);
    // Unmount first so a second click restarts the toast's animation.
    setToastDays(null);
    restartTimer.current = setTimeout(() => {
      setToastDays(days);
      hideTimer.current = setTimeout(() => setToastDays(null), TOAST_DURATION);
    }, 20);
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={onClick}
        aria-label="copy share link"
        title="copy share link"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M5.8 8.2L8.2 5.8M6.4 3.9L7.3 3a2.4 2.4 0 0 1 3.4 3.4l-0.9 0.9M7.6 10.1L6.7 11a2.4 2.4 0 0 1-3.4-3.4l0.9-0.9"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {/* Portaled to <body>: the corner panel's backdrop-filter would
          otherwise become the toast's containing block and pin it there
          instead of to the bottom of the viewport. */}
      {toastDays !== null &&
        createPortal(
          <div className={styles.toast}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={styles.check}>
              <path
                d="M2 6.5L4.75 9L10 3"
                stroke="#e0ea5e"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={styles.lines}>
              <span>link copied</span>
              <span className={styles.expiry}>expires in {toastDays} days</span>
            </span>
          </div>,
          document.body
        )}
      <span aria-live="polite" className={styles.status}>
        {toastDays !== null ? `link copied, expires in ${toastDays} days` : ""}
      </span>
    </>
  );
}
