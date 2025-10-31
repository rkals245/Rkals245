import React from 'react';
import { formatTimeSummary, ChartDataPoint } from '../utils/statsUtils';

interface BarChartProps {
  data: ChartDataPoint[];
  title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.values.study + d.values.break), 1);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>
      <div className="flex justify-around items-end h-48 p-2 bg-gray-700/50 rounded-lg">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center h-full justify-end group">
            <div className="relative flex-grow flex flex-col-reverse items-end w-8 md:w-10">
              <div
                className="w-full bg-cyan-500 rounded-b-sm hover:opacity-80 transition-opacity"
                style={{ height: `${(item.values.study / maxValue) * 100}%` }}
              />
              <div
                className="w-full bg-fuchsia-500 hover:opacity-80 transition-opacity"
                style={{ height: `${(item.values.break / maxValue) * 100}%` }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p><span className="text-cyan-400">Study:</span> {formatTimeSummary(item.values.study)}</p>
                {item.values.break > 0 && <p><span className="text-fuchsia-400">Break:</span> {formatTimeSummary(item.values.break)}</p>}
              </div>
            </div>
            <span className="text-xs text-gray-400 mt-2">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;