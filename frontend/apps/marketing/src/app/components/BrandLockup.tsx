import { Logo } from "@open-agency/ui";

type BrandLockupProps = {
  markOnly?: boolean;
};

export function BrandLockup({ markOnly = false }: BrandLockupProps) {
  return markOnly ? (
    <Logo ariaLabel="Open Agency" size="lg" variant="mascot" />
  ) : (
    <Logo ariaLabel="Open Agency" size="md" variant="full" />
  );
}
