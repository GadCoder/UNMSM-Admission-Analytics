import styles from "./RemovableChip.module.css";

type RemovableChipProps = {
  label: string;
  accessibleName: string;
  onRemove: () => void;
  title?: string;
  className?: string;
};

export function RemovableChip({
  label,
  accessibleName,
  onRemove,
  title,
  className,
}: RemovableChipProps) {
  return (
    <button
      type="button"
      className={[styles.chip, className].filter(Boolean).join(" ")}
      aria-label={accessibleName}
      title={title ?? label}
      onClick={onRemove}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.removeMark} aria-hidden="true">
        ×
      </span>
    </button>
  );
}
