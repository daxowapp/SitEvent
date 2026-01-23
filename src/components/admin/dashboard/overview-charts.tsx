"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface RegistrationTrend {
    date: string;
    count: number;
}

interface ChartDataInput {
    date: string;
    value: number;
}

interface StatusData {
    name: string;
    value: number;
    [key: string]: string | number;
}

const COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b"];

export function RegistrationChart({ data }: { data: ChartDataInput[] }) {
    if (!data || data.length === 0) {
        return <div className="h-[300px] w-full flex items-center justify-center text-slate-400">No data available</div>;
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#ffffff",
                            borderColor: "#e2e8f0",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            color: "#0f172a"
                        }}
                        itemStyle={{ color: "#7c3aed" }}
                        labelStyle={{ color: "#64748b", marginBottom: "0.25rem" }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#7c3aed"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function EventStatusChart({ data }: { data: StatusData[] }) {
    const total = data.reduce((acc, item) => acc + item.value, 0);

    return (
        <div className="flex items-center justify-center gap-8">
            <ResponsiveContainer width={200} height={200}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                className="transition-all duration-300 hover:opacity-80"
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid rgba(139, 92, 246, 0.3)",
                            borderRadius: "8px",
                        }}
                        itemStyle={{ color: "#fff", fontFamily: "JetBrains Mono" }}
                    />
                </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-3">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                            <p className="text-sm text-slate-300 font-['Outfit']">{item.name}</p>
                            <p className="text-lg font-bold text-white font-['JetBrains_Mono']">
                                {item.value}
                                <span className="text-xs text-slate-500 ml-1">
                                    ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                                </span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
