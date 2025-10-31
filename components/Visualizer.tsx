
import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  isSessionActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyserNode, isSessionActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // FIX: Initialize useRef with null to satisfy the requirement of providing an initial value. This resolves the "Expected 1 arguments, but got 0" error, likely due to a strict configuration.
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserNode) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    analyserNode.fftSize = 256;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyserNode.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        
        const r = barHeight + 50 * (i/bufferLength);
        const g = 150 * (i/bufferLength);
        const b = 200;

        canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };

    if (isSessionActive) {
      draw();
    } else {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        // FIX: Check against null to ensure cancelAnimationFrame is called even if the animation frame ID is 0 (which is a valid ID).
        if(animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    }

    return () => {
      // FIX: Check against null to ensure cancelAnimationFrame is called even if the animation frame ID is 0.
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isSessionActive]);

  return <canvas ref={canvasRef} width="300" height="100" className="w-full max-w-sm" />;
};

export default Visualizer;
