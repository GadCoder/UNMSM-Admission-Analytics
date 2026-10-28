import type { ReactNode, Ref } from "react";

import styles from "./PageBanner.module.css";

type PageBannerHeadingProps = {
  eyebrow: string;
  title: string;
  titleId: string;
  titleRef?: Ref<HTMLHeadingElement>;
  titleAddon?: ReactNode;
  description?: string;
  rightContent?: ReactNode;
  rightContentClassName?: string;
  className?: string;
  compact?: boolean;
};

export function PageBannerHeading({
  eyebrow,
  title,
  titleId,
  titleRef,
  titleAddon,
  description,
  rightContent,
  rightContentClassName,
  className = "",
  compact = false,
}: PageBannerHeadingProps) {
  return (
    <div className={`${styles.heading} ${compact ? styles.headingCompact : ""} ${className}`}>
      <div className={styles.headingContent}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 id={titleId} ref={titleRef} tabIndex={titleRef ? -1 : undefined}>
          {title}
          {titleAddon}
        </h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {rightContent && (
        <div className={`${styles.actions} ${rightContentClassName ?? ""}`}>{rightContent}</div>
      )}
    </div>
  );
}
