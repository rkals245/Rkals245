export interface StudySession {
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number; // in seconds
  breakDuration: number; // in seconds
}

export interface AccessoryItem {
  id: string;
  name: string;
  price: number;
  type: 'hat' | 'glasses';
  emoji: string;
}

export interface Character {
  id: string; // Unique ID for this instance of a character
  type: string; // e.g., 'dog', 'cat'
  level: number; // 0 for unhatched, 1 for baby, 2 for grown
  accessories: string[]; // Array of AccessoryItem IDs
}

export interface CharacterState {
  activeCharacterId: string | null;
  characters: Character[];
  unlockedCharacters: string[]; // List of character types that have been fully grown
  ownedAccessoryIds: string[];
  focusCoins: number;
  goalMetDates: string[]; // Store 'YYYY-MM-DD'
}


// FIX: Add missing Speaker and Transcript types for Transcription component.
export enum Speaker {
  USER = 'USER',
  MODEL = 'MODEL',
}

export interface Transcript {
  speaker: Speaker;
  text: string;
  isFinal: boolean;
}