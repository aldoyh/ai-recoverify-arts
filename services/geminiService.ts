import { GoogleGenAI, Modality } from "@google/genai";

// Utility to convert a File object to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
};

const urlToBase64 = async (url: string): Promise<{ base64: string, mimeType: string }> => {
    const proxyUrl = 'https://corsproxy.io/?';
    try {
        const response = await fetch(`${proxyUrl}${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`Failed to fetch image URL: ${response.statusText}`);
        const blob = await response.blob();
        const mimeType = blob.type;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve({ base64: base64String, mimeType });
            };
            reader.onerror = error => reject(error);
        });
    } catch (error) {
        console.error("Error converting URL to base64:", error);
        throw new Error("Could not fetch the inspiration thumbnail.");
    }
};


const getAi = () => {
     if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not found. Cannot initialize GoogleGenAI.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

// Function for the Image Editor
export const editImageWithPrompt = async (
    imageFile: File,
    prompt: string
): Promise<string> => {
    if (!process.env.API_KEY) {
        console.warn("API_KEY not found. Mocking Gemini API response for Image Editor.");
        return mockEditedImageResponse();
    }
    
    const ai = getAi();
    const base64Data = await fileToBase64(imageFile);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: imageFile.type } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${base64ImageBytes}`;
            }
        }
        
        throw new Error("No image data found in Gemini response.");

    } catch (error) {
        console.error("Error calling Gemini API for image editing:", error);
        throw new Error("Failed to edit image. The API may be unavailable or the request may be invalid.");
    }
};

// --- YouTube Cover Generator Functions ---

/**
 * Fetches transcript from a dedicated API.
 */
const fetchTranscriptFromApi = async (videoId: string, lang: string): Promise<string | null> => {
    try {
        const apiUrl = `https://youtube-transcript-api.vercel.app/?video_id=${videoId}&lang=${lang}`;
        const response = await fetch(apiUrl);
        if (!response.ok) return null;
        const data = await response.json();
        return data.map((line: { text: string }) => line.text).join(' ');
    } catch (e) {
        console.error(`Failed to fetch transcript from API for lang=${lang}`, e);
        return null;
    }
};

/**
 * Scrapes video metadata (title, description, thumbnail). This is more reliable than scraping for captions.
 */
const fetchMetadataViaScraping = async (videoId: string): Promise<{ title: string; description: string; thumbnailUrl: string; } | null> => {
    try {
        const proxyUrl = 'https://corsproxy.io/?';
        const videoUrl = `${proxyUrl}${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
        const response = await fetch(videoUrl);
        if (!response.ok) return null;
        const html = await response.text();
        const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.*?});/);
        if (!playerResponseMatch || !playerResponseMatch[1]) return null;

        const playerResponse = JSON.parse(playerResponseMatch[1]);
        const videoDetails = playerResponse.videoDetails;

        if (videoDetails && videoDetails.title && videoDetails.shortDescription) {
            // Get the highest resolution thumbnail available
            const thumbnails = videoDetails.thumbnail?.thumbnails || [];
            const thumbnailUrl = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : '';
            return {
                title: videoDetails.title,
                description: videoDetails.shortDescription,
                thumbnailUrl: thumbnailUrl
            };
        }
        return null;
    } catch (e) {
        console.error("Scraping for metadata failed:", e);
        return null;
    }
};


/**
 * Fetches both transcript and metadata for a YouTube video.
 */
export const fetchYouTubeTranscript = async (videoId: string): Promise<{ text: string; source: 'transcript' | 'metadata'; thumbnailUrl: string | null; }> => {
    // Start fetching metadata and transcript in parallel
    const metadataPromise = fetchMetadataViaScraping(videoId);
    let transcript = await fetchTranscriptFromApi(videoId, 'ar');
    if (!transcript) {
        transcript = await fetchTranscriptFromApi(videoId, 'en');
    }
    
    const metadata = await metadataPromise;
    const thumbnailUrl = metadata?.thumbnailUrl || null;

    if (transcript) {
        return { text: transcript, source: 'transcript', thumbnailUrl };
    }

    if (metadata) {
        return { text: `${metadata.title}\n\n${metadata.description}`, source: 'metadata', thumbnailUrl };
    }

    throw new Error("Could not fetch transcript or video details. The video may be private, have captions disabled, or the fetching services may be temporarily down.");
};


// Step 1: Summarize Transcript or Metadata with Gemini Pro
export const summarizeTranscript = async (content: string, sourceType: 'transcript' | 'metadata'): Promise<string> => {
    const ai = getAi();
    let promptContent = '';
    
    if (sourceType === 'metadata') {
        promptContent = `Summarize the following video title and description to identify the core themes and subjects. The goal is to create a concept for a compelling YouTube cover image. The summary MUST be in ARABIC and concise (2-3 sentences). Content: "${content}"`;
    } else {
        promptContent = `Summarize the following video transcript to identify the core themes, subjects, and visual elements. The goal is to create a concept for a compelling YouTube cover image. The summary MUST be in ARABIC and concise (2-3 sentences). Transcript: "${content}"`;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: promptContent,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing content:", error);
        throw new Error("Failed to summarize content with Gemini Pro.");
    }
};

// Step 2: Create Art Prompt with Gemini Flash
export const createImagePromptFromSummary = async (summary: string, useThumbnail: boolean): Promise<string> => {
    const ai = getAi();
    let basePrompt = `Based on this ARABIC summary, create a short, visually descriptive, and engaging prompt in ENGLISH for an AI image generator to create a YouTube video cover. The prompt should focus on a single, strong visual concept. Do not include text in the prompt.`;
    
    if (useThumbnail) {
        basePrompt += ' The new image should be inspired by the style and theme of the provided original thumbnail but be more dynamic and eye-catching.'
    }

    const finalPrompt = `${basePrompt} Summary: "${summary}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error creating image prompt:", error);
        throw new Error("Failed to create image prompt with Gemini Flash.");
    }
};

// Step 3: Generate Image (now multimodal)
export const generateImage = async (prompt: string, thumbnailUrl?: string | null): Promise<string> => {
    const ai = getAi();
    try {
        // Text + Image prompt using Gemini 2.5 Flash Image
        if (thumbnailUrl) {
            const { base64, mimeType } = await urlToBase64(thumbnailUrl);
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { data: base64, mimeType: mimeType } },
                        { text: prompt },
                    ],
                },
                config: { responseModalities: [Modality.IMAGE] },
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${base64ImageBytes}`;
                }
            }
            throw new Error("No image data found in Gemini response.");

        } 
        // Text-only prompt using Imagen
        else {
             const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '16:9',
                },
            });
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate cover image.");
    }
};


// --- Mock Functions for Development without API Key ---

const mockEditedImageResponse = async (): Promise<string> => {
    return new Promise(resolve => {
        setTimeout(async () => {
            try {
                const response = await fetch(`https://picsum.photos/1024/1024?random=${Math.random()}`);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve('');
            } catch (e) {
                console.error("Failed to fetch mock image", e);
                resolve('');
            }
        }, 1500);
    });
};
