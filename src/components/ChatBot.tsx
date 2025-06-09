import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VoiceRecorder, convertBlobToBase64 } from '@/utils/VoiceRecorder';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface HealthInfo {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string;
}

const ChatBot: React.FC = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [healthInformation, setHealthInformation] = useState<HealthInfo[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load health information for AI responses
  useEffect(() => {
    loadHealthInformation();
  }, []);

  // Load chat history when component mounts
  useEffect(() => {
    if (user) {
      loadChatHistory();
    } else {
      // Set initial bot message for non-authenticated users
      setMessages([{
        id: '1',
        text: 'Hello! I\'m your AI healthcare assistant. How can I help you today?',
        isBot: true,
        timestamp: new Date()
      }]);
    }
  }, [user]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    voiceRecorderRef.current = new VoiceRecorder();
    return () => {
      if (voiceRecorderRef.current?.isRecording()) {
        voiceRecorderRef.current.stopRecording();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const loadHealthInformation = async () => {
    try {
      // Use type assertion to bypass TypeScript issues until types are regenerated
      const { data, error } = await (supabase as any)
        .from('health_information')
        .select('*');

      if (error) throw error;
      setHealthInformation(data || []);
    } catch (error) {
      console.error('Error loading health information:', error);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          text: msg.message,
          isBot: msg.is_bot,
          timestamp: new Date(msg.created_at)
        }));
        setMessages(loadedMessages);
      } else {
        // If no chat history, add initial bot message
        const initialMessage = {
          id: '1',
          text: 'Hello! I\'m your AI healthcare assistant. How can I help you today?',
          isBot: true,
          timestamp: new Date()
        };
        setMessages([initialMessage]);
        await saveMessageToDatabase(initialMessage);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive"
      });
    }
  };

  const saveMessageToDatabase = async (message: Message) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          message: message.text,
          is_bot: message.isBot,
          message_type: 'text'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive"
      });
    }
  };

  const generateHealthResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Enhanced disease-specific search terms
    const searchTerms = input.split(' ').filter(term => term.length > 2);
    
    // Priority search for exact disease matches
    let relevantInfo = healthInformation.find(info => {
      const title = info.title.toLowerCase();
      const category = info.category.toLowerCase();
      const tags = info.tags ? info.tags.toLowerCase() : '';
      const description = info.description.toLowerCase();
      
      // Check for exact disease name matches first
      return searchTerms.some(searchTerm => {
        // Exact title match (highest priority)
        if (title === searchTerm) return true;
        
        // Disease name in title
        if (title.includes(searchTerm) && searchTerm.length > 4) return true;
        
        // Category match for disease types
        if (category.includes(searchTerm)) return true;
        
        // Tag match for disease classifications
        if (tags.includes(searchTerm)) return true;
        
        return false;
      });
    });

    // If no exact match, try partial matching
    if (!relevantInfo) {
      relevantInfo = healthInformation.find(info => {
        const titleWords = info.title.toLowerCase().split(' ');
        const categoryWords = info.category.toLowerCase().split(' ');
        const tagWords = info.tags ? info.tags.toLowerCase().split(',').map(tag => tag.trim()) : [];
        const descriptionWords = info.description.toLowerCase().split(' ');
        
        // Check if any search term has partial matches
        return searchTerms.some(searchTerm => 
          titleWords.some(titleWord => 
            titleWord.includes(searchTerm) || 
            searchTerm.includes(titleWord) ||
            this.calculateSimilarity(titleWord, searchTerm) > 0.7
          ) ||
          categoryWords.some(catWord => 
            catWord.includes(searchTerm) || 
            searchTerm.includes(catWord)
          ) ||
          tagWords.some(tag => 
            tag.includes(searchTerm) || 
            searchTerm.includes(tag)
          ) ||
          descriptionWords.some(descWord => 
            descWord.includes(searchTerm) && searchTerm.length > 4
          )
        );
      });
    }

    // If we found relevant health information
    if (relevantInfo) {
      return `**${relevantInfo.title}**\n\n${relevantInfo.description}\n\n**Category:** ${relevantInfo.category}${relevantInfo.tags ? `\n**Related Topics:** ${relevantInfo.tags}` : ''}\n\n*Please remember that this is general health information. For personalized medical advice, always consult with a healthcare professional.*`;
    }

    // Disease-specific fallback responses
    if (this.isDiseaseQuery(input)) {
      const suggestedTerms = this.getSuggestedDiseaseTerms(input);
      return `I understand you're asking about a health condition. While I don't have specific information about "${input}" in my database, I recommend:\n\n1. Consulting with a healthcare professional for accurate diagnosis and treatment\n2. Trying more specific search terms like: ${suggestedTerms}\n3. Searching for the category of condition (e.g., "heart disease", "skin condition", "respiratory illness")\n\nPlease feel free to ask about specific symptoms or health topics!`;
    }

    if (input.includes('exercise') || input.includes('workout') || input.includes('fitness')) {
      return "Regular exercise is crucial for maintaining good health. It can improve cardiovascular health, strengthen muscles and bones, boost mental health, and help maintain a healthy weight. Aim for at least 150 minutes of moderate-intensity exercise per week. However, please consult with a healthcare provider before starting any new exercise program.";
    }

    if (input.includes('diet') || input.includes('nutrition') || input.includes('food')) {
      return "A balanced diet is essential for good health. Focus on eating a variety of fruits, vegetables, whole grains, lean proteins, and healthy fats. Stay hydrated by drinking plenty of water. Limit processed foods, added sugars, and excessive sodium. For personalized nutrition advice, consider consulting with a registered dietitian.";
    }

    if (input.includes('sleep') || input.includes('tired') || input.includes('insomnia')) {
      return "Good sleep is vital for physical and mental health. Adults should aim for 7-9 hours of quality sleep per night. Establish a regular sleep schedule, create a comfortable sleep environment, and avoid screens before bedtime. If you're experiencing persistent sleep problems, consult with a healthcare provider.";
    }

    if (input.includes('stress') || input.includes('anxiety') || input.includes('mental health')) {
      return "Managing stress and maintaining mental health is crucial for overall well-being. Try relaxation techniques like deep breathing, meditation, or yoga. Regular exercise, adequate sleep, and social connections can also help. If you're experiencing persistent mental health concerns, please reach out to a mental health professional.";
    }

    // Default response
    return "I understand your health concern. Based on general medical knowledge, it's always best to maintain a healthy lifestyle with regular exercise, balanced nutrition, adequate sleep, and stress management. However, for specific medical advice or concerns, please consult with a qualified healthcare professional who can provide personalized guidance based on your individual health needs.";
  };

  // Helper method to check if query is disease-related
  private isDiseaseQuery = (input: string): boolean => {
    const diseaseKeywords = [
      'disease', 'illness', 'condition', 'symptom', 'syndrome', 'disorder',
      'infection', 'virus', 'bacteria', 'cancer', 'tumor', 'pain', 'ache',
      'fever', 'inflammation', 'allergy', 'diabetes', 'hypertension',
      'depression', 'anxiety', 'asthma', 'arthritis'
    ];
    
    return diseaseKeywords.some(keyword => input.includes(keyword));
  };

  // Helper method to suggest related disease terms
  private getSuggestedDiseaseTerms = (input: string): string => {
    const commonDiseases = [
      'diabetes', 'hypertension', 'heart disease', 'asthma', 'arthritis',
      'depression', 'anxiety', 'cancer', 'stroke', 'pneumonia',
      'bronchitis', 'allergies', 'migraine', 'obesity'
    ];
    
    // Find diseases that might be related to the search
    const related = commonDiseases.filter(disease => 
      disease.includes(input.split(' ')[0]) || 
      input.includes(disease.split(' ')[0])
    );
    
    if (related.length > 0) {
      return related.slice(0, 3).join(', ');
    }
    
    return 'specific disease name, symptoms you\'re experiencing, or the affected body part';
  };

  // Helper method to calculate string similarity (simple implementation)
  private calculateSimilarity = (str1: string, str2: string): number => {
    if (str1.length < 3 || str2.length < 3) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const matches = shorter.split('').filter((char, i) => longer[i] === char).length;
    return matches / longer.length;
  };

  const handleStartRecording = async () => {
    try {
      console.log('Starting recording...');
      setIsRecording(true);
      setRecordingDuration(0);
      
      await voiceRecorderRef.current?.startRecording();
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording started",
        description: "Speak your message clearly. Click the button again to stop.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start recording. Please check microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      setIsProcessingAudio(true);
      
      // Clear recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      const audioBlob = await voiceRecorderRef.current?.stopRecording();
      if (!audioBlob) {
        throw new Error('No audio recorded');
      }

      console.log('Audio recorded, converting to base64...');
      const base64Audio = await convertBlobToBase64(audioBlob);
      
      console.log('Sending to speech-to-text function...');
      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio }
      });

      if (error) {
        console.error('Speech-to-text error:', error);
        
        // Check if it's an API key configuration error
        if (error.message?.includes('OpenAI API key not configured')) {
          toast({
            title: "Configuration Error",
            description: "OpenAI API key is not configured. Please add it to Supabase Edge Function Secrets.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: error.message || 'Failed to process audio. Please try again.',
            variant: "destructive"
          });
        }
        return;
      }

      if (data?.text && data.text.trim()) {
        setInput(data.text.trim());
        toast({
          title: "Speech recognized",
          description: "Text has been added to the input. You can edit it or send it directly.",
        });
      } else {
        toast({
          title: "No speech detected",
          description: "Please try speaking more clearly or check your microphone.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingAudio(false);
      setRecordingDuration(0);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Save user message to database
    if (user) {
      await saveMessageToDatabase(userMessage);
    }

    // Generate AI response based on health information
    setTimeout(async () => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateHealthResponse(userMessage.text),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);

      // Save bot response to database
      if (user) {
        await saveMessageToDatabase(botResponse);
      }
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Avatar className="h-8 w-8 bg-blue-600">
            <AvatarFallback className="text-white">AI</AvatarFallback>
          </Avatar>
          <span>Healthcare AI Assistant</span>
          {!user && (
            <span className="text-sm text-orange-600 font-normal">
              (Login to save chat history)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isBot
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your health concerns or use voice..."
              className="flex-1"
              disabled={isRecording || isProcessingAudio}
            />
            <Button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isTyping || isProcessingAudio}
              variant="outline"
              size="icon"
              className={`relative ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : ''}`}
            >
              {isProcessingAudio ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isTyping || isRecording || isProcessingAudio}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {isRecording && (
            <div className="flex items-center justify-center mt-2 text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <p className="text-sm font-medium">Recording... {formatRecordingTime(recordingDuration)}</p>
            </div>
          )}
          {isProcessingAudio && (
            <p className="text-sm text-gray-600 mt-2 text-center">Processing audio...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatBot;
