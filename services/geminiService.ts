import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPCMBlob, base64Decode, decodeAudioData } from './audioUtils';

interface GeminiServiceCallbacks {
  onOpen: () => void;
  onAudioData: (audioBuffer: AudioBuffer) => void;
  onClose: () => void;
  onError: (error: Error) => void;
  onTranscription?: (text: string, isUser: boolean) => void;
}

export class GeminiService {
  private ai: GoogleGenAI;
  private session: any = null;
  private config: any;
  private model = 'gemini-2.5-flash-native-audio-preview-09-2025';

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async connect(
    audioContext: AudioContext,
    callbacks: GeminiServiceCallbacks
  ): Promise<void> {
    const config = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
      },
      // Correct format for systemInstruction is Content object or string. Using object for strict compliance.
      systemInstruction: { parts: [{ text: 'You are a professional tactical communications officer. Keep responses brief, clear, and to the point. Use radio protocol where appropriate (e.g. "Copy that", "Over").' }] },
      // Enable transcription with empty objects. Do not specify model here.
      inputAudioTranscription: {}, 
      outputAudioTranscription: {}
    };

    try {
      this.session = await this.ai.live.connect({
        model: this.model,
        config,
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            callbacks.onOpen();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const rawBytes = base64Decode(base64Audio);
              const audioBuffer = await decodeAudioData(rawBytes, audioContext);
              callbacks.onAudioData(audioBuffer);
            }

            // Handle Transcription (Optional for UI)
            if (message.serverContent?.outputTranscription?.text) {
               callbacks.onTranscription?.(message.serverContent.outputTranscription.text, false);
            }
             if (message.serverContent?.inputTranscription?.text) {
               callbacks.onTranscription?.(message.serverContent.inputTranscription.text, true);
            }

            // Handle turn complete
            if (message.serverContent?.turnComplete) {
              // Can trigger UI updates here
            }
          },
          onclose: () => {
            console.log("Gemini Live Closed");
            callbacks.onClose();
          },
          onerror: (e: any) => {
            console.error("Gemini Live Error", e);
            callbacks.onError(new Error(e.message || "Unknown error"));
          }
        }
      });
    } catch (err) {
      console.error("Failed to connect to Gemini Live", err);
      callbacks.onError(err as Error);
    }
  }

  sendAudioChunk(float32Data: Float32Array) {
    if (this.session) {
      const blob = createPCMBlob(float32Data);
      this.session.sendRealtimeInput({ media: blob });
    }
  }

  disconnect() {
    if (this.session) {
      try {
        if (typeof this.session.close === 'function') {
          this.session.close();
        }
      } catch (e) {
        console.warn("Error closing session:", e);
      }
      this.session = null;
    }
  }
}