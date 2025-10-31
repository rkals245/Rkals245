import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { StudySession, CharacterState, Character } from './types';
import {
    saveSession,
    getSessions,
    calculateTodayProgress,
    formatTimeSummary,
    GOAL_KEY,
    getCharacterState,
    saveCharacterState,
    POSSIBLE_CHARACTERS,
    calculateFocusCoins,
    BREAK_SETTINGS_KEY,
    getDefaultBreakSettings,
} from './utils/statsUtils';
import Timer from './components/Timer';
import StatsModal from './components/StatsModal';
import StudyBuddyCharacter from './components/StudyBuddyCharacter';
import WhiteNoisePlayer from './components/WhiteNoisePlayer';
import CharacterDexModal from './components/CharacterDexModal';
import CharacterCustomizationModal from './components/CharacterCustomizationModal';
import BreakSettings, { BreakSettingsData } from './components/BreakSettings';

type SessionStatus = 'idle' | 'studying' | 'on_break';

const App: React.FC = () => {
    const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    
    const [studyTimeInSession, setStudyTimeInSession] = useState(0);
    const [breakTimeInSession, setBreakTimeInSession] = useState(0);
    const [timerDisplaySeconds, setTimerDisplaySeconds] = useState(0);

    const [timeToNextBreak, setTimeToNextBreak] = useState(0);
    const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);

    const [studySessions, setStudySessions] = useState<StudySession[]>([]);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [isDexModalOpen, setIsDexModalOpen] = useState(false);
    const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);

    const [dailyGoal, setDailyGoal] = useState(0);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState({ hours: '', minutes: ''});
    const [characterState, setCharacterState] = useState<CharacterState>(getCharacterState());
    const [breakSettings, setBreakSettings] = useState<BreakSettingsData>(getDefaultBreakSettings());

    const [hatchingState, setHatchingState] = useState<'none' | 'shaking' | 'hatched'>('none');


    const timerInterval = useRef<number | null>(null);
    const sessionStartTime = useRef<Date | null>(null);
    
    useEffect(() => {
        setStudySessions(getSessions());
        setCharacterState(getCharacterState());
        setBreakSettings(getDefaultBreakSettings());
        const savedGoal = localStorage.getItem(GOAL_KEY);
        if (savedGoal) {
            const goalInSeconds = parseInt(savedGoal, 10);
            setDailyGoal(goalInSeconds);
             setGoalInput({
                hours: Math.floor(goalInSeconds / 3600).toString(),
                minutes: Math.floor((goalInSeconds % 3600) / 60).toString()
            });
        }
    }, []);

    const activeCharacter = useMemo(() => {
        return characterState.characters.find(c => c.id === characterState.activeCharacterId);
    }, [characterState]);

    const todayProgress = useMemo(() => calculateTodayProgress(studySessions), [studySessions]);

    useEffect(() => {
        const playSound = (freq = 523, duration = 100) => {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            gainNode.gain.value = 0.1;
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            oscillator.start();
            setTimeout(() => oscillator.stop(), duration);
        };

        const tick = () => {
            setSessionStatus(currentStatus => {
                if (currentStatus === 'studying') {
                    setStudyTimeInSession(t => {
                        const newTime = t + 1;
                        setTimerDisplaySeconds(newTime);
                        return newTime;
                    });
                    
                    if (breakSettings.enabled) {
                        setTimeToNextBreak(t => {
                            const newT = t - 1;
                            if (newT <= 0) {
                                playSound(650);
                                setBreakTimeRemaining(breakSettings.breakDuration);
                                setTimerDisplaySeconds(breakSettings.breakDuration);
                                return 0;
                            }
                            return newT;
                        });
                        // Transition to break
                        if (timeToNextBreak <= 1) return 'on_break';
                    }
                } else if (currentStatus === 'on_break') {
                    setBreakTimeInSession(t => t + 1);
                    setBreakTimeRemaining(t => {
                        const newT = t - 1;
                         setTimerDisplaySeconds(newT);
                        if (newT <= 0) {
                            playSound(523);
                             setTimeToNextBreak(breakSettings.studyInterval);
                            return 0;
                        }
                        return newT;
                    });
                    // Transition to studying
                    if (breakTimeRemaining <= 1) return 'studying';
                }
                return currentStatus;
            });
        };

        if (sessionStatus !== 'idle') {
            timerInterval.current = window.setInterval(tick, 1000);
        } else {
            if (timerInterval.current) clearInterval(timerInterval.current);
        }

        return () => {
            if (timerInterval.current) clearInterval(timerInterval.current);
        };
    }, [sessionStatus, breakSettings, timeToNextBreak, breakTimeRemaining]);

    
    const updateCharacterOnGoalMet = useCallback(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        let currentState = getCharacterState();

        if (currentState.goalMetDates.includes(todayStr)) return;

        const charToUpdate = currentState.characters.find(c => c.id === currentState.activeCharacterId);

        if (charToUpdate && charToUpdate.level === 0) {
            setHatchingState('shaking');
            setTimeout(() => {
                let newState = getCharacterState();
                if (!newState.goalMetDates.includes(todayStr)) {
                    newState.goalMetDates.push(todayStr);
                }
                const charIndex = newState.characters.findIndex(c => c.id === newState.activeCharacterId);
                if (charIndex !== -1) {
                    const available = POSSIBLE_CHARACTERS.filter(c => !newState.unlockedCharacters.includes(c));
                    const randomType = available.length > 0
                        ? available[Math.floor(Math.random() * available.length)]
                        : POSSIBLE_CHARACTERS[Math.floor(Math.random() * POSSIBLE_CHARACTERS.length)];
                    
                    newState.characters[charIndex].level = 1;
                    newState.characters[charIndex].type = randomType;
                }
                saveCharacterState(newState);
                setCharacterState(newState);
                setHatchingState('hatched');
                setTimeout(() => setHatchingState('none'), 1500);
            }, 2500);
        } else {
            // Non-hatching growth logic
            let newState = getCharacterState();
            if (!newState.goalMetDates.includes(todayStr)) {
                newState.goalMetDates.push(todayStr);
            }
            const charIndex = newState.characters.findIndex(c => c.id === newState.activeCharacterId);
            if (charIndex !== -1 && newState.characters[charIndex].level === 1) {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const recentSuccesses = newState.goalMetDates.filter(dateStr => new Date(dateStr) >= sevenDaysAgo).length;
                if (recentSuccesses >= 5) {
                    newState.characters[charIndex].level = 2;
                    if (!newState.unlockedCharacters.includes(newState.characters[charIndex].type)) {
                        newState.unlockedCharacters.push(newState.characters[charIndex].type);
                    }
                }
            }
            saveCharacterState(newState);
            setCharacterState(newState);
        }
    }, []);


    const handleSaveSession = useCallback(() => {
        if (studyTimeInSession > 0 && sessionStartTime.current) {
            const endTime = new Date();
            const newSession: StudySession = {
                startTime: sessionStartTime.current.toISOString(),
                endTime: endTime.toISOString(),
                duration: studyTimeInSession,
                breakDuration: breakTimeInSession,
            };
            
            const newTotalProgress = calculateTodayProgress(getSessions()) + newSession.duration;

            saveSession(newSession);
            setStudySessions(getSessions());

            const coinsEarned = calculateFocusCoins(newSession.duration);
            if (coinsEarned > 0) {
                 setCharacterState(prevState => {
                    const newState = {...prevState, focusCoins: prevState.focusCoins + coinsEarned};
                    saveCharacterState(newState);
                    return newState;
                });
            }

            if (dailyGoal > 0 && newTotalProgress >= dailyGoal && (newTotalProgress - newSession.duration) < dailyGoal) {
                 updateCharacterOnGoalMet();
            }
        }
    }, [studyTimeInSession, breakTimeInSession, dailyGoal, updateCharacterOnGoalMet]);

    const startSession = () => {
        sessionStartTime.current = new Date();
        setStudyTimeInSession(0);
        setBreakTimeInSession(0);
        setTimerDisplaySeconds(0);
        if(breakSettings.enabled) {
            setTimeToNextBreak(breakSettings.studyInterval);
        }
        setSessionStatus('studying');
    };

    const endSession = () => {
        handleSaveSession();
        setSessionStatus('idle');
    };

    const handleReset = () => {
        if (sessionStatus !== 'idle') return;
        setStudyTimeInSession(0);
        setBreakTimeInSession(0);
        setTimerDisplaySeconds(0);
        sessionStartTime.current = null;
    };

    const handleSetGoal = () => {
        const hours = parseInt(goalInput.hours, 10) || 0;
        const minutes = parseInt(goalInput.minutes, 10) || 0;
        const totalSeconds = (hours * 3600) + (minutes * 60);

        if (totalSeconds > 0) {
            setDailyGoal(totalSeconds);
            localStorage.setItem(GOAL_KEY, totalSeconds.toString());
            setIsEditingGoal(false);
        }
    };
    
    const handleHatchNew = () => {
        const newState = {...characterState};
        const newId = `char_${Date.now()}`;
        newState.characters.push({ id: newId, type: 'egg', level: 0, accessories: [] });
        newState.activeCharacterId = newId;
        saveCharacterState(newState);
        setCharacterState(newState);
        setIsDexModalOpen(false);
    };

    const handleBuyAccessory = (item) => {
        if (characterState.focusCoins >= item.price && !characterState.ownedAccessoryIds.includes(item.id)) {
            setCharacterState(prev => {
                const newState = {
                    ...prev,
                    focusCoins: prev.focusCoins - item.price,
                    ownedAccessoryIds: [...prev.ownedAccessoryIds, item.id]
                };
                saveCharacterState(newState);
                return newState;
            })
        }
    };

    const handleToggleAccessory = (itemId) => {
        if (!activeCharacter) return;
        
        setCharacterState(prev => {
            const charIndex = prev.characters.findIndex(c => c.id === activeCharacter.id);
            if (charIndex === -1) return prev;
            const charToUpdate = { ...prev.characters[charIndex] };
            const accessoryIndex = charToUpdate.accessories.indexOf(itemId);
            if (accessoryIndex > -1) {
                charToUpdate.accessories.splice(accessoryIndex, 1);
            } else {
                charToUpdate.accessories.push(itemId);
            }
            const newCharacters = [...prev.characters];
            newCharacters[charIndex] = charToUpdate;
            const newState = { ...prev, characters: newCharacters };
            saveCharacterState(newState);
            return newState;
        })
    };

    const handleBreakSettingsChange = (newSettings: BreakSettingsData) => {
        setBreakSettings(newSettings);
        localStorage.setItem(BREAK_SETTINGS_KEY, JSON.stringify(newSettings));
    };
    
    const handleSkipBreak = () => {
        setSessionStatus('studying');
        setTimeToNextBreak(breakSettings.studyInterval);
        setTimerDisplaySeconds(studyTimeInSession);
    };

    const getButtonState = () => {
        if (sessionStatus === 'studying') return { text: 'Stop Studying', action: endSession, bg: 'bg-red-500 hover:bg-red-600' };
        if (sessionStatus === 'on_break') return { text: 'Skip Break', action: handleSkipBreak, bg: 'bg-green-500 hover:bg-green-600' };
        return { text: 'Start Studying', action: startSession, bg: 'bg-cyan-500 hover:bg-cyan-600' };
    };

    const buttonState = getButtonState();
    const isSessionActive = sessionStatus !== 'idle';
    const progressPercentage = dailyGoal > 0 ? Math.min((todayProgress / dailyGoal) * 100, 100) : 0;
    
    const GrowthStatus = () => {
        if (!activeCharacter) return null;
        if (hatchingState !== 'none') return <p className="text-xs text-yellow-300 animate-pulse">Something is happening...!</p>;
        if (activeCharacter.level === 0) return <p className="text-xs text-gray-400">Meet today's goal to hatch your egg!</p>
        if (activeCharacter.level === 1) {
             const sevenDaysAgo = new Date();
             sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
             const recentSuccesses = characterState.goalMetDates.filter(dateStr => new Date(dateStr) >= sevenDaysAgo).length;
             return <p className="text-xs text-gray-400">Growth: Met goal on <span className="font-bold text-cyan-300">{recentSuccesses}/5</span> days this week.</p>
        }
        if (activeCharacter.level >= 2) return <p className="text-xs text-green-400 font-semibold">Fully grown! Open the Dex to start a new journey.</p>
        return null;
    }

    return (
        <>
            <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-4 font-sans">
                <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-4">
                    <header className="flex flex-col items-center space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold">Gemini Study Buddy</h1>
                        <p className="text-lg text-gray-400">Your focus partner.</p>
                    </header>
                     <div className="absolute top-4 right-4 bg-gray-800 p-2 rounded-lg shadow-md flex items-center">
                        <span className="text-yellow-400 text-xl">💰</span>
                        <span className="ml-2 font-bold text-lg">{characterState.focusCoins}</span>
                    </div>
                    
                    <div className="w-full bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl p-6 flex flex-col items-center space-y-6">
                        {sessionStatus === 'on_break' && <p className="text-2xl font-bold text-fuchsia-400">Break Time!</p>}
                        <Timer seconds={timerDisplaySeconds} />

                        <div className="w-full bg-gray-700/50 p-4 rounded-lg">
                           {(dailyGoal === 0 || isEditingGoal) ? (
                                <div className="flex flex-col items-center space-y-3">
                                    <p className="font-semibold">Set your daily goal:</p>
                                    <div className="flex items-center space-x-2">
                                        <input type="number" min="0" value={goalInput.hours} onChange={(e) => setGoalInput({...goalInput, hours: e.target.value})} className="w-16 bg-gray-800 text-center rounded p-1" placeholder="H" />
                                        <span>:</span>
                                         <input type="number" min="0" max="59" value={goalInput.minutes} onChange={(e) => setGoalInput({...goalInput, minutes: e.target.value})} className="w-16 bg-gray-800 text-center rounded p-1" placeholder="M" />
                                    </div>
                                    <button onClick={handleSetGoal} className="px-4 py-1 bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors">Set Goal</button>
                                </div>
                           ) : (
                                <div className="flex items-center space-x-4">
                                    <StudyBuddyCharacter character={activeCharacter} hatchingState={hatchingState} />
                                    <div className="flex-grow text-left">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <p className="font-bold text-lg">Today's Goal</p>
                                            <button onClick={() => setIsEditingGoal(true)} className="text-xs text-cyan-400 hover:underline">Edit</button>
                                        </div>
                                        <div className="w-full bg-gray-600 rounded-full h-4">
                                            <div className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 h-4 rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <p className="text-left text-sm mt-1 text-gray-300">{formatTimeSummary(todayProgress)} / {formatTimeSummary(dailyGoal)}</p>
                                          <GrowthStatus />
                                        </div>
                                    </div>
                                </div>
                           )}
                        </div>
                        <BreakSettings settings={breakSettings} onSettingsChange={handleBreakSettingsChange} isSessionActive={isSessionActive} />
                        <WhiteNoisePlayer />
                    </div>

                    {error && <p className="text-red-400 mt-4">{error}</p>}
                    
                    <div className="flex flex-col items-center space-y-4">
                        <button
                            onClick={buttonState.action}
                            className={`w-48 h-48 rounded-full ${buttonState.bg} text-white font-bold text-2xl flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-300`}
                        >
                            {buttonState.text}
                        </button>

                        {sessionStatus === 'on_break' && (
                            <button onClick={endSession} className="text-red-400 hover:underline">End Session</button>
                        )}

                        <div className="flex flex-wrap justify-center gap-4">
                             <button onClick={() => setIsCustomizationModalOpen(true)} disabled={isSessionActive} className="px-6 py-2 bg-gray-700 text-yellow-300 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Customize</button>
                            <button onClick={() => setIsStatsModalOpen(true)} disabled={isSessionActive} className="px-6 py-2 bg-gray-700 text-cyan-300 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Statistics</button>
                             <button onClick={() => setIsDexModalOpen(true)} disabled={isSessionActive} className="px-6 py-2 bg-gray-700 text-fuchsia-300 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Character Dex</button>
                        </div>
                         <button onClick={handleReset} disabled={isSessionActive || timerDisplaySeconds !== 0} className="px-6 py-2 bg-gray-700 text-red-400 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Reset Timer</button>
                    </div>
                </div>
            </div>
            <StatsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} sessions={studySessions} />
             <CharacterDexModal isOpen={isDexModalOpen} onClose={() => setIsDexModalOpen(false)} unlockedCharacters={characterState.unlockedCharacters} activeCharacterIsMaxLevel={activeCharacter?.level === 2} onHatchNew={handleHatchNew} />
             <CharacterCustomizationModal isOpen={isCustomizationModalOpen} onClose={() => setIsCustomizationModalOpen(false)} characterState={characterState} activeCharacter={activeCharacter} onBuy={handleBuyAccessory} onToggleEquip={handleToggleAccessory} />
        </>
    );
};

export default App;