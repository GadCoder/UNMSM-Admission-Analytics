import type { ReactNode } from "react";

import styles from "./PageBanner.module.css";

type PageBannerProps = {
  eyebrow: string;
  title: string;
  titleId: string;
  description?: string;
  filters?: ReactNode;
  children?: ReactNode;
};

export function PageBanner({ eyebrow, title, titleId, description, filters, children }: PageBannerProps) {
  return <section className={styles.banner} aria-labelledby={titleId}>
    <div className={styles.heading}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 id={titleId}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
    </div>
    {filters}
    {children}
  </section>;
}
