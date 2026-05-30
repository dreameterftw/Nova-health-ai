"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type Emotion = 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised' | 'neutral' | null;

interface EmotionDetectorProps {
  onEmotionChange: (emotion: Emotion, confidence: number) => void;
  active: boolean;
}

const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fearful: '😨',
  disgusted: '😒',
  surprised: '😲',
  neutral: '😐',
};

const EMOTION_COLORS: Record<string, string> = {
  happy: '#10B981',
  sad: '#3B82F6',
  angry: '#EF4444',
  fearful: '#8B5CF6',
  disgusted: '#F59E0B',
  surprised: '#FBBF24',
  neutral: '#64748B',
};

export const EmotionDetector = ({ onEmotionChange, active }: EmotionDetectorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error' | 'permission_denied'>('idle');
  const [emotion, setEmotion] = useState<Emotion>(null);
  const [confidence, setConfidence] = useState(0);
  const faceApiRef = useRef<any>(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      stopCamera();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmotion(null);
      setStatus('idle');
      return;
    }

    let cancelled = false;

    async function init() {
      setStatus('loading');
      try {
        const faceapi = await import('face-api.js');
        faceApiRef.current = faceapi;

        // Load models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        ]);

        if (cancelled) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus('ready');

        intervalRef.current = setInterval(async () => {
          if (!videoRef.current || !faceApiRef.current) return;

          const fa = faceApiRef.current;
          const result = await fa
            .detectSingleFace(videoRef.current, new fa.TinyFaceDetectorOptions())
            .withFaceExpressions();

          if (result?.expressions) {
            const scores = result.expressions as any;
            const entries = Object.entries(scores).sort((a: any, b: any) => b[1] - a[1]);
            const [topEmotion, topScore] = entries[0];
            
            const detected = topEmotion as Emotion;
            const conf = Math.round((topScore as number) * 100);
            
            setEmotion(detected);
            setConfidence(conf);
            onEmotionChange(detected, conf);
          } else {
            setEmotion(null);
            setConfidence(0);
          }
        }, 800);
      } catch (error: any) {
        console.error('EmotionDetector error:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setStatus('permission_denied');
        } else {
          setStatus('error');
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [active, onEmotionChange, stopCamera]);

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
      {/* Live Camera Feed */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        playsInline
        autoPlay
        style={{ transform: "scaleX(-1)" }}
      />
      
      <AnimatePresence>
        {status === 'loading' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md z-10"
          >
            <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
            <p className="text-white font-medium">Initializing AI Engine...</p>
            <p className="text-slate-400 text-xs mt-2">Loading neural models</p>
          </motion.div>
        )}

        {status === 'permission_denied' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md z-10 p-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
              <CameraOff size={32} className="text-rose-500" />
            </div>
            <p className="text-white font-bold text-lg">Camera Access Required</p>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">Please enable camera permissions in your browser to start the emotion monitor.</p>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md z-10 p-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
              <CameraOff size={32} className="text-rose-500" />
            </div>
            <p className="text-white font-bold text-lg">Camera Error</p>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">Unable to access camera. Please check your device settings.</p>
          </motion.div>
        )}

        {status === 'ready' && !emotion && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 backdrop-blur-md rounded-full border border-white/10 z-20"
          >
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">Scanning...</span>
          </motion.div>
        )}

        {status === 'ready' && emotion && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-20"
          >
            <span className="text-4xl">{EMOTION_EMOJI[emotion]}</span>
            <div className="flex flex-col">
              <span className="text-white font-black text-xl capitalize leading-tight">{emotion}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence}%` }}
                    className="h-full"
                    style={{ background: EMOTION_COLORS[emotion] }}
                  />
                </div>
                <span className="text-white/60 text-[10px] font-bold">{confidence}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
