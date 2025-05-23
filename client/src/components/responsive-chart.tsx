import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChartData {
  [key: string]: any;
}

interface ResponsiveChartProps {
  data: ChartData[];
  type: 'line' | 'bar';
  xDataKey: string;
  series: {
    dataKey: string;
    color: string;
    name?: string;
  }[];
  height?: number;
  legendPosition?: 'top' | 'bottom';
  gridLines?: boolean;
  aspectRatio?: number;
}

export default function ResponsiveChart({
  data,
  type,
  xDataKey,
  series,
  height = 300,
  legendPosition = 'bottom',
  gridLines = true,
  aspectRatio = 2,
}: ResponsiveChartProps) {
  const isMobile = useIsMobile();
  const [chartHeight, setChartHeight] = useState(height);

  // Adjust chart height for mobile
  useEffect(() => {
    if (isMobile) {
      // Use a taller chart on mobile for better visibility
      setChartHeight(height * 0.8);
    } else {
      setChartHeight(height);
    }
  }, [isMobile, height]);

  // Determine how many ticks to show based on screen size
  const getTickCount = () => {
    return isMobile ? Math.min(3, data.length) : Math.min(7, data.length);
  };

  // Simplified tooltip for mobile
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-slate-800 border border-slate-700 p-2 rounded-md shadow-md text-xs">
        <p className="font-medium text-white">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center mt-1">
            <span 
              className="w-2 h-2 rounded-full mr-1" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="mr-1 text-slate-300">
              {series.find(s => s.dataKey === entry.dataKey)?.name || entry.dataKey}:
            </span>
            <span className="font-medium text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart
            data={data}
            margin={isMobile ? { top: 10, right: 10, left: 0, bottom: 20 } : { top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {gridLines && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis 
              dataKey={xDataKey} 
              tick={{ fill: '#9CA3AF' }}
              tickCount={getTickCount()}
              axisLine={{ stroke: '#4B5563' }}
              tickLine={{ stroke: '#4B5563' }}
            />
            <YAxis 
              tick={{ fill: '#9CA3AF' }}
              axisLine={{ stroke: '#4B5563' }}
              tickLine={{ stroke: '#4B5563' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {series.map((s, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={s.dataKey}
                stroke={s.color}
                activeDot={{ r: 6 }}
                strokeWidth={2}
                name={s.name || s.dataKey}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart
            data={data}
            margin={isMobile ? { top: 10, right: 10, left: 0, bottom: 20 } : { top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {gridLines && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis 
              dataKey={xDataKey} 
              tick={{ fill: '#9CA3AF' }}
              tickCount={getTickCount()}
              axisLine={{ stroke: '#4B5563' }}
              tickLine={{ stroke: '#4B5563' }}
            />
            <YAxis 
              tick={{ fill: '#9CA3AF' }}
              axisLine={{ stroke: '#4B5563' }}
              tickLine={{ stroke: '#4B5563' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {series.map((s, i) => (
              <Bar
                key={i}
                dataKey={s.dataKey}
                fill={s.color}
                name={s.name || s.dataKey}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}