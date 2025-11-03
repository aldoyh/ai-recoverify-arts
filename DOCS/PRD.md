Product Requirements Document: Gemini Creative Suite
Version: 1.0
Date: October 26, 2023
Author: Senior Frontend Engineer
1. Introduction & Vision
1.1. Product Vision
The Gemini Creative Suite is a web-based application designed to empower content creators by providing a seamless, AI-driven toolkit for generating and refining visual assets. By integrating the power of Google's Gemini and Imagen models, this suite aims to significantly reduce the time and effort required to produce high-quality, engaging visuals, allowing creators to focus on what they do best: creating content.
1.2. Problem Statement
Content creators, particularly those managing YouTube channels and podcasts, face a constant demand for fresh, eye-catching visual content like thumbnails and cover art. This process can be time-consuming, requires design skills, and can become a bottleneck in the content production workflow. Furthermore, brainstorming visual concepts from raw ideas or long-form content is a creative challenge.
1.3. Target Audience
YouTubers & Video Podcasters: Individuals or teams looking to rapidly generate relevant, high-quality thumbnails for their videos.
Audio Podcasters & Content Strategists: Creators who want to transform spoken ideas or audio recordings into tangible visual concepts.
Social Media Managers: Professionals who need to quickly edit or repurpose images with AI assistance for various platforms.
2. Goals & Objectives
Empower Creativity: Provide powerful, intuitive AI tools that act as a creative partner for users.
Streamline Workflow: Drastically reduce the time from idea to final visual asset.
Enhance Visual Quality: Enable creators without a design background to produce modern, aesthetically pleasing graphics.
Ensure Accessibility: Offer full localization and support for both English and Arabic-speaking creators, including right-to-left (RTL) language support.
Maintain Reliability: Implement robust fallback mechanisms to ensure high availability of core features.
3. Functional Requirements (Features)
The application is structured around a tab-based interface, with each tab representing a core feature.
3.1. Core Functionality (Platform-wide)
Localization: The entire user interface, including all labels, buttons, and messages, must be available in both English and Arabic. The application defaults to Arabic.
Language Toggle: A persistent button allows the user to switch between English and Arabic at any time. The UI (including text direction ltr/rtl) updates instantly.
Responsive Design: The application is fully responsive and functional across desktop and mobile devices.
Centralized Error Handling: A dedicated UI element clearly displays user-facing errors from API calls or internal processes.
3.2. Feature: Image Editor
User Flow: The user uploads an image, provides a text prompt describing the desired edit, and receives an AI-modified version of the image.
Inputs:
An image file (PNG, JPG, GIF) up to 10MB, accepted via file picker or drag-and-drop.
A text string describing the desired edit (e.g., "add a retro filter," "make the background blurry").
Processing:
The image and text prompt are sent to the gemini-2.5-flash-image model.
Outputs:
A new image with the edits applied.
The UI displays a side-by-side comparison of the original and edited images.
3.3. Feature: YouTube Cover Generator
User Flow: The user provides a YouTube video URL, and the system generates a new, relevant thumbnail based on the video's content.
Inputs:
A valid YouTube video URL (handles standard, short, and live formats).
A boolean option to "Use current thumbnail as inspiration."
Processing (Multi-Step Workflow):
Data Fetching: The system robustly fetches the video's title using the official YouTube oEmbed endpoint and the highest-resolution thumbnail via a direct URL pattern. It secondarily attempts to scrape the video's description. If a transcript is available (first Arabic, then English), it is prioritized over the description.
AI Summarization: The fetched content (transcript or title/description) is sent to gemini-2.5-pro to be summarized into a concise, 2-3 sentence creative brief in Arabic.
AI Prompt Generation: The Arabic summary is sent to gemini-2.5-flash, which translates and transforms it into a final, detailed image generation prompt in English, adhering to modern design principles (bold, minimalist, vibrant, no text).
AI Image Generation:
With Inspiration: If the "inspiration" option is checked, the original thumbnail and the new prompt are sent to gemini-2.5-flash-image for a multimodal generation. The prompt explicitly directs the AI to draw inspiration from the source image's style and composition.
Without Inspiration: The prompt is sent to the imagen-4.0-generate-001 model to create an image from scratch.
Outputs:
A 16:9 aspect ratio cover image.
A display card showing the generated image, the AI summary, the final image prompt, and the original URL.
A "Download" button for the generated image.
Generation History: Each successful generation is saved to the browser's localStorage and displayed in a history list within the tab, allowing users to review past results.
3.4. Feature: Audio Idea Generator
User Flow: The user records an audio clip of their ideas. The system transcribes the audio in real-time and, upon completion, generates a summary and a set of visual concepts.
Inputs:
Live audio from the user's microphone.
Processing:
Real-time Transcription: Uses the Gemini Live API (gemini-2.5-flash-native-audio-preview-09-2025) to capture and transcribe user audio as they speak.
AI Summarization: Once recording stops, the full transcript is sent to gemini-2.5-pro to be summarized into a creative brief in Arabic.
AI Prompt Generation: The Arabic brief is sent to gemini-2.5-flash to create a final image generation prompt in English.
AI Image Generation: The prompt is sent to the imagen-4.0-generate-001 model to generate two distinct 16:9 visual concepts.
Outputs:
The real-time transcript displayed in a text box.
The final AI-generated summary of the idea.
Two generated images representing the visual concepts.
4. Technical Requirements & Architecture
4.1. Frontend
Framework: React 19+ with TypeScript
Styling: Tailwind CSS with a custom "brand-red" theme. Google Fonts (Tajawal) for enhanced Arabic typography.
State Management: React Hooks (useState, useCallback, useEffect, useRef).
4.2. AI & External Services
Primary AI Provider: Google Gemini API (@google/genai).
Models: gemini-2.5-flash-image, gemini-2.5-pro, gemini-2.5-flash, imagen-4.0-generate-001, gemini-2.5-flash-native-audio-preview-09-2025.
Fallback AI Provider: Hugging Face Inference API.
Model: stabilityai/stable-diffusion-xl-base-1.0. This is triggered automatically if any Gemini/Imagen image generation call fails, ensuring service resilience.
Prompt Management: All LLM prompts are externalized into Markdown (.md) files within a /prompts directory. This decouples prompt engineering from application logic, allowing for easy updates.
Data Services:
A CORS proxy (api.allorigins.win) is used for fetching cross-origin data.
A third-party API (youtube-transcript-api.vercel.app) is used for fetching YouTube transcripts.
YouTube's oEmbed endpoint is used for reliable metadata fetching.
5. User Experience (UX) & Design
Theme: A dark, modern aesthetic with a "brand-red" accent color palette, creating a professional and focused creative environment.
Feedback: The application provides constant feedback to the user through:
Loading spinners and descriptive text during processing.
Step-by-step progress indicators for the multi-stage YouTube generator.
Animate-in transitions for new results.
Interaction: Large, clear call-to-action buttons, intuitive file uploaders, and a clean, uncluttered layout guide the user through each workflow. The round, iconic record button for the audio generator is a key focal point.
