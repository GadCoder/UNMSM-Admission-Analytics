import type { ComponentPropsWithoutRef, ReactNode } from "react";

import styles from "./FormField.module.css";

export function FormField({
  id,
  label,
  children,
  className = "",
}: {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.field} ${className}`.trim()}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

type TextInputProps = Omit<ComponentPropsWithoutRef<"input">, "className"> & { className?: string };

export function TextInput({ className = "", ...inputProps }: TextInputProps) {
  return (
    <input
      {...inputProps}
      className={`${styles.control} ${styles.textInput} ${className}`.trim()}
    />
  );
}
