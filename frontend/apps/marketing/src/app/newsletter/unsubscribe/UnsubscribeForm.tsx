"use client";

import { Alert, AlertDescription, AlertTitle, Button } from "@open-agency/ui";
import { useActionState, useEffect, useRef } from "react";

import { type NewsletterSignupResult, unsubscribeNewsletterForm } from "../actions";

type UnsubscribeFormProps = {
  readonly token: string;
};

const initialState: NewsletterSignupResult = { status: "idle" };

export function UnsubscribeForm({ token }: UnsubscribeFormProps) {
  const [state, formAction, pending] = useActionState(unsubscribeNewsletterForm, initialState);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle") {
      resultRef.current?.focus();
    }
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div ref={resultRef} tabIndex={-1} aria-live="polite">
        <Alert>
          <AlertTitle>You are unsubscribed.</AlertTitle>
          <AlertDescription>
            Your withdrawal is recorded. You will no longer receive the Open Agency newsletter.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {state.status === "error" ? (
        <div ref={resultRef} tabIndex={-1}>
          <Alert variant="destructive">
            <AlertTitle>We could not unsubscribe you.</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <form action={formAction} method="post" className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Unsubscribing..." : "Confirm unsubscribe"}
        </Button>
      </form>
    </div>
  );
}
