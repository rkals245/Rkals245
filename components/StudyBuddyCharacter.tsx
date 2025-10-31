import React from 'react';
import { Character, AccessoryItem } from '../types';
import { SHOP_ITEMS } from '../utils/statsUtils';

interface StudyBuddyCharacterProps {
  character: Character | undefined;
  hatchingState: 'none' | 'shaking' | 'hatched';
}

const CHARACTERS: Record<string, string[]> = {
  egg: ['🥚', '🥚'],
  dog: ['🐶', '🐕'],
  cat: ['🐱', '🐈'],
  fox: ['🦊', '🦊'],
  bear: ['🐻', '🐻‍❄️'],
  panda: ['🐼', '🐼'],
  koala: ['🐨', '🐨'],
  lion: ['🦁', '🦁'],
  tiger: ['🐯', '🐅'],
};


const StudyBuddyCharacter: React.FC<StudyBuddyCharacterProps> = ({ character, hatchingState }) => {
  
  const getCharacterVisual = () => {
    if (!character) {
      return { emoji: '🥚', label: "Let's begin!", accessories: [] };
    }

    const charEmojis = CHARACTERS[character.type] || ['?', '?'];
    const equippedAccessories = character.accessories
      .map(id => SHOP_ITEMS.find(item => item.id === id))
      .filter((item): item is AccessoryItem => !!item);

    if (hatchingState === 'hatched') {
         return { emoji: charEmojis[0], label: "It's a " + character.type + "!", accessories: [] };
    }
    
    if (character.level === 0 || hatchingState === 'shaking') {
      return { emoji: charEmojis[0], label: "An egg!", accessories: [] };
    }
    if (character.level === 1) {
      return { emoji: charEmojis[0], label: "Hatched!", accessories: equippedAccessories };
    }
    if (character.level >= 2) {
      return { emoji: charEmojis[1], label: "Growing strong!", accessories: equippedAccessories };
    }

    return { emoji: '🥚', label: "Let's begin!", accessories: [] };
  };

  const { emoji, label, accessories } = getCharacterVisual();

  const getAnimationClass = () => {
    switch(hatchingState) {
        case 'shaking': return 'animate-shake';
        case 'hatched': return 'animate-pop-in';
        default: return 'animate-bounce-slow';
    }
  }

  const hat = accessories?.find(item => item.type === 'hat');
  const glasses = accessories?.find(item => item.type === 'glasses');

  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-500">
        <div className={`relative text-6xl w-20 h-20 flex items-center justify-center ${getAnimationClass()}`}>
            <span>{emoji}</span>
            {hat && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-5xl" style={{ textShadow: '0 2px 3px rgba(0,0,0,0.3)'}}>{hat.emoji}</span>
            )}
            {glasses && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl" style={{ textShadow: '0 2px 3px rgba(0,0,0,0.3)'}}>{glasses.emoji}</span>
            )}
        </div>
        <p className="text-xs text-gray-400 mt-2">{label}</p>
        <style>{`
            @keyframes bounce-slow {
                0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
                50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
            }
            .animate-bounce-slow { animation: bounce-slow 3s infinite; }

            @keyframes shake {
                0%, 100% { transform: translateX(0) rotate(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) rotate(-3deg); }
                20%, 40%, 60%, 80% { transform: translateX(4px) rotate(3deg); }
            }
            .animate-shake { animation: shake 0.5s infinite; }

            @keyframes pop-in {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); }
            }
            .animate-pop-in { animation: pop-in 0.5s ease-out forwards; }
        `}</style>
    </div>
  );
};

export default StudyBuddyCharacter;