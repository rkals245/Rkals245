import React, { useState, useMemo } from 'react';
import { StudySession } from '../types';
import BarChart from './BarChart';
import {
  calculateDailyStats,
  calculateWeeklyStats,
  calculateMonthlyStats,
  formatTimeSummary,
  ChartStats,
} from '../utils/statsUtils';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: StudySession[];
}

type View = 'daily' | 'weekly' | 'monthly';

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, sessions }) => {
  const [view, setView] = useState<View>('daily');

  const stats: ChartStats = useMemo(() => {
    switch (view) {
      case 'daily':
        return calculateDailyStats(sessions);
      case 'weekly':
        return calculateWeeklyStats(sessions);
      case 'monthly':
        return calculateMonthlyStats(sessions);
      default:
        return { data: [], total: { study: 0, break: 0 } };
    }
  }, [view, sessions]);
  
  const titleMap: Record<View, string> = {
      daily: "This Week's Activity",
      weekly: "Last 4 Weeks' Activity",
      monthly: "Last 6 Months' Activity",
  }

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 text-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close statistics"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-center mb-6">Your Study Statistics</h2>
        
        <div className="flex justify-center mb-6 bg-gray-700/50 p-1 rounded-lg">
          {(['daily', 'weekly', 'monthly'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize w-24 ${view === v ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
            >
              {v}
            </button>
          ))}
        </div>
        
        <div className="space-y-4">
           <div className="text-center text-gray-400">
                <p>Total Study: <span className="font-bold text-cyan-300">{formatTimeSummary(stats.total.study)}</span></p>
                {stats.total.break > 0 && <p>Total Break: <span className="font-bold text-fuchsia-300">{formatTimeSummary(stats.total.break)}</span></p>}
            </div>
           <BarChart data={stats.data} title={titleMap[view]} />
        </div>
      </div>
       <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
          }
       `}</style>
    </div>
  );
};

export default StatsModal;