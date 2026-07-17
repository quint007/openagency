"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { FeedbackModal } from "./FeedbackModal";

type FeedbackContextValue = {
  readonly openFeedback: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

export function FeedbackProvider({ children }: { readonly children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openFeedback = useCallback(() => setIsOpen(true), []);
  const closeFeedback = useCallback(() => setIsOpen(false), []);
  const contextValue = useMemo(() => ({ openFeedback }), [openFeedback]);

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <FeedbackModal key={isOpen ? "open" : "closed"} open={isOpen} onClose={closeFeedback} />
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useOptionalFeedback();

  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }

  return context;
}

export function useOptionalFeedback() {
  return useContext(FeedbackContext);
}
