import React, { useState, useCallback, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
    editImageWithPrompt,
    summarizeTranscript,
    createImagePromptFromSummary,
    generateImage,
    fetchYouTubeTranscript,
    startTranscription,
    stopTranscription,
    summarizeAudioTranscript,
    createImagePromptFromSummary as createImagePromptFromAudioSummary,
    generateImagesFromPrompt,
} from './services/geminiService';
import {
    initAuth,
    googleSignIn,
    logout as googleLogout,
    clearAccessToken,
} from './services/googleAuthService';
import {
    uploadFileToDrive,
    overwriteDriveFile,
    findFilesByName,
    imageUrlToBlob,
    DriveAuthError,
} from './services/googleDriveService';
import { FileUploader } from './components/FileUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { CoverDisplay } from './components/CoverDisplay';
import { GenerationHistory } from './components/GenerationHistory';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { ConfirmModal, ConfirmDialogState } from './components/ConfirmModal';
import { DrivePickerModal } from './components/DrivePickerModal';
import { DriveBrowser } from './components/DriveBrowser';

export type GenerationHistoryItem = {
    id: string;
    youtubeUrl: string;
    summary: string;
    prompt: string;
    imageUrl: string;
    source: 'transcript' | 'metadata';
};

type Language = 'ar' | 'en';
type ActiveTab = 'editor' | 'youtube' | 'audio' | 'drive';

