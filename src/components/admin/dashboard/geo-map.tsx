"use client";

import React, { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Globe } from "lucide-react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country centroids for marker placement
const COUNTRY_COORDS: Record<string, [number, number]> = {
    "Turkey": [35, 39],
    "United States": [-95, 38],
    "Germany": [10, 51],
    "United Kingdom": [-2, 54],
    "France": [2, 47],
    "Spain": [-4, 40],
    "Italy": [12, 43],
    "Netherlands": [5, 52],
    "Belgium": [4, 51],
    "Poland": [20, 52],
    "Russia": [100, 60],
    "China": [105, 35],
    "Japan": [138, 36],
    "South Korea": [128, 36],
    "India": [80, 22],
    "Pakistan": [70, 30],
    "Indonesia": [120, -5],
    "Malaysia": [110, 4],
    "Saudi Arabia": [45, 24],
    "UAE": [54, 24],
    "Egypt": [30, 27],
    "Nigeria": [8, 10],
    "South Africa": [25, -29],
    "Brazil": [-55, -10],
    "Mexico": [-102, 23],
    "Canada": [-106, 56],
    "Australia": [135, -25],
    "Unknown": [0, 0],
};

interface GeoMapProps {
    data: { country: string; count: number }[];
}

export function GeoMap({ data }: GeoMapProps) {
    const [tooltipContent, setTooltipContent] = useState("");
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const maxVal = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);
    const totalRegistrants = useMemo(() => data.reduce((acc, d) => acc + d.count, 0), [data]);

    const radiusScale = useMemo(() =>
        scaleLinear()
            .domain([0, maxVal])
            .range([4, 20]),
        [maxVal]);

    // Filter to top countries with known coordinates
    const markers = useMemo(() => {
        return data
            .filter(d => COUNTRY_COORDS[d.country])
            .slice(0, 20)
            .map(d => ({
                name: d.country,
                count: d.count,
                coordinates: COUNTRY_COORDS[d.country] as [number, number],
            }));
    }, [data]);

    return (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 h-full flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 font-['Outfit'] flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-600" />
                    Global Network
                </h3>
                <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900 font-['JetBrains_Mono']">
                        {totalRegistrants.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">total registrants</p>
                </div>
            </div>

            <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-50/50">
                <ComposableMap
                    projectionConfig={{ scale: 320, center: [0, 20] }}
                    className="w-full h-full"
                    style={{ backgroundColor: "transparent" }}
                >
                    <ZoomableGroup>
                        <Geographies geography={geoUrl}>
                            {({ geographies }: { geographies: any[] }) =>
                                geographies.map((geo) => (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="#e2e8f0"
                                        stroke="#cbd5e1"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#94a3b8", outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                ))
                            }
                        </Geographies>

                        {/* Data point markers */}
                        {markers.map(({ name, count, coordinates }) => (
                            <Marker key={name} coordinates={coordinates}>
                                <circle
                                    r={radiusScale(count)}
                                    fill="url(#markerGradient)"
                                    fillOpacity={0.8}
                                    stroke="#7c3aed"
                                    strokeWidth={1}
                                    className="cursor-pointer transition-all duration-300 hover:fill-opacity-100"
                                    style={{
                                        filter: "drop-shadow(0 0 4px rgba(124, 58, 237, 0.3))",
                                    }}
                                    onMouseEnter={(e) => {
                                        setTooltipContent(`${name}: ${count.toLocaleString()}`);
                                    }}
                                    onMouseLeave={() => setTooltipContent("")}
                                />
                                {/* Pulse animation for top 3 */}
                                {markers.indexOf(markers.find(m => m.name === name)!) < 3 && (
                                    <circle
                                        r={radiusScale(count)}
                                        fill="none"
                                        stroke="#7c3aed"
                                        strokeWidth={2}
                                        opacity={0.5}
                                        className="animate-ping"
                                    />
                                )}
                            </Marker>
                        ))}

                        {/* Gradient definition */}
                        <defs>
                            <radialGradient id="markerGradient" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#06b6d4" />
                            </radialGradient>
                        </defs>
                    </ZoomableGroup>
                </ComposableMap>

                {/* Tooltip */}
                {tooltipContent && (
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-slate-900 px-3 py-2 rounded-lg text-sm font-['JetBrains_Mono'] border border-slate-200 shadow-lg">
                        {tooltipContent}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
                {data.slice(0, 4).map((d, i) => (
                    <div key={d.country} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                            style={{ opacity: 1 - (i * 0.2) }}
                        />
                        <span>{d.country}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
