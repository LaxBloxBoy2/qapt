"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Dynamically import ReactECharts with no SSR to avoid hydration issues
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface PieChartProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
    itemStyle?: {
      color: string;
    };
  }>;
  className?: string;
}

export default function PieChart({ title, data, className }: PieChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Configure chart options
  const chartOptions = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
      data: data.map((item) => item.name),
      textStyle: {
        color: "#888",
      },
    },
    series: [
      {
        name: title,
        type: "pie",
        radius: ["50%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: data,
      },
    ],
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
