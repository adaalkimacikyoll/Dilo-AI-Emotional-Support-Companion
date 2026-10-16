import { useCallback, useEffect, useRef, useState } from "react";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

const getRecognitionCtor = (): (new () => Recognition) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/**
 * Browser speech-to-text. Dictated text is appended to whatever was already typed,
 * and interim results are shown live until they become final.
 */
export function useSpeechInput(locale: string, onText: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<"denied" | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const isSupported = getRecognitionCtor() !== null;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(
    (baseText: string) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;
      const recognition = new Ctor();
      recognition.lang = locale;
      recognition.continuous = true;
      recognition.interimResults = true;

      const prefix = baseText.trim() ? baseText.trimEnd() + " " : "";
      let finalText = "";

      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += chunk;
          else interim += chunk;
        }
        onText(prefix + (finalText + interim).trim());
      };
      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") setError("denied");
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      setError(null);
      recognition.start();
      setIsListening(true);
    },
    [locale, onText],
  );

  // Stop listening when the language changes or the component unmounts.
  useEffect(() => () => recognitionRef.current?.stop(), [locale]);

  return { isSupported, isListening, error, start, stop, clearError: () => setError(null) };
}
