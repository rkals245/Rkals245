import React from 'react';

export interface BreakSettingsData {
  enabled: boolean;
  studyInterval: number; // in seconds
  breakDuration: number; // in seconds
}

interface BreakSettingsProps {
  settings: BreakSettingsData;
  onSettingsChange: (newSettings: BreakSettingsData) => void;
  isSessionActive: boolean;
}

const studyIntervals = [
    { label: '25 min', value: 25 * 60 },
    { label: '50 min', value: 50 * 60 },
    { label: '1 hour', value: 60 * 60 },
];

const breakDurations = [
    { label: '5 min', value: 5 * 60 },
    { label: '10 min', value: 10 * 60 },
    { label: '15 min', value: 15 * 60 },
];

const BreakSettings: React.FC<BreakSettingsProps> = ({ settings, onSettingsChange, isSessionActive }) => {
  return (
    <div className="w-full bg-gray-700/50 p-4 rounded-lg mt-4 space-y-3">
        <div className="flex items-center justify-between">
            <label htmlFor="break-enabled" className="font-semibold">Enable Automatic Breaks</label>
            <input
                id="break-enabled"
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => onSettingsChange({ ...settings, enabled: e.target.checked })}
                disabled={isSessionActive}
                className="w-5 h-5 rounded text-cyan-500 bg-gray-600 border-gray-500 focus:ring-cyan-600"
            />
        </div>
        {settings.enabled && (
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 w-full">
                    <label htmlFor="study-interval" className="text-sm text-gray-300 block mb-1">Study For</label>
                    <select
                        id="study-interval"
                        value={settings.studyInterval}
                        onChange={(e) => onSettingsChange({ ...settings, studyInterval: parseInt(e.target.value, 10) })}
                        disabled={isSessionActive}
                        className="w-full bg-gray-800 rounded p-2 focus:ring-2 focus:ring-cyan-500 border-transparent"
                    >
                        {studyIntervals.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="flex-1 w-full">
                    <label htmlFor="break-duration" className="text-sm text-gray-300 block mb-1">Break For</label>
                     <select
                        id="break-duration"
                        value={settings.breakDuration}
                        onChange={(e) => onSettingsChange({ ...settings, breakDuration: parseInt(e.target.value, 10) })}
                        disabled={isSessionActive}
                        className="w-full bg-gray-800 rounded p-2 focus:ring-2 focus:ring-cyan-500 border-transparent"
                    >
                        {breakDurations.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>
        )}
    </div>
  );
};

export default BreakSettings;
