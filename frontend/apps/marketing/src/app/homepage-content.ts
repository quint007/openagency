export type HomepageAnchorId = "platform" | "solutions" | "about" | "contact";

export type HomepageAnchorHref = `#${HomepageAnchorId}`;

export type HomepageRouteHref =
  | HomepageAnchorHref
  | "/blog"
  | `/blog/${string}`
  | "/blog/opencode-starter"
  | "/blog?category=writing"
  | "/blog?category=automation"
  | "/awesome"
  | "/awesome/agents"
  | "/awesome/workflows"
  | "/awesome/prompts"
  | "/tools"
  | "/tools/prompt-brief"
  | "/tools/launch-checklist"
  | "/tools/review-rubric"
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
  "/awesome",
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
  startHere: {
    title: string;
    description: string;
    cards: readonly HomepageFeatureCard[];
  };
  awesomeLists: {
    title: string;
    description: string;
    previews: readonly HomepageCardLink[];
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
    primaryCta: { label: "View the guides", href: "/blog" },
  },
  hero: {
    sectionId: "platform",
    eyebrow: "",
    title: "Work smarter with AI — not harder with hype.",
    body: "open-agency is a free, open-source platform for creators and builders who want practical AI in their workflows. Guides, tools, templates, and courses — all built in public, all usable today.",
    primaryCta: { label: "Browse the guides", href: "/blog" },
    secondaryCta: { label: "See the tools", href: "/tools" },
    supportingLine:
      "Everything free. No paywall. No account required to get started.",
  },
  trustBar: {
    ariaLabel: "Trust bar",
    statements: [
      "Open source — every template and tool is on GitHub",
      "No fluff — guides ship with working code, not slides",
      "Built by practitioners — platform engineers and creators, not influencers",
    ],
  },
  startHere: {
    title: "The fastest way to level up your AI workflow",
    description:
      "Pick a category. Everything below is free, practical, and ships with something you can use today.",
    cards: [
      {
        label: "coding",
        title: "Set up your AI-optimised coding repo",
        body: "CLAUDE.md, opencode config, MCP servers, and context management — everything you need to make AI a real part of your dev workflow.",
        cta: {
          label: "Read the guide →",
          href: "/blog/opencode-starter",
        },
      },
      {
        label: "curated",
        title: "The best free AI tools, curated",
        body: "No subscriptions. No trials. Hand-picked open-source and free-tier tools across coding, writing, marketing, and automation — updated regularly.",
        cta: {
          label: "Browse the lists →",
          href: "/awesome",
        },
      },
      {
        label: "writing",
        title: "Write faster without sounding like AI",
        body: "Prompt patterns, editing workflows, and voice-preservation techniques for writers who use AI as a tool, not a ghostwriter.",
        cta: {
          label: "Read the guide →",
          href: "/blog?category=writing",
        },
      },
      {
        label: "automation",
        title: "Automate the repetitive stuff — for free",
        body: "n8n, Make, native webhooks. A practical map of what to automate and exactly how to do it without spending a cent.",
        cta: {
          label: "Read the guide →",
          href: "/blog?category=automation",
        },
      },
    ],
  },
  awesomeLists: {
    title: "The open-agency awesome lists",
    description:
      "Curated references for teams building repeatable AI-assisted workflows.",
    previews: [
      {
        label: "Agents worth studying",
        href: "/awesome/agents",
        description:
          "Examples of operator-friendly agents, prompts, and review loops.",
      },
      {
        label: "Workflow systems",
        href: "/awesome/workflows",
        description:
          "Operating models, approval systems, and launch checklists to remix.",
      },
      {
        label: "Prompt libraries",
        href: "/awesome/prompts",
        description:
          "Reusable prompt structures for briefs, reviews, and distribution planning.",
      },
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
    description:
      "Fast helpers for turning scattered AI output into cleaner work before it reaches your team.",
    cards: [
      {
        label: "Prompt brief template",
        href: "/tools/prompt-brief",
        description:
          "Structure a request before it goes into the model or back to your team.",
      },
      {
        label: "Launch checklist",
        href: "/tools/launch-checklist",
        description:
          "Pressure-test content, approvals, and distribution steps before shipping.",
      },
      {
        label: "Review rubric",
        href: "/tools/review-rubric",
        description:
          "Keep human review criteria visible across drafts and revisions.",
      },
    ],
  },
  newsletter: {
    title: "Get the good stuff in your inbox",
    description:
      "A focused newsletter on open-source workflow patterns, guides, and tools for AI users.",
    fieldLabel: "Your email address",
    placeholder: "name@example.com",
    submitLabel: "Subscribe — it's free",
    privacyNote: "No spam. No selling your email. Unsubscribe any time.",
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
    },
    success: {
      title: "You’re on the list.",
      description:
        "We’ll confirm your spot when the waitlist opens and send the first issue when launch day arrives.",
    },
  },
  footer: {
    description: "open-agency — practical AI for people who build things.",
    columns: [
      {
        title: "Navigation",
        links: [
          { label: "Guides", href: "/blog" },
          { label: "Awesome lists", href: "/awesome" },
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
