import React, { useState, useCallback, useEffect } from 'react';
import { editImageWithPrompt, summarizeTranscript, createImagePromptFromSummary, generateImage, fetchYouTubeTranscript } from './services/geminiService';
import { FileUploader } from './components/FileUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { CoverDisplay } from './components/CoverDisplay';
import { GenerationHistory } from './components/GenerationHistory';

export type GenerationHistoryItem = {
    id: string;
    youtubeUrl: string;
    summary: string;
    prompt: string;
    imageUrl: string;
    source: 'transcript' | 'metadata';
};

type Language = 'ar' | 'en';

const translations = {
  ar: {
    appTitle: 'مجموعة أدوات Gemini الإبداعية',
    appDescription: 'تحرير صور مدعوم بالذكاء الاصطناعي وإنشاء أغلفة يوتيوب.',
    imageEditorTab: 'محرر الصور',
    youtubeCoverTab: 'مولّد أغلفة يوتيوب',
    errorPrefix: 'خطأ',
    uploadImageLabel: 'رفع صورة',
    uploadImagePrompt: 'انقر للرفع أو اسحب وأفلت',
    uploadImageSubtext: 'PNG, JPG, GIF حتى 10 ميجابايت',
    editingPromptLabel: 'موجه التحرير',
    editingPromptPlaceholder: 'مثال: أضف فلترًا قديمًا، اجعل الخلفية ضبابية...',
    generateEditButton: 'إنشاء التعديل',
    youtubeUrlLabel: 'رابط فيديو يوتيوب',
    youtubeUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
    generateCoverButton: 'إنشاء غلاف',
    useThumbnailLabel: 'استخدام الصورة المصغرة الحالية كمصدر إلهام؟',
    inspirationThumbnail: 'الصورة المصغرة للإلهام:',
    step1: 'الخطوة 1/4: جلب بيانات الفيديو...',
    step2: 'الخطوة 2/4: التلخيص باستخدام Gemini Pro...',
    step3: 'الخطوة 3/4: إنشاء موجه باستخدام Gemini Flash...',
    step4: 'الخطوة 4/4: إنشاء الصورة...',
    resultTitle: 'النتيجة',
    originalLabel: 'الأصلية',
    editedLabel: 'المعدلة',
    promptLabel: 'الموجه',
    coverArtTitle: 'صورة الغلاف المُنشأة',
    downloadButton: 'تحميل الصورة',
    summaryLabel: 'ملخص الذكاء الاصطناعي',
    imagenPromptLabel: 'موجه الصورة',
    originalUrlLabel: 'الرابط الأصلي',
    historyTitle: 'سجل الإنشاء',
    loadingText: 'جاري الإنشاء...',
    toggleToEnglish: 'English',
    metadataNotice: 'ملاحظة: تم إنشاء هذا الملخص باستخدام عنوان الفيديو ووصفه لعدم توفر نص مكتوب.',
  },
  en: {
    appTitle: 'Gemini Creative Suite',
    appDescription: 'AI-powered image editing and YouTube cover generation.',
    imageEditorTab: 'Image Editor',
    youtubeCoverTab: 'YouTube Cover Generator',
    errorPrefix: 'Error',
    uploadImageLabel: 'Upload Image',
    uploadImagePrompt: 'Click to upload or drag and drop',
    uploadImageSubtext: 'PNG, JPG, GIF up to 10MB',
    editingPromptLabel: 'Editing Prompt',
    editingPromptPlaceholder: 'e.g., Add a retro filter, make the background blurry...',
    generateEditButton: 'Generate Edit',
    youtubeUrlLabel: 'YouTube Video URL',
    youtubeUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
    generateCoverButton: 'Generate Cover Art',
    useThumbnailLabel: 'Use current thumbnail as inspiration?',
    inspirationThumbnail: 'Inspiration Thumbnail:',
    step1: 'Step 1/4: Fetching video data...',
    step2: 'Step 2/4: Summarizing with Gemini Pro...',
    step3: 'Step 3/4: Creating prompt with Gemini Flash...',
    step4: 'Step 4/4: Generating image...',
    resultTitle: 'Result',
    originalLabel: 'Original',
    editedLabel: 'Edited',
    promptLabel: 'Prompt',
    coverArtTitle: 'Generated Cover Art',
    downloadButton: 'Download Image',
    summaryLabel: 'AI Summary',
    imagenPromptLabel: 'Image Prompt',
    originalUrlLabel: 'Original URL',
    historyTitle: 'Generation History',
    loadingText: 'Generating...',
    toggleToArabic: 'العربية',
    metadataNotice: "Note: This summary was generated using the video's title and description as a transcript was unavailable.",
  },
};

const getYouTubeVideoId = (url: string): string | null => {
    // This regex handles standard watch URLs, short youtu.be URLs, and live URLs.
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};


