import type { CSSProperties } from "react";

export type ComparisonGridStyle = CSSProperties & {
  "--comparison-columns": string;
  "--comparison-count": string;
};

export function getComparisonGridStyle(processCount: number): ComparisonGridStyle {
  return {
    "--comparison-columns": `minmax(0, 1fr) repeat(${processCount}, minmax(6.5rem, 1fr))`,
    "--comparison-count": String(processCount),
  };
}
