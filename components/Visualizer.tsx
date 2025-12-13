import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
  color: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ stream, isActive, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!stream || !isActive || !canvasRef.current) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64; 
    analyserRef.current = analyser;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isActive) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const barWidth = (centerX / bufferLength) * 1.5;
      
      // Draw mirrored from center
      for (let i = 0; i < bufferLength; i++) {
        // Normalize value
        const value = dataArray[i] / 255;
        // Apply height scaling
        const barHeight = value * canvas.height * 0.8;
        
        // Dynamic opacity based on height
        const opacity = 0.5 + (value * 0.5);
        canvasCtx.fillStyle = color;
        canvasCtx.globalAlpha = opacity;

        // Right side
        const xRight = centerX + (i * (barWidth + 1));
        const y = (canvas.height - barHeight) / 2; // Vertically centered
        
        canvasCtx.beginPath();
        canvasCtx.roundRect(xRight, y, barWidth, barHeight, 20);
        canvasCtx.fill();

        // Left side (mirrored)
        const xLeft = centerX - (i * (barWidth + 1)) - barWidth;
        canvasCtx.beginPath();
        canvasCtx.roundRect(xLeft, y, barWidth, barHeight, 20);
        canvasCtx.fill();
      }
      
      canvasCtx.globalAlpha = 1.0;
    };

    draw();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
    };
  }, [stream, isActive, color]);

  // Handle clearing when inactive
  useEffect(() => {
    if (!isActive && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={100} 
      className="w-full h-full"
    />
  );
};

export default Visualizer;