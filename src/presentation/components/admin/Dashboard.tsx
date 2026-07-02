"use client";

import { MapPin, Store, Star, MessageSquareWarning, DollarSign, ChevronDown, Users, Crown, Calendar } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { adminNightMarketService } from '@/application/features/admin/adminNightMarketService';
import { adminBoothService } from '@/application/features/admin/adminBoothService';
import { adminComplaintService } from '@/application/features/admin/adminComplaintService';
import { boothRegistrationService } from '@/application/features/boothRegistration/boothRegistrationService';
import { reviewService } from '@/application/features/reviews/reviewService';
import type { Booth, BoothRegistration, Complaint, NightMarket } from '@/shared/types';

// ── Period data ────────────────────────────────────────────────────────────────

interface MonthData {
  platformRevenue: number;
  totalMarkets: number;
  totalBooth: number;
  newReview: number;
  newComplaints: number;
  newBooth: number;
  totalSubscription: number;
  activeSubscription: number;
  newSubscription: number;
}

const yearMonthData: Record<number, Record<string, MonthData>> = {
  2023: {
    Jan: { platformRevenue: 28000000, totalMarkets: 2,  totalBooth: 298,  newBooth: 12, newReview: 68,  newComplaints: 5,  totalSubscription: 32,  activeSubscription: 28,  newSubscription: 3  },
    Feb: { platformRevenue: 30000000, totalMarkets: 2,  totalBooth: 313,  newBooth: 15, newReview: 74,  newComplaints: 7,  totalSubscription: 36,  activeSubscription: 31,  newSubscription: 4  },
    Mar: { platformRevenue: 32000000, totalMarkets: 2,  totalBooth: 331,  newBooth: 18, newReview: 92,  newComplaints: 6,  totalSubscription: 41,  activeSubscription: 35,  newSubscription: 5  },
    Apr: { platformRevenue: 31000000, totalMarkets: 2,  totalBooth: 345,  newBooth: 14, newReview: 88,  newComplaints: 8,  totalSubscription: 46,  activeSubscription: 39,  newSubscription: 5  },
    May: { platformRevenue: 34000000, totalMarkets: 2,  totalBooth: 365,  newBooth: 20, newReview: 105, newComplaints: 9,  totalSubscription: 52,  activeSubscription: 44,  newSubscription: 6  },
    Jun: { platformRevenue: 36000000, totalMarkets: 3, totalBooth: 387,  newBooth: 22, newReview: 118, newComplaints: 7,  totalSubscription: 59,  activeSubscription: 50,  newSubscription: 7  },
    Jul: { platformRevenue: 38000000, totalMarkets: 3, totalBooth: 412,  newBooth: 25, newReview: 134, newComplaints: 10, totalSubscription: 67,  activeSubscription: 57,  newSubscription: 8  },
    Aug: { platformRevenue: 40000000, totalMarkets: 3, totalBooth: 440,  newBooth: 28, newReview: 156, newComplaints: 8,  totalSubscription: 76,  activeSubscription: 64,  newSubscription: 9  },
    Sep: { platformRevenue: 39000000, totalMarkets: 3, totalBooth: 460,  newBooth: 20, newReview: 142, newComplaints: 6,  totalSubscription: 83,  activeSubscription: 71,  newSubscription: 7  },
    Oct: { platformRevenue: 42000000, totalMarkets: 3, totalBooth: 490,  newBooth: 30, newReview: 178, newComplaints: 11, totalSubscription: 93,  activeSubscription: 79,  newSubscription: 10 },
    Nov: { platformRevenue: 45000000, totalMarkets: 3, totalBooth: 522,  newBooth: 32, newReview: 195, newComplaints: 9,  totalSubscription: 104, activeSubscription: 88,  newSubscription: 11 },
    Dec: { platformRevenue: 48000000, totalMarkets: 3, totalBooth: 557,  newBooth: 35, newReview: 223, newComplaints: 12, totalSubscription: 117, activeSubscription: 99,  newSubscription: 13 },
  },
  2024: {
    Jan: { platformRevenue: 38000000, totalMarkets: 3, totalBooth: 577,  newBooth: 20, newReview: 184, newComplaints: 6,  totalSubscription: 123, activeSubscription: 105, newSubscription: 6  },
    Feb: { platformRevenue: 42000000, totalMarkets: 3, totalBooth: 601,  newBooth: 24, newReview: 210, newComplaints: 8,  totalSubscription: 131, activeSubscription: 112, newSubscription: 8  },
    Mar: { platformRevenue: 46000000, totalMarkets: 3, totalBooth: 629,  newBooth: 28, newReview: 238, newComplaints: 7,  totalSubscription: 140, activeSubscription: 120, newSubscription: 9  },
    Apr: { platformRevenue: 49000000, totalMarkets: 3, totalBooth: 659,  newBooth: 30, newReview: 265, newComplaints: 9,  totalSubscription: 150, activeSubscription: 128, newSubscription: 10 },
    May: { platformRevenue: 51000000, totalMarkets: 3, totalBooth: 681,  newBooth: 22, newReview: 290, newComplaints: 10, totalSubscription: 158, activeSubscription: 135, newSubscription: 8  },
    Jun: { platformRevenue: 54000000, totalMarkets: 3, totalBooth: 699,  newBooth: 18, newReview: 312, newComplaints: 8,  totalSubscription: 167, activeSubscription: 143, newSubscription: 9  },
    Jul: { platformRevenue: 56000000, totalMarkets: 3, totalBooth: 724,  newBooth: 25, newReview: 334, newComplaints: 7,  totalSubscription: 177, activeSubscription: 152, newSubscription: 10 },
    Aug: { platformRevenue: 58000000, totalMarkets: 3, totalBooth: 751,  newBooth: 27, newReview: 360, newComplaints: 11, totalSubscription: 188, activeSubscription: 161, newSubscription: 11 },
    Sep: { platformRevenue: 55000000, totalMarkets: 3, totalBooth: 771,  newBooth: 20, newReview: 328, newComplaints: 6,  totalSubscription: 195, activeSubscription: 168, newSubscription: 7  },
    Oct: { platformRevenue: 60000000, totalMarkets: 3, totalBooth: 803,  newBooth: 32, newReview: 395, newComplaints: 13, totalSubscription: 207, activeSubscription: 178, newSubscription: 12 },
    Nov: { platformRevenue: 63000000, totalMarkets: 3, totalBooth: 841,  newBooth: 38, newReview: 418, newComplaints: 9,  totalSubscription: 220, activeSubscription: 189, newSubscription: 13 },
    Dec: { platformRevenue: 68000000, totalMarkets: 3, totalBooth: 883,  newBooth: 42, newReview: 462, newComplaints: 14, totalSubscription: 235, activeSubscription: 202, newSubscription: 15 },
  },
  2025: {
    Jan: { platformRevenue: 52000000, totalMarkets: 3, totalBooth: 911,  newBooth: 28, newReview: 380, newComplaints: 7,  totalSubscription: 245, activeSubscription: 211, newSubscription: 10 },
    Feb: { platformRevenue: 56000000, totalMarkets: 3, totalBooth: 943,  newBooth: 32, newReview: 415, newComplaints: 9,  totalSubscription: 257, activeSubscription: 222, newSubscription: 12 },
    Mar: { platformRevenue: 61000000, totalMarkets: 3, totalBooth: 978,  newBooth: 35, newReview: 456, newComplaints: 8,  totalSubscription: 271, activeSubscription: 234, newSubscription: 14 },
    Apr: { platformRevenue: 65000000, totalMarkets: 4, totalBooth: 1008, newBooth: 30, newReview: 492, newComplaints: 10, totalSubscription: 283, activeSubscription: 244, newSubscription: 12 },
    May: { platformRevenue: 68000000, totalMarkets: 4, totalBooth: 1033, newBooth: 25, newReview: 520, newComplaints: 7,  totalSubscription: 293, activeSubscription: 253, newSubscription: 10 },
    Jun: { platformRevenue: 72000000, totalMarkets: 4, totalBooth: 1055, newBooth: 22, newReview: 548, newComplaints: 9,  totalSubscription: 304, activeSubscription: 262, newSubscription: 11 },
    Jul: { platformRevenue: 75000000, totalMarkets: 4, totalBooth: 1083, newBooth: 28, newReview: 576, newComplaints: 8,  totalSubscription: 316, activeSubscription: 273, newSubscription: 12 },
    Aug: { platformRevenue: 78000000, totalMarkets: 4, totalBooth: 1113, newBooth: 30, newReview: 612, newComplaints: 11, totalSubscription: 329, activeSubscription: 284, newSubscription: 13 },
    Sep: { platformRevenue: 74000000, totalMarkets: 4, totalBooth: 1137, newBooth: 24, newReview: 584, newComplaints: 6,  totalSubscription: 339, activeSubscription: 292, newSubscription: 10 },
    Oct: { platformRevenue: 80000000, totalMarkets: 4, totalBooth: 1173, newBooth: 36, newReview: 650, newComplaints: 12, totalSubscription: 352, activeSubscription: 303, newSubscription: 13 },
    Nov: { platformRevenue: 84000000, totalMarkets: 4, totalBooth: 1213, newBooth: 40, newReview: 688, newComplaints: 10, totalSubscription: 367, activeSubscription: 316, newSubscription: 15 },
    Dec: { platformRevenue: 90000000, totalMarkets: 4, totalBooth: 1258, newBooth: 45, newReview: 740, newComplaints: 15, totalSubscription: 384, activeSubscription: 331, newSubscription: 17 },
  },
  2026: {
    Jan: { platformRevenue: 68000000, totalMarkets: 4, totalBooth: 1288, newBooth: 30, newReview: 612, newComplaints: 8,  totalSubscription: 396, activeSubscription: 342, newSubscription: 12 },
    Feb: { platformRevenue: 72000000, totalMarkets: 4, totalBooth: 1322, newBooth: 34, newReview: 654, newComplaints: 10, totalSubscription: 411, activeSubscription: 354, newSubscription: 15 },
    Mar: { platformRevenue: 76000000, totalMarkets: 4, totalBooth: 1360, newBooth: 38, newReview: 698, newComplaints: 7,  totalSubscription: 428, activeSubscription: 369, newSubscription: 17 },
    Apr: { platformRevenue: 80000000, totalMarkets: 4, totalBooth: 1392, newBooth: 32, newReview: 736, newComplaints: 9,  totalSubscription: 442, activeSubscription: 382, newSubscription: 14 },
    May: { platformRevenue: 84000000, totalMarkets: 4, totalBooth: 1420, newBooth: 28, newReview: 778, newComplaints: 8,  totalSubscription: 455, activeSubscription: 392, newSubscription: 13 },
    Jun: { platformRevenue: 88000000, totalMarkets: 4, totalBooth: 1445, newBooth: 25, newReview: 812, newComplaints: 6,  totalSubscription: 467, activeSubscription: 402, newSubscription: 12 },
  },
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const availableYears = [2023, 2024, 2025, 2026];

const sumYear = (year: number): MonthData => {
  const data = yearMonthData[year] || {};
  const vals = Object.values(data);
  if (vals.length === 0) return { platformRevenue: 0, totalMarkets: 2, totalBooth: 0, newBooth: 0, newReview: 0, newComplaints: 0, totalSubscription: 0, activeSubscription: 0, newSubscription: 0 };
  return {
    platformRevenue: vals.reduce((s, m) => s + m.platformRevenue, 0),
    totalMarkets: vals[vals.length - 1].totalMarkets,
    totalBooth: vals[vals.length - 1].totalBooth,
    newBooth: vals.reduce((s, m) => s + m.newBooth, 0),
    newReview: vals.reduce((s, m) => s + m.newReview, 0),
    newComplaints: vals.reduce((s, m) => s + m.newComplaints, 0),
    totalSubscription: vals[vals.length - 1].totalSubscription,
    activeSubscription: vals[vals.length - 1].activeSubscription,
    newSubscription: vals.reduce((s, m) => s + m.newSubscription, 0),
  };
};

const getPeriodData = (year: number, month: string | null): MonthData => {
  if (month) return yearMonthData[year]?.[month] ?? { platformRevenue: 0, totalMarkets: 2, totalBooth: 0, newBooth: 0, newReview: 0, newComplaints: 0 };
  return sumYear(year);
};

const getChartData = (year: number, month: string | null, view: string) => {
  if (month) {
    const base = yearMonthData[year]?.[month];
    if (!base) return [];
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((label, i) => {
      const w = [0.22, 0.26, 0.28, 0.24][i];
      return {
        label,
        platformRevenue: Math.round(base.platformRevenue * w),
        newBooth: Math.round(base.newBooth * w),
        newReview: Math.round(base.newReview * w),
        newComplaints: Math.round(base.newComplaints * w),
      };
    });
  }
  const yearData = yearMonthData[year] || {};
  return months.filter(m => yearData[m]).map(m => ({
    label: m,
    platformRevenue: yearData[m].platformRevenue,
    newBooth: yearData[m].newBooth,
    newReview: yearData[m].newReview,
    newComplaints: yearData[m].newComplaints,
  }));
};

const getSubscriptionChartData = (year: number, month: string | null) => {
  if (month) {
    const base = yearMonthData[year]?.[month];
    if (!base) return [];
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((label, i) => {
      const w = [0.22, 0.26, 0.28, 0.24][i];
      return {
        label,
        newSubscription: Math.round(base.newSubscription * w),
        activeSubscription: Math.round(base.activeSubscription * (0.95 + i * 0.017)),
        totalSubscription: Math.round(base.totalSubscription * (0.97 + i * 0.01)),
      };
    });
  }
  const yearData = yearMonthData[year] || {};
  return months.filter(m => yearData[m]).map(m => ({
    label: m,
    newSubscription: yearData[m].newSubscription,
    activeSubscription: yearData[m].activeSubscription,
    totalSubscription: yearData[m].totalSubscription,
  }));
};

// ── SVG Line Chart ─────────────────────────────────────────────────────────────

interface SvgLineChartProps {
  data: Array<{ label: string; [key: string]: any }>;
  dataKey: string;
  color: string;
  shortLabel: string;
  formatY: (v: number) => string;
  isCurrency: boolean;
}

function SvgLineChart({ data, dataKey, color, shortLabel, formatY, isCurrency }: SvgLineChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; label: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const PAD = { top: 16, right: 24, bottom: 36, left: 64 };
  const W = 900;
  const H = 240;
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const values = data.map(d => d[dataKey] as number);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = (rawMax - rawMin) * 0.1 || rawMax * 0.1 || 1;
  const minVal = Math.max(0, rawMin - padding);
  const maxVal = rawMax + padding;
  const range = maxVal - minVal || 1;

  const xPos = (i: number) => data.length < 2 ? PAD.left + chartW / 2 : PAD.left + (i / (data.length - 1)) * chartW;
  const yPos = (v: number) => PAD.top + (1 - (v - minVal) / range) * chartH;

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i)},${yPos(d[dataKey])}`).join(' ');

  // Area fill path
  const areaD = data.length > 1
    ? `${pathD} L${xPos(data.length - 1)},${PAD.top + chartH} L${xPos(0)},${PAD.top + chartH} Z`
    : '';

  const yTickCount = 5;
  const yTicks = Array.from({ length: yTickCount }, (_, i) => minVal + (range * i) / (yTickCount - 1));

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const relX = (e.clientX - rect.left) * scaleX - PAD.left;
    const idx = Math.round((relX / chartW) * (data.length - 1));
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    const d = data[clamped];
    setTooltip({ x: xPos(clamped), y: yPos(d[dataKey]), value: d[dataKey], label: d.label });
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 240, display: 'block' }}
        onMouseMove={handleMouseMove}
        data-mouse-leave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={`areaGrad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map((v, i) => (
          <line
            key={i}
            x1={PAD.left} y1={yPos(v)}
            x2={W - PAD.right} y2={yPos(v)}
            stroke="#E5E7EB" strokeWidth="1"
          />
        ))}

        {/* Y axis labels */}
        {yTicks.map((v, i) => (
          <text key={i} x={PAD.left - 8} y={yPos(v) + 4} textAnchor="end" fontSize="11" fill="#64748B">
            {formatY(Math.round(v))}
          </text>
        ))}

        {/* X axis labels */}
        {data.map((d, i) => (
          <text key={i} x={xPos(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="#64748B">
            {d.label}
          </text>
        ))}

        {/* Area fill */}
        {data.length > 1 && (
          <path d={areaD} fill={`url(#areaGrad-${dataKey})`} />
        )}

        {/* Line */}
        {data.length > 1 && (
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        )}

        {/* Dots on all data points */}
        {data.map((d, i) => (
          <circle key={i} cx={xPos(i)} cy={yPos(d[dataKey])} r="3" fill={color} opacity="0.5" />
        ))}

        {/* Active dot */}
        {tooltip && (
          <circle cx={tooltip.x} cy={tooltip.y} r="5" fill={color} stroke="#FFFFFF" strokeWidth="2" />
        )}

        {/* Vertical hover line */}
        {tooltip && (
          <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + chartH} stroke={color} strokeWidth="1" strokeDasharray="4 2" opacity="0.4" />
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none rounded-lg px-3 py-2 text-xs"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: 'translate(-50%, -130%)',
            whiteSpace: 'nowrap',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p className="font-medium" style={{ color: '#111827' }}>{tooltip.label}</p>
          <p style={{ color }}>
            {shortLabel}: {isCurrency ? `$${tooltip.value.toLocaleString('en-US')}` : tooltip.value}
          </p>
        </div>
      )}
    </div>
  );
}

