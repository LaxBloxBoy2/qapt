"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Dynamically import ReactECharts with no SSR to avoid hydration issues
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface BarChartProps {
  title: string;
  xAxisData: string[];
  series: Array<{
    name: string;
    data: number[];
    color?: string;
  }>;
  className?: string;
}

export default function BarChart({ title, xAxisData, series, className }: BarChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Configure chart options
  const chartOptions = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      data: series.map((item) => item.name),
      textStyle: {
        color: "#888",
      },
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "3%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        data: xAxisData,
        axisTick: {
          alignWithLabel: true,
        },
        axisLine: {
          lineStyle: {
            color: "#ddd",
          },
        },
        axisLabel: {
          color: "#888",
        },
      },
    ],
    yAxis: [
      {
        type: "value",
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: "#f0f0f0",
          },
        },
        axisLabel: {
          color: "#888",
        },
      },
    ],
    series: series.map((item) => ({
      name: item.name,
      type: "bar",
      barWidth: "60%",
      data: item.data,
      itemStyle: {
        color: item.color,
      },
    })),
  };

  if (!mounted) {
    return (
      <div className={cn("card", className)}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card", className)}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-64">
        <ReactECharts option={chartOptions} style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}
