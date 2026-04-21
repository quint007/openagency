import { cn } from "../../lib/utils";

type LogoVariant = "full" | "text" | "mascot";
type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  mascotClassName?: string;
  textClassName?: string;
  ariaLabel?: string;
};

const sizeClasses: Record<LogoSize, { mascot: string; text: string; gap: string }> = {
  sm: { mascot: "size-6", text: "text-base", gap: "gap-2" },
  md: { mascot: "size-8", text: "text-lg", gap: "gap-2.5" },
  lg: { mascot: "size-10", text: "text-xl", gap: "gap-3" },
};

function LogoMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("shrink-0 [image-rendering:pixelated]", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="15" y="0" width="1" height="1" fill="#00daf3" />
      <rect x="16" y="0" width="1" height="1" fill="#00daf3" />
      <rect x="15" y="1" width="1" height="1" fill="#131b2e" />
      <rect x="16" y="1" width="1" height="1" fill="#131b2e" />
      <rect x="14" y="2" width="1" height="1" fill="#131b2e" />
      <rect x="15" y="2" width="1" height="1" fill="#c8d4e8" />
      <rect x="16" y="2" width="1" height="1" fill="#c8d4e8" />
      <rect x="17" y="2" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="7" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="8" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="9" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="10" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="11" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="12" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="13" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="14" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="15" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="16" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="17" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="18" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="19" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="20" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="21" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="22" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="23" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="24" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="25" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="26" y="3" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="4" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="7" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="8" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="9" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="10" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="11" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="12" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="13" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="14" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="15" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="16" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="17" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="18" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="19" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="20" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="21" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="22" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="23" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="24" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="25" y="4" width="1" height="1" fill="#c8d4e8" />
      <rect x="26" y="4" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="5" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="5" width="1" height="1" fill="#a0b4cc" />
      <rect x="7" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="8" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="9" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="10" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="11" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="12" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="13" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="14" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="15" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="16" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="17" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="18" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="19" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="20" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="21" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="22" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="23" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="24" y="5" width="1" height="1" fill="#c8d4e8" />
      <rect x="25" y="5" width="1" height="1" fill="#a0b4cc" />
      <rect x="26" y="5" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="6" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="6" width="1" height="1" fill="#c8d4e8" />
      <rect x="7" y="6" width="1" height="1" fill="#c8d4e8" />
      <rect x="8" y="6" width="1" height="1" fill="#060e20" />
      <rect x="9" y="6" width="1" height="1" fill="#060e20" />
      <rect x="10" y="6" width="1" height="1" fill="#060e20" />
      <rect x="11" y="6" width="1" height="1" fill="#060e20" />
      <rect x="12" y="6" width="1" height="1" fill="#060e20" />
      <rect x="13" y="6" width="1" height="1" fill="#060e20" />
      <rect x="14" y="6" width="1" height="1" fill="#060e20" />
      <rect x="15" y="6" width="1" height="1" fill="#060e20" />
      <rect x="16" y="6" width="1" height="1" fill="#060e20" />
      <rect x="17" y="6" width="1" height="1" fill="#060e20" />
      <rect x="18" y="6" width="1" height="1" fill="#060e20" />
      <rect x="19" y="6" width="1" height="1" fill="#060e20" />
      <rect x="20" y="6" width="1" height="1" fill="#060e20" />
      <rect x="21" y="6" width="1" height="1" fill="#060e20" />
      <rect x="22" y="6" width="1" height="1" fill="#060e20" />
      <rect x="23" y="6" width="1" height="1" fill="#060e20" />
      <rect x="24" y="6" width="1" height="1" fill="#c8d4e8" />
      <rect x="25" y="6" width="1" height="1" fill="#c8d4e8" />
      <rect x="26" y="6" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="7" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="7" width="1" height="1" fill="#c8d4e8" />
      <rect x="7" y="7" width="1" height="1" fill="#c8d4e8" />
      <rect x="8" y="7" width="1" height="1" fill="#060e20" />
      <rect x="9" y="7" width="1" height="1" fill="#00daf3" />
      <rect x="10" y="7" width="1" height="1" fill="#00daf3" />
      <rect x="11" y="7" width="1" height="1" fill="#00daf3" />
      <rect x="12" y="7" width="1" height="1" fill="#060e20" />
      <rect x="13" y="7" width="1" height="1" fill="#060e20" />
      <rect x="14" y="7" width="1" height="1" fill="#060e20" />
      <rect x="15" y="7" width="1" height="1" fill="#060e20" />
      <rect x="16" y="7" width="1" height="1" fill="#060e20" />
      <rect x="17" y="7" width="1" height="1" fill="#060e20" />
      <rect x="18" y="7" width="1" height="1" fill="#060e20" />
      <rect x="19" y="7" width="1" height="1" fill="#060e20" />
      <rect x="20" y="7" width="1" height="1" fill="#00daf3" />
      <rect x="21" y="7" width="1" height="1" fill="#00daf3" />
      <rect x="22" y="7" width="1" height="1" fill="#00daf3" />
      <rect x="23" y="7" width="1" height="1" fill="#060e20" />
      <rect x="24" y="7" width="1" height="1" fill="#c8d4e8" />
      <rect x="25" y="7" width="1" height="1" fill="#c8d4e8" />
      <rect x="26" y="7" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="8" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="8" width="1" height="1" fill="#c8d4e8" />
      <rect x="7" y="8" width="1" height="1" fill="#c8d4e8" />
      <rect x="8" y="8" width="1" height="1" fill="#060e20" />
      <rect x="9" y="8" width="1" height="1" fill="#00daf3" />
      <rect x="10" y="8" width="1" height="1" fill="#00daf3" />
      <rect x="11" y="8" width="1" height="1" fill="#00daf3" />
      <rect x="12" y="8" width="1" height="1" fill="#060e20" />
      <rect x="13" y="8" width="1" height="1" fill="#060e20" />
      <rect x="14" y="8" width="1" height="1" fill="#060e20" />
      <rect x="15" y="8" width="1" height="1" fill="#060e20" />
      <rect x="16" y="8" width="1" height="1" fill="#060e20" />
      <rect x="17" y="8" width="1" height="1" fill="#060e20" />
      <rect x="18" y="8" width="1" height="1" fill="#060e20" />
      <rect x="19" y="8" width="1" height="1" fill="#060e20" />
      <rect x="20" y="8" width="1" height="1" fill="#00daf3" />
      <rect x="21" y="8" width="1" height="1" fill="#00daf3" />
      <rect x="22" y="8" width="1" height="1" fill="#00daf3" />
      <rect x="23" y="8" width="1" height="1" fill="#060e20" />
      <rect x="24" y="8" width="1" height="1" fill="#c8d4e8" />
      <rect x="25" y="8" width="1" height="1" fill="#c8d4e8" />
      <rect x="26" y="8" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="9" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="9" width="1" height="1" fill="#c8d4e8" />
      <rect x="7" y="9" width="1" height="1" fill="#c8d4e8" />
      <rect x="8" y="9" width="1" height="1" fill="#060e20" />
      <rect x="9" y="9" width="1" height="1" fill="#00daf3" />
      <rect x="10" y="9" width="1" height="1" fill="#00daf3" />
      <rect x="11" y="9" width="1" height="1" fill="#00daf3" />
      <rect x="12" y="9" width="1" height="1" fill="#060e20" />
      <rect x="13" y="9" width="1" height="1" fill="#060e20" />
      <rect x="14" y="9" width="1" height="1" fill="#060e20" />
      <rect x="15" y="9" width="1" height="1" fill="#060e20" />
      <rect x="16" y="9" width="1" height="1" fill="#060e20" />
      <rect x="17" y="9" width="1" height="1" fill="#060e20" />
      <rect x="18" y="9" width="1" height="1" fill="#060e20" />
      <rect x="19" y="9" width="1" height="1" fill="#060e20" />
      <rect x="20" y="9" width="1" height="1" fill="#00daf3" />
      <rect x="21" y="9" width="1" height="1" fill="#00daf3" />
      <rect x="22" y="9" width="1" height="1" fill="#00daf3" />
      <rect x="23" y="9" width="1" height="1" fill="#060e20" />
      <rect x="24" y="9" width="1" height="1" fill="#c8d4e8" />
      <rect x="25" y="9" width="1" height="1" fill="#c8d4e8" />
      <rect x="26" y="9" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="10" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="10" width="1" height="1" fill="#c8d4e8" />
      <rect x="7" y="10" width="1" height="1" fill="#c8d4e8" />
      <rect x="8" y="10" width="1" height="1" fill="#060e20" />
      <rect x="9" y="10" width="1" height="1" fill="#060e20" />
      <rect x="10" y="10" width="1" height="1" fill="#060e20" />
      <rect x="11" y="10" width="1" height="1" fill="#060e20" />
      <rect x="12" y="10" width="1" height="1" fill="#060e20" />
      <rect x="13" y="10" width="1" height="1" fill="#060e20" />
      <rect x="14" y="10" width="1" height="1" fill="#060e20" />
      <rect x="15" y="10" width="1" height="1" fill="#060e20" />
      <rect x="16" y="10" width="1" height="1" fill="#060e20" />
      <rect x="17" y="10" width="1" height="1" fill="#060e20" />
      <rect x="18" y="10" width="1" height="1" fill="#060e20" />
      <rect x="19" y="10" width="1" height="1" fill="#060e20" />
      <rect x="20" y="10" width="1" height="1" fill="#060e20" />
      <rect x="21" y="10" width="1" height="1" fill="#060e20" />
      <rect x="22" y="10" width="1" height="1" fill="#060e20" />
      <rect x="23" y="10" width="1" height="1" fill="#060e20" />
      <rect x="24" y="10" width="1" height="1" fill="#c8d4e8" />
      <rect x="25" y="10" width="1" height="1" fill="#c8d4e8" />
      <rect x="26" y="10" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="11" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="11" width="1" height="1" fill="#c8d4e8" />
      <rect x="7" y="11" width="1" height="1" fill="#c8d4e8" />
      <rect x="8" y="11" width="1" height="1" fill="#060e20" />
      <rect x="9" y="11" width="1" height="1" fill="#060e20" />
      <rect x="10" y="11" width="1" height="1" fill="#00ffaa" />
      <rect x="11" y="11" width="1" height="1" fill="#00ffaa" />
      <rect x="12" y="11" width="1" height="1" fill="#00ffaa" />
      <rect x="13" y="11" width="1" height="1" fill="#00ffaa" />
      <rect x="14" y="11" width="1" height="1" fill="#00ffaa" />
      <rect x="15" y="11" width="1" height="1" fill="#00ffaa" />
      <rect x="16" y="11" width="1" height="1" fill="#00ffaa" />
      <rect x="17" y="11" width="1" height="1" fill="#00ffaa" />
      <rect x="18" y="11" width="1" height="1" fill="#00ffaa" />
      <rect x="19" y="11" width="1" height="1" fill="#00ffaa" />
      <rect x="20" y="11" width="1" height="1" fill="#00ffaa" />
      <rect x="21" y="11" width="1" height="1" fill="#00ffaa" />
      <rect x="22" y="11" width="1" height="1" fill="#060e20" />
      <rect x="23" y="11" width="1" height="1" fill="#060e20" />
      <rect x="24" y="11" width="1" height="1" fill="#c8d4e8" />
      <rect x="25" y="11" width="1" height="1" fill="#c8d4e8" />
      <rect x="26" y="11" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="12" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="12" width="1" height="1" fill="#c8d4e8" />
      <rect x="7" y="12" width="1" height="1" fill="#c8d4e8" />
      <rect x="8" y="12" width="1" height="1" fill="#060e20" />
      <rect x="9" y="12" width="1" height="1" fill="#060e20" />
      <rect x="10" y="12" width="1" height="1" fill="#060e20" />
      <rect x="11" y="12" width="1" height="1" fill="#060e20" />
      <rect x="12" y="12" width="1" height="1" fill="#060e20" />
      <rect x="13" y="12" width="1" height="1" fill="#060e20" />
      <rect x="14" y="12" width="1" height="1" fill="#060e20" />
      <rect x="15" y="12" width="1" height="1" fill="#060e20" />
      <rect x="16" y="12" width="1" height="1" fill="#060e20" />
      <rect x="17" y="12" width="1" height="1" fill="#060e20" />
      <rect x="18" y="12" width="1" height="1" fill="#060e20" />
      <rect x="19" y="12" width="1" height="1" fill="#060e20" />
      <rect x="20" y="12" width="1" height="1" fill="#060e20" />
      <rect x="21" y="12" width="1" height="1" fill="#060e20" />
      <rect x="22" y="12" width="1" height="1" fill="#060e20" />
      <rect x="23" y="12" width="1" height="1" fill="#060e20" />
      <rect x="24" y="12" width="1" height="1" fill="#c8d4e8" />
      <rect x="25" y="12" width="1" height="1" fill="#c8d4e8" />
      <rect x="26" y="12" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="13" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="13" width="1" height="1" fill="#c8d4e8" />
      <rect x="7" y="13" width="1" height="1" fill="#c8d4e8" />
      <rect x="8" y="13" width="1" height="1" fill="#060e20" />
      <rect x="9" y="13" width="1" height="1" fill="#060e20" />
      <rect x="10" y="13" width="1" height="1" fill="#060e20" />
      <rect x="11" y="13" width="1" height="1" fill="#060e20" />
      <rect x="12" y="13" width="1" height="1" fill="#060e20" />
      <rect x="13" y="13" width="1" height="1" fill="#060e20" />
      <rect x="14" y="13" width="1" height="1" fill="#060e20" />
      <rect x="15" y="13" width="1" height="1" fill="#060e20" />
      <rect x="16" y="13" width="1" height="1" fill="#060e20" />
      <rect x="17" y="13" width="1" height="1" fill="#060e20" />
      <rect x="18" y="13" width="1" height="1" fill="#060e20" />
      <rect x="19" y="13" width="1" height="1" fill="#060e20" />
      <rect x="20" y="13" width="1" height="1" fill="#060e20" />
      <rect x="21" y="13" width="1" height="1" fill="#060e20" />
      <rect x="22" y="13" width="1" height="1" fill="#060e20" />
      <rect x="23" y="13" width="1" height="1" fill="#060e20" />
      <rect x="24" y="13" width="1" height="1" fill="#c8d4e8" />
      <rect x="25" y="13" width="1" height="1" fill="#c8d4e8" />
      <rect x="26" y="13" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="14" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="7" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="8" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="9" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="10" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="11" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="12" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="13" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="14" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="15" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="16" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="17" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="18" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="19" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="20" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="21" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="22" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="23" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="24" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="25" y="14" width="1" height="1" fill="#c8d4e8" />
      <rect x="26" y="14" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="15" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="7" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="8" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="9" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="10" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="11" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="12" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="13" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="14" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="15" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="16" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="17" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="18" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="19" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="20" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="21" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="22" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="23" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="24" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="25" y="15" width="1" height="1" fill="#c8d4e8" />
      <rect x="26" y="15" width="1" height="1" fill="#131b2e" />
      <rect x="5" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="6" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="7" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="8" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="9" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="10" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="11" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="12" y="16" width="1" height="1" fill="#414754" />
      <rect x="13" y="16" width="1" height="1" fill="#414754" />
      <rect x="14" y="16" width="1" height="1" fill="#414754" />
      <rect x="15" y="16" width="1" height="1" fill="#414754" />
      <rect x="16" y="16" width="1" height="1" fill="#414754" />
      <rect x="17" y="16" width="1" height="1" fill="#414754" />
      <rect x="18" y="16" width="1" height="1" fill="#414754" />
      <rect x="19" y="16" width="1" height="1" fill="#414754" />
      <rect x="20" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="21" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="22" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="23" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="24" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="25" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="26" y="16" width="1" height="1" fill="#131b2e" />
      <rect x="12" y="17" width="1" height="1" fill="#131b2e" />
      <rect x="13" y="17" width="1" height="1" fill="#414754" />
      <rect x="14" y="17" width="1" height="1" fill="#c8d4e8" />
      <rect x="15" y="17" width="1" height="1" fill="#c8d4e8" />
      <rect x="16" y="17" width="1" height="1" fill="#c8d4e8" />
      <rect x="17" y="17" width="1" height="1" fill="#c8d4e8" />
      <rect x="18" y="17" width="1" height="1" fill="#414754" />
      <rect x="19" y="17" width="1" height="1" fill="#131b2e" />
      <rect x="11" y="18" width="1" height="1" fill="#131b2e" />
      <rect x="12" y="18" width="1" height="1" fill="#c8d4e8" />
      <rect x="13" y="18" width="1" height="1" fill="#c8d4e8" />
      <rect x="14" y="18" width="1" height="1" fill="#c8d4e8" />
      <rect x="15" y="18" width="1" height="1" fill="#c8d4e8" />
      <rect x="16" y="18" width="1" height="1" fill="#c8d4e8" />
      <rect x="17" y="18" width="1" height="1" fill="#c8d4e8" />
      <rect x="18" y="18" width="1" height="1" fill="#c8d4e8" />
      <rect x="19" y="18" width="1" height="1" fill="#c8d4e8" />
      <rect x="20" y="18" width="1" height="1" fill="#131b2e" />
      <rect x="11" y="19" width="1" height="1" fill="#131b2e" />
      <rect x="12" y="19" width="1" height="1" fill="#c8d4e8" />
      <rect x="13" y="19" width="1" height="1" fill="#c8d4e8" />
      <rect x="14" y="19" width="1" height="1" fill="#c8d4e8" />
      <rect x="15" y="19" width="1" height="1" fill="#00daf3" />
      <rect x="16" y="19" width="1" height="1" fill="#00daf3" />
      <rect x="17" y="19" width="1" height="1" fill="#c8d4e8" />
      <rect x="18" y="19" width="1" height="1" fill="#c8d4e8" />
      <rect x="19" y="19" width="1" height="1" fill="#c8d4e8" />
      <rect x="20" y="19" width="1" height="1" fill="#131b2e" />
      <rect x="11" y="20" width="1" height="1" fill="#131b2e" />
      <rect x="12" y="20" width="1" height="1" fill="#c8d4e8" />
      <rect x="13" y="20" width="1" height="1" fill="#c8d4e8" />
      <rect x="14" y="20" width="1" height="1" fill="#c8d4e8" />
      <rect x="15" y="20" width="1" height="1" fill="#c8d4e8" />
      <rect x="16" y="20" width="1" height="1" fill="#c8d4e8" />
      <rect x="17" y="20" width="1" height="1" fill="#c8d4e8" />
      <rect x="18" y="20" width="1" height="1" fill="#c8d4e8" />
      <rect x="19" y="20" width="1" height="1" fill="#c8d4e8" />
      <rect x="20" y="20" width="1" height="1" fill="#131b2e" />
      <rect x="12" y="21" width="1" height="1" fill="#131b2e" />
      <rect x="13" y="21" width="1" height="1" fill="#131b2e" />
      <rect x="14" y="21" width="1" height="1" fill="#131b2e" />
      <rect x="15" y="21" width="1" height="1" fill="#131b2e" />
      <rect x="16" y="21" width="1" height="1" fill="#131b2e" />
      <rect x="17" y="21" width="1" height="1" fill="#131b2e" />
      <rect x="18" y="21" width="1" height="1" fill="#131b2e" />
      <rect x="19" y="21" width="1" height="1" fill="#131b2e" />
      <rect x="11" y="22" width="1" height="1" fill="#131b2e" />
      <rect x="12" y="22" width="1" height="1" fill="#c8d4e8" />
      <rect x="13" y="22" width="1" height="1" fill="#c8d4e8" />
      <rect x="14" y="22" width="1" height="1" fill="#131b2e" />
      <rect x="17" y="22" width="1" height="1" fill="#131b2e" />
      <rect x="18" y="22" width="1" height="1" fill="#c8d4e8" />
      <rect x="19" y="22" width="1" height="1" fill="#c8d4e8" />
      <rect x="20" y="22" width="1" height="1" fill="#131b2e" />
      <rect x="11" y="23" width="1" height="1" fill="#131b2e" />
      <rect x="12" y="23" width="1" height="1" fill="#c8d4e8" />
      <rect x="13" y="23" width="1" height="1" fill="#c8d4e8" />
      <rect x="14" y="23" width="1" height="1" fill="#131b2e" />
      <rect x="17" y="23" width="1" height="1" fill="#131b2e" />
      <rect x="18" y="23" width="1" height="1" fill="#c8d4e8" />
      <rect x="19" y="23" width="1" height="1" fill="#c8d4e8" />
      <rect x="20" y="23" width="1" height="1" fill="#131b2e" />
      <rect x="11" y="24" width="1" height="1" fill="#131b2e" />
      <rect x="12" y="24" width="1" height="1" fill="#c8d4e8" />
      <rect x="13" y="24" width="1" height="1" fill="#c8d4e8" />
      <rect x="14" y="24" width="1" height="1" fill="#131b2e" />
      <rect x="17" y="24" width="1" height="1" fill="#131b2e" />
      <rect x="18" y="24" width="1" height="1" fill="#c8d4e8" />
      <rect x="19" y="24" width="1" height="1" fill="#c8d4e8" />
      <rect x="20" y="24" width="1" height="1" fill="#131b2e" />
      <rect x="10" y="25" width="1" height="1" fill="#131b2e" />
      <rect x="11" y="25" width="1" height="1" fill="#c8d4e8" />
      <rect x="12" y="25" width="1" height="1" fill="#c8d4e8" />
      <rect x="13" y="25" width="1" height="1" fill="#c8d4e8" />
      <rect x="14" y="25" width="1" height="1" fill="#c8d4e8" />
      <rect x="15" y="25" width="1" height="1" fill="#131b2e" />
      <rect x="17" y="25" width="1" height="1" fill="#131b2e" />
      <rect x="18" y="25" width="1" height="1" fill="#c8d4e8" />
      <rect x="19" y="25" width="1" height="1" fill="#c8d4e8" />
      <rect x="20" y="25" width="1" height="1" fill="#c8d4e8" />
      <rect x="21" y="25" width="1" height="1" fill="#c8d4e8" />
      <rect x="22" y="25" width="1" height="1" fill="#131b2e" />
      <rect x="10" y="26" width="1" height="1" fill="#131b2e" />
      <rect x="11" y="26" width="1" height="1" fill="#131b2e" />
      <rect x="12" y="26" width="1" height="1" fill="#131b2e" />
      <rect x="13" y="26" width="1" height="1" fill="#131b2e" />
      <rect x="14" y="26" width="1" height="1" fill="#131b2e" />
      <rect x="15" y="26" width="1" height="1" fill="#131b2e" />
      <rect x="17" y="26" width="1" height="1" fill="#131b2e" />
      <rect x="18" y="26" width="1" height="1" fill="#131b2e" />
      <rect x="19" y="26" width="1" height="1" fill="#131b2e" />
      <rect x="20" y="26" width="1" height="1" fill="#131b2e" />
      <rect x="21" y="26" width="1" height="1" fill="#131b2e" />
      <rect x="22" y="26" width="1" height="1" fill="#131b2e" />
    </svg>
  );
}

function Logo({
  variant = "full",
  size = "md",
  className,
  mascotClassName,
  textClassName,
  ariaLabel = "Open Agency",
}: LogoProps) {
  const classes = sizeClasses[size];

  if (variant === "mascot") {
    return (
      <span aria-label={ariaLabel} role="img" className={cn("inline-flex", className)}>
        <LogoMascot className={cn(classes.mascot, mascotClassName)} />
      </span>
    );
  }

  const wordmark = (
    <span
      className={cn(
        "inline-flex items-baseline whitespace-nowrap font-semibold tracking-[-0.04em] [font-family:var(--brand-font-heading)]",
        classes.text,
        textClassName,
      )}
    >
      <span className="text-white">open</span>
      <span className="text-brand-primary">-agency.io</span>
    </span>
  );

  if (variant === "text") {
    return (
      <span aria-label={ariaLabel} role="img" className={cn("inline-flex", className)}>
        {wordmark}
      </span>
    );
  }

  return (
    <span
      aria-label={ariaLabel}
      role="img"
      className={cn("inline-flex items-center", classes.gap, className)}
    >
      <LogoMascot className={cn(classes.mascot, mascotClassName)} />
      {wordmark}
    </span>
  );
}

export { Logo, LogoMascot };
