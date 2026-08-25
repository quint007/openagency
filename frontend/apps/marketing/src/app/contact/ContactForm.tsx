"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import { Alert, AlertDescription, AlertTitle, Button, Input } from "@open-agency/ui";
import { Check } from "pixelarticons/react/Check";

import { submitContact, type ContactActionState } from "./actions";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactActionState, FormData>(submitContact, {
    status: "idle",
  });
  const formRef = useRef<HTMLFormElement>(null);
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const errorId = `${messageId}-error`;

  useEffect(() => {
    if (state.status === "success" && formRef.current) {
      formRef.current.reset();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-5">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-[color:color-mix(in_srgb,var(--brand-tertiary)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-tertiary)_10%,var(--surface-container-low)_90%)] text-[var(--brand-tertiary)]">
          <Check aria-hidden="true" className="size-6" />
        </span>
        <div className="flex flex-col gap-3">
          <h2 className="font-[var(--brand-font-heading)] text-2xl font-semibold tracking-[-0.04em] text-[var(--on-surface)]">
            Message sent
          </h2>
          <p className="text-base leading-8">
            Thanks for reaching out. We will read your message and reply at the email address you provided.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} className="flex flex-col gap-5" action={formAction} noValidate>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--on-surface)]" htmlFor={nameId}>
          Name <span className="font-normal text-[var(--on-surface-variant)]">(optional)</span>
        </label>
        <Input id={nameId} name="name" type="text" autoComplete="name" placeholder="Your name" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--on-surface)]" htmlFor={emailId}>
          Email
        </label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--on-surface)]" htmlFor={messageId}>
          Message
        </label>
        <textarea
          id={messageId}
          name="message"
          rows={6}
          required
          maxLength={4000}
          placeholder="How can we help?"
          className="min-h-32 w-full resize-y border border-[color:color-mix(in_srgb,var(--outline-variant)_35%,transparent)] bg-[var(--input-background)] px-3 py-2 text-sm leading-6 text-[var(--on-surface)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[var(--on-surface-variant)] focus-visible:border-[var(--brand-primary)] focus-visible:ring-3 focus-visible:ring-[color:color-mix(in_srgb,var(--brand-primary)_30%,transparent)]"
        />
      </div>

      {state.status === "error" ? (
        <Alert id={errorId} variant="destructive" role="alert">
          <AlertTitle>We could not send that</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button className="min-h-11 px-5" type="submit" disabled={pending}>
          {pending ? "Sending..." : "Send message"}
        </Button>
      </div>
    </form>
  );
}