const translations = {
  ar: {
    appTitle: 'مجموعة أدوات Gemini الإبداعية',
    appDescription: 'تحرير صور مدعوم بالذكاء الاصطناعي وإنشاء أغلفة يوتيوب مع حفظ مباشر في Google Drive.',
    imageEditorTab: 'محرر الصور',
    youtubeCoverTab: 'مولّد أغلفة يوتيوب',
    audioIdeaTab: 'مولّد الأفكار الصوتية',
    googleDriveTab: 'Google Drive',
    errorPrefix: 'خطأ',
    uploadImageLabel: 'رفع صورة',
    uploadImagePrompt: 'انقر للرفع أو اسحب وأفلت',
    uploadImageSubtext: 'PNG, JPG, GIF حتى 10 ميجابايت',
    importFromDrive: 'استيراد من Google Drive',
    editingPromptLabel: 'موجه التحرير',
    editingPromptPlaceholder: 'مثال: أضف فلترًا قديمًا، اجعل الخلفية ضبابية...',
    generateEditButton: 'إنشاء التعديل',
    youtubeUrlLabel: 'رابط فيديو يوتيوب',
    youtubeUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
    generateCoverButton: 'إنشاء غلاف',
    useThumbnailLabel: 'استخدام الصورة المصغرة الحالية كمصدر إلهام؟',
    inspirationThumbnail: 'الصورة المصغرة للإلهام:',
    step1: 'الخطوة 1/4: جلب بيانات الفيديو...',
    step2: 'الخطوة 2/4: التلخيص باستخدام Gemini...',
    step3: 'الخطوة 3/4: إنشاء موجه باستخدام Gemini...',
    step4: 'الخطوة 4/4: إنشاء الصورة...',
    resultTitle: 'النتيجة',
    originalLabel: 'الأصلية',
    editedLabel: 'المعدلة',
    promptLabel: 'الموجه',
    coverArtTitle: 'صورة الغلاف المُنشأة',
    downloadButton: 'تحميل الصورة',
    saveToDrive: 'حفظ في Google Drive',
    savingToDrive: 'جاري الحفظ...',
    viewInDrive: 'عرض في Google Drive',
    summaryLabel: 'ملخص الذكاء الاصطناعي',
    imagenPromptLabel: 'موجه الصورة',
    originalUrlLabel: 'الرابط الأصلي',
    historyTitle: 'سجل الإنشاء',
    loadingText: 'جاري الإنشاء...',
    toggleLanguage: 'English',
    metadataNotice: 'ملاحظة: تم إنشاء هذا الملخص باستخدام عنوان الفيديو ووصفه لعدم توفر نص مكتوب.',
    recordButton: 'بدء التسجيل',
    stopButton: 'إيقاف التسجيل',
    processingAudio: 'جاري معالجة الصوت...',
    speakNow: 'تحدث الآن... سيظهر النص هنا.',
    audioSummaryLabel: 'ملخص الفكرة',
    generatedIdeasLabel: 'الأفكار المرئية المقترحة',
    signInWithGoogle: 'تسجيل الدخول عبر Google',
    signOutGoogle: 'تسجيل الخروج',
    driveConnected: 'متصل بـ Google Drive',
    driveAuthNeeded: 'يرجى تسجيل الدخول بحساب Google أولاً لحفظ الملفات في Google Drive.',
    savedSuccess: 'تم حفظ الصورة بنجاح في Google Drive!',
    overwriteTitle: 'تأكيد استبدال الملف في Google Drive',
    overwriteMessage: 'يوجد ملف بنفس الاسم بالفعل في Google Drive. هل تريد استبدال محتواه بالصورة الجديدة؟',
    confirmOverwrite: 'استبدال الملف',
    cancel: 'إلغاء',
  },
  en: {
    appTitle: 'Gemini Creative Suite',
    appDescription: 'AI-powered image editing, YouTube cover generation, and Google Drive integration.',
    imageEditorTab: 'Image Editor',
    youtubeCoverTab: 'YouTube Cover Generator',
    audioIdeaTab: 'Audio Idea Generator',
    googleDriveTab: 'Google Drive',
    errorPrefix: 'Error',
    uploadImageLabel: 'Upload Image',
    uploadImagePrompt: 'Click to upload or drag and drop',
    uploadImageSubtext: 'PNG, JPG, GIF up to 10MB',
    importFromDrive: 'Import from Google Drive',
    editingPromptLabel: 'Editing Prompt',
    editingPromptPlaceholder: 'e.g., Add a retro filter, make the background blurry...',
    generateEditButton: 'Generate Edit',
    youtubeUrlLabel: 'YouTube Video URL',
    youtubeUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
    generateCoverButton: 'Generate Cover Art',
    useThumbnailLabel: 'Use current thumbnail as inspiration?',
    inspirationThumbnail: 'Inspiration Thumbnail:',
    step1: 'Step 1/4: Fetching video data...',
    step2: 'Step 2/4: Summarizing with Gemini...',
    step3: 'Step 3/4: Creating prompt with Gemini...',
    step4: 'Step 4/4: Generating image...',
    resultTitle: 'Result',
    originalLabel: 'Original',
    editedLabel: 'Edited',
    promptLabel: 'Prompt',
    coverArtTitle: 'Generated Cover Art',
    downloadButton: 'Download Image',
    saveToDrive: 'Save to Google Drive',
    savingToDrive: 'Saving...',
    viewInDrive: 'View in Google Drive',
    summaryLabel: 'AI Summary',
    imagenPromptLabel: 'Image Prompt',
    originalUrlLabel: 'Original URL',
    historyTitle: 'Generation History',
    loadingText: 'Generating...',
    toggleLanguage: 'العربية',
    metadataNotice: "Note: This summary was generated using the video's title and description as a transcript was unavailable.",
    recordButton: 'Start Recording',
    stopButton: 'Stop Recording',
    processingAudio: 'Processing audio...',
    speakNow: 'Speak now... transcript will appear here.',
    audioSummaryLabel: 'Idea Summary',
    generatedIdeasLabel: 'Suggested Visual Ideas',
    signInWithGoogle: 'Sign in with Google',
    signOutGoogle: 'Sign Out',
    driveConnected: 'Google Drive Connected',
    driveAuthNeeded: 'Please sign in with Google first to save files to Google Drive.',
    savedSuccess: 'Saved image to Google Drive successfully!',
    overwriteTitle: 'Overwrite Existing Drive File?',
    overwriteMessage: 'A file with this name already exists in Google Drive. Do you want to overwrite its contents?',
    confirmOverwrite: 'Overwrite File',
    cancel: 'Cancel',
  },
};

const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

