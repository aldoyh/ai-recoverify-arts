
import { GoogleGenAI, Modality, LiveSession, Blob } from "@google/genai";

// --- Prompt Fetching and Caching ---
const promptCache = new Map<string, string>();

const fetchPrompt = async (name: string): Promise<string> => {
    if (promptCache.has(name)) {
        return promptCache.get(name)!;
    }
    try {
        const response = await fetch(`/prompts/${name}.md`);
        if (!response.ok) {
            throw new Error(`Failed to fetch prompt: ${name}`);
        }
        const text = await response.text();
        promptCache.set(name, text);
        return text;
    } catch (error) {
        console.error(`Error fetching prompt ${name}:`, error);
        // Fallback to a generic error message to avoid crashing the app
        return "Error: Could not load prompt template.";
    }
};


// --- Hugging Face Fallback ---
const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
};

const generateImagesWithHuggingFace = async (prompt: string, count: number): Promise<string[]> => {
    // Note: Hugging Face free inference API can be slow, especially on cold start.
    // This implementation does not use an API token, which may result in rate limiting.
    console.log(`Attempting to generate ${count} image(s) with Hugging Face for prompt: "${prompt}"`);

    const imagePromises: Promise<string>[] = [];

    for (let i = 0; i < count; i++) {
        const promise = fetch(HUGGING_FACE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs: prompt }),
            })
            .then(async (response) => {
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({ error: 'Unknown error format' }));
                    throw new Error(`Hugging Face API error: ${response.statusText} - ${JSON.stringify(errorBody)}`);
                }
                return response.blob();
            })
            .then(blobToBase64);

        imagePromises.push(promise);
    }
    
    const results = await Promise.all(imagePromises);
    return results;
};


// --- Base64 Utilities ---
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
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
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
 * Fetches YouTube video details using a robust, multi-step process.
 * It prioritizes the official oEmbed endpoint for reliability and falls back
 * to scraping for additional details like the description.
 */
const fetchVideoDetails = async (videoId: string): Promise<{ title: string; description: string; thumbnailUrl: string; } | null> => {
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    
    try {
        // Step 1: Use the reliable oEmbed endpoint to get the title.
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembedProxy = `${proxyUrl}${encodeURIComponent(oembedUrl)}`;
        const oembedResponse = await fetch(oembedProxy);
        if (!oembedResponse.ok) {
            // If oEmbed fails, we can't reliably get the title, so we consider this a failure.
            throw new Error(`oEmbed request failed with status ${oembedResponse.status}`);
        }
        const oembedData = await oembedResponse.json();
        const title = oembedData.title;

        if (!title) {
            throw new Error("Video title could not be retrieved from oEmbed.");
        }
        
        // Step 2: Construct the URL for the highest quality thumbnail.
        const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

        // Step 3: Attempt to scrape the video page for the description as an enhancement.
        let description = '';
        try {
            const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const pageProxy = `${proxyUrl}${encodeURIComponent(videoPageUrl)}`;
            const pageResponse = await fetch(pageProxy);
            if (pageResponse.ok) {
                const html = await pageResponse.text();
                // Try parsing from the meta description tag first
                const metaDescMatch = html.match(/<meta name="description" content="([^"]+)">/);
                if (metaDescMatch && metaDescMatch[1]) {
                    description = metaDescMatch[1];
                } else {
                    // Fallback to scraping the initial player response if meta tag is not found
                    const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.*?});/);
                    if (playerResponseMatch && playerResponseMatch[1]) {
                        const playerResponse = JSON.parse(playerResponseMatch[1]);
                        description = playerResponse?.videoDetails?.shortDescription || '';
                    }
                }
            }
        } catch (scrapeError) {
            console.warn("Could not scrape description, proceeding with title only.", scrapeError);
            // This is not a fatal error; we can proceed without a description.
        }

        return { title, description, thumbnailUrl };

    } catch (error) {
        console.error("Fatal error in fetchVideoDetails:", error);
        return null; // Return null if we can't get the essential data (title).
    }
};


/**
 * Fetches transcript and/or metadata for a YouTube video.
 * It attempts to fetch a transcript first, but reliably falls back to video details (title/description).
 */
export const fetchYouTubeTranscript = async (videoId: string): Promise<{ text: string; source: 'transcript' | 'metadata'; thumbnailUrl: string | null; }> => {
    // Start fetching details and transcript in parallel
    const detailsPromise = fetchVideoDetails(videoId);
    
    let transcript: string | null = null;
    try {
        // Attempt to fetch transcript
        transcript = await fetchTranscriptFromApi(videoId, 'ar');
        if (!transcript) {
            transcript = await fetchTranscriptFromApi(videoId, 'en');
        }
    } catch(e) {
        console.warn("Transcript fetching failed entirely.", e);
    }
    
    const details = await detailsPromise;
    const thumbnailUrl = details?.thumbnailUrl || null;

    // Prioritize transcript if available
    if (transcript) {
        return { text: transcript, source: 'transcript', thumbnailUrl };
    }

    // Fallback to video details if transcript fails
    if (details && details.title) {
        const content = details.description ? `${details.title}\n\n${details.description}` : details.title;
        return { text: content, source: 'metadata', thumbnailUrl };
    }

    // If both fail, throw a comprehensive error
    throw new Error("Could not fetch transcript or video details. The video may be private, have captions disabled, or the external fetching services may be temporarily unavailable.");
};


