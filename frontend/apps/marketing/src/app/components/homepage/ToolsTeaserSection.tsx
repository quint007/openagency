import type { HomepageContent } from "../../homepage-content";
import styles from "../../page.module.css";
import { CardSection } from "./CardSection";

type ToolsTeaserSectionProps = {
  content: HomepageContent["toolsTeaser"];
};

export function ToolsTeaserSection({ content }: ToolsTeaserSectionProps) {
  return (
    <CardSection
      cards={content.cards}
      cardClassName={styles.toolsTeaserCard}
      description={content.description}
      sectionId="tools-teaser"
      title={content.title}
      titleId="tools-teaser-title"
    />
  );
}
