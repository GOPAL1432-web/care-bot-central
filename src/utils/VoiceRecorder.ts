
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<void> {
    try {
      console.log('Requesting microphone access...');
      
      // Request microphone access with optimized constraints
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

      // Check for supported MIME types with better fallbacks
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
        throw new Error('Recording failed: ' + (event as any).error?.message || 'Unknown error');
      };

      this.mediaRecorder.onstart = () => {
        console.log('MediaRecorder started successfully');
      };
      
      this.mediaRecorder.start(1000); // Collect data every second
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      this.cleanup();
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone access denied. Please allow microphone permissions in your browser settings and try again.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError') {
          throw new Error('Microphone is already in use by another application. Please close other applications using the microphone and try again.');
        } else if (error.name === 'OverconstrainedError') {
          throw new Error('Microphone does not support the required audio format. Please try with a different microphone.');
        } else {
          throw new Error(`Failed to access microphone: ${error.message}`);
        }
      } else {
        throw new Error('Failed to access microphone: Unknown error');
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

      const timeout = setTimeout(() => {
        console.error('Recording stop timeout');
        this.cleanup();
        reject(new Error('Recording stop timeout - please try again'));
      }, 5000);

      this.mediaRecorder.onstop = () => {
        clearTimeout(timeout);
        console.log('Recording stopped, chunks:', this.audioChunks.length);
        
        if (this.audioChunks.length === 0) {
          this.cleanup();
          reject(new Error('No audio data recorded. Please try speaking louder or check your microphone.'));
          return;
        }

        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm' 
        });
        
        console.log('Audio blob created, size:', audioBlob.size);
        
        if (audioBlob.size === 0) {
          this.cleanup();
          reject(new Error('Empty audio recording. Please try again.'));
          return;
        }

        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (event) => {
        clearTimeout(timeout);
        console.error('Error during recording stop:', event);
        this.cleanup();
        reject(new Error('Recording failed: ' + ((event as any).error?.message || 'Unknown error')));
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

export const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('Converting blob to base64, size:', blob.size);
    
    if (blob.size === 0) {
      reject(new Error('Cannot convert empty blob to base64'));
      return;
    }

    const reader = new FileReader();
    
    const timeout = setTimeout(() => {
      console.error('Base64 conversion timeout');
      reject(new Error('Conversion timeout - please try again'));
    }, 10000);

    reader.onloadend = () => {
      clearTimeout(timeout);
      const base64String = reader.result as string;
      
      if (!base64String) {
        reject(new Error('Failed to convert audio to base64'));
        return;
      }

      // Remove the data URL prefix to get just the base64 content
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
