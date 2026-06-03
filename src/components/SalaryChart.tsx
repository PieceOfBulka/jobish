"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export interface SalaryPoint {
  month: string;
  junior: number;
  middle: number;
  senior: number;
}

export function SalaryChart({ data }: { data: SalaryPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => `${Math.round(v / 1000)}к`}
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(v) => new Intl.NumberFormat("ru-RU").format(Number(v)) + " ₽"}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="junior" name="Junior" stroke="#a5b4fc" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="middle" name="Middle" stroke="#6366f1" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="senior" name="Senior" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
