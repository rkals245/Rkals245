
import React, { useRef, useEffect } from 'react';
import { Transcript, Speaker } from '../types';

interface TranscriptionProps {
  transcripts: Transcript[];
}

const Transcription: React.FC<TranscriptionProps> = ({ transcripts }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <div className="w-full flex-grow bg-gray-800/50 rounded-lg p-4 space-y-4 overflow-y-auto min-h-[200px] md:min-h-[300px]">
      {transcripts.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>Your conversation will appear here...</p>
        </div>
      )}
      {transcripts.map((t, index) => (
        <div key={index} className={`flex flex-col ${t.speaker === Speaker.USER ? 'items-end' : 'items-start'}`}>
          <div className={`text-xs font-bold mb-1 ${t.speaker === Speaker.USER ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
            {t.speaker === Speaker.USER ? 'You' : 'Study Buddy'}
          </div>
          <div className={`rounded-lg px-4 py-2 max-w-xs md:max-w-md lg:max-w-lg break-words ${t.speaker === Speaker.USER ? 'bg-cyan-600/50' : 'bg-fuchsia-600/50'}`}>
            <p className={`${!t.isFinal ? 'opacity-70' : ''}`}>{t.text}</p>
          </div>
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default Transcription;
