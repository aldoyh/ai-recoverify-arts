
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
        return "Error: Could not load prompt template.";
    }
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
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

// Function for the Image Editor
export const editImageWithPrompt = async (
    imageFile: File,
    prompt: string
): Promise<string> => {
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
        throw new Error("Failed to edit image.");
    }
};

// --- YouTube Cover Generator Functions ---

const fetchVideoDetails = async (videoId: string): Promise<{ title: string; description: string; thumbnailUrl: string; } | null> => {
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembedProxy = `${proxyUrl}${encodeURIComponent(oembedUrl)}`;
        const oembedResponse = await fetch(oembedProxy);
        if (!oembedResponse.ok) {
            throw new Error(`oEmbed request failed with status ${oembedResponse.status}`);
        }
        const oembedData = await oembedResponse.json();
        const title = oembedData.title;

        if (!title) {
            throw new Error("Video title could not be retrieved from oEmbed.");
        }
        
        const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

        let description = '';
        try {
            const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const pageProxy = `${proxyUrl}${encodeURIComponent(videoPageUrl)}`;
            const pageResponse = await fetch(pageProxy);
            if (pageResponse.ok) {
                const html = await pageResponse.text();
                const metaDescMatch = html.match(/<meta name="description" content="([^"]+)">/);
                if (metaDescMatch && metaDescMatch[1]) {
                    description = metaDescMatch[1];
                } else {
                    const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.*?});/);
                    if (playerResponseMatch && playerResponseMatch[1]) {
                        const playerResponse = JSON.parse(playerResponseMatch[1]);
                        description = playerResponse?.videoDetails?.shortDescription || '';
                    }
                }
            }
        } catch (scrapeError) {
            console.warn("Could not scrape description, proceeding with title only.", scrapeError);
        }

        return { title, description, thumbnailUrl };

    } catch (error) {
        console.error("Fatal error in fetchVideoDetails:", error);
        return null;
    }
};

export const fetchYouTubeTranscript = async (videoId: string): Promise<{ text: string; source: 'metadata'; thumbnailUrl: string | null; }> => {
    try {
        const details = await fetchVideoDetails(videoId);

        if (details && details.title) {
            const content = details.description ? `${details.title}\n\n${details.description}` : details.title;
            const thumbnailUrl = details.thumbnailUrl || null;
            return { text: content, source: 'metadata', thumbnailUrl };
        }

        throw new Error("Could not fetch video details. The video may be private or the URL invalid.");
    } catch (error) {
        throw error;
    }
};

export const summarizeTranscript = async (content: string): Promise<string> => {
    const ai = getAi();
    const promptTemplate = await fetchPrompt('summarize_metadata');
    const promptContent = promptTemplate.replace('{content}', content);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: promptContent,
        });
        return response.text || '';
    } catch (error) {
        console.error("Error summarizing content:", error);
        throw new Error("Failed to summarize content with Gemini.");
    }
};

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
            model: 'gemini-3-flash-preview',
            contents: finalPrompt,
        });
        return response.text || '';
    } catch (error) {
        console.error("Error creating image prompt:", error);
        throw new Error("Failed to create image prompt with Gemini.");
    }
};

export const generateImage = async (prompt: string, thumbnailUrl?: string | null): Promise<string> => {
    try {
        const ai = getAi();
        if (thumbnailUrl) {
            const { base64, mimeType } = await urlToBase64(thumbnailUrl);
            
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
                    const mimeType = part.inlineData.mimeType || 'image/jpeg';
                    return `data:${mimeType};base64,${base64ImageBytes}`;
                }
            }
            throw new Error("No image data found in Gemini response.");
        } else {
             const images = await generateImagesFromPrompt(prompt, 1);
             if (images.length === 0) {
                 throw new Error("Image generation returned no images.");
             }
             return images[0];
        }
    } catch (geminiError) {
        console.error("Gemini image generation failed.", geminiError);
        throw new Error("Failed to generate cover image.");
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
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
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
            responseModalities: [Modality.AUDIO],
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
            session.sendRealtimeInput({ audio: pcmBlob });
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

    sessionPromise?.then(session => {
        session.close();
    });

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
            model: 'gemini-3-flash-preview',
            contents: promptContent,
        });
        return response.text || '';
    } catch (error) {
        console.error("Error summarizing transcript:", error);
        throw new Error("Failed to summarize transcript with Gemini.");
    }
};

export const generateImagesFromPrompt = async (prompt: string, count: number): Promise<string[]> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                imageConfig: { aspectRatio: "16:9", imageSize: "1K" },
            },
        });
        
        const imageUrls: string[] = [];
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                imageUrls.push(`data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`);
            }
        }
        return imageUrls;
    } catch (geminiError) {
        console.error("Gemini image generation failed.", geminiError);
        throw new Error("Failed to generate images.");
    }
};