const App: React.FC = () => {
    // General State
    const [language, setLanguage] = useState<Language>('ar');
    const [activeTab, setActiveTab] = useState<'editor' | 'youtube'>('youtube');
    const [error, setError] = useState<string | null>(null);
    const t = translations[language];

    // Image Editor State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    // YouTube Cover Generator State
    const [youtubeUrl, setYoutubeUrl] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generationStep, setGenerationStep] = useState<string>('');
    const [generatedCover, setGeneratedCover] = useState<GenerationHistoryItem | null>(null);
    const [generationHistory, setGenerationHistory] = useState<GenerationHistoryItem[]>([]);
    const [useThumbnail, setUseThumbnail] = useState<boolean>(false);
    const [fetchedThumbnailUrl, setFetchedThumbnailUrl] = useState<string | null>(null);

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('generationHistory');
            if (storedHistory) {
                setGenerationHistory(JSON.parse(storedHistory));
            }
        } catch (e) {
            console.error("Failed to parse generation history from localStorage", e);
            localStorage.removeItem('generationHistory');
        }
    }, []);

    const toggleLanguage = () => {
        setLanguage(prevLang => prevLang === 'en' ? 'ar' : 'en');
    };

    const handleFileChange = useCallback((file: File | null) => {
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
        setEditedImage(null);
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
        setGeneratedCover(null);
        setFetchedThumbnailUrl(null);

        try {
            const videoId = getYouTubeVideoId(youtubeUrl);
            if (!videoId) {
                throw new Error("Invalid YouTube URL. Please check the link and try again.");
            }
            
            setGenerationStep(t.step1);
            const { text: content, source, thumbnailUrl } = await fetchYouTubeTranscript(videoId);
            if(thumbnailUrl) {
                setFetchedThumbnailUrl(thumbnailUrl);
            }

            setGenerationStep(t.step2);
            const summary = await summarizeTranscript(content, source);

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


    const renderEditor = () => (
        <main className="bg-brand-red-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-brand-red-600">
            <form onSubmit={handleImageEditSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <FileUploader 
                        onFileChange={handleFileChange} 
                        originalImage={originalImage}
                        label={t.uploadImageLabel}
                        promptText={t.uploadImagePrompt}
                        subtext={t.uploadImageSubtext}
                    />
                    <div>
                        <label htmlFor="prompt" className="block mb-2 text-sm font-medium text-red-100">
                            {t.editingPromptLabel}
                        </label>
                        <textarea
                            id="prompt"
                            rows={4}
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
                    className="w-full flex items-center justify-center bg-white hover:bg-red-100 disabled:bg-brand-red-700 disabled:text-red-400 disabled:cursor-not-allowed text-brand-red-700 font-bold py-3 px-4 rounded-lg transition duration-300 shadow-lg disabled:shadow-none"
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
                            className="w-4 h-4 text-brand-red-500 bg-brand-red-700 border-brand-red-600 rounded focus:ring-white"
                        />
                        <label htmlFor="use-thumbnail" className="ms-2 text-sm font-medium text-red-100">{t.useThumbnailLabel}</label>
                    </div>
                    {fetchedThumbnailUrl && useThumbnail && (
                         <div className="flex items-center gap-2 text-sm text-red-200">
                             <span>{t.inspirationThumbnail}</span>
                             <img src={fetchedThumbnailUrl} alt="Current YouTube Thumbnail" className="rounded-md shadow-md w-16 h-9 object-cover" />
                         </div>
                    )}
                </div>
                 <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full mt-6 flex items-center justify-center bg-white hover:bg-red-100 disabled:bg-brand-red-700 disabled:text-red-400 disabled:cursor-not-allowed text-brand-red-700 font-bold py-3 px-4 rounded-lg transition duration-300 shadow-lg disabled:shadow-none"
                >
                    {isGenerating ? <LoadingSpinner text={t.loadingText} /> : t.generateCoverButton}
                </button>
            </form>
            {isGenerating && <p className="text-center mt-4 text-red-200 animate-pulse">{generationStep}</p>}
        </main>
    );

    return (
        <div className="bg-brand-red-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-red-700 to-brand-red-900 min-h-screen text-white font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl">
                 <header className="text-center mb-8 relative">
                    <div className="absolute top-0 start-0">
                        <button
                            onClick={toggleLanguage}
                            className="bg-brand-red-800/50 hover:bg-brand-red-700/50 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                        >
                            {language === 'en' ? t.toggleToArabic : t.toggleToEnglish}
                        </button>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                        {t.appTitle}
                    </h1>
                    <p className="text-red-200 mt-2 text-lg">
                        {t.appDescription}
                    </p>
                </header>

                <div className="mb-8 flex justify-center border-b border-brand-red-700">
                    <button onClick={() => setActiveTab('editor')} className={`px-6 py-3 font-medium transition-colors duration-300 ${activeTab === 'editor' ? 'text-white border-b-2 border-white' : 'text-red-200 hover:text-white'}`}>{t.imageEditorTab}</button>
                    <button onClick={() => setActiveTab('youtube')} className={`px-6 py-3 font-medium transition-colors duration-300 ${activeTab === 'youtube' ? 'text-white border-b-2 border-white' : 'text-red-200 hover:text-white'}`}>{t.youtubeCoverTab}</button>
                </div>
                
                {error && <div className="text-red-200 text-center mb-4 p-3 bg-brand-red-500/30 rounded-lg border border-red-400">{t.errorPrefix}: {error}</div>}

                {activeTab === 'editor' ? renderEditor() : renderYoutubeGenerator()}

                {activeTab === 'editor' && editedImage && originalImage && (
                    <ResultDisplay 
                        originalImage={originalImage} 
                        editedImage={editedImage}
                        prompt={prompt} 
                        title={t.resultTitle}
                        originalLabel={t.originalLabel}
                        editedLabel={t.editedLabel}
                        promptLabel={t.promptLabel}
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
        </div>
    );
};

export default App;