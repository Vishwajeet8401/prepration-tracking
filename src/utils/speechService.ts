import { Capacitor } from '@capacitor/core';
import { speakNativeText, stopNativeSpeech } from './mobileScheduler';

type SpeechStateListener = (speaking: boolean, text: string) => void;

class SpeechService {
  private listeners: Set<SpeechStateListener> = new Set();
  private currentText: string = '';
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  public addListener(listener: SpeechStateListener) {
    this.listeners.add(listener);
  }

  public removeListener(listener: SpeechStateListener) {
    this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.isSpeaking, this.currentText);
      } catch (err) {
        console.error('Error notifying speech state listener:', err);
      }
    });
  }

  public speak(text: string) {
    // Clean string from markdown or other tags
    const cleanText = text.replace(/[*#`_~]/g, '');

    // 1. If currently speaking the exact same text, stop it (toggle behavior)
    if (this.isSpeaking && this.currentText === cleanText) {
      this.stop();
      return;
    }

    // 2. Stop any active speech first
    this.stop();

    this.currentText = cleanText;
    this.isSpeaking = true;
    this.notify();

    // 3. Native mobile path
    if (Capacitor.isNativePlatform()) {
      speakNativeText(cleanText)
        .then(() => {
          if (this.currentText === cleanText) {
            this.isSpeaking = false;
            this.notify();
          }
        })
        .catch((err) => {
          console.error('Native speech play error:', err);
          if (this.currentText === cleanText) {
            this.isSpeaking = false;
            this.notify();
          }
        });
      return;
    }


    // 4. Web browser path
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported in this browser.');
      this.isSpeaking = false;
      this.notify();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => {
      if (this.currentUtterance === utterance) {
        this.isSpeaking = false;
        this.notify();
      }
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      if (this.currentUtterance === utterance) {
        this.isSpeaking = false;
        this.notify();
      }
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stop() {
    this.isSpeaking = false;
    this.currentText = '';
    this.notify();

    if (Capacitor.isNativePlatform()) {
      stopNativeSpeech();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public getSpeakingText(): string {
    return this.currentText;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const speechService = new SpeechService();