// ── SVG Grouped Bar Chart ──────────────────────────────────────────────────────

interface SubBarDatum {
  label: string;
  newSubscription: number;
  activeSubscription: number;
  totalSubscription: number;
}

function SvgGroupedBarChart({ data }: { data: SubBarDatum[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; datum: SubBarDatum } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const PAD = { top: 16, right: 24, bottom: 36, left: 48 };
  const W = 900;
  const H = 220;
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const series: { key: keyof SubBarDatum; color: string }[] = [
    { key: 'newSubscription', color: '#111827' },
    { key: 'activeSubscription', color: '#10B981' },
    { key: 'totalSubscription', color: '#F59E0B' },
  ];

  const allVals = data.flatMap(d => series.map(s => d[s.key] as number));
  const maxVal = Math.max(...allVals, 1);

  const groupW = data.length > 1 ? chartW / data.length : chartW;
  const gap = groupW * 0.25;
  const barsArea = groupW - gap;
  const barW = barsArea / series.length;

  const groupX = (i: number) => PAD.left + i * groupW + gap / 2;
  const barH = (v: number) => (v / maxVal) * chartH;
  const barY = (v: number) => PAD.top + chartH - barH(v);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(t * maxVal));

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 220, display: 'block' }}
        data-mouse-leave={() => setTooltip(null)}
      >
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <line
            key={`grid-${i}`}
            x1={PAD.left} y1={barY(v)}
            x2={W - PAD.right} y2={barY(v)}
            stroke="#E5E7EB" strokeWidth="1"
          />
        ))}

        {/* Y axis labels */}
        {yTicks.map((v, i) => (
          <text key={`ytick-${i}`} x={PAD.left - 8} y={barY(v) + 4} textAnchor="end" fontSize="11" fill="#64748B">
            {v}
          </text>
        ))}

        {/* Bars */}
        {data.map((d, gi) => (
          <g key={`group-${gi}`}
            data-mouse-enter={() => setTooltip({ x: groupX(gi) + barsArea / 2, y: barY(Math.max(...series.map(s => d[s.key] as number))), datum: d })}
            data-mouse-leave={() => setTooltip(null)}
          >
            {series.map((s, si) => {
              const v = d[s.key] as number;
              const h = barH(v);
              const x = groupX(gi) + si * barW;
              const y = barY(v);
              const r = Math.min(3, h / 2);
              return (
                <g key={`bar-${gi}-${si}`}>
                  <rect
                    x={x} y={y + r}
                    width={barW - 2} height={Math.max(h - r, 0)}
                    fill={s.color} opacity={0.85}
                  />
                  {h > r && (
                    <rect
                      x={x} y={y}
                      width={barW - 2} height={r * 2}
                      rx={r} ry={r}
                      fill={s.color} opacity={0.85}
                    />
                  )}
                </g>
              );
            })}
            {/* X label */}
            <text
              x={groupX(gi) + barsArea / 2}
              y={H - 6}
              textAnchor="middle" fontSize="11" fill="#64748B"
            >
              {d.label}
            </text>
          </g>
        ))}

        {/* Hover crosshair */}
        {tooltip && (
          <line
            x1={tooltip.x} y1={PAD.top}
            x2={tooltip.x} y2={PAD.top + chartH}
            stroke="#334155" strokeWidth="1" strokeDasharray="4 2"
          />
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none rounded-lg px-3 py-2 text-xs"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: 'translate(-50%, -130%)',
            whiteSpace: 'nowrap',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(8px)',
            zIndex: 10,
          }}
        >
          <p className="font-medium mb-1" style={{ color: '#111827' }}>{tooltip.datum.label}</p>
          <p style={{ color: '#111827' }}>New: {tooltip.datum.newSubscription}</p>
          <p style={{ color: '#10B981' }}>Active: {tooltip.datum.activeSubscription}</p>
          <p style={{ color: '#F59E0B' }}>Total: {tooltip.datum.totalSubscription}</p>
        </div>
      )}
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  subColor: string;
  icon: React.ReactNode;
  iconGradient: string;
  glowColor: string;
}

