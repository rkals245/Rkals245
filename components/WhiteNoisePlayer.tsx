import React, { useState, useRef, useEffect, useCallback } from 'react';

type SoundType = 'off' | 'noise' | 'fire' | 'waves';

const WhiteNoisePlayer: React.FC = () => {
  const [activeSound, setActiveSound] = useState<SoundType>('off');
  const [volume, setVolume] = useState(0.2);

  const audioContext = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const soundNodes = useRef<AudioNode[]>([]);
  const fireInterval = useRef<number | null>(null);


  const stopAllSounds = useCallback(() => {
    soundNodes.current.forEach(node => node.disconnect());
    soundNodes.current = [];
    if (fireInterval.current) {
      clearInterval(fireInterval.current);
      fireInterval.current = null;
    }
  }, []);

  const setupAudio = useCallback(() => {
    if (!audioContext.current) {
      try {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNode.current = audioContext.current.createGain();
        gainNode.current.connect(audioContext.current.destination);
      } catch (e) {
        console.error("Web Audio API is not supported in this browser");
        return;
      }
    }
    if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
    }
    if (gainNode.current) {
        gainNode.current.gain.setValueAtTime(volume, audioContext.current.currentTime);
    }
  },[volume]);


  useEffect(() => {
    if (!audioContext.current || !gainNode.current) return;
    
    stopAllSounds();

    if (activeSound === 'off') {
        if(audioContext.current.state === 'running') {
            audioContext.current.suspend();
        }
        return;
    }

    const bufferSize = 4096;
    const nodes: AudioNode[] = [];

    if (activeSound === 'noise') {
        let lastOut = 0.0;
        const node = audioContext.current.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = e => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; // (roughly) compensate for gain
            }
        };
        node.connect(gainNode.current!);
        nodes.push(node);
    }

    if (activeSound === 'fire') {
        // Low-frequency rumble
        let lastOut = 0.0;
        const rumbleNode = audioContext.current.createScriptProcessor(bufferSize, 1, 1);
        rumbleNode.onaudioprocess = e => {
            const output = e.outputBuffer.getChannelData(0);
             for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.1 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 2.5;
            }
        }
        
        const biquadFilter = audioContext.current.createBiquadFilter();
        biquadFilter.type = "lowpass";
        biquadFilter.frequency.setValueAtTime(150, audioContext.current.currentTime);
        
        rumbleNode.connect(biquadFilter);
        biquadFilter.connect(gainNode.current!);
        nodes.push(rumbleNode, biquadFilter);

        // Crackles
        fireInterval.current = window.setInterval(() => {
            if (!audioContext.current) return;
            const crackleSource = audioContext.current.createBufferSource();
            const crackleBuffer = audioContext.current.createBuffer(1, 2048, audioContext.current.sampleRate);
            const data = crackleBuffer.getChannelData(0);
            for(let i = 0; i < 2048; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            crackleSource.buffer = crackleBuffer;

            const crackleGain = audioContext.current.createGain();
            crackleGain.gain.setValueAtTime(Math.random() * 0.4, audioContext.current.currentTime);

            const crackleFilter = audioContext.current.createBiquadFilter();
            crackleFilter.type = 'highpass';
            crackleFilter.frequency.value = 2000;

            crackleSource.connect(crackleFilter).connect(crackleGain).connect(gainNode.current!);
            crackleSource.start();
            crackleSource.stop(audioContext.current.currentTime + 0.05 + Math.random() * 0.1);

        }, 200);
    }

    if (activeSound === 'waves') {
        let lastOut = 0.0;
        const noiseNode = audioContext.current.createScriptProcessor(bufferSize, 1, 1);
        noiseNode.onaudioprocess = e => { // Pink-ish noise
            const output = e.outputBuffer.getChannelData(0);
            let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11;
                b6 = white * 0.115926;
            }
        };

        const panner = audioContext.current.createStereoPanner();
        const lfo = audioContext.current.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.15;

        const lfoGain = audioContext.current.createGain();
        lfoGain.gain.value = 0.8;
        
        lfo.connect(lfoGain);
        lfoGain.connect(panner.pan);
        
        noiseNode.connect(panner);
        panner.connect(gainNode.current!);
        
        lfo.start();
        nodes.push(noiseNode, panner, lfo, lfoGain);
    }
    
    soundNodes.current = nodes;

  }, [activeSound, stopAllSounds]);

  const handleSoundChange = (sound: SoundType) => {
    setupAudio();
    setActiveSound(current => current === sound ? 'off' : sound);
  };
  
  useEffect(() => {
    if (gainNode.current && audioContext.current) {
      gainNode.current.gain.linearRampToValueAtTime(volume, audioContext.current.currentTime + 0.1);
    }
  }, [volume]);
  
  useEffect(() => {
    return () => {
        stopAllSounds();
        if(audioContext.current && audioContext.current.state !== 'closed') {
            audioContext.current.close();
        }
    }
  },[stopAllSounds]);

  const SoundButton = ({ type, emoji, label }: { type: SoundType, emoji: string, label: string }) => (
    <button 
        onClick={() => handleSoundChange(type)} 
        className={`flex flex-col items-center justify-center p-2 rounded-lg w-20 h-20 transition-colors ${activeSound === type ? 'bg-cyan-600' : 'bg-gray-600 hover:bg-gray-500'}`}
        aria-pressed={activeSound === type}
    >
        <span className="text-2xl" role="img" aria-label={label}>{emoji}</span>
        <span className="text-xs mt-1">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center space-y-3 bg-gray-700/50 p-3 rounded-lg w-full max-w-sm">
        <div className="flex items-center justify-center space-x-3">
            <SoundButton type="noise" emoji="〰️" label="Noise" />
            <SoundButton type="fire" emoji="🔥" label="Fireplace" />
            <SoundButton type="waves" emoji="🌊" label="Waves" />
        </div>
        <div className="flex items-center space-x-2 w-full px-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                aria-label="Volume"
            />
        </div>
    </div>
  );
};

export default WhiteNoisePlayer;