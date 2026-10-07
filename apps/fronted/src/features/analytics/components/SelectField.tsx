import type { ComponentPropsWithoutRef, ReactNode } from "react";

import styles from "./SelectField.module.css";

type SelectFieldProps = Omit<ComponentPropsWithoutRef<"select">, "children" | "className"> & {
  label: string;
  children: ReactNode;
};

export function SelectField({ label, children, ...selectProps }: SelectFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <select {...selectProps} className={styles.select}>
        {children}
      </select>
    </label>
  );
}