// Step 1: Summarize Transcript or Metadata with Gemini Pro
export const summarizeTranscript = async (content: string, sourceType: 'transcript' | 'metadata'): Promise<string> => {
    const ai = getAi();
    const promptName = sourceType === 'transcript' ? 'summarize_transcript' : 'summarize_metadata';
    const promptTemplate = await fetchPrompt(promptName);
    const promptContent = promptTemplate.replace('{content}', content);

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
    const promptTemplate = await fetchPrompt('create_image_prompt');
    
    const inspirationText = useThumbnail 
        ? '**Inspiration:** The new image should be inspired by the style and theme of the provided original thumbnail but be more dynamic and eye-catching.' 
        : '';

    const finalPrompt = promptTemplate
        .replace('{inspiration_text}', inspirationText)
        .replace('{summary}', summary);

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

// Step 3: Generate Image (now supports single or multi-modal) with fallback
export const generateImage = async (prompt: string, thumbnailUrl?: string | null): Promise<string> => {
    try {
        const ai = getAi();
        // Text + Image prompt using Gemini 2.5 Flash Image
        if (thumbnailUrl) {
            const { base64, mimeType } = await urlToBase64(thumbnailUrl);
            
            // Explicitly instruct the model on how to use the provided image
            const multimodalPrompt = `Taking strong inspiration from the provided image's style, color palette, and overall composition, create a new, more dynamic and eye-catching image that visually represents the following concept: ${prompt}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { data: base64, mimeType: mimeType } },
                        { text: multimodalPrompt },
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
             const images = await generateImagesFromPrompt(prompt, 1);
             if (images.length === 0) {
                 throw new Error("Image generation returned no images.");
             }
             return images[0];
        }
    } catch (geminiError) {
        console.warn("Gemini image generation failed, attempting fallback to Hugging Face.", geminiError);
        try {
            // Fallback is always text-to-image, ignoring the thumbnail if it was provided.
            const hfImages = await generateImagesWithHuggingFace(prompt, 1);
            if (hfImages.length === 0) {
                throw new Error("Hugging Face fallback returned no images.");
            }
            return hfImages[0];
        } catch (hfError) {
            console.error("Hugging Face fallback also failed.", hfError);
            throw new Error("Failed to generate cover image using both primary and fallback services.");
        }
    }
};

// --- Audio Idea Generator Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

let sessionPromise: Promise<LiveSession> | null = null;
let inputAudioContext: AudioContext | null = null;
let stream: MediaStream | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let source: MediaStreamAudioSourceNode | null = null;

export const startTranscription = async (onTranscriptUpdate: (transcriptPart: string) => void): Promise<void> => {
    if (sessionPromise) {
        console.warn("Transcription already in progress.");
        return;
    }

    const ai = getAi();
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log("Live session opened."),
            onmessage: (message) => {
                if (message.serverContent?.inputTranscription) {
                    onTranscriptUpdate(message.serverContent.inputTranscription.text);
                }
            },
            onerror: (e) => console.error("Live session error:", e),
            onclose: () => console.log("Live session closed."),
        },
        config: {
            responseModalities: [Modality.AUDIO], // Required by API
            inputAudioTranscription: {},
        },
    });

    inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    source = inputAudioContext.createMediaStreamSource(stream);
    scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);

    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromise?.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
        });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(inputAudioContext.destination);
};

export const stopTranscription = (): void => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    scriptProcessor?.disconnect();
    source?.disconnect();
    inputAudioContext?.close();

    sessionPromise?.then(session => session.close());

    stream = null;
    scriptProcessor = null;
    source = null;
    inputAudioContext = null;
    sessionPromise = null;
};

export const summarizeAudioTranscript = async (transcript: string): Promise<string> => {
    const ai = getAi();
    const promptTemplate = await fetchPrompt('summarize_audio');
    const promptContent = promptTemplate.replace('{content}', transcript);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: promptContent,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing transcript:", error);
        throw new Error("Failed to summarize transcript with Gemini Pro.");
    }
};

export const generateImagesFromPrompt = async (prompt: string, count: number): Promise<string[]> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: count,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });
        return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
    } catch (geminiError) {
        console.warn("Gemini image generation failed, attempting fallback to Hugging Face.", geminiError);
        try {
            return await generateImagesWithHuggingFace(prompt, count);
        } catch (hfError) {
             console.error("Hugging Face fallback also failed.", hfError);
             throw new Error("Failed to generate images using both primary and fallback services.");
        }
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