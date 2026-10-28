import type { ReactNode } from "react";

import styles from "./PageBanner.module.css";

type PageBannerHeadingProps = {
  eyebrow: string;
  title: string;
  titleId: string;
  description?: string;
  rightContent?: ReactNode;
  compact?: boolean;
};

export function PageBannerHeading({
  eyebrow,
  title,
  titleId,
  description,
  rightContent,
  compact = false,
}: PageBannerHeadingProps) {
  return (
    <div className={`${styles.heading} ${compact ? styles.headingCompact : ""}`}>
      <div className={styles.headingContent}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 id={titleId}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {rightContent}
    </div>
  );
}
