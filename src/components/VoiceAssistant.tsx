import React, { useState, useRef } from 'react';
import { Mic, Square, Volume2, Loader2 } from 'lucide-react';

interface VoiceAssistantProps {
  onTranscript: (text: string) => void;
  onAudioGenerated?: (audioUrl: string) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onTranscript, onAudioGenerated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = processAudio;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
    setIsProcessing(true);
  };

  const processAudio = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result?.toString().split(',')[1];
      try {
        const response = await fetch('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64Audio, mimeType: 'audio/webm' }),
        });
        const data = await response.json();
        if (data.text) onTranscript(data.text);
      } catch (err) {
        console.error('Transcription error:', err);
      } finally {
        setIsProcessing(false);
      }
    };
  };

  return (
    <div className="flex items-center gap-2">
      {isProcessing ? (
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
      ) : (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2.5 rounded-full transition-colors cursor-pointer ${
            isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
          title={isRecording ? 'Stop recording' : 'Record voice'}
        >
          {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};
