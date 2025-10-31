import React from 'react';
import { POSSIBLE_CHARACTERS } from '../utils/statsUtils';

interface CharacterDexModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedCharacters: string[];
  activeCharacterIsMaxLevel: boolean;
  onHatchNew: () => void;
}

const CHAR_EMOJIS: Record<string, string> = {
  dog: '🐕',
  cat: '🐈',
  fox: '🦊',
  bear: '🐻‍❄️',
  panda: '🐼',
  koala: '🐨',
  lion: '🦁',
  tiger: '🐅',
};

const CharacterDexModal: React.FC<CharacterDexModalProps> = ({ 
  isOpen, 
  onClose, 
  unlockedCharacters,
  activeCharacterIsMaxLevel,
  onHatchNew
}) => {
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
          aria-label="Close Character Dex"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-center mb-6">Character Collection</h2>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6">
          {POSSIBLE_CHARACTERS.map(charType => {
            const isUnlocked = unlockedCharacters.includes(charType);
            return (
              <div 
                key={charType}
                className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all ${isUnlocked ? 'bg-cyan-800/50' : 'bg-gray-700/50'}`}
              >
                <span className={`text-5xl ${isUnlocked ? '' : 'opacity-30 grayscale'}`}>
                  {CHAR_EMOJIS[charType] || '?'}
                </span>
                <p className={`mt-2 text-sm font-semibold capitalize ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                  {isUnlocked ? charType : '???'}
                </p>
              </div>
            );
          })}
        </div>
        
        {activeCharacterIsMaxLevel && (
            <div className="text-center">
                <p className="mb-4 text-gray-300">Your current buddy is fully grown! You can now hatch a new egg.</p>
                <button
                    onClick={onHatchNew}
                    className="px-6 py-3 bg-fuchsia-600 text-white font-bold rounded-lg hover:bg-fuchsia-700 transition-colors"
                >
                    Hatch a New Egg
                </button>
            </div>
        )}

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

export default CharacterDexModal;
