
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<void> {
    try {
      console.log('Requesting microphone access...');
      
      // Request microphone access with specific constraints
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
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
        'audio/mpeg'
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No supported audio format found');
      }

      console.log('Using MIME type:', selectedMimeType);
      
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
      };
      
      this.mediaRecorder.start(1000); // Collect data every second
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone access denied. Please allow microphone permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      } else {
        throw new Error(`Failed to access microphone: ${error.message}`);
      }
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      console.log('Stopping recording...');

      this.mediaRecorder.onstop = () => {
        console.log('Recording stopped, chunks:', this.audioChunks.length);
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm' 
        });
        console.log('Audio blob created, size:', audioBlob.size);
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
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

export const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('Converting blob to base64, size:', blob.size);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix to get just the base64 content
      const base64Content = base64String.split(',')[1];
      console.log('Base64 conversion complete, length:', base64Content.length);
      resolve(base64Content);
    };
    reader.onerror = (error) => {
      console.error('Error converting to base64:', error);
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
};
