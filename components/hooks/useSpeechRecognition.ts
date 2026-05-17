import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState("")

  const recognitionRef = useRef<any>(null)

  // Persist final transcript across events
  const finalTranscriptRef = useRef("")

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser."
      )
      return
    }

    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
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

    recognition.onerror = (event: any) => {
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