const App: React.FC = () => {
    // General State
    const [language, setLanguage] = useState<Language>('ar');
    const [activeTab, setActiveTab] = useState<ActiveTab>('youtube');
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const t = translations[language];

    // Google Auth & Drive State
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [needsAuth, setNeedsAuth] = useState<boolean>(true);
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
    const [isDrivePickerOpen, setIsDrivePickerOpen] = useState<boolean>(false);
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

    // Image Editor State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isSavingEditedToDrive, setIsSavingEditedToDrive] = useState<boolean>(false);
    const [editedDriveLink, setEditedDriveLink] = useState<string | null>(null);

    // YouTube Cover Generator State
    const [youtubeUrl, setYoutubeUrl] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generationStep, setGenerationStep] = useState<string>('');
    const [generatedCover, setGeneratedCover] = useState<GenerationHistoryItem | null>(null);
    const [generationHistory, setGenerationHistory] = useState<GenerationHistoryItem[]>([]);
    const [useThumbnail, setUseThumbnail] = useState<boolean>(false);
    const [fetchedThumbnailUrl, setFetchedThumbnailUrl] = useState<string | null>(null);
    const [isSavingCoverToDrive, setIsSavingCoverToDrive] = useState<boolean>(false);
    const [coverDriveLink, setCoverDriveLink] = useState<string | null>(null);

    // Audio Idea Generator State
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
    const transcriptRef = useRef<string>('');
    const [liveTranscript, setLiveTranscript] = useState<string>('');
    const [audioIdeas, setAudioIdeas] = useState<{ summary: string; prompt: string; images: string[] } | null>(null);
    const [savingAudioIdx, setSavingAudioIdx] = useState<number | null>(null);
    const [audioDriveLinks, setAudioDriveLinks] = useState<Record<number, string>>({});

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    useEffect(() => {
        const unsubscribe = initAuth(
            (authenticatedUser, token) => {
                setUser(authenticatedUser);
                setAccessToken(token);
                setNeedsAuth(false);
            },
            () => {
                setAccessToken(null);
                setNeedsAuth(true);
            }
        );
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('generationHistory');
            if (storedHistory) {
                setGenerationHistory(JSON.parse(storedHistory));
            }
        } catch (e) {
            console.error('Failed to parse generation history from localStorage', e);
            localStorage.removeItem('generationHistory');
        }
    }, []);

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        setError(null);
        try {
            const result = await googleSignIn();
            setUser(result.user);
            setAccessToken(result.accessToken);
            setNeedsAuth(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Google Sign-In failed.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleGoogleLogout = async () => {
        await googleLogout();
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
    };

    const handleAuthExpired = useCallback(() => {
        clearAccessToken();
        setAccessToken(null);
        setNeedsAuth(true);
        setError(t.driveAuthNeeded);
    }, [t.driveAuthNeeded]);

    const saveImageToDriveWithConfirm = async (
        imageUrl: string,
        fileName: string,
        onBusyChange: (busy: boolean) => void,
        onSaved: (webViewLink: string) => void
    ) => {
        let activeToken = accessToken;
        if (!activeToken || needsAuth) {
            try {
                setIsLoggingIn(true);
                const result = await googleSignIn();
                setUser(result.user);
                setAccessToken(result.accessToken);
                setNeedsAuth(false);
                activeToken = result.accessToken;
            } catch (err) {
                setError(err instanceof Error ? err.message : t.driveAuthNeeded);
                return;
            } finally {
                setIsLoggingIn(false);
            }
        }

        onBusyChange(true);
        setError(null);
        setNotice(null);

        try {
            const { blob, mimeType } = await imageUrlToBlob(imageUrl);
            const existing = await findFilesByName(activeToken, fileName);

            if (existing.length > 0) {
                const targetFile = existing[0];
                onBusyChange(false);
                setConfirmDialog({
                    isOpen: true,
                    title: t.overwriteTitle,
                    message: t.overwriteMessage,
                    items: [targetFile.name],
                    confirmLabel: t.confirmOverwrite,
                    cancelLabel: t.cancel,
                    isDestructive: false,
                    onConfirm: async () => {
                        setConfirmDialog((prev) => (prev ? { ...prev, isBusy: true } : null));
                        try {
                            const updated = await overwriteDriveFile(
                                activeToken!,
                                targetFile.id,
                                blob,
                                mimeType
                            );
                            setConfirmDialog(null);
                            setNotice(t.savedSuccess);
                            if (updated.webViewLink) {
                                onSaved(updated.webViewLink);
                            }
                        } catch (err) {
                            setConfirmDialog(null);
                            if (err instanceof DriveAuthError) {
                                handleAuthExpired();
                            } else {
                                setError(err instanceof Error ? err.message : 'Failed to overwrite file.');
                            }
                        }
                    },
                });
                return;
            }

            const uploaded = await uploadFileToDrive(activeToken, {
                name: fileName,
                blob,
                mimeType,
            });
            setNotice(t.savedSuccess);
            if (uploaded.webViewLink) {
                onSaved(uploaded.webViewLink);
            }
        } catch (err) {
            if (err instanceof DriveAuthError) {
                handleAuthExpired();
            } else {
                setError(err instanceof Error ? err.message : 'Failed to save to Google Drive.');
            }
        } finally {
            onBusyChange(false);
        }
    };

    const toggleLanguage = () => {
        setLanguage((prevLang) => (prevLang === 'en' ? 'ar' : 'en'));
    };

    const handleFileChange = useCallback((file: File | null) => {
        setEditedDriveLink(null);
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setOriginalImage(reader.result as string);
                setEditedImage(null);
            };
            reader.readAsDataURL(file);
        } else {
            setImageFile(null);
            setOriginalImage(null);
        }
    }, []);

    const handleImageEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile || !prompt) {
            setError('Please upload an image and provide an editing prompt.');
            return;
        }
        setIsEditing(true);
        setError(null);
        setNotice(null);
        setEditedImage(null);
        setEditedDriveLink(null);
        try {
            const result = await editImageWithPrompt(imageFile, prompt);
            setEditedImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsEditing(false);
        }
    };

    const handleYouTubeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!youtubeUrl) {
            setError('Please enter a YouTube video URL.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setNotice(null);
        setGeneratedCover(null);
        setCoverDriveLink(null);
        setFetchedThumbnailUrl(null);

        try {
            const videoId = getYouTubeVideoId(youtubeUrl);
            if (!videoId) {
                throw new Error('Invalid YouTube URL. Please check the link and try again.');
            }

            setGenerationStep(t.step1);
            const { text: content, source, thumbnailUrl } = await fetchYouTubeTranscript(videoId);
            if (thumbnailUrl) {
                setFetchedThumbnailUrl(thumbnailUrl);
            }

            setGenerationStep(t.step2);
            const summary = await summarizeTranscript(content);

            setGenerationStep(t.step3);
            const artPrompt = await createImagePromptFromSummary(summary, useThumbnail);

            setGenerationStep(t.step4);
            const imageUrl = await generateImage(artPrompt, useThumbnail ? thumbnailUrl : null);

            const newCover: GenerationHistoryItem = {
                id: new Date().toISOString(),
                youtubeUrl,
                summary,
                prompt: artPrompt,
                imageUrl,
                source,
            };

            setGeneratedCover(newCover);
            const updatedHistory = [newCover, ...generationHistory];
            setGenerationHistory(updatedHistory);
            localStorage.setItem('generationHistory', JSON.stringify(updatedHistory));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during cover generation.');
        } finally {
            setIsGenerating(false);
            setGenerationStep('');
        }
    };

    const handleToggleRecording = async () => {
        setError(null);
        setNotice(null);
        if (isRecording) {
            setIsRecording(false);
            stopTranscription();

            if (transcriptRef.current.trim().length > 0) {
                setIsProcessingAudio(true);
                setAudioDriveLinks({});
                try {
                    const summary = await summarizeAudioTranscript(transcriptRef.current);
                    const generatedPrompt = await createImagePromptFromAudioSummary(summary, false);
                    const images = await generateImagesFromPrompt(generatedPrompt, 2);
                    setAudioIdeas({ summary, prompt: generatedPrompt, images });
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred while processing audio.');
                } finally {
                    setIsProcessingAudio(false);
                }
            }
        } else {
            try {
                transcriptRef.current = '';
                setLiveTranscript('');
                setAudioIdeas(null);
                setAudioDriveLinks({});

                await startTranscription((transcriptPart) => {
                    transcriptRef.current += transcriptPart;
                    setLiveTranscript((prev) => prev + transcriptPart);
                });
                setIsRecording(true);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not start recording. Please check microphone permissions.');
            }
        }
    };

    const handleRequestConfirm = (dialog: ConfirmDialogState) => {
        setConfirmDialog({
            ...dialog,
            onConfirm: async () => {
                setConfirmDialog((prev) => (prev ? { ...prev, isBusy: true } : null));
                await dialog.onConfirm();
            },
        });
    };

    const renderEditor = () => (
        <main className="bg-brand-red-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-brand-red-600">
            <form onSubmit={handleImageEditSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <FileUploader
                            onFileChange={handleFileChange}
                            originalImage={originalImage}
                            label={t.uploadImageLabel}
                            promptText={t.uploadImagePrompt}
                            subtext={t.uploadImageSubtext}
                        />
                        <button
                            type="button"
                            onClick={() => setIsDrivePickerOpen(true)}
                            className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-brand-red-900/80 hover:bg-brand-red-700 border border-brand-red-600 text-red-100 font-semibold py-2 px-3 rounded-lg transition text-sm"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5zm8.58 0H8.86l6.56 11.5h7.43L16.29 3.5zM9.73 16L6.3 22h13.71l3.43-6H9.73z" />
                            </svg>
                            {t.importFromDrive}
                        </button>
                    </div>
                    <div>
                        <label htmlFor="prompt" className="block mb-2 text-sm font-medium text-red-100">
                            {t.editingPromptLabel}
                        </label>
                        <textarea
                            id="prompt"
                            rows={6}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full bg-brand-red-900 border border-brand-red-600 rounded-lg p-3 focus:ring-2 focus:ring-white focus:border-white transition duration-200 placeholder-red-200/50 text-white resize-none"
                            placeholder={t.editingPromptPlaceholder}
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isEditing || !imageFile || !prompt}
                    className="w-full flex items-center justify-center bg-white hover:bg-red-50 disabled:bg-brand-red-700 disabled:text-red-300 disabled:cursor-not-allowed text-brand-red-700 font-bold py-3 px-4 rounded-lg transition duration-300 shadow-lg disabled:shadow-none"
                >
                    {isEditing ? <LoadingSpinner text={t.loadingText} /> : t.generateEditButton}
                </button>
            </form>
        </main>
    );

    const renderYoutubeGenerator = () => (
        <main className="bg-brand-red-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-brand-red-600">
            <form onSubmit={handleYouTubeSubmit}>
                <label htmlFor="youtube-url" className="block mb-2 text-sm font-medium text-red-100">
                    {t.youtubeUrlLabel}
                </label>
                <input
                    id="youtube-url"
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full bg-brand-red-900 border border-brand-red-600 rounded-lg p-3 focus:ring-2 focus:ring-white focus:border-white transition duration-200 placeholder-red-200/50 text-white"
                    placeholder={t.youtubeUrlPlaceholder}
                    required
                />
                <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center">
                        <input
                            id="use-thumbnail"
                            type="checkbox"
                            checked={useThumbnail}
                            onChange={(e) => setUseThumbnail(e.target.checked)}
                            className="w-4 h-4 text-brand-red-600 bg-brand-red-900 border-brand-red-600 rounded focus:ring-white"
                        />
                        <label htmlFor="use-thumbnail" className="ms-2 text-sm font-medium text-red-100">
                            {t.useThumbnailLabel}
                        </label>
                    </div>
                    {fetchedThumbnailUrl && useThumbnail && (
                        <div className="flex items-center gap-2 text-sm text-red-200">
                            <span>{t.inspirationThumbnail}</span>
                            <img
                                src={fetchedThumbnailUrl}
                                alt="Current YouTube Thumbnail"
                                className="rounded-md shadow-md w-16 h-9 object-cover"
                            />
                        </div>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full mt-6 flex items-center justify-center bg-white hover:bg-red-50 disabled:bg-brand-red-700 disabled:text-red-300 disabled:cursor-not-allowed text-brand-red-700 font-bold py-3 px-4 rounded-lg transition duration-300 shadow-lg disabled:shadow-none"
                >
                    {isGenerating ? <LoadingSpinner text={t.loadingText} /> : t.generateCoverButton}
                </button>
            </form>
            {isGenerating && <p className="text-center mt-4 text-red-200 animate-pulse">{generationStep}</p>}
        </main>
    );

    const renderAudioGenerator = () => (
        <main className="bg-brand-red-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-brand-red-600">
            <div className="flex flex-col items-center">
                <button
                    onClick={handleToggleRecording}
                    disabled={isProcessingAudio}
                    className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-white hover:bg-red-50'
                    }`}
                >
                    {isRecording ? (
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-10 h-10 text-brand-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>
                <p className="mt-4 font-semibold text-red-100">
                    {isRecording ? t.stopButton : t.recordButton}
                </p>
                <div className="mt-6 w-full h-32 bg-brand-red-900/60 rounded-lg p-4 border border-brand-red-600 overflow-y-auto">
                    <p className="text-red-200 whitespace-pre-wrap">
                        {liveTranscript || <span className="text-red-200/50">{t.speakNow}</span>}
                    </p>
                </div>
            </div>
            {isProcessingAudio && (
                <div className="mt-6 flex justify-center">
                    <LoadingSpinner text={t.processingAudio} />
                </div>
            )}
            {audioIdeas && (
                <section className="mt-8 animate-fade-in">
                    <div>
                        <h3 className="text-lg font-semibold text-red-100">{t.audioSummaryLabel}</h3>
                        <p className="text-red-100 bg-brand-red-900/60 p-3 rounded-md mt-1">"{audioIdeas.summary}"</p>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold text-red-100">{t.generatedIdeasLabel}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            {audioIdeas.images.map((imageSrc, index) => (
                                <div key={index} className="space-y-2">
                                    <img
                                        src={imageSrc}
                                        alt={`Generated Idea ${index + 1}`}
                                        className="rounded-lg shadow-lg w-full aspect-video object-cover"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={savingAudioIdx === index}
                                            onClick={() =>
                                                saveImageToDriveWithConfirm(
                                                    imageSrc,
                                                    `audio-idea-${Date.now()}-${index + 1}.png`,
                                                    (busy) => setSavingAudioIdx(busy ? index : null),
                                                    (link) =>
                                                        setAudioDriveLinks((prev) => ({
                                                            ...prev,
                                                            [index]: link,
                                                        }))
                                                )
                                            }
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white hover:bg-red-50 text-brand-red-800 font-bold py-2 px-3 rounded-lg text-xs transition disabled:opacity-60"
                                        >
                                            {savingAudioIdx === index ? t.savingToDrive : t.saveToDrive}
                                        </button>
                                        {audioDriveLinks[index] && (
                                            <a
                                                href={audioDriveLinks[index]}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-brand-red-700 hover:bg-brand-red-600 text-white font-semibold py-2 px-3 rounded-lg text-xs transition"
                                            >
                                                {t.viewInDrive}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-red-200 bg-brand-red-900/60 p-3 rounded-md mt-3 italic text-sm">
                            {t.promptLabel}: "{audioIdeas.prompt}"
                        </p>
                    </div>
                </section>
            )}
        </main>
    );

    return (
        <div className="bg-brand-red-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-red-700 to-brand-red-900 min-h-screen text-white font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl">
                <header className="mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                        <button
                            onClick={toggleLanguage}
                            className="bg-brand-red-800/70 hover:bg-brand-red-700/80 border border-brand-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 text-sm"
                        >
                            {t.toggleLanguage}
                        </button>

                        <div className="flex items-center gap-2">
                            {!needsAuth && accessToken ? (
                                <div className="flex items-center gap-2 bg-brand-red-800/80 border border-brand-red-600 rounded-lg px-3 py-1.5">
                                    {user?.photoURL && (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName || 'User'}
                                            className="w-6 h-6 rounded-full"
                                            referrerPolicy="no-referrer"
                                        />
                                    )}
                                    <span className="text-xs font-semibold text-red-100 hidden sm:inline">
                                        {user?.email || t.driveConnected}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleGoogleLogout}
                                        className="text-xs text-white hover:underline font-bold ms-1"
                                    >
                                        {t.signOutGoogle}
                                    </button>
                                </div>
                            ) : (
                                <GoogleSignInButton
                                    onClick={handleGoogleLogin}
                                    isLoading={isLoggingIn}
                                    label={t.signInWithGoogle}
                                    compact
                                />
                            )}
                        </div>
                    </div>

                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-white">{t.appTitle}</h1>
                        <p className="text-red-100 mt-2 text-lg">{t.appDescription}</p>
                    </div>
                </header>

                <div className="mb-8 flex flex-wrap justify-center border-b border-brand-red-700">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`px-5 py-3 font-medium transition-colors duration-300 ${
                            activeTab === 'editor'
                                ? 'text-white border-b-2 border-white'
                                : 'text-red-200 hover:text-white'
                        }`}
                    >
                        {t.imageEditorTab}
                    </button>
                    <button
                        onClick={() => setActiveTab('youtube')}
                        className={`px-5 py-3 font-medium transition-colors duration-300 ${
                            activeTab === 'youtube'
                                ? 'text-white border-b-2 border-white'
                                : 'text-red-200 hover:text-white'
                        }`}
                    >
                        {t.youtubeCoverTab}
                    </button>
                    <button
                        onClick={() => setActiveTab('audio')}
                        className={`px-5 py-3 font-medium transition-colors duration-300 ${
                            activeTab === 'audio'
                                ? 'text-white border-b-2 border-white'
                                : 'text-red-200 hover:text-white'
                        }`}
                    >
                        {t.audioIdeaTab}
                    </button>
                    <button
                        onClick={() => setActiveTab('drive')}
                        className={`px-5 py-3 font-medium transition-colors duration-300 inline-flex items-center gap-2 ${
                            activeTab === 'drive'
                                ? 'text-white border-b-2 border-white'
                                : 'text-red-200 hover:text-white'
                        }`}
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5zm8.58 0H8.86l6.56 11.5h7.43L16.29 3.5zM9.73 16L6.3 22h13.71l3.43-6H9.73z" />
                        </svg>
                        {t.googleDriveTab}
                    </button>
                </div>

                {error && (
                    <div className="text-red-100 text-center mb-4 p-3 bg-red-950/70 rounded-lg border border-red-400">
                        {t.errorPrefix}: {error}
                    </div>
                )}

                {notice && (
                    <div className="text-white text-center mb-4 p-3 bg-brand-red-800/80 rounded-lg border border-red-200/60">
                        {notice}
                    </div>
                )}

                {activeTab === 'editor' && renderEditor()}
                {activeTab === 'youtube' && renderYoutubeGenerator()}
                {activeTab === 'audio' && renderAudioGenerator()}
                {activeTab === 'drive' && (
                    <DriveBrowser
                        user={user}
                        accessToken={accessToken}
                        needsAuth={needsAuth}
                        isLoggingIn={isLoggingIn}
                        language={language}
                        onLogin={handleGoogleLogin}
                        onLogout={handleGoogleLogout}
                        onAuthExpired={handleAuthExpired}
                        onEditDriveImage={(file) => {
                            handleFileChange(file);
                            setActiveTab('editor');
                        }}
                        onRequestConfirm={handleRequestConfirm}
                        onCloseConfirm={() => setConfirmDialog(null)}
                    />
                )}

                {activeTab === 'editor' && editedImage && originalImage && (
                    <ResultDisplay
                        originalImage={originalImage}
                        editedImage={editedImage}
                        prompt={prompt}
                        title={t.resultTitle}
                        originalLabel={t.originalLabel}
                        editedLabel={t.editedLabel}
                        promptLabel={t.promptLabel}
                        onSaveToDrive={() =>
                            saveImageToDriveWithConfirm(
                                editedImage,
                                `edited-${imageFile?.name || 'image.png'}`,
                                setIsSavingEditedToDrive,
                                setEditedDriveLink
                            )
                        }
                        isSavingToDrive={isSavingEditedToDrive}
                        savedDriveLink={editedDriveLink}
                        saveToDriveLabel={t.saveToDrive}
                        savingToDriveLabel={t.savingToDrive}
                        viewInDriveLabel={t.viewInDrive}
                    />
                )}

                {activeTab === 'youtube' && generatedCover && (
                    <CoverDisplay
                        data={generatedCover}
                        title={t.coverArtTitle}
                        downloadButtonText={t.downloadButton}
                        summaryLabel={t.summaryLabel}
                        promptLabel={t.imagenPromptLabel}
                        urlLabel={t.originalUrlLabel}
                        metadataNoticeText={t.metadataNotice}
                        onSaveToDrive={() =>
                            saveImageToDriveWithConfirm(
                                generatedCover.imageUrl,
                                `youtube-cover-${generatedCover.id.replace(/[:.]/g, '-')}.jpg`,
                                setIsSavingCoverToDrive,
                                setCoverDriveLink
                            )
                        }
                        isSavingToDrive={isSavingCoverToDrive}
                        savedDriveLink={coverDriveLink}
                        saveToDriveLabel={t.saveToDrive}
                        savingToDriveLabel={t.savingToDrive}
                        viewInDriveLabel={t.viewInDrive}
                    />
                )}

                {activeTab === 'youtube' && generationHistory.length > 0 && (
                    <GenerationHistory
                        history={generationHistory}
                        title={t.historyTitle}
                        promptLabel={t.promptLabel}
                    />
                )}
            </div>

            <DrivePickerModal
                isOpen={isDrivePickerOpen}
                accessToken={accessToken}
                needsAuth={needsAuth}
                isLoggingIn={isLoggingIn}
                language={language}
                onLogin={handleGoogleLogin}
                onAuthExpired={handleAuthExpired}
                onSelectFile={handleFileChange}
                onClose={() => setIsDrivePickerOpen(false)}
            />

            <ConfirmModal
                dialog={confirmDialog}
                onCancel={() => setConfirmDialog(null)}
            />
        </div>
    );
};

export default App;
