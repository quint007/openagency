"use client";

import { useActionState, useEffect, useId, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@open-agency/ui";
import { ArrowRight } from "pixelarticons/react/ArrowRight";

import { newsletterSignup, type NewsletterSignupResult } from "./actions";
import type { HomepageContent } from "../homepage-content";
import styles from "./page.module.css";

type NewsletterLandingProps = {
  content: HomepageContent["newsletter"];
};

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
};

const launchAt = new Date("2026-04-23T15:00:00Z");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  hour12: true,
  minute: "2-digit",
  month: "long",
  timeZone: "UTC",
  timeZoneName: "short",
  year: "numeric",
});

const minuteInMs = 60_000;
const hourInMs = 60 * minuteInMs;
const dayInMs = 24 * hourInMs;

function getCountdownParts(now: number): CountdownParts {
  const totalMs = Math.max(launchAt.getTime() - now, 0);
  const days = Math.floor(totalMs / dayInMs);
  const hours = Math.floor((totalMs % dayInMs) / hourInMs);
  const minutes = Math.floor((totalMs % hourInMs) / minuteInMs);

  return { days, hours, minutes };
}

function formatCountdownValue(value: number) {
  return value.toString().padStart(2, "0");
}

function CountdownStat({ label, value }: { label: string; value: number }) {
  return (
    <div
      className={`${styles.countdownStat} flex flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_35%,transparent)] px-4 py-1 text-center`}
    >
      <span className={styles.countdownValue}>
        {formatCountdownValue(value)}
      </span>
      <span className={styles.countdownLabel}>{label}</span>
    </div>
  );
}

export function NewsletterLanding({ content }: NewsletterLandingProps) {
  const emailId = useId();
  const [now, setNow] = useState(() => Date.now());
  const countdown = getCountdownParts(now);
  const launchLabel = useMemo(() => dateFormatter.format(launchAt), []);

  const initialState: NewsletterSignupResult = { status: "idle" };
  const [state, formAction, pending] = useActionState(
    newsletterSignup,
    initialState,
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section
      className="px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14"
      aria-labelledby="newsletter-title"
    >
      <div
        className={`${styles.heroSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-8 rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12`}
      >
        <div className="flex max-w-[52rem] flex-col gap-4">
          <Badge variant="outline" className={styles.eyebrow}>
            Launch countdown
          </Badge>
          <h1
            id="newsletter-title"
            className={`${styles.pageTitle} max-w-[11ch]`}
          >
            {content.title}
          </h1>
          <p className={`${styles.pageDescription} max-w-[44rem]`}>
            {content.description}
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Card
            variant="elevated"
            className={`${styles.panelSurface} overflow-hidden rounded-[1.75rem]`}
          >
            <CardHeader className="gap-3">
              <Badge variant="outline" className={styles.eyebrow}>
                Countdown
              </Badge>
              <CardTitle className="max-w-[12ch] text-[clamp(1.6rem,1.25rem+1vw,2.3rem)] leading-[0.95] tracking-[-0.05em] text-on-surface">
                Launch window opens in
              </CardTitle>
              <CardDescription className="max-w-[38rem] text-base leading-8 text-on-surface-variant">
                We’re keeping the list closed until launch day so the first
                issue lands right when the countdown reaches zero.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <CountdownStat label="Days" value={countdown.days} />
                <CountdownStat label="Hours" value={countdown.hours} />
                <CountdownStat label="Minutes" value={countdown.minutes} />
              </div>

              <p className={styles.metaText}>Launching {launchLabel}</p>
            </CardContent>
          </Card>

          <Card
            variant="elevated"
            className={`${styles.panelSurface} overflow-hidden rounded-[1.75rem]`}
          >
            <CardHeader className="gap-3">
              <Badge variant="outline" className={styles.eyebrow}>
                Signup
              </Badge>
              <CardTitle className="max-w-[11ch] text-[clamp(1.6rem,1.25rem+1vw,2.3rem)] leading-[0.95] tracking-[-0.05em] text-on-surface">
                Be first on the list
              </CardTitle>
              <CardDescription className="max-w-[34rem] text-base leading-8 text-on-surface-variant">
                {content.privacyNote}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-5">
              {state.status === "success" && (
                <p className="text-base text-on-surface-variant">
                  Thanks for subscribing! Check your inbox.
                </p>
              )}
              {state.status === "error" && (
                <p className="text-base text-error">{state.error}</p>
              )}
              {(state.status === "idle" || state.status === "error") && (
                <form action={formAction} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    <label className={styles.fieldLabel} htmlFor={emailId}>
                      {content.fieldLabel}
                    </label>
                    <Input
                      id={emailId}
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder={content.placeholder}
                    />
                  </div>

                  <Button
                    className="min-h-12 px-6"
                    type="submit"
                    disabled={pending}
                  >
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
