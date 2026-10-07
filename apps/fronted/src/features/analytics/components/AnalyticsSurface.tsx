import type { ComponentPropsWithoutRef } from "react";

import styles from "./AnalyticsSurface.module.css";

type AnalyticsSurfaceProps = ComponentPropsWithoutRef<"section">;

export function AnalyticsSurface({ className, ...sectionProps }: AnalyticsSurfaceProps) {
  const combinedClassName = [styles.surface, className].filter(Boolean).join(" ");

  return <section {...sectionProps} className={combinedClassName} />;
}
