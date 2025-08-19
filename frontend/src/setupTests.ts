import "@testing-library/jest-dom"
import { vi } from "vitest"

// ---- Global speechSynthesis mocks ----
export const speakMock = vi.fn()
export const cancelMock = vi.fn()
export const getVoicesMock = vi.fn(() => [{ name: "Google US English" }])

Object.defineProperty(global, "speechSynthesis", {
  value: {
    speak: speakMock,
    cancel: cancelMock,
    getVoices: getVoicesMock,
    onvoiceschanged: null,
  },
  configurable: true, // 👈 allows redefining later if needed
})

// ---- Mock SpeechSynthesisUtterance ----
class MockSpeechSynthesisUtterance {
  text: string
  lang = "en-US"
  rate = 1
  pitch = 1
  voice: SpeechSynthesisVoice | null = null
  onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null

  constructor(text: string) {
    this.text = text
  }
}
;(global as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance
