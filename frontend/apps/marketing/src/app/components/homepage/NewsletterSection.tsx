"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Alert, AlertAction, AlertDescription, AlertTitle, Button, Input } from "@open-agency/ui";
import { Mail } from "pixelarticons/react/Mail";
import type { HomepageContent } from "../../homepage-content";
import styles from "../../page.module.css";

type NewsletterSectionProps = {
  content: HomepageContent["newsletter"];
};

type SubmissionState =
  | {
      status: "idle";
    }
  | {
      status: "error";
      errorKey: keyof HomepageContent["newsletter"]["errors"];
    }
  | {
      status: "success";
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterSection({ content }: NewsletterSectionProps) {
  const [email, setEmail] = useState("");
  const [submissionState, setSubmissionState] = useState<SubmissionState>({ status: "idle" });
  const emailId = useId();
  const messageId = `${emailId}-message`;
  const privacyId = `${emailId}-privacy`;
  const inputRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submissionState.status === "error") {
      inputRef.current?.focus();
    }

    if (submissionState.status === "success") {
      successRef.current?.focus();
    }
  }, [submissionState]);

  function handleRetry() {
    setSubmissionState({ status: "idle" });
    inputRef.current?.focus();
  }

  function handleEmailChange(nextValue: string) {
    setEmail(nextValue);

    if (submissionState.status !== "idle") {
      setSubmissionState({ status: "idle" });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (normalizedEmail.length === 0) {
      setSubmissionState({ status: "error", errorKey: "required" });
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setSubmissionState({ status: "error", errorKey: "invalid" });
      return;
    }

    setEmail(normalizedEmail);
    setSubmissionState({ status: "success" });
  }

  const describedBy = [privacyId];

  if (submissionState.status === "error") {
    describedBy.push(messageId);
  }

  return (
    <section className="w-full" id="newsletter" aria-labelledby="newsletter-title" data-newsletter-ready="true">
      <div className={`${styles.sectionSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-10 rounded-[2rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14`}>
        <header className="flex max-w-[42rem] flex-col gap-4">
          <h2 className={styles.sectionTitle} id="newsletter-title">
            {content.title}
          </h2>
          <p className={styles.sectionDescription}>{content.description}</p>
        </header>

        <div className={`${styles.newsletterPanel} flex w-full flex-col gap-8 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_40%,transparent)] p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between`}>
          <div className="flex max-w-[30rem] flex-1 flex-col gap-5">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-[color:color-mix(in_srgb,var(--brand-primary)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_76%,transparent)] text-[var(--brand-primary)]">
              <Mail className="size-6" />
            </span>
            <div className="flex flex-col gap-3">
              <h3 className="text-[1.4rem] font-medium tracking-[-0.04em] text-[var(--on-surface)] sm:text-[1.8rem]">
                Weekly notes for teams designing with AI instead of around it.
              </h3>
              <p className={styles.newsletterPrivacy} id={privacyId}>
                {content.privacyNote}
              </p>
            </div>
          </div>

          <div className="flex w-full max-w-[34rem] flex-1 flex-col gap-5">
            {submissionState.status === "success" ? (
              <div className={styles.newsletterMessage} ref={successRef} tabIndex={-1}>
                <Alert className={styles.newsletterSuccessAlert}>
                  <AlertTitle>{content.success.title}</AlertTitle>
                  <AlertDescription>{content.success.description}</AlertDescription>
                </Alert>
              </div>
            ) : (
              <form className="flex w-full flex-col gap-5" onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex flex-1 flex-col gap-4">
                    <label className={styles.newsletterLabel} htmlFor={emailId}>
                      {content.fieldLabel}
                    </label>
                    <Input
                      ref={inputRef}
                      id={emailId}
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      className="min-w-0"
                      value={email}
                      placeholder={content.placeholder}
                      aria-describedby={describedBy.join(" ")}
                      aria-errormessage={submissionState.status === "error" ? messageId : undefined}
                      aria-invalid={submissionState.status === "error" ? true : undefined}
                      onChange={(event) => handleEmailChange(event.target.value)}
                    />
                  </div>

                  <Button className="min-h-11 px-6 sm:self-end" type="submit">
                    {content.submitLabel}
                  </Button>
                </div>

                {submissionState.status === "error" ? (
                  <Alert className={styles.newsletterMessage} id={messageId} variant="destructive">
                    <AlertTitle>{content.errors[submissionState.errorKey].title}</AlertTitle>
                    <AlertDescription>{content.errors[submissionState.errorKey].description}</AlertDescription>
                    <AlertAction>
                      <Button size="xs" type="button" variant="outline" onClick={handleRetry}>
                        {content.retryLabel}
                      </Button>
                    </AlertAction>
                  </Alert>
                ) : null}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
