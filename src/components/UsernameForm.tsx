"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveUsernames, type UsernameFormState } from "@/app/actions";
import { GRID_TILE_URL } from "@/lib/mat";
import styles from "./UsernameForm.module.css";

export default function UsernameForm({
  initial,
  error,
  unverified = false,
}: {
  /** Prefills the fields when a submitted pair failed to load. */
  initial?: { letterboxd?: string; goodreads?: string };
  error?: string;
  /** The submitted usernames couldn't be found: outline them in red until edited. */
  unverified?: boolean;
}) {
  const [state, formAction, isPending] = useActionState<UsernameFormState, FormData>(
    saveUsernames,
    { error: error ?? null }
  );
  const [letterboxd, setLetterboxd] = useState(initial?.letterboxd ?? "");
  const [goodreads, setGoodreads] = useState(initial?.goodreads ?? "");
  const [goodreadsOpen, setGoodreadsOpen] = useState(Boolean(initial?.goodreads));
  // The required message only shows once they've tried to submit, not while
  // the field is still empty on first load.
  const [tried, setTried] = useState(false);
  // Every feed that was asked for failed, so every filled-in field is
  // suspect. Each one clears as soon as it's edited.
  const [letterboxdUnverified, setLetterboxdUnverified] = useState(unverified);
  const [goodreadsUnverified, setGoodreadsUnverified] = useState(
    unverified && Boolean(initial?.goodreads)
  );
  const letterboxdRef = useRef<HTMLInputElement>(null);
  const goodreadsRef = useRef<HTMLInputElement>(null);
  // Only a click on "add goodreads" animates the field in and focuses it. When
  // the form comes back prefilled after a failed load, the field is already
  // there and shouldn't replay its entrance.
  const [openedByClick, setOpenedByClick] = useState(false);

  useEffect(() => {
    if (goodreadsOpen && openedByClick) goodreadsRef.current?.focus();
  }, [goodreadsOpen, openedByClick]);

  const letterboxdInvalid = tried && letterboxd.trim().length === 0;

  return (
    <main className={styles.mat} style={{ backgroundImage: GRID_TILE_URL }}>
      <form
        action={formAction}
        noValidate
        className={styles.form}
        onSubmit={(e) => {
          if (letterboxd.trim().length === 0) {
            e.preventDefault();
            setTried(true);
            letterboxdRef.current?.focus();
          }
        }}
      >
        <div className={styles.heading}>
          <h1 className={styles.title}>thoughtscape</h1>
          <p className={styles.subtitle}>lay your reviews out on a cutting mat</p>
        </div>

        <div className={styles.fields}>
          <div className={styles.group}>
            <div className={styles.field}>
              <input
                ref={letterboxdRef}
                id="letterboxd"
                name="letterboxd"
                className={`${styles.input} ${letterboxdUnverified ? styles.unverified : ""}`}
                type="text"
                placeholder=" "
                autoComplete="off"
                spellCheck={false}
                required
                aria-invalid={letterboxdInvalid || letterboxdUnverified}
                aria-describedby={letterboxdInvalid ? "letterboxd-msg" : undefined}
                value={letterboxd}
                onChange={(e) => {
                  setLetterboxd(e.target.value);
                  setLetterboxdUnverified(false);
                }}
              />
              <label htmlFor="letterboxd" className={styles.label}>
                letterboxd username
              </label>
            </div>
            {letterboxdInvalid && (
              <span id="letterboxd-msg" role="alert" className={styles.error}>
                a letterboxd username is required
              </span>
            )}
          </div>

          {goodreadsOpen ? (
            <div
              id="goodreads-group"
              className={`${styles.group} ${openedByClick ? styles.reveal : ""}`}
            >
              <div className={styles.field}>
                <input
                  ref={goodreadsRef}
                  id="goodreads"
                  name="goodreads"
                  className={`${styles.input} ${styles.removable} ${goodreadsUnverified ? styles.unverified : ""}`}
                  type="text"
                  inputMode="numeric"
                  placeholder=" "
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={goodreadsUnverified}
                  aria-describedby="goodreads-msg"
                  value={goodreads}
                  onChange={(e) => {
                    setGoodreads(e.target.value);
                    setGoodreadsUnverified(false);
                  }}
                />
                <label htmlFor="goodreads" className={styles.label}>
                  goodreads user id
                </label>
                <button
                  type="button"
                  className={styles.hide}
                  aria-label="remove goodreads"
                  title="remove goodreads"
                  onClick={() => {
                    setGoodreadsOpen(false);
                    setGoodreads("");
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path
                      d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <span id="goodreads-msg" className={styles.hint}>
                the number in your goodreads
                <br />
                profile url
              </span>
            </div>
          ) : (
            <button
              type="button"
              className={styles.add}
              aria-expanded="false"
              aria-controls="goodreads-group"
              onClick={() => {
                setOpenedByClick(true);
                setGoodreadsOpen(true);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M6 1.5V10.5M1.5 6H10.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span>add goodreads</span>
            </button>
          )}
        </div>

        <div className={styles.actions}>
          {state.error && !letterboxdInvalid && (
            <span
              role="alert"
              // A failed lookup's message matches the red fields.
              className={`${styles.error} ${styles.formError} ${unverified ? styles.unverifiedText : ""}`}
            >
              {state.error}
            </span>
          )}
          <button type="submit" className={styles.submit} disabled={isPending}>
            {isPending ? "laying it out…" : "lay it out"}
          </button>
        </div>
      </form>
    </main>
  );
}
