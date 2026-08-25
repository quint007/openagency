import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { homepageContent } from "../src/app/homepage-content";
import Home from "../src/app/page";

const { getBlogPostsMock } = vi.hoisted(() => ({
  getBlogPostsMock: vi.fn(),
}));

vi.mock("@open-agency/cms-client", () => ({
  getBlogPosts: getBlogPostsMock,
}));

test("marketing homepage renders the approved homepage sections and footer contracts", async () => {
  getBlogPostsMock.mockResolvedValue([
    {
      excerpt:
        "A practical structure for approvals, revisions, and sign-off when AI is part of your content operation.",
      id: 101,
      publishedAt: "2026-04-01T12:00:00.000Z",
      slug: "human-review-loops",
      title: "Human review loops that keep AI output calm and accountable",
    },
  ]);

  render(await Home());

  const main = screen.getByRole("main");
  const footer = screen.getByRole("contentinfo");
  const desktopNav = screen.getByRole("navigation", {
    name: homepageContent.header.navigationLabel,
  });
  const header = desktopNav.closest("header");

  expect(header).toBeTruthy();

  if (!header) {
    throw new Error(
      "Expected desktop navigation to be wrapped by the homepage header",
    );
  }

  for (const item of homepageContent.header.links) {
    expect(
      within(desktopNav)
        .getByRole("link", { name: item.label })
        .getAttribute("href"),
    ).toBe(item.href);
  }

  const menuToggle = within(header).getByRole("button", {
    name: homepageContent.header.menuLabel,
  });
  expect(menuToggle.getAttribute("aria-expanded")).toBe("false");

  const headerCta = within(header).getByRole("button", {
    name: homepageContent.header.primaryCta.label,
  });
  expect(headerCta.tagName).toBe("A");
  expect(headerCta.getAttribute("href")).toBe(
    homepageContent.header.primaryCta.href,
  );

  const heroPrimaryCta = screen.getByRole("button", {
    name: homepageContent.hero.primaryCta.label,
  });
  expect(heroPrimaryCta.tagName).toBe("A");
  expect(heroPrimaryCta.getAttribute("href")).toBe(
    homepageContent.hero.primaryCta.href,
  );

  const heroSecondaryCta = screen.getByRole("button", {
    name: homepageContent.hero.secondaryCta.label,
  });
  expect(heroSecondaryCta.tagName).toBe("A");
  expect(heroSecondaryCta.getAttribute("href")).toBe(
    homepageContent.hero.secondaryCta.href,
  );

  if (homepageContent.hero.eyebrow) {
    expect(screen.getByText(homepageContent.hero.eyebrow)).toBeTruthy();
  }

  expect(
    screen.getByRole("heading", {
      name: homepageContent.hero.title,
    }),
  ).toBeTruthy();
  expect(screen.getByText(homepageContent.hero.body)).toBeTruthy();
  expect(screen.getByText(homepageContent.hero.supportingLine)).toBeTruthy();
  expect(screen.getByText("Open source systems")).toBeTruthy();

  const renderedSections = Array.from(main.querySelectorAll(":scope > section")).map(
    (section) => {
      const labelledBy = section.getAttribute("aria-labelledby");
      const label = labelledBy ? document.getElementById(labelledBy) : null;

      return {
        id: section.id,
        name: label?.textContent?.trim() ?? section.getAttribute("aria-label") ?? "",
      };
    },
  );

  expect(renderedSections).toEqual([
    { id: homepageContent.hero.sectionId, name: homepageContent.hero.title },
    { id: "solutions", name: homepageContent.trustBar.ariaLabel },
    { id: "latest-guides", name: homepageContent.latestGuides.title },
    { id: "tools-teaser", name: homepageContent.toolsTeaser.title },
    { id: "newsletter", name: homepageContent.newsletter.title },
  ]);

  const proofRow = screen.getByRole("list", {
    name: homepageContent.trustBar.ariaLabel,
  });
  const proofSection = within(main).getByRole("region", {
    name: homepageContent.trustBar.ariaLabel,
  });

  expect(proofSection.getAttribute("id")).toBe("solutions");

  for (const statement of homepageContent.trustBar.statements) {
    expect(within(proofRow).getByText(statement)).toBeTruthy();
  }

  const latestGuidesSection = within(main).getByRole("region", {
    name: homepageContent.latestGuides.title,
  });

  expect(
    within(latestGuidesSection).getByText(
      homepageContent.latestGuides.description,
    ),
  ).toBeTruthy();
  expect(
    within(latestGuidesSection)
      .getByRole("button", { name: homepageContent.latestGuides.cta.label })
      .getAttribute("href"),
  ).toBe(homepageContent.latestGuides.cta.href);
  expect(
    within(latestGuidesSection).getByRole("heading", {
      name: "Human review loops that keep AI output calm and accountable",
      level: 3,
    }),
  ).toBeTruthy();
  expect(
    within(latestGuidesSection).getByRole("button", { name: "Previous post" }),
  ).toBeTruthy();
  expect(
    within(latestGuidesSection).getByRole("button", { name: "Next post" }),
  ).toBeTruthy();

  const toolsSection = within(main).getByRole("region", {
    name: homepageContent.toolsTeaser.title,
  });
  const toolCards = within(toolsSection).getAllByRole("listitem");

  expect(toolCards).toHaveLength(homepageContent.toolsTeaser.cards.length);

  for (const card of homepageContent.toolsTeaser.cards) {
    expect(
      within(toolsSection)
        .getByRole("link", { name: card.label })
        .getAttribute("href"),
    ).toBe(card.href);
    expect(within(toolsSection).getByText(card.description)).toBeTruthy();
  }

  expect(main.textContent).not.toMatch(/coming soon|in progress/i);
  expect(
    within(toolsSection).getByRole("link", { name: "Local model calculator" }),
  ).toBeTruthy();

  const newsletterSection = within(main).getByRole("region", {
    name: homepageContent.newsletter.title,
  });

  expect(
    within(newsletterSection).getByText(homepageContent.newsletter.description),
  ).toBeTruthy();
  expect(
    within(newsletterSection).getByRole("textbox", {
      name: homepageContent.newsletter.fieldLabel,
    }),
  ).toBeTruthy();
  expect(
    within(newsletterSection).getByText(homepageContent.newsletter.privacyNote),
  ).toBeTruthy();
  expect(
    within(newsletterSection).getByRole("button", {
      name: homepageContent.newsletter.submitLabel,
    }),
  ).toBeTruthy();

  expect(
    within(footer).getByText(homepageContent.footer.description),
  ).toBeTruthy();
  expect(homepageContent.footer.columns.map((column) => column.title)).toEqual([
    "Navigation",
    "Open source",
    "Legal",
  ]);

  for (const column of homepageContent.footer.columns) {
    expect(
      within(footer).getByRole("heading", { name: column.title }),
    ).toBeTruthy();

    for (const link of column.links) {
      expect(
        within(footer)
          .getByRole("link", { name: link.label })
          .getAttribute("href"),
      ).toBe(link.href);
    }
  }

  expect(
    within(footer).getByText(homepageContent.footer.copyright),
  ).toBeTruthy();

  const renderedValueSurface = `${header?.textContent ?? ""} ${main.textContent ?? ""} ${footer.textContent ?? ""}`;
  expect(renderedValueSurface).not.toMatch(
    /templates|courses|all usable today|awesome lists|prompt brief|launch checklist|review rubric/i,
  );
  expect(
    within(footer).queryByRole("link", { name: /awesome lists/i }),
  ).toBeNull();
}, 10000);

