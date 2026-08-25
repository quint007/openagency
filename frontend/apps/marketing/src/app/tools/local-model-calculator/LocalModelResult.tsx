"use client";

import { Alert, Button, Card, CardContent, CardHeader, CardTitle } from "@open-agency/ui";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

import type { CalculatorResult } from "./types";

type LocalModelResultProps = {
  result: CalculatorResult;
  shareUrl: string;
};

function ReasonList({ reasons }: { reasons: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {reasons.map((reason) => (
        <li key={reason} className="flex items-start gap-2 text-sm text-on-surface-variant">
          <Check className="mt-0.5 size-4 shrink-0 text-brand-success" />
          {reason}
        </li>
      ))}
    </ul>
  );
}

export function LocalModelResult({ result, shareUrl }: LocalModelResultProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyError(null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if (error instanceof DOMException) {
        setCopyError("We could not copy the share link. Please copy the URL from your browser.");
        return;
      }

      throw error;
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Card className="border border-outline-variant/20 bg-surface-container">
        <CardHeader className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-brand-primary [font-family:var(--brand-font-heading)]">
            Best fit
          </span>
          <CardTitle className="text-2xl text-on-surface [font-family:var(--brand-font-heading)]">
            {result.recommended.model.name}
          </CardTitle>
          <p className="text-sm text-on-surface-variant">{result.recommended.model.description}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <ReasonList reasons={result.recommended.reasons} />

          <div className="flex flex-wrap gap-2">
            {result.recommended.model.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center border border-outline-variant/20 px-2 py-1 text-xs uppercase tracking-[0.1em] text-on-surface-variant [font-family:var(--brand-font-heading)]"
              >
                {tag}
              </span>
            ))}
          </div>

          <a
            href={result.recommended.model.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary-light"
          >
            Download from {result.recommended.model.provider}
            <ExternalLink className="size-4" />
          </a>
        </CardContent>
      </Card>

      {result.alternatives.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium text-on-surface [font-family:var(--brand-font-heading)]">
            Also consider
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {result.alternatives.map((match) => (
              <Card
                key={match.model.id}
                className="border border-outline-variant/20 bg-surface-container-low"
              >
                <CardHeader className="flex flex-col gap-2">
                  <CardTitle className="text-base text-on-surface [font-family:var(--brand-font-heading)]">
                    {match.model.name}
                  </CardTitle>
                  <p className="text-sm text-on-surface-variant">{match.model.description}</p>
                </CardHeader>
                <CardContent>
                  <ReasonList reasons={match.reasons} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <Alert className="border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant">
        <p className="text-sm">
          Results are a starting point. Local model performance also depends on your quantisation
          settings, context length, and frontend (Ollama, LM Studio, llama.cpp, etc.).
        </p>
      </Alert>

      <div className="flex flex-col items-start gap-4">
        {copyError ? (
          <Alert className="border-destructive/20 bg-destructive/10 text-destructive-foreground">
            {copyError}
          </Alert>
        ) : null}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleCopyLink} className="gap-2">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Link copied" : "Copy share link"}
          </Button>
        </div>
      </div>
    </div>
  );
}
