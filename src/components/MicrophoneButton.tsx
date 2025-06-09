
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MicrophoneButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<void> {
    try {
      console.log('Requesting microphone access...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('Microphone access granted');

      // Check for supported MIME types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/mpeg',
        'audio/wav'
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('Selected MIME type:', selectedMimeType);
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No supported audio format found on this device');
      }
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available, size:', event.data.size);
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        throw new Error('Recording failed');
      };

      this.mediaRecorder.onstart = () => {
        console.log('MediaRecorder started successfully');
      };
      
      this.mediaRecorder.start(100); // Collect data every 100ms
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      this.cleanup();
      throw error;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      console.log('Stopping recording...');

      const timeout = setTimeout(() => {
        console.error('Recording stop timeout');
        this.cleanup();
        reject(new Error('Recording stop timeout'));
      }, 5000);

      this.mediaRecorder.onstop = () => {
        clearTimeout(timeout);
        console.log('Recording stopped, chunks:', this.audioChunks.length);
        
        if (this.audioChunks.length === 0) {
          this.cleanup();
          reject(new Error('No audio data recorded'));
          return;
        }

        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm' 
        });
        
        console.log('Audio blob created, size:', audioBlob.size);
        
        if (audioBlob.size === 0) {
          this.cleanup();
          reject(new Error('Empty audio recording'));
          return;
        }

        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (event) => {
        clearTimeout(timeout);
        console.error('Error during recording stop:', event);
        this.cleanup();
        reject(new Error('Recording failed'));
      };

      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      } else {
        clearTimeout(timeout);
        console.warn('MediaRecorder is not in recording state:', this.mediaRecorder.state);
        this.cleanup();
        reject(new Error('Recording is not active'));
      }
    });
  }

  private cleanup(): void {
    console.log('Cleaning up recorder...');
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.label);
      });
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('Converting blob to base64, size:', blob.size);
    
    if (blob.size === 0) {
      reject(new Error('Cannot convert empty blob to base64'));
      return;
    }

    const reader = new FileReader();
    
    const timeout = setTimeout(() => {
      console.error('Base64 conversion timeout');
      reject(new Error('Conversion timeout'));
    }, 10000);

    reader.onloadend = () => {
      clearTimeout(timeout);
      const base64String = reader.result as string;
      
      if (!base64String) {
        reject(new Error('Failed to convert audio to base64'));
        return;
      }

      const base64Content = base64String.split(',')[1];
      
      if (!base64Content) {
        reject(new Error('Invalid base64 data'));
        return;
      }

      console.log('Base64 conversion complete, length:', base64Content.length);
      resolve(base64Content);
    };
    
    reader.onerror = (error) => {
      clearTimeout(timeout);
      console.error('Error converting to base64:', error);
      reject(new Error('Failed to convert audio to base64'));
    };
    
    reader.readAsDataURL(blob);
  });
};

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ onTranscription, disabled }) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (recorderRef.current?.isRecording()) {
        recorderRef.current.stopRecording();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const checkMicrophonePermissions = async (): Promise<boolean> => {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state === 'granted';
    } catch (error) {
      console.log('Permission API not supported');
      return false;
    }
  };

  const handleStartRecording = async () => {
    try {
      console.log('Starting recording...');
      setMicrophoneError(null);
      setIsRecording(true);
      setRecordingDuration(0);
      
      const hasPermission = await checkMicrophonePermissions();
      if (!hasPermission) {
        console.log('Microphone permission not granted, requesting access...');
      }
      
      recorderRef.current = new AudioRecorder();
      await recorderRef.current.startRecording();
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      
      let errorMessage = "Failed to start recording. ";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Microphone access denied. Please allow microphone permissions and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No microphone found. Please connect a microphone and try again.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Microphone is being used by another application. Please close other apps and try again.";
        } else {
          errorMessage += error.message;
        }
      }
      
      setMicrophoneError(errorMessage);
      toast({
        title: "Microphone Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      setIsProcessing(true);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      if (!recorderRef.current) {
        throw new Error('No recorder available');
      }

      const audioBlob = await recorderRef.current.stopRecording();
      console.log('Audio recorded, converting to base64...');
      const base64Audio = await convertBlobToBase64(audioBlob);
      
      console.log('Sending to speech-to-text function...');
      
      // Using fetch directly to call the Supabase function
      const response = await fetch('https://xcdhkzlohmhhnoydhlwl.supabase.co/functions/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZGhremxvaG1oaG5veWRobHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjgzMjIsImV4cCI6MjA2NDI0NDMyMn0.aWYl553GyeI_lIRI_WjxJ7wvDAq-8e974dq0Al9PUnc'}`
        },
        body: JSON.stringify({ audio: base64Audio })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Speech-to-text error:', data);
        
        if (data.error?.includes('OpenAI API key not configured')) {
          toast({
            title: "Configuration Required",
            description: "OpenAI API key needs to be configured for speech-to-text feature.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: data.error || 'Failed to process audio. Please try again.',
            variant: "destructive"
          });
        }
        return;
      }

      if (data?.text && data.text.trim()) {
        onTranscription(data.text.trim());
        toast({
          title: "Speech recognized",
          description: "Text has been transcribed successfully",
        });
      } else {
        toast({
          title: "No speech detected",
          description: "Please try speaking more clearly",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process audio",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setRecordingDuration(0);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      {microphoneError && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2 max-w-xs">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-xs text-red-600">{microphoneError}</p>
        </div>
      )}
      
      <Button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={disabled || isProcessing}
        variant="outline"
        size="icon"
        className={`relative ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : ''}`}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {isRecording && (
        <div className="flex items-center justify-center mt-1 text-red-600">
          <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse mr-1"></div>
          <p className="text-xs font-medium">{formatRecordingTime(recordingDuration)}</p>
        </div>
      )}
      
      {isProcessing && (
        <p className="text-xs text-gray-600 mt-1">Processing...</p>
      )}
    </div>
  );
};

export default MicrophoneButton;