test("homepage content contract keeps the latest guides section copy stable", () => {
  expect(homepageContent.latestGuides.title).toBe("Latest guides");
  expect(homepageContent.latestGuides.cta).toEqual({
    label: "See all guides",
    href: "/blog",
  });
  expect(homepageContent.latestGuides.description).toBe(
    "Fresh operating notes from the Open Agency guides library.",
  );
});

test("homepage content contract keeps live-value hero and supporting copy", () => {
  expect(homepageContent.hero.title).toBe(
    "Work smarter with AI — not harder with hype.",
  );
  expect(homepageContent.hero.body).toBe(
    "open-agency is a free, open-source site for people building with AI. Read practical guides and use the local model calculator to choose a model for your device.",
  );
  expect(homepageContent.hero.supportingLine).toBe(
    "Free, open-source, and practical — no account required to get started.",
  );
  expect(homepageContent.hero.body).not.toMatch(/templates|courses|all usable today/i);
  expect(homepageContent.trustBar.statements.join(" ")).not.toMatch(/templates|courses/i);
});

test("homepage content contract keeps the calculator teaser and footer href contracts", () => {
  expect(homepageContent.toolsTeaser.title).toBe(
    "Free tools. No account needed.",
  );
  expect(homepageContent.toolsTeaser.cards).toHaveLength(1);
  expect(homepageContent.toolsTeaser.cards[0]?.href).toBe(
    "/tools/local-model-calculator",
  );
  expect(homepageContent.newsletter.fieldLabel).toBe("Your email address");
  expect(homepageContent.newsletter.submitLabel).toBe("Subscribe — it's free");
  expect(homepageContent.newsletter.privacyNote).toBe(
    "No spam. No selling your email. Unsubscribe any time.",
  );
  expect(homepageContent.footer.description).toBe(
    "open-agency — practical AI for people who build things.",
  );
  expect(homepageContent.footer.columns).toEqual([
    {
      title: "Navigation",
      links: [
        { label: "Guides", href: "/blog" },
        { label: "Tools", href: "/tools" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
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
        { label: "Cookies", href: "/privacy/cookies" },
      ],
    },
  ]);
});

test("homepage content contract exposes only healthy navigation and calculator actions", () => {
  expect(homepageContent.header.links).toEqual([{ label: "Guides", href: "/blog" }]);
  expect(homepageContent.header.primaryCta).toEqual({
    label: "Try the calculator",
    href: "/tools/local-model-calculator",
  });
  expect(homepageContent.hero.primaryCta.href).toBe("/blog");
  expect(homepageContent.hero.secondaryCta.href).toBe("/tools");
});
