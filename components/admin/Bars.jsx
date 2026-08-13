"use client";

import { useMemo } from "react";
import { barY, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Chart } from "@tanstack/charts/react";
import { tooltip } from "@tanstack/charts/tooltip";
import { INK, compact } from "./format";

/**
 * Vertical bars over a categorical domain — the histograms.
 *
 * Single series, so no legend and no palette: the axis title says what is being
 * counted. `radius` rounds only the data end, which stays anchored to the
 * baseline; rounding both ends would detach the bar from zero and misread length.
 */
export default function Bars({
  rows,
  xKey,
  yKey,
  ariaLabel,
  ariaDescription,
  height = 200,
  initialWidth = 360,
  yLabel,
}) {
  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(rows, {
            x: xKey,
            y: yKey,
            fill: INK,
            radius: 4,
          }),
        ],
        x: {
          scale: () => scaleBand().padding(0.28),
          axis: { tickLabels: { fontSize: 11 } },
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: {
            label: yLabel,
            ticks: { count: 3, format: compact },
            tickLabels: { fontSize: 11 },
          },
        },
        tooltip,
      }),
    [rows, xKey, yKey, yLabel],
  );

  return (
    <Chart
      definition={definition}
      height={height}
      initialWidth={initialWidth}
      ariaLabel={ariaLabel}
      ariaDescription={ariaDescription}
      className="text-gray-400"
    />
  );
}