function KpiCard({ label, value, sub, subColor, icon, iconGradient, glowColor }: KpiCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      data-mouse-enter={() => setHovered(true)}
      data-mouse-leave={() => setHovered(false)}
      className="rounded-xl p-5 transition-all"
      style={{
        background: hovered
          ? '#FFFFFF'
          : '#FFFFFF',
        border: hovered ? '1px solid #D1D5DB' : '1px solid #E5E7EB',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.06), 0 0 0 1px rgba(17,24,39,0.06)' : '0 4px 18px rgba(15,23,42,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs mb-1" style={{ color: '#64748B' }}>{label}</p>
          <p className="text-2xl font-semibold" style={{ color: '#111827' }}>{value}</p>
          <p className="text-xs mt-1" style={{ color: subColor }}>{sub}</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: iconGradient,
            boxShadow: `0 0 16px ${glowColor}`,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

interface DashboardProps {
  onNavigate?: (tab: string, params?: any) => void;
}

const emptyPeriodData: MonthData = {
  platformRevenue: 0,
  totalMarkets: 0,
  totalBooth: 0,
  newBooth: 0,
  newReview: 0,
  newComplaints: 0,
  totalSubscription: 0,
  activeSubscription: 0,
  newSubscription: 0,
};

export function Dashboard({ onNavigate }: DashboardProps) {

  const [dateRange, setDateRange] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState('Jun');
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(2026);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const [chartView, setChartView] = useState<'platformRevenue' | 'newBooth'>('platformRevenue');
  const [markets, setMarkets] = useState<NightMarket[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<BoothRegistration[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      adminNightMarketService.getNightMarkets(1, 1000),
      adminBoothService.getAllBooths(1, 1000),
      boothRegistrationService.getPending(1, 1000),
      adminComplaintService.getAllComplaints(1, 1000),
      reviewService.getAll(1, 1000),
    ]).then((results) => {
      if (!mounted) return;
      const [marketRes, boothRes, pendingRes, complaintRes, reviewRes] = results;
      if (marketRes.status === 'fulfilled') setMarkets(marketRes.value.data?.items ?? []);
      if (boothRes.status === 'fulfilled') setBooths(boothRes.value.data?.items ?? []);
      if (pendingRes.status === 'fulfilled') setPendingRegistrations(pendingRes.value.data?.items ?? []);
      if (complaintRes.status === 'fulfilled') setComplaints(complaintRes.value.data?.items ?? []);
      if (reviewRes.status === 'fulfilled') setReviewTotal(reviewRes.value.data?.total ?? reviewRes.value.data?.items?.length ?? 0);
    });
    return () => { mounted = false; };
  }, []);

  const pendingBooth = useMemo(() => pendingRegistrations.slice(0, 6), [pendingRegistrations]);
  const openComplaints = useMemo(
    () => complaints.filter(c => ['Submitted', 'UnderInvestigation', 'Open', 'Investigating'].includes(c.status)).slice(0, 6),
    [complaints]
  );

  const getEffectivePeriod = (range: string, month: string, monthYear: number, year: number) => {
    if (range === 'month') return { year: monthYear, month };
    return { year, month: null };
  };

  const eff = getEffectivePeriod(dateRange, selectedMonth, selectedMonthYear, selectedYear);
  const periodData = useMemo(() => ({
    ...emptyPeriodData,
    totalMarkets: markets.length,
    totalBooth: booths.length,
    newReview: reviewTotal,
    newComplaints: complaints.length,
  }), [markets.length, booths.length, reviewTotal, complaints.length]);
  const chartData = useMemo(() => [], [chartView]);

  const periodLabel = dateRange === "month" ? `${selectedMonth} ${selectedMonthYear}` : `Year ${selectedYear}`;



  const formatRevenue = (v: number) => {
    if (v >= 1000000000) return `${(v / 1000000000).toFixed(1).replace('.', ',')} B`;
    if (v >= 1000000) return `${(v / 1000000).toFixed(0)} M`;
    return `${(v / 1000).toFixed(0)} K`;
  };

  const formatValue = (v: number, view: string) => {
    if (view === 'platformRevenue') {
      if (v >= 1000000000) return `${(v / 1000000000).toFixed(1).replace('.', ',')} tỷ`;
      if (v >= 1000000) return `${(v / 1000000).toFixed(0)} M`;
      return `${(v / 1000).toFixed(0)} K`;
    }
    return v.toString();
  };

  const chartViewConfig = {
    platformRevenue: { label: 'Subscription Revenue', shortLabel: 'Revenue', color: '#111827' },
    newBooth: { label: 'Newly Registered Booths', shortLabel: 'New Booths', color: '#10B981' },
  } as const;

  const availableMonths = months;

  return (
    <div className="p-6 space-y-6">
      {/* Header + Period Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Platform analytics by period</p>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
            >
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            {dateRange === "month" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
              >
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
            {dateRange === "year" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </div>

          {dateRange === "month" && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(Number(e.target.value))}
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard
          label="Subscription Revenue"
          value={formatRevenue(periodData.platformRevenue)}
          sub={periodLabel}
          subColor="#818CF8"
          icon={<DollarSign className="w-5 h-5 text-white" />}
          iconGradient="linear-gradient(135deg, #6366F1, #4F46E5)"
          glowColor="rgba(99,102,241,0.4)"
        />
        <KpiCard
          label="Total Night Markets"
          value={String(periodData.totalMarkets)}
          sub="Active markets"
          subColor="#2DD4BF"
          icon={<MapPin className="w-5 h-5 text-white" />}
          iconGradient="linear-gradient(135deg, #14B8A6, #0D9488)"
          glowColor="rgba(20,184,166,0.4)"
        />
        <KpiCard
          label="Total Booths"
          value={periodData.totalBooth.toLocaleString()}
          sub={`+${periodData.newBooth} new this period`}
          subColor="#34D399"
          icon={<Store className="w-5 h-5 text-white" />}
          iconGradient="linear-gradient(135deg, #10B981, #059669)"
          glowColor="rgba(16,185,129,0.4)"
        />
        <KpiCard
          label="Reviews"
          value={periodData.newReview.toLocaleString()}
          sub="This period"
          subColor="#FBBF24"
          icon={<Star className="w-5 h-5 text-white" />}
          iconGradient="linear-gradient(135deg, #F59E0B, #D97706)"
          glowColor="rgba(245,158,11,0.4)"
        />
        <KpiCard
          label="Complaints"
          value={String(periodData.newComplaints)}
          sub="This period"
          subColor="#F87171"
          icon={<MessageSquareWarning className="w-5 h-5 text-white" />}
          iconGradient="linear-gradient(135deg, #EF4444, #DC2626)"
          glowColor="rgba(239,68,68,0.4)"
        />
      </div>

      {/* Chart */}
      <div
        className="rounded-xl p-6"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 style={{ color: '#111827' }}>{chartViewConfig[chartView].label}</h3>
            <p className="text-sm mt-0.5" style={{ color: '#475569' }}>{periodLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {(Object.keys(chartViewConfig) as Array<keyof typeof chartViewConfig>).map((view) => (
              <button
                key={view}
                onClick={() => setChartView(view)}
                className="px-3 py-1.5 rounded-lg text-xs transition-all"
                style={
                  chartView === view
                    ? {
                        background: '#2563EB',
                        color: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }
                    : {
                        background: '#FFFFFF',
                        color: '#64748B',
                        border: '1px solid #E5E7EB',
                      }
                }
              >
                {chartViewConfig[view].shortLabel}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-sm" style={{ color: '#64748B' }}>
            No data available
          </div>
        ) : (
          <SvgLineChart
            data={chartData}
            dataKey={chartView}
            color={chartViewConfig[chartView].color}
            shortLabel={chartViewConfig[chartView].shortLabel}
            formatY={(v) => formatValue(v, chartView)}
            isCurrency={chartView === 'platformRevenue'}
          />
        )}
      </div>



      {/* Pending Booths + Open Complaints */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pending Booths */}
        <div
          className="rounded-xl p-6"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: '#111827' }}>Pending Booth Approvals</h3>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full"
              style={{
                background: 'rgba(249,115,22,0.12)',
                color: '#FB923C',
                border: '1px solid rgba(249,115,22,0.25)',
              }}
            >
              {pendingBooth.length} waiting
            </span>
          </div>
          <div className="space-y-2">
            {pendingBooth.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#475569' }}>No data available</p>
            ) : (
              pendingBooth.map(booth => (
                <div
                  key={booth.id}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(249,115,22,0.12)' }}
                  >
                    <Store className="w-4 h-4" style={{ color: '#FB923C' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm Muncate" style={{ color: '#111827' }}>{booth.boothName || 'No data available'}</p>
                    <p className="text-xs Muncate" style={{ color: '#475569' }}>{booth.phone || 'No data available'}</p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: '#475569' }}>
                    {booth.createdAt ? new Date(booth.createdAt).toLocaleDateString('vi-VN') : 'No data available'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Open Complaints */}
        <div
          className="rounded-xl p-6"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: '#111827' }}>Open Complaints</h3>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full"
              style={{
                background: 'rgba(239,68,68,0.12)',
                color: '#F87171',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              {openComplaints.length} open
            </span>
          </div>
          <div className="space-y-2">
            {openComplaints.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#475569' }}>No data available</p>
            ) : (
              openComplaints.map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
                >
                  <span
                    className="flex-shrink-0 px-2 py-0.5 rounded text-xs"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    {c.status || 'No data'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm Muncate" style={{ color: '#111827' }}>{c.title || c.id || 'No data available'}</p>
                    <p className="text-xs Muncate" style={{ color: '#475569' }}>{(c.description || 'No data available').slice(0, 50)}</p>
                  </div>
                  <span
                    className="flex-shrink-0 text-xs px-2 py-0.5 rounded"
                    style={
                      c.status === 'Submitted'
                        ? { background: 'rgba(239,68,68,0.1)', color: '#F87171' }
                        : { background: 'rgba(245,158,11,0.1)', color: '#FBBF24' }
                    }
                  >
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Night Market Status Table */}
      <div
        className="rounded-xl p-6"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
        }}
      >
        <h3 className="mb-4" style={{ color: '#111827' }}>Night Market Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                {['Market', 'Location', 'Hours', 'Total Booths', 'Active', 'Occupancy', 'Status'].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs" style={{ color: '#475569', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {markets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm" style={{ color: '#64748B' }}>
                    No data available
                  </td>
                </tr>
              ) : (
                markets.slice(0, 5).map(market => {
                  const activeBooth = booths.filter(booth => booth.nightMarketId === market.id && booth.status === 'Active').length;
                  const totalBooth = market.totalBooth ?? booths.filter(booth => booth.nightMarketId === market.id).length;
                  const occupancy = totalBooth > 0 ? Math.round((activeBooth / totalBooth) * 100) : null;
                  const hours = [market.openingHours, market.closingHours].filter(Boolean).join(' - ') || 'No data available';

                  return (
                    <tr
                      key={market.id}
                      onClick={() => onNavigate && onNavigate('markets', { marketId: market.id })}
                      className="transition-all hover:bg-gray-50 cursor-pointer"
                      style={{ borderBottom: '1px solid #E5E7EB' }}
                    >
                      <td className="py-3 px-3 text-sm" style={{ color: '#111827' }}>{market.name || 'No data available'}</td>
                      <td className="py-3 px-3 text-sm" style={{ color: '#64748B' }}>{market.address || 'No data available'}</td>
                      <td className="py-3 px-3 text-sm" style={{ color: '#64748B' }}>{hours}</td>
                      <td className="py-3 px-3 text-sm" style={{ color: '#334155' }}>{totalBooth || 'No data available'}</td>
                      <td className="py-3 px-3 text-sm" style={{ color: '#34D399' }}>{activeBooth || 'No data available'}</td>
                      <td className="py-3 px-3 text-sm" style={{ color: '#2DD4BF' }}>{occupancy !== null ? `${occupancy}%` : 'No data available'}</td>
                      <td className="py-3 px-3">
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full"
                          style={
                            market.status === 'Open'
                              ? { background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }
                              : market.status === 'Closed'
                              ? { background: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.25)' }
                              : { background: 'rgba(100,116,139,0.12)', color: '#64748B', border: '1px solid rgba(100,116,139,0.25)' }
                          }
                        >
                          {market.status || 'No data'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
