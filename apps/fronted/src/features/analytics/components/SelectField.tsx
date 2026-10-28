import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { FormField } from "./FormField";
import styles from "./FormField.module.css";

type SelectFieldProps = Omit<ComponentPropsWithoutRef<"select">, "children" | "className"> & {
  label: string;
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
  displayValue?: string;
};

export function SelectField({
  label,
  children,
  id,
  className = "",
  wrapperClassName,
  displayValue,
  ...selectProps
}: SelectFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const controlClassName = [
    styles.control,
    styles.select,
    displayValue ? styles.compactSelect : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const fieldClassName = [wrapperClassName, displayValue ? styles.compactField : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <FormField id={controlId} label={label} className={fieldClassName}>
      <select {...selectProps} id={controlId} className={controlClassName}>
        {children}
      </select>
      {displayValue && <span className={styles.compactValue}>{displayValue}</span>}
    </FormField>
  );
}
