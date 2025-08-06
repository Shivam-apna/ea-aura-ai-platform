// avatars.ts
import { toast } from "sonner";
import { getApiEndpoint } from "@/config/environment";

let currentAudio: HTMLAudioElement | null = null;

export const createTTS = async (
    activeTab: string,
    pageTitle: string,
    storageKey: string,
    setTtsLoading: (loading: boolean) => void,
    setIsSpeaking: (speaking: boolean) => void,
) => {
    try {
        setTtsLoading(true);

        // Stop any currently playing audio before starting new one
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        const summaryKey = `${storageKey}_${activeTab}`;
        console.log("summaryKey", summaryKey);

        const cachedSummary = localStorage.getItem(summaryKey);

        if (!cachedSummary) {
            toast.error("No summary data available for TTS.");
            return;
        }

        const summaryData = JSON.parse(cachedSummary);
        console.log("summaryData", summaryData);

        // Extract summaries from each metric
        const summaries = [];
        let counter = 1;

        Object.entries(summaryData)
            .filter(([key]) =>
                key !== "response" &&
                key !== "task" &&
                key !== "columns" &&
                key !== "filters"
            )
            .forEach(([key, value]) => {
                if (typeof value === "object" && value !== null && (value as any).summary) {
                    summaries.push(`${counter}. ${key}: ${(value as any).summary}`);
                    counter++;
                }
            });

        // Create the formatted text for TTS
        const introText = `${pageTitle} ${activeTab} Data. Summary of each metric:`;
        const summaryText = summaries.length > 0
            ? summaries.join(". ")
            : "No summary data available for metrics.";

        const fullText = `${introText} ${summaryText}`;

        console.log("TTS Text:", fullText);

        const res = await fetch(getApiEndpoint("/v1/text-to-speech"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: fullText,
                tenant_id: "demo232",
                voice: "Arista-PlayAI",
            }),
        });

        if (!res.ok) {
            toast.error("TTS generation failed.");
            return;
        }

        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Store the audio in the global variable so it can be stopped
        currentAudio = new Audio(audioUrl);

        // Set loading to false and speaking to true BEFORE playing
        setTtsLoading(false);
        setIsSpeaking(true);

        // Set up event listeners before playing
        currentAudio.onended = () => {
            setIsSpeaking(false);
            currentAudio = null; // Clear the reference when audio ends
        };

        currentAudio.onerror = () => {
            setIsSpeaking(false);
            currentAudio = null; // Clear the reference on error
        };

        await currentAudio.play();
        toast.success("EA-AURA Avatar started ...");

    } catch (error) {
        console.error("TTS Error:", error);
        toast.error("Something went wrong with TTS.");
        setIsSpeaking(false);
        currentAudio = null; // Clear the reference on error
    } finally {
        setTtsLoading(false);
    }
};

// Export function to stop current audio
export const stopCurrentTTS = (setIsSpeaking: (speaking: boolean) => void) => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        setIsSpeaking(false);

    } else {
        setIsSpeaking(false); // Set speaking to false anyway to reset UI state
    }
};