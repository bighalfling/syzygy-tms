"use client";

import * as React from "react";
import * as Recharts from "recharts";
import { cn } from "./utils";

/* =========================================================
   Types & Context
========================================================= */

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within <ChartContainer />");
  return ctx;
}

/* =========================================================
   Container
========================================================= */

function ChartContainer({
  id,
  className,
  config,
  children,
}: {
  id?: string;
  className?: string;
  config: ChartConfig;
  children: React.ReactNode;
}) {
  const uid = React.useId().replace(/:/g, "");
  const chartId = `chart-${id ?? uid}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "relative aspect-video w-full text-xs [&_.recharts-surface]:outline-none",
          className
        )}
      >
        <ChartStyle id={chartId} config={config} />
        <Recharts.ResponsiveContainer width="100%" height="100%">
          {children}
        </Recharts.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

/* =========================================================
   CSS variables for themes
========================================================= */

function ChartStyle({
  id,
  config,
}: {
  id: string;
  config: ChartConfig;
}) {
  const entries = Object.entries(config).filter(
    ([, v]) => v.color || v.theme
  );

  if (!entries.length) return null;

  const css = Object.entries(THEMES)
    .map(([theme, selector]) => {
      const vars = entries
        .map(([key, cfg]) => {
          const color =
            cfg.color || cfg.theme?.[theme as keyof typeof cfg.theme];
          return color ? `--color-${key}: ${color};` : "";
        })
        .join("\n");

      return `
${selector} [data-chart="${id}"] {
${vars}
}
`;
    })
    .join("\n");

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/* =========================================================
   Tooltip
========================================================= */

export const ChartTooltip = Recharts.Tooltip;

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: any[];
  label?: any;

  className?: string;
  indicator?: "dot" | "line" | "dashed";
  hideLabel?: boolean;
  hideIndicator?: boolean;

  formatter?: (
    value: any,
    name: any,
    item: any,
    index: number,
    payload: any
  ) => React.ReactNode;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  formatter,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className={cn(
        "rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-md",
        className
      )}
    >
      {!hideLabel && label ? (
        <div className="mb-1 font-medium">{label}</div>
      ) : null}

      <div className="grid gap-1">
        {payload.map((item, index) => {
          const key = item.dataKey || item.name;
          const cfg = config[key] ?? {};
          const color = item.color || item.fill;

          return (
            <div
              key={index}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                {!hideIndicator && (
                  <span
                    className={cn(
                      "inline-block",
                      indicator === "dot" && "h-2 w-2 rounded-full",
                      indicator === "line" && "h-2 w-1",
                      indicator === "dashed" &&
                        "h-2 w-1 border border-dashed bg-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="text-muted-foreground">
                  {cfg.label ?? item.name}
                </span>
              </div>

              <span className="font-mono tabular-nums">
                {formatter
                  ? formatter(
                      item.value,
                      item.name,
                      item,
                      index,
                      item.payload
                    )
                  : typeof item.value === "number"
                  ? item.value.toLocaleString()
                  : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   Legend
========================================================= */

export const ChartLegend = Recharts.Legend;

export function ChartLegendContent({
  payload,
  className,
}: {
  payload?: any[];
  className?: string;
}) {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div className={cn("flex flex-wrap justify-center gap-4", className)}>
      {payload.map((item, i) => {
        const cfg = config[item.dataKey] ?? {};
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs">
              {cfg.label ?? item.value ?? item.dataKey}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   Exports
========================================================= */

export { ChartContainer };
