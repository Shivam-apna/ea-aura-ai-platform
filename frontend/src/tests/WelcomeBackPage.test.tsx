import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import WelcomeBackPage from "../components/WelcomeBackPage"
import { speakMock, getVoicesMock } from "@/setupTests"

// 🔹 Mock child components
vi.mock("../components/NewsFeed", () => ({
  __esModule: true,
  default: ({ companyDomain }: { companyDomain: string }) => (
    <div data-testid="news-feed">NewsFeed for {companyDomain}</div>
  ),
}))

vi.mock("@/components/AvatarVisualizer", () => ({
  CompactVoiceVisualizer: ({ isSpeaking }: { isSpeaking: boolean }) => (
    <div data-testid="voice-visualizer">{isSpeaking ? "Speaking..." : ""}</div>
  ),
}))

vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light" }),
}))

describe("WelcomeBackPage", () => {
  const props = {
    userName: "shivam",
    fullName: "Shivam Singh",
    lastActivity: "Viewed AI Trends",
    userDomain: "ea-aura.ai",
    onContinue: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders full name in header and welcome title, and shows initials", () => {
    render(<WelcomeBackPage {...props} />)

    // Full name appears in header and welcome text
    const fullNames = screen.getAllByText("Shivam Singh")
    expect(fullNames).toHaveLength(2)

    // Initials from "Shivam Singh" → "SS"
    expect(screen.getByText("SS")).toBeInTheDocument()
  })

  it("displays last activity in text", () => {
    render(<WelcomeBackPage {...props} />)
    expect(screen.getByText(/Your last activity:/i)).toBeInTheDocument()
    expect(screen.getByText("Viewed AI Trends")).toBeInTheDocument()
  })

  it("renders the logo with correct alt text", () => {
    render(<WelcomeBackPage {...props} />)
    const logo = screen.getByAltText("EA-AURA.AI Logo")
    expect(logo).toBeInTheDocument()
    expect((logo as HTMLImageElement).src).toContain("EA-AURA.AI.svg")
  })

  it("renders the NewsFeed component with companyDomain", () => {
    render(<WelcomeBackPage {...props} />)
    expect(screen.getByTestId("news-feed")).toHaveTextContent(
      "NewsFeed for ea-aura.ai"
    )
  })

  it("calls onContinue when button is clicked", () => {
    render(<WelcomeBackPage {...props} />)
    const button = screen.getByRole("button", { name: /continue/i })
    fireEvent.click(button)
    expect(props.onContinue).toHaveBeenCalledTimes(1)
  })

  it("speaks welcome back messages using speechSynthesis", () => {
    render(<WelcomeBackPage {...props} />)
    expect(getVoicesMock).toHaveBeenCalled()
    expect(speakMock).toHaveBeenCalled()
  })
})
