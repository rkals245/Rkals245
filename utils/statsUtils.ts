import { StudySession, CharacterState, AccessoryItem } from '../types';
import { BreakSettingsData } from '../components/BreakSettings';

const SESSIONS_KEY = 'gemini-study-buddy-sessions';
export const GOAL_KEY = 'gemini-study-buddy-goal';
export const CHARACTER_KEY = 'gemini-study-buddy-character';
export const BREAK_SETTINGS_KEY = 'gemini-study-buddy-break-settings';

export const POSSIBLE_CHARACTERS = ['dog', 'cat', 'fox', 'bear', 'panda', 'koala', 'lion', 'tiger'];

export const SHOP_ITEMS: AccessoryItem[] = [
    { id: 'hat_1', name: 'Cowboy Hat', price: 100, type: 'hat', emoji: '🤠' },
    { id: 'hat_2', name: 'Top Hat', price: 150, type: 'hat', emoji: '🎩' },
    { id: 'hat_3', name: 'Crown', price: 500, type: 'hat', emoji: '👑' },
    { id: 'glasses_1', name: 'Sunglasses', price: 80, type: 'glasses', emoji: '😎' },
    { id: 'glasses_2', name: 'Monocle', price: 200, type: 'glasses', emoji: '🧐' },
];

export const calculateFocusCoins = (durationInSeconds: number): number => {
  const hours = durationInSeconds / 3600;
  return Math.floor(hours) * 10;
};

export const getSessions = (): StudySession[] => {
  try {
    const sessionsJson = localStorage.getItem(SESSIONS_KEY);
    if (!sessionsJson) return [];
    const sessions = JSON.parse(sessionsJson);
    // Ensure breakDuration exists for backward compatibility
    return sessions.map((s: any) => ({ ...s, breakDuration: s.breakDuration || 0 }));
  } catch (error) {
    console.error("Failed to parse study sessions from localStorage", error);
    return [];
  }
};

export const saveSession = (newSession: StudySession): void => {
  const sessions = getSessions();
  sessions.push(newSession);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const getCharacterState = (): CharacterState => {
  try {
    const stateJson = localStorage.getItem(CHARACTER_KEY);
    if (stateJson) {
      const state = JSON.parse(stateJson);
      return {
        ...state,
        ownedAccessoryIds: state.ownedAccessoryIds || [],
        focusCoins: state.focusCoins || 0,
      }
    }
  } catch (error) {
     console.error("Failed to parse character state from localStorage", error);
  }
  const initialId = `char_${Date.now()}`;
  return { 
      activeCharacterId: initialId,
      characters: [{ id: initialId, type: 'egg', level: 0, accessories: [] }],
      unlockedCharacters: [],
      ownedAccessoryIds: [],
      focusCoins: 0,
      goalMetDates: [] 
  };
};

export const saveCharacterState = (state: CharacterState): void => {
    localStorage.setItem(CHARACTER_KEY, JSON.stringify(state));
};

export const getDefaultBreakSettings = (): BreakSettingsData => {
    try {
        const settingsJson = localStorage.getItem(BREAK_SETTINGS_KEY);
        if (settingsJson) {
            return JSON.parse(settingsJson);
        }
    } catch (error) {
        console.error("Failed to parse break settings", error);
    }
    return {
        enabled: true,
        studyInterval: 25 * 60,
        breakDuration: 5 * 60,
    };
};


export const formatTimeSummary = (totalSeconds: number): string => {
  if (totalSeconds < 60) return `${Math.floor(totalSeconds)}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m`;
  return result.trim() || '0m';
};


export type ChartDataPoint = {
    label: string;
    values: { study: number; break: number };
};
export type ChartData = ChartDataPoint[];
export type ChartStats = {
    data: ChartData;
    total: { study: number; break: number };
};

const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

export const calculateTodayProgress = (sessions: StudySession[]): number => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return sessions.reduce((total, session) => {
        const sessionDate = new Date(session.startTime);
        if (sessionDate >= today) {
            return total + session.duration;
        }
        return total;
    }, 0);
};

export const calculateDailyStats = (sessions: StudySession[]): ChartStats => {
  const data: ChartData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ label: day, values: { study: 0, break: 0 } }));
  const total = { study: 0, break: 0 };
  const today = new Date();
  const startOfWeek = getStartOfWeek(today);
  startOfWeek.setHours(0, 0, 0, 0);

  sessions.forEach(session => {
    const sessionDate = new Date(session.startTime);
    if (sessionDate >= startOfWeek) {
      const dayIndex = (sessionDate.getDay() + 6) % 7;
      data[dayIndex].values.study += session.duration;
      data[dayIndex].values.break += session.breakDuration;
      total.study += session.duration;
      total.break += session.breakDuration;
    }
  });
  return { data, total };
};

export const calculateWeeklyStats = (sessions: StudySession[]): ChartStats => {
    const data: ChartData = ["3 wks ago", "2 wks ago", "Last week", "This week"].map(label => ({ label, value: 0, values: { study: 0, break: 0 } }));
    const total = { study: 0, break: 0 };
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const fourWeeksAgo = new Date(today);
    fourWeeksAgo.setDate(today.getDate() - 28);
    fourWeeksAgo.setHours(0, 0, 0, 0);
    
    sessions.forEach(session => {
        const sessionDate = new Date(session.startTime);
        if (sessionDate >= fourWeeksAgo) {
            const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 3600 * 24));
            const weekIndex = 3 - Math.floor(diffDays / 7);
            if(weekIndex >= 0 && weekIndex < 4) {
                data[weekIndex].values.study += session.duration;
                data[weekIndex].values.break += session.breakDuration;
            }
        }
    });
    data.forEach(d => {
        total.study += d.values.study;
        total.break += d.values.break;
    });
    return { data, total };
}

export const calculateMonthlyStats = (sessions: StudySession[]): ChartStats => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data: ChartData = [];
    const total = { study: 0, break: 0 };
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        data.push({ label: monthNames[d.getMonth()], values: { study: 0, break: 0 } });
    }
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    sixMonthsAgo.setHours(0,0,0,0);

    sessions.forEach(session => {
        const sessionDate = new Date(session.startTime);
        if (sessionDate >= sixMonthsAgo) {
            const monthIndex = 5 - ((today.getFullYear() - sessionDate.getFullYear()) * 12 + (today.getMonth() - sessionDate.getMonth()));
            if (monthIndex >= 0 && monthIndex < 6) {
                data[monthIndex].values.study += session.duration;
                data[monthIndex].values.break += session.breakDuration;
            }
        }
    });
    data.forEach(d => {
        total.study += d.values.study;
        total.break += d.values.break;
    });
    return { data, total };
}