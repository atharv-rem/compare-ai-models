import { useEffect, useRef, useState } from "react"

type SpeechRecognitionResultLike = {
  isFinal: boolean
  0: {
    transcript: string
  }
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

type SpeechRecognitionErrorEventLike = {
  error: string
}

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null

  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(() =>
    getSpeechRecognitionConstructor()
      ? ""
      : "Speech recognition is not supported in this browser."
  )

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)

  // Persist final transcript across events
  const finalTranscriptRef = useRef("")

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor()

    if (!SpeechRecognition) {
      return
    }

    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interimTranscript = ""

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript =
          event.results[i][0].transcript

        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + " "
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(
        finalTranscriptRef.current +
          interimTranscript
      )
    }

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      setError(event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [])

  const startListening = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser.")
      return
    }

    setError("")

    finalTranscriptRef.current = ""
    setTranscript("")

    recognitionRef.current?.start()

    setIsListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
  }
}
