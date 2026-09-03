"use client";

import { Alert, AlertDescription, AlertTitle, Button } from "@open-agency/ui";
import { useActionState, useEffect, useRef } from "react";

import { confirmNewsletterForm, type NewsletterSignupResult } from "../actions";

const initialState: NewsletterSignupResult = { status: "idle" };

export function ConfirmForm({ token }: { readonly token: string }) {
  const [state, formAction, pending] = useActionState(confirmNewsletterForm, initialState);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle") resultRef.current?.focus();
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div ref={resultRef} tabIndex={-1} aria-live="polite">
        <Alert>
          <AlertTitle>Your subscription is confirmed.</AlertTitle>
          <AlertDescription>The first issue will arrive in your inbox. You can unsubscribe at any time.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {state.status === "error" ? (
        <div ref={resultRef} tabIndex={-1}>
          <Alert variant="destructive">
            <AlertTitle>We could not confirm your subscription.</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <form action={formAction} method="post">
        <input type="hidden" name="token" value={token} />
        <Button type="submit" disabled={pending}>
          {pending ? "Confirming..." : "Confirm subscription"}
        </Button>
      </form>
    </div>
  );
}
