import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { FormField } from "./FormField";
import styles from "./FormField.module.css";

type SelectFieldProps = Omit<ComponentPropsWithoutRef<"select">, "children" | "className"> & {
  label: string;
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
  variant?: "default" | "soft";
};

export function SelectField({ label, children, id, className = "", wrapperClassName, variant = "default", ...selectProps }: SelectFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const controlClassName = [styles.control, styles.select, variant === "soft" ? styles.soft : "", className].filter(Boolean).join(" ");

  return (
    <FormField id={controlId} label={label} className={wrapperClassName}>
      <select {...selectProps} id={controlId} className={controlClassName}>
        {children}
      </select>
    </FormField>
  );
}
