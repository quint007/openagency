"use client";

import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@open-agency/ui";
import { ArrowRight } from "pixelarticons/react/ArrowRight";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import type { HomepageContent } from "../homepage-content";
import { type NewsletterSignupResult, newsletterSignup } from "./actions";
import styles from "./page.module.css";

type NewsletterLandingProps = {
  content: HomepageContent["newsletter"];
};

export function NewsletterLanding({ content }: NewsletterLandingProps) {
  const [email, setEmail] = useState("");
  const emailId = useId();
  const messageId = `${emailId}-message`;
  const privacyId = `${emailId}-privacy`;
  const inputRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const initialState: NewsletterSignupResult = { status: "idle" };
  const [state, formAction, pending] = useActionState(newsletterSignup, initialState);

  useEffect(() => {
    if (state.status === "error") {
      inputRef.current?.focus();
    }

    if (state.status === "success") {
      successRef.current?.focus();
    }
  }, [state.status]);

  const errorState = state.status === "error" ? state : null;
  const describedBy = errorState ? `${privacyId} ${messageId}` : privacyId;

  return (
    <section className="px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14" aria-labelledby="newsletter-title">
      <div
        className={`${styles.heroSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-8 rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12`}
      >
        <div className="flex max-w-[52rem] flex-col gap-4">
          <Badge variant="outline" className={styles.eyebrow}>
            Newsletter
          </Badge>
          <h1 id="newsletter-title" className={`${styles.pageTitle} max-w-[11ch]`}>
            {content.title}
          </h1>
          <p className={`${styles.pageDescription} max-w-[44rem]`}>{content.description}</p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Card variant="elevated" className={`${styles.panelSurface} overflow-hidden rounded-[1.75rem]`}>
            <CardHeader className="gap-3">
              <Badge variant="outline" className={styles.eyebrow}>
                What to expect
              </Badge>
              <CardTitle className="max-w-[12ch] text-[clamp(1.6rem,1.25rem+1vw,2.3rem)] leading-[0.95] tracking-[-0.05em] text-on-surface">
                Practical notes when they are useful
              </CardTitle>
              <CardDescription className="max-w-[38rem] text-base leading-8 text-on-surface-variant">
                Get concise updates when new guides, tools, and workflow patterns are published. No artificial launch
                timer, no daily drip campaign.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 text-base leading-8 text-on-surface-variant">
              <p>Every issue points to something you can read, copy, or try immediately.</p>
              <p>Unsubscribe links are included in every email.</p>
            </CardContent>
          </Card>

          <Card variant="elevated" className={`${styles.panelSurface} overflow-hidden rounded-[1.75rem]`}>
            <CardHeader className="gap-3">
              <Badge variant="outline" className={styles.eyebrow}>
                Signup
              </Badge>
              <CardTitle className="max-w-[11ch] text-[clamp(1.6rem,1.25rem+1vw,2.3rem)] leading-[0.95] tracking-[-0.05em] text-on-surface">
                Be first on the list
              </CardTitle>
              <div className="flex max-w-[34rem] flex-col gap-2 text-base leading-8 text-on-surface-variant">
                <CardDescription id={privacyId}>{content.privacyNote}</CardDescription>
                <a
                  className="text-sm text-brand-primary underline-offset-4 hover:text-brand-primary-light hover:underline"
                  href="/privacy"
                >
                  {content.privacyLinkLabel}
                </a>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-5">
              {state.status === "success" && (
                <div ref={successRef} tabIndex={-1} aria-live="polite">
                  <p className="text-base text-on-surface-variant">Thanks for subscribing! Check your inbox.</p>
                </div>
              )}
              {errorState ? (
                <Alert id={messageId} variant="destructive" role="alert">
                  <AlertTitle>{content.errors[errorState.code].title}</AlertTitle>
                  <AlertDescription>{content.errors[errorState.code].description}</AlertDescription>
                </Alert>
              ) : null}
              {(state.status === "idle" || state.status === "error") && (
                <form action={formAction} className="flex flex-col gap-4" noValidate>
                  <div className="flex flex-col gap-3">
                    <label className={styles.fieldLabel} htmlFor={emailId}>
                      {content.fieldLabel}
                    </label>
                    <Input
                      ref={inputRef}
                      id={emailId}
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder={content.placeholder}
                      value={email}
                      aria-describedby={describedBy}
                      aria-errormessage={errorState ? messageId : undefined}
                      aria-invalid={errorState ? true : undefined}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>

                  <Button className="min-h-12 px-6" type="submit" disabled={pending}>
                    {pending ? "Subscribing..." : content.submitLabel}
                    {!pending && <ArrowRight data-icon="inline-end" />}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
