import type { ReactNode, Ref } from "react";

import styles from "./PageBanner.module.css";
import { PageBannerHeading } from "./PageBannerHeading";

type PageBannerProps = {
  eyebrow: string;
  title: string;
  titleId: string;
  titleRef?: Ref<HTMLHeadingElement>;
  titleAddon?: ReactNode;
  description?: string;
  rightContent?: ReactNode;
  filters?: ReactNode;
  children?: ReactNode;
  detailLayout?: boolean;
};

export function PageBanner({
  eyebrow,
  title,
  titleId,
  titleRef,
  titleAddon,
  description,
  rightContent,
  filters,
  children,
  detailLayout = false,
}: PageBannerProps) {
  return (
    <section
      className={`${styles.banner} ${detailLayout ? styles.detailBanner : ""}`}
      aria-labelledby={titleId}
    >
      <PageBannerHeading
        eyebrow={eyebrow}
        title={title}
        titleId={titleId}
        titleRef={titleRef}
        titleAddon={titleAddon}
        rightContent={rightContent}
        rightContentClassName={detailLayout ? styles.detailActions : undefined}
        description={description}
        className={detailLayout ? styles.detailHeading : undefined}
      />
      {filters}
      {children}
    </section>
  );
}
