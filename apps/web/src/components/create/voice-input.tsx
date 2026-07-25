"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
}

interface VoiceInputProps {
  value: string
  onChange: (text: string) => void
  placeholder?: string
  onListeningChange?: (listening: boolean) => void
}

export function VoiceInput({
  value,
  onChange,
  placeholder,
  onListeningChange,
}: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [error, setError] = useState("")
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const baseTextRef = useRef("")

  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      setSupported(false)
      return
    }

    const recognition = new Ctor()
    recognition.lang = "zh-CN"
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let interim = ""
      let finalText = ""
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalText += result[0].transcript
        else interim += result[0].transcript
      }
      const next = `${baseTextRef.current}${finalText}${interim}`.trim()
      onChange(next)
      if (finalText) {
        baseTextRef.current = `${baseTextRef.current}${finalText}`.trim() + " "
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setError("请允许浏览器使用麦克风")
      } else if (event.error !== "aborted") {
        setError("语音识别出错，请重试")
      }
      setListening(false)
      onListeningChange?.(false)
    }

    recognition.onend = () => {
      setListening(false)
      onListeningChange?.(false)
    }

    recognitionRef.current = recognition
    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        recognition.stop()
      } catch {
        // ignore
      }
    }
  }, [onChange, onListeningChange])

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    setError("")

    if (listening) {
      recognition.stop()
      setListening(false)
      onListeningChange?.(false)
      return
    }

    baseTextRef.current = value ? `${value.trim()} ` : ""
    try {
      recognition.start()
      setListening(true)
      onListeningChange?.(true)
    } catch {
      setError("无法启动语音识别")
    }
  }, [listening, onChange, onListeningChange, value])

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={
            placeholder ||
            "例如：如果我连续跑步30天，就奖励自己一双跑鞋，截止日期8月15日"
          }
          className="input-field min-h-[110px] pr-14"
        />
        <button
          type="button"
          onClick={toggle}
          disabled={!supported}
          title={supported ? (listening ? "停止录音" : "语音输入") : "当前浏览器不支持语音识别"}
          className={`absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded border transition ${
            listening
              ? "border-seal bg-seal text-white animate-pulse"
              : "border-line bg-white text-ink hover:border-ink"
          } disabled:opacity-40`}
        >
          <MicIcon listening={listening} />
        </button>
      </div>
      {!supported && (
        <p className="text-xs text-muted">当前浏览器不支持语音识别，可直接打字。建议使用 Chrome。</p>
      )}
      {listening && (
        <p className="text-xs font-medium text-seal">正在聆听… 再说一遍关键信息即可</p>
      )}
      {error && <p className="text-xs text-seal">{error}</p>}
    </div>
  )
}

function MicIcon({ listening }: { listening: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
        fill={listening ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
