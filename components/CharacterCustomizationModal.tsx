import React, { useState } from 'react';
import { CharacterState, Character } from '../types';
import { SHOP_ITEMS } from '../utils/statsUtils';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterState: CharacterState;
  activeCharacter: Character | undefined;
  onBuy: (item: typeof SHOP_ITEMS[0]) => void;
  onToggleEquip: (itemId: string) => void;
}

type View = 'shop' | 'wardrobe';

const CharacterCustomizationModal: React.FC<CustomizationModalProps> = ({ 
  isOpen, 
  onClose, 
  characterState, 
  activeCharacter, 
  onBuy, 
  onToggleEquip 
}) => {
  const [view, setView] = useState<View>('shop');

  if (!isOpen) return null;

  const renderShop = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {SHOP_ITEMS.map(item => {
        const isOwned = characterState.ownedAccessoryIds.includes(item.id);
        const canAfford = characterState.focusCoins >= item.price;
        return (
          <div key={item.id} className="bg-gray-700/50 p-4 rounded-lg flex flex-col items-center text-center">
            <span className="text-5xl">{item.emoji}</span>
            <p className="font-semibold mt-2">{item.name}</p>
            <div className="flex items-center text-yellow-400 mt-1">
              <span className="mr-1">💰</span>
              <span>{item.price}</span>
            </div>
            <button
              onClick={() => onBuy(item)}
              disabled={isOwned || !canAfford}
              className="mt-3 px-4 py-1 text-sm rounded-lg transition-colors w-full disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400 bg-cyan-600 hover:bg-cyan-700"
            >
              {isOwned ? 'Owned' : 'Buy'}
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderWardrobe = () => (
    <div>
        {characterState.ownedAccessoryIds.length === 0 ? (
            <p className="text-center text-gray-400">You don't own any accessories. Visit the shop to buy some!</p>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {SHOP_ITEMS.filter(i => characterState.ownedAccessoryIds.includes(i.id)).map(item => {
                    const isEquipped = activeCharacter?.accessories.includes(item.id);
                    return (
                        <div key={item.id} className="bg-gray-700/50 p-4 rounded-lg flex flex-col items-center text-center">
                            <span className="text-5xl">{item.emoji}</span>
                            <p className="font-semibold mt-2">{item.name}</p>
                            <button
                                onClick={() => onToggleEquip(item.id)}
                                disabled={!activeCharacter || activeCharacter.level === 0}
                                className={`mt-3 px-4 py-1 text-sm rounded-lg transition-colors w-full ${isEquipped ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} disabled:bg-gray-600 disabled:cursor-not-allowed`}
                            >
                                {isEquipped ? 'Unequip' : 'Equip'}
                            </button>
                        </div>
                    );
                })}
            </div>
        )}
        {activeCharacter?.level === 0 && <p className="text-center text-gray-400 mt-4 text-sm">You can't equip items on an egg!</p>}
    </div>
  );


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
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Customize</h2>
             <div className="bg-gray-900 p-2 rounded-lg shadow-inner flex items-center">
                <span className="text-yellow-400 text-lg">💰</span>
                <span className="ml-2 font-semibold">{characterState.focusCoins}</span>
            </div>
        </div>
        
        <div className="flex justify-center mb-6 bg-gray-700/50 p-1 rounded-lg">
          {(['shop', 'wardrobe'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize w-28 ${view === v ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
            >
              {v}
            </button>
          ))}
        </div>
        
        <div>
           {view === 'shop' ? renderShop() : renderWardrobe()}
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

export default CharacterCustomizationModal;
