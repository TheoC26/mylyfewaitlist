"use client";

import { useMemo } from "react";
import { areaY, defineChart, lineY, ruleY } from "@tanstack/charts";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Chart } from "@tanstack/charts/react";
import { tooltip } from "@tanstack/charts/tooltip";
import { scaleUtc } from "d3-scale";
import { INK, INK_2, compact, dayLabel } from "./format";

/**
 * Line chart over an ordered domain. Used for every trend on the Overview tab.
 *
 * TIMEZONE, THE ONE THING NOT TO "FIX": the server buckets days in Eastern time
 * and sends them as "2026-08-11" strings. Those are parsed to UTC midnight and
 * plotted on scaleUtc, so parsing and formatting cancel and each tick reads back
 * the exact Eastern day that was bucketed. Swapping scaleUtc for scaleTime would
 * shift every label by the viewer's offset — launch day would render as Aug 10 in
 * Eastern and Aug 12 in Tokyo. TanStack Charts has no built-in temporal scale by
 * design; d3's is the documented path.
 *
 * A second series is allowed only when it measures the same entity a second way
 * (exact vs rolling retention). It is distinguished by lightness AND a dash
 * pattern AND a direct label, never by hue alone.
 */
export default function TimeSeries({
  rows,
  series,
  xKey = "date",
  xType = "time",
  ariaLabel,
  ariaDescription,
  height = 260,
  initialWidth = 520,
  yFormat = compact,
  xFormat,
  xTickValues,
  area = false,
  yLabel,
  tickCount = 5,
}) {
  const definition = useMemo(() => {
    const primary = series[0];
    const marks = [ruleY([0], { stroke: "#e5e7eb" })];

    if (area && primary) {
      marks.push(
        areaY(rows, {
          x: xKey,
          y: primary.key,
          fill: INK,
          fillOpacity: 0.05,
        }),
      );
    }

    series.forEach((entry, index) => {
      marks.push(
        lineY(rows, {
          x: xKey,
          y: entry.key,
          stroke: index === 0 ? INK : INK_2,
          strokeWidth: 2,
          strokeDasharray: index === 0 ? undefined : "4 3",
          // Points only on short domains; on 90 days they turn the line into a
          // caterpillar and hide the shape they were meant to reveal.
          points: rows.length <= 14,
        }),
      );
    });

    return defineChart({
      marks,
      x: {
        scale: xType === "time" ? scaleUtc : scaleLinear,
        // Deliberately NOT nice: on a date domain it rounds outward to the next
        // whole tick, which pads the axis days past today and makes the line stop
        // short of the edge as though the data ran out. The domain should end on
        // the last day we actually have.
        axis: {
          ticks: {
            // Explicit values where the domain is sampled rather than continuous:
            // retention exists at D0/1/3/7/14/28 only, and letting the scale pick
            // its own even ticks would print a D5 and D10 that were never measured.
            ...(xTickValues
              ? { values: xTickValues }
              : { count: Math.min(6, Math.max(2, rows.length)) }),
            format: xFormat ?? (xType === "time" ? dayLabel : undefined),
          },
          tickLabels: { fontSize: 11, thin: { minGap: 8, priority: "ends" } },
        },
      },
      y: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: {
          label: yLabel,
          ticks: { count: tickCount, format: yFormat },
          tickLabels: { fontSize: 11 },
        },
      },
      tooltip,
    });
  }, [
    rows,
    series,
    xKey,
    xType,
    area,
    xFormat,
    xTickValues,
    yFormat,
    yLabel,
    tickCount,
  ]);

  return (
    <div>
      <Chart
        definition={definition}
        height={height}
        initialWidth={initialWidth}
        ariaLabel={ariaLabel}
        ariaDescription={ariaDescription}
        className="text-gray-400"
      />
      {series.length > 1 && (
        <div className="mt-1 flex flex-wrap gap-4">
          {series.map((entry, index) => (
            <span
              key={entry.key}
              className="flex items-center gap-1.5 text-xs text-gray-500"
            >
              <svg width="14" height="8" aria-hidden="true">
                <line
                  x1="0"
                  y1="4"
                  x2="14"
                  y2="4"
                  stroke={index === 0 ? INK : INK_2}
                  strokeWidth="2"
                  strokeDasharray={index === 0 ? undefined : "4 3"}
                />
              </svg>
              {entry.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
