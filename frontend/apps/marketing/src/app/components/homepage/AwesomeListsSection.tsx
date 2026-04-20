import type { HomepageContent } from "../../homepage-content";
import styles from "../../page.module.css";
import { CardSection } from "./CardSection";

type AwesomeListsSectionProps = {
  content: HomepageContent["awesomeLists"];
};

export function AwesomeListsSection({ content }: AwesomeListsSectionProps) {
  return (
    <CardSection
      cards={content.previews}
      cardClassName={styles.awesomeListsCard}
      description={content.description}
      sectionId="awesome-lists"
      title={content.title}
      titleId="awesome-lists-title"
    />
  );
}
