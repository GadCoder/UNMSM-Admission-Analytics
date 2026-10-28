import type { ReactNode } from "react";

export function marker(index: number, x: number, y: number, color: string): ReactNode {
  switch (index) {
    case 1:
      return (
        <rect
          x={x - 4}
          y={y - 4}
          width="8"
          height="8"
          fill="white"
          stroke={color}
          strokeWidth="2"
        />
      );
    case 2:
      return (
        <polygon
          points={`${x},${y - 5} ${x + 5},${y + 4} ${x - 5},${y + 4}`}
          fill="white"
          stroke={color}
          strokeWidth="2"
        />
      );
    case 3:
      return (
        <polygon
          points={`${x},${y - 5} ${x + 5},${y} ${x},${y + 5} ${x - 5},${y}`}
          fill="white"
          stroke={color}
          strokeWidth="2"
        />
      );
    default:
      return <circle cx={x} cy={y} r="4" fill="white" stroke={color} strokeWidth="2" />;
  }
}

export function segments(
  values: Array<number | null>,
  xPositions: number[],
  y: (value: number) => number,
) {
  const result: string[] = [];
  let current: string[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (current.length) result.push(current.join(" "));
      current = [];
    } else current.push(`${current.length ? "L" : "M"} ${xPositions[index]} ${y(value)}`);
  });
  if (current.length) result.push(current.join(" "));
  return result;
}
