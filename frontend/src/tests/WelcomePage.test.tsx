import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import WelcomePage from "../components/WelcomePage"
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

describe("WelcomePage", () => {
  const props = {
    userName: "shivam",
    fullName: "Shivam Singh",
    userDomain: "ea-aura.ai",
    onGetStarted: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders full name in header and welcome title, and shows initials", () => {
    render(<WelcomePage {...props} />)

    // Full name should appear twice (header + title)
    const fullNames = screen.getAllByText("Shivam Singh")
    expect(fullNames).toHaveLength(2)

    // Initials from "Shivam Singh" → "SS"
    expect(screen.getByText("SS")).toBeInTheDocument()
  })

  it("renders the logo image with correct alt text", () => {
    render(<WelcomePage {...props} />)
    const logo = screen.getByAltText("EA-AURA.AI Logo")
    expect(logo).toBeInTheDocument()
    expect((logo as HTMLImageElement).src).toContain("EA-AURA.AI.svg")
  })

  it("renders the NewsFeed component with companyDomain", () => {
    render(<WelcomePage {...props} />)
    expect(screen.getByTestId("news-feed")).toHaveTextContent(
      "NewsFeed for ea-aura.ai"
    )
  })

  it("calls onGetStarted when button is clicked", () => {
    render(<WelcomePage {...props} />)
    const button = screen.getByRole("button", { name: /get started/i })
    fireEvent.click(button)
    expect(props.onGetStarted).toHaveBeenCalledTimes(1)
  })

  it("uses speechSynthesis to speak welcome messages", () => {
    render(<WelcomePage {...props} />)
    expect(getVoicesMock).toHaveBeenCalled()
    expect(speakMock).toHaveBeenCalled()
  })
})
