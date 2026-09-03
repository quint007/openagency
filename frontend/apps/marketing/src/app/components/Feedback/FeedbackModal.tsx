"use client";

import { Alert, AlertDescription, AlertTitle, Button, Input } from "@open-agency/ui";
import { Cancel } from "pixelarticons/react/Cancel";
import { Check } from "pixelarticons/react/Check";
import { useActionState, useEffect, useId, useRef } from "react";

import { type FeedbackActionState, submitFeedback } from "../../feedback/actions";
import { FEEDBACK_CATEGORIES } from "../../feedback/constants";

type FeedbackModalProps = {
  readonly open: boolean;
  readonly onClose: () => void;
};

const focusableSelector =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [state, formAction, pending] = useActionState<FeedbackActionState, FormData>(submitFeedback, {
    status: "idle",
  });
  const dialogRef = useRef<HTMLElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const errorId = `${titleId}-error`;
  const messageId = `${titleId}-message`;
  const emailId = `${titleId}-email`;
  const categoryId = `${titleId}-category`;
  const pageUrl = typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}`;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    categoryRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [onClose, open]);

  useEffect(() => {
    if (state.status === "success") {
      successRef.current?.focus();
    }

    if (state.status === "error") {
      messageRef.current?.focus();
    }
  }, [state]);

  if (!open) {
    return null;
  }

  if (state.status === "success") {
    return (
      <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_78%,transparent)] p-4 backdrop-blur-sm sm:items-center sm:p-6">
        <button
          type="button"
          className="absolute inset-0 cursor-default"
          onClick={onClose}
          aria-label="Close feedback form"
        />
        <section
          ref={dialogRef}
          className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[38rem] flex-col gap-6 overflow-y-auto rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_55%,transparent)] bg-[var(--surface-container)] p-6 shadow-[0_24px_64px_color-mix(in_srgb,var(--brand-primary)_16%,transparent)] sm:max-h-[calc(100dvh-3rem)] sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="absolute top-5 right-5 inline-flex size-10 items-center justify-center border border-transparent text-[var(--on-surface-variant)] transition-colors hover:border-[color:color-mix(in_srgb,var(--brand-primary)_45%,transparent)] hover:text-[var(--on-surface)] focus-visible:border-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color:color-mix(in_srgb,var(--brand-primary)_30%,transparent)]"
            onClick={onClose}
            aria-label="Close feedback form"
          >
            <Cancel aria-hidden="true" className="size-5" />
          </button>
          <div ref={successRef} tabIndex={-1} className="flex flex-col gap-5 outline-none">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-[color:color-mix(in_srgb,var(--brand-tertiary)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-tertiary)_10%,var(--surface-container-low)_90%)] text-[var(--brand-tertiary)]">
              <Check aria-hidden="true" className="size-6" />
            </span>
            <div className="flex flex-col gap-3">
              <h2 id={titleId} className="font-[var(--brand-font-heading)] text-2xl font-semibold tracking-[-0.04em] text-[var(--on-surface)]">
                Thanks for the signal.
              </h2>
              <p className="text-sm leading-7 text-[var(--on-surface-variant)]">
                Your feedback is in the queue. It helps us keep Open Agency practical and useful.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="min-h-11 px-5" onClick={onClose}>
              Close
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const errorState = state.status === "error" ? state : null;
  const describedBy = errorState ? `${descriptionId} ${errorId}` : descriptionId;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_78%,transparent)] p-4 backdrop-blur-sm sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close feedback form"
      />
      <section
        ref={dialogRef}
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[38rem] flex-col gap-6 overflow-y-auto rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_55%,transparent)] bg-[var(--surface-container)] p-6 shadow-[0_24px_64px_color-mix(in_srgb,var(--brand-primary)_16%,transparent)] sm:max-h-[calc(100dvh-3rem)] sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
      >
        <button
          type="button"
          className="absolute top-5 right-5 inline-flex size-10 items-center justify-center border border-transparent text-[var(--on-surface-variant)] transition-colors hover:border-[color:color-mix(in_srgb,var(--brand-primary)_45%,transparent)] hover:text-[var(--on-surface)] focus-visible:border-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color:color-mix(in_srgb,var(--brand-primary)_30%,transparent)]"
          onClick={onClose}
          aria-label="Close feedback form"
        >
          <Cancel aria-hidden="true" className="size-5" />
        </button>

        <header className="flex max-w-[32rem] flex-col gap-3 pr-10">
          <span className="inline-flex self-start rounded-full bg-[color:color-mix(in_srgb,var(--brand-primary)_12%,var(--surface-container-low)_88%)] px-3 py-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[var(--brand-primary-light)]">
            Open channel
          </span>
          <h2 id={titleId} className="font-[var(--brand-font-heading)] text-2xl font-semibold tracking-[-0.04em] text-[var(--on-surface)]">
            What should we improve?
          </h2>
          <p id={descriptionId} className="text-sm leading-7 text-[var(--on-surface-variant)]">
            Send a bug, idea, content correction, or anything else that would make the site more useful.
          </p>
        </header>

        <form className="flex flex-col gap-5" action={formAction} noValidate>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--on-surface)]" htmlFor={categoryId}>
              Category
            </label>
            <select
              ref={categoryRef}
              id={categoryId}
              name="category"
              defaultValue="Other"
              required
              className="h-11 w-full border border-[color:color-mix(in_srgb,var(--outline-variant)_35%,transparent)] bg-[var(--input-background)] px-3 text-sm leading-6 text-[var(--on-surface)] outline-none transition-[border-color,box-shadow,background-color] duration-200 focus-visible:border-[var(--brand-primary)] focus-visible:ring-3 focus-visible:ring-[color:color-mix(in_srgb,var(--brand-primary)_30%,transparent)]"
            >
              {FEEDBACK_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--on-surface)]" htmlFor={messageId}>
              Message
            </label>
            <textarea
              ref={messageRef}
              id={messageId}
              name="message"
              rows={6}
              required
              maxLength={4000}
              placeholder="Tell us what happened or what you would like to see next."
              className="min-h-32 w-full resize-y border border-[color:color-mix(in_srgb,var(--outline-variant)_35%,transparent)] bg-[var(--input-background)] px-3 py-2 text-sm leading-6 text-[var(--on-surface)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[var(--on-surface-variant)] focus-visible:border-[var(--brand-primary)] focus-visible:ring-3 focus-visible:ring-[color:color-mix(in_srgb,var(--brand-primary)_30%,transparent)]"
              aria-invalid={errorState ? true : undefined}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--on-surface)]" htmlFor={emailId}>
              Email <span className="font-normal text-[var(--on-surface-variant)]">(optional)</span>
            </label>
            <Input id={emailId} name="email" type="email" autoComplete="email" placeholder="you@example.com" />
          </div>

          <input type="hidden" name="url" value={pageUrl} readOnly />

          {errorState ? (
            <Alert id={errorId} variant="destructive" role="alert">
              <AlertTitle>We could not send that</AlertTitle>
              <AlertDescription>{errorState.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button className="min-h-11 px-5" type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button className="min-h-11 px-5" type="submit" disabled={pending}>
              {pending ? "Sending..." : "Send feedback"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
