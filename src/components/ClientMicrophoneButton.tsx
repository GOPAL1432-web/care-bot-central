
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClientSpeechRecognition } from '@/utils/SpeechRecognition';

interface ClientMicrophoneButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

const ClientMicrophoneButton: React.FC<ClientMicrophoneButtonProps> = ({ 
  onTranscription, 
  disabled 
}) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const speechRecognition = useRef<ClientSpeechRecognition | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    if (!ClientSpeechRecognition.isSupported()) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      speechRecognition.current = new ClientSpeechRecognition();
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setIsSupported(false);
      setError('Failed to initialize speech recognition');
    }

    return () => {
      if (speechRecognition.current?.isCurrentlyListening()) {
        speechRecognition.current.stopListening();
      }
    };
  }, []);

  const handleStartListening = async () => {
    if (!speechRecognition.current || !isSupported) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not available in this browser",
        variant: "destructive"
      });
      return;
    }

    try {
      setError(null);
      setIsListening(true);
      
      toast({
        title: "Listening...",
        description: "Speak now. The microphone is active.",
      });

      const transcript = await speechRecognition.current.startListening();
      
      if (transcript) {
        onTranscription(transcript);
        toast({
          title: "Speech Recognized",
          description: "Your speech has been converted to text successfully!",
        });
      }
    } catch (error) {
      console.error('Speech recognition error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to recognize speech';
      setError(errorMessage);
      
      toast({
        title: "Speech Recognition Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    if (speechRecognition.current?.isCurrentlyListening()) {
      speechRecognition.current.stopListening();
      setIsListening(false);
      
      toast({
        title: "Stopped Listening",
        description: "Microphone has been turned off",
      });
    }
  };

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center">
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2 max-w-xs">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
        <Button
          disabled
          variant="outline"
          size="icon"
          className="opacity-50"
        >
          <MicOff className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2 max-w-xs">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
      
      <Button
        onClick={isListening ? handleStopListening : handleStartListening}
        disabled={disabled}
        variant="outline"
        size="icon"
        className={`relative ${isListening ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' : ''}`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {isListening && (
        <div className="flex items-center justify-center mt-1 text-red-600">
          <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse mr-1"></div>
          <p className="text-xs font-medium">Listening...</p>
        </div>
      )}
    </div>
  );
};

export default ClientMicrophoneButton;
