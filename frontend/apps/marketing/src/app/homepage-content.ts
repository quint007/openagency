export type HomepageAnchorId = "platform" | "solutions" | "about" | "contact";

export type HomepageAnchorHref = `#${HomepageAnchorId}`;

export type HomepageRouteHref =
  | HomepageAnchorHref
  | "/blog"
  | `/blog/${string}`
  | "/tools"
  | "/tools/local-model-calculator"
  | "/newsletter"
  | "/about"
  | "/privacy"
  | "/terms"
  | "https://github.com/Open-Agency-io"
  | "mailto:hello@open-agency.io";

export type HomepageLink = {
  label: string;
  href: HomepageRouteHref;
};

export type HomepageCardLink = HomepageLink & {
  description: string;
};

export type HomepageFeatureCard = {
  body: string;
  cta: HomepageLink;
  label: string;
  title: string;
};

export const allowedFooterLinkHrefs = [
  "/blog",
  "/tools",
  "https://github.com/Open-Agency-io",
  "/privacy",
  "/terms",
] as const;

export type HomepageFooterLinkHref = (typeof allowedFooterLinkHrefs)[number];

export type HomepageFooterLink = {
  label: string;
  href: HomepageFooterLinkHref;
};

export type HomepageContent = {
  header: {
    navigationLabel: string;
    mobileNavigationLabel: string;
    menuLabel: string;
    links: readonly HomepageLink[];
    primaryCta: HomepageLink;
  };
  hero: {
    sectionId: HomepageAnchorId;
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: HomepageLink;
    secondaryCta: HomepageLink;
    supportingLine: string;
  };
  trustBar: {
    ariaLabel: string;
    statements: readonly string[];
  };
  latestGuides: {
    title: string;
    description: string;
    cta: HomepageLink;
    empty: {
      title: string;
      body: string;
      cta: HomepageLink;
    };
    error: {
      title: string;
      body: string;
      cta: HomepageLink;
    };
  };
  toolsTeaser: {
    title: string;
    description: string;
    cards: readonly HomepageCardLink[];
  };
  newsletter: {
    title: string;
    description: string;
    fieldLabel: string;
    placeholder: string;
    submitLabel: string;
    privacyNote: string;
    privacyLinkLabel: string;
    retryLabel: string;
    errors: {
      required: {
        title: string;
        description: string;
      };
      invalid: {
        title: string;
        description: string;
      };
      generic: {
        title: string;
        description: string;
      };
      configuration: {
        title: string;
        description: string;
      };
    };
    success: {
      title: string;
      description: string;
    };
  };
  footer: {
    description: string;
    columns: readonly {
      title: string;
      links: readonly HomepageFooterLink[];
    }[];
    copyright: string;
  };
};

const homepageAnchors = {
  platform: "#platform",
  solutions: "#solutions",
  about: "#about",
  contact: "#contact",
} as const satisfies Record<HomepageAnchorId, HomepageAnchorHref>;

export const homepageContent = {
  header: {
    navigationLabel: "Primary",
    mobileNavigationLabel: "Mobile primary",
    menuLabel: "Menu",
    links: [{ label: "Guides", href: "/blog" }],
    primaryCta: { label: "Try the calculator", href: "/tools/local-model-calculator" },
  },
  hero: {
    sectionId: "platform",
    eyebrow: "",
    title: "Work smarter with AI — not harder with hype.",
    body: "open-agency is a free, open-source site for people building with AI. Read practical guides and use the local model calculator to choose a model for your device.",
    primaryCta: { label: "Browse the guides", href: "/blog" },
    secondaryCta: { label: "See the tools", href: "/tools" },
    supportingLine: "Free, open-source, and practical — no account required to get started.",
  },
  trustBar: {
    ariaLabel: "Trust bar",
    statements: [
      "Open source — practical guides and tools are built in public",
      "No fluff — guides ship with working code, not slides",
      "Built by practitioners — platform engineers and creators, not influencers",
    ],
  },
  latestGuides: {
    title: "Latest guides",
    description: "Fresh operating notes from the Open Agency guides library.",
    cta: {
      label: "See all guides",
      href: "/blog",
    },
    empty: {
      title: "Latest guides are on the way.",
      body: "We are curating the first set of guides now. Check back soon or browse the full guides library in the meantime.",
      cta: {
        label: "Browse all guides",
        href: "/blog",
      },
    },
    error: {
      title: "Latest guides are temporarily unavailable.",
      body: "The guides feed could not load just now. Please try again in a bit or open the full guides library directly.",
      cta: {
        label: "Open guides library",
        href: "/blog",
      },
    },
  },
  toolsTeaser: {
    title: "Free tools. No account needed.",
    description: "Choose a local AI model for your device and workflow goals.",
    cards: [
      {
        label: "Local model calculator",
        href: "/tools/local-model-calculator",
        description:
          "Find the best local AI model for your device specs and workflow goals.",
      },
    ],
  },
  newsletter: {
    title: "Get the good stuff in your inbox",
    description: "A focused newsletter on open-source workflow patterns, guides, and tools for AI users.",
    fieldLabel: "Your email address",
    placeholder: "name@example.com",
    submitLabel: "Subscribe — it's free",
    privacyNote: "No spam. No selling your email. Unsubscribe any time.",
    privacyLinkLabel: "Read our Privacy policy.",
    retryLabel: "Try again",
    errors: {
      required: {
        title: "Add your email address",
        description: "Enter an email address before you subscribe.",
      },
      invalid: {
        title: "Use a valid email address",
        description: "Check the format and try again.",
      },
      generic: {
        title: "We could not subscribe you",
        description: "Please try again in a moment.",
      },
      configuration: {
        title: "Newsletter signup is unavailable",
        description: "Please try again later.",
      },
    },
    success: {
      title: "You’re on the list.",
      description: "We’ll confirm your spot when the waitlist opens and send the first issue when launch day arrives.",
    },
  },
  footer: {
    description: "open-agency — practical AI for people who build things.",
    columns: [
      {
        title: "Navigation",
        links: [
          { label: "Guides", href: "/blog" },
          { label: "Tools", href: "/tools" },
        ],
      },
      {
        title: "Open source",
        links: [{ label: "GitHub", href: "https://github.com/Open-Agency-io" }],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
        ],
      },
    ],
    copyright: "© Open Agency. Human-reviewed systems for AI-native teams.",
  },
} as const satisfies HomepageContent;

export { homepageAnchors };
