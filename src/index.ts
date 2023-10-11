import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList =
  window.SpeechGrammarList || window.webkitSpeechGrammarList;

export type SpeechRecognitionEventHandler =
  | ((event: SpeechRecognitionEvent) => void)
  | null;

export interface StartOptions {
  continuous?: boolean;
  grammar?: string;
  interimResults?: boolean;
  lang?: string;
  maxAlternatives?: number;
  regex?: RegExp;
}
export interface SpeechRecognitionOptions extends StartOptions {
  startOnLoad?: boolean;

  onaudioend?: SpeechRecognitionEventHandler;
  onaudiostart?: SpeechRecognitionEventHandler;
  onend?: SpeechRecognitionEventHandler;
  onerror?: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch?: SpeechRecognitionEventHandler;
  onresult?: SpeechRecognitionEventHandler;
  onsoundend?: SpeechRecognitionEventHandler;
  onsoundstart?: SpeechRecognitionEventHandler;
  onspeechend?: SpeechRecognitionEventHandler;
  onspeechstart?: SpeechRecognitionEventHandler;
  onstart?: SpeechRecognitionEventHandler;
}

export interface Transcript {
  id: string;
  confidence: number;
  isFinal: boolean;
  transcript: string;
}
export interface SpeechRecognitionObject {
  liveTranscript: string;
  match: string | null;
  restart: (startOptions?: StartOptions) => void;
  start: (startOptions?: StartOptions) => void;
  transcripts: Transcript[];
  abort: () => void;
  instance: SpeechRecognition;
  stop: () => void;
}

export const useSpeechRecognition = (
  options?: SpeechRecognitionOptions
): SpeechRecognitionObject => {
  const [_options, setOptions] = useState<Required<SpeechRecognitionOptions>>({
    continuous: true,
    grammar: '#JSGF V1.0; grammar word; public <word> = hello world ;',
    interimResults: true,
    lang: 'en-US',
    maxAlternatives: 1,
    regex: new RegExp('hello world', 'gi'),

    startOnLoad: true,

    onaudioend: null,
    onaudiostart: null,
    onend: null,
    onerror: null,
    onnomatch: null,
    onresult: null,
    onsoundend: null,
    onsoundstart: null,
    onspeechend: null,
    onspeechstart: null,
    onstart: null,
    ...options,
  });

  const [transcripts, setTranscripts] = useState<
    { id: string; confidence: number; isFinal: boolean; transcript: string }[]
  >([]);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [match, setMatch] = useState<string | null>(null);

  const recognition = useRef(new SpeechRecognition());
  const isInitialized = useRef(false);
  const isListening = useRef(false);

  const handleResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      const result = event.results.item(event.resultIndex);
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;
      const _transcript = result[0].transcript;

      if (result.isFinal) {
        setTranscripts(prev => {
          const id = (Math.random() * 1000000000000).toString(16).split('.')[0];
          prev.push({ id, confidence, isFinal, transcript: _transcript });
          return [...prev];
        });
        setLiveTranscript('');
      } else {
        setLiveTranscript(result[0].transcript);
      }

      const matchedColor = (
        [..._transcript.matchAll(_options.regex)].pop()?.[0] || ''
      ).toLowerCase();
      if (_options.regex.test(matchedColor)) {
        setMatch(matchedColor);
      } else {
        setMatch(null);
      }
      if (_options.onresult) _options.onresult(event);
    },

    [_options]
  );

  const handleStart = useCallback(
    (event: Event) => {
      if (_options.onend) _options.onend(event as SpeechRecognitionEvent);
      isListening.current = true;
    },
    [_options]
  );

  const handleEnd = useCallback(
    (event: Event) => {
      recognition.current.stop();
      if (_options.continuous) setTimeout(() => recognition.current.start(), 0);
      if (_options.onend) _options.onend(event as SpeechRecognitionEvent);
      isListening.current = false;
    },
    [_options]
  );

  const start = useCallback((startOptions?: StartOptions) => {
    if (startOptions)
      setOptions(prev => ({
        ...prev,
        ...startOptions,
      }));
    if (isListening.current) return;
    recognition.current.start();
  }, []);

  const restart = useCallback(
    (startOptions?: StartOptions) => {
      recognition.current.stop();
      setTimeout(() => start(startOptions), 0);
    },
    [start]
  );

  const abort = useCallback(() => recognition.current.abort(), []);
  const stop = useCallback(() => recognition.current.stop(), []);

  const initializeSpeechRecognition = useCallback(() => {
    const speechRecognitionList = new SpeechGrammarList();
    speechRecognitionList.addFromString(_options.grammar, 1);

    recognition.current.grammars = speechRecognitionList;
    recognition.current.continuous = _options.continuous;
    recognition.current.interimResults = _options.interimResults;
    recognition.current.lang = _options.lang;
    recognition.current.maxAlternatives = _options.maxAlternatives;

    const callback = (event: Event, func: SpeechRecognitionEventHandler) => {
      if (func) func(event as SpeechRecognitionEvent);
    };

    recognition.current.onaudioend = e => callback(e, _options.onaudioend);
    recognition.current.onaudiostart = e => callback(e, _options.onaudiostart);
    recognition.current.onend = handleEnd;
    recognition.current.onerror = _options.onerror;
    recognition.current.onnomatch = _options.onnomatch;
    recognition.current.onresult = handleResult;
    recognition.current.onsoundend = e => callback(e, _options.onsoundend);
    recognition.current.onsoundstart = e => callback(e, _options.onsoundstart);
    recognition.current.onspeechend = e => callback(e, _options.onspeechend);
    recognition.current.onspeechstart = e =>
      callback(e, _options.onspeechstart);
    recognition.current.onstart = handleStart;

    isInitialized.current = true;

    if (_options.startOnLoad) recognition.current.start();
  }, [
    _options.continuous,
    _options.grammar,
    _options.interimResults,
    _options.lang,
    _options.maxAlternatives,
    _options.onaudioend,
    _options.onaudiostart,
    _options.onerror,
    _options.onnomatch,
    _options.onsoundend,
    _options.onsoundstart,
    _options.onspeechend,
    _options.onspeechstart,
    _options.startOnLoad,
    handleEnd,
    handleResult,
    handleStart,
  ]);

  useEffect(() => {
    if (!isInitialized.current) initializeSpeechRecognition();
  }, [initializeSpeechRecognition]);

  return useMemo<SpeechRecognitionObject>(
    () => ({
      liveTranscript,
      match,
      restart,
      start,
      transcripts,

      abort,
      stop,

      instance: recognition.current,
    }),
    [liveTranscript, match, restart, start, transcripts]
  );
};
