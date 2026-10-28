import type { ReactNode } from "react";

import styles from "./PageBanner.module.css";
import { PageBannerHeading } from "./PageBannerHeading";

type PageBannerProps = {
  eyebrow: string;
  title: string;
  titleId: string;
  description?: string;
  filters?: ReactNode;
  children?: ReactNode;
};

export function PageBanner({
  eyebrow,
  title,
  titleId,
  description,
  filters,
  children,
}: PageBannerProps) {
  return (
    <section className={styles.banner} aria-labelledby={titleId}>
      <PageBannerHeading
        eyebrow={eyebrow}
        title={title}
        titleId={titleId}
        description={description}
      />
      {filters}
      {children}
    </section>
  );
}
