import { ref, onBeforeUnmount } from 'vue';
import { isServer } from '@/services/helpersRuntime';
import { parseVoice } from '@/utils/voiceParser';
import type { VoiceQuery } from '@/types/voice';

// PUBLIC_INTERFACE
export function useVoiceRecognition() {
  /**
   * PUBLIC_INTERFACE
   * Provides a small wrapper over the Web Speech API (if available).
   * SSR-safe. If unsupported, exposes supported=false and does nothing.
   */
  const supported =
    !isServer() &&
    typeof window !== 'undefined' &&
    (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));

  const listening = ref(false);
  const interim = ref('');
  const finalText = ref('');
  const error = ref<string | null>(null);
  let rec: any | null = null;

  if (supported) {
    // @ts-expect-error vendor prefixed
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-IN'; // English India for better INR/phrasing, still matches generic
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      listening.value = true;
      error.value = null;
      interim.value = '';
      finalText.value = '';
    };
    rec.onerror = (ev: any) => {
      error.value = ev?.error || 'unknown_error';
      listening.value = false;
    };
    rec.onend = () => {
      listening.value = false;
    };
    rec.onresult = (e: any) => {
      let interimStr = '';
      let finalStr = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalStr += res[0].transcript;
        else interimStr += res[0].transcript;
      }
      interim.value = interimStr.trim();
      if (finalStr.trim()) {
        finalText.value = finalStr.trim();
      }
    };
  }

  function start() {
    if (!supported || !rec) return;
    error.value = null;
    interim.value = '';
    finalText.value = '';
    try {
      rec.start();
    } catch {
      // ignore start errors (e.g., already started)
    }
  }

  function stop() {
    if (!supported || !rec) return;
    try {
      rec.stop();
    } catch {
      // ignore stop errors
    }
  }

  function getVoiceQuery(): VoiceQuery {
    const transcript = (finalText.value || interim.value || '').trim();
    return {
      transcript,
      final: !!finalText.value,
      parsed: parseVoice(transcript),
    };
  }

  onBeforeUnmount(() => {
    if (rec && listening.value) {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    }
  });

  return {
    supported,
    listening,
    interim,
    finalText,
    error,
    start,
    stop,
    getVoiceQuery,
  };
}
