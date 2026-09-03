"use client";

import { useEffect } from "react";

export function TokenUrlScrubber() {
  useEffect(() => {
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);

  return null;
}
