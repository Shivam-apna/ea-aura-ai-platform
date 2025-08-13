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

        const cachedSummary = localStorage.getItem(summaryKey);

        if (!cachedSummary) {
            toast.error("No summary data available for TTS.");
            return;
        }

        const summaryData = JSON.parse(cachedSummary);

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

export const createIndividualMetricTTS = async (
    metricKey: string,
    activeTab: string,
    pageTitle: string,
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

        // Find the localStorage key that matches `_summary_${activeTab}`
        const targetSuffix = `_summary_${activeTab}`;
        const summaryKey = Object.keys(localStorage).find(key =>
            key.toLowerCase().endsWith(targetSuffix.toLowerCase())
        );

        if (!summaryKey) {
            toast.error(`No summary data found for ${activeTab}.`);
            return;
        }


        const cachedSummary = localStorage.getItem(summaryKey);
        if (!cachedSummary) {
            toast.error("No summary data available for TTS.");
            return;
        }

        const summaryData = JSON.parse(cachedSummary);

        // Find the specific metric
        const metricData = summaryData[metricKey];
        if (!metricData || !metricData.summary) {
            toast.error(`No summary available for ${metricKey}.`);
            return;
        }

        // Create the formatted text for TTS - only for this specific metric
        const fullText = `${pageTitle} ${activeTab} Data. ${metricKey}: ${metricData.summary}`;

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
            currentAudio = null;
        };
        currentAudio.onerror = () => {
            setIsSpeaking(false);
            currentAudio = null;
        };

        await currentAudio.play();
        toast.success(`EA-AURA Avatar started for ${metricKey}...`);

    } catch (error) {
        console.error("Individual Metric TTS Error:", error);
        toast.error("Something went wrong with TTS.");
        setIsSpeaking(false);
        currentAudio = null;
    } finally {
        setTtsLoading(false);
    }
};
