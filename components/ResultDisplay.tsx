import React from 'react';

interface ResultDisplayProps {
    originalImage: string;
    editedImage: string;
    prompt: string;
    title: string;
    originalLabel: string;
    editedLabel: string;
    promptLabel: string;
    onSaveToDrive?: () => void;
    isSavingToDrive?: boolean;
    savedDriveLink?: string | null;
    saveToDriveLabel?: string;
    savingToDriveLabel?: string;
    viewInDriveLabel?: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
    originalImage,
    editedImage,
    prompt,
    title,
    originalLabel,
    editedLabel,
    promptLabel,
    onSaveToDrive,
    isSavingToDrive = false,
    savedDriveLink,
    saveToDriveLabel = 'Save to Google Drive',
    savingToDriveLabel = 'Saving...',
    viewInDriveLabel = 'View in Google Drive',
}) => {
    return (
        <section className="mt-12 bg-brand-red-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-brand-red-600 animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-6 text-white">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center">
                    <h3 className="text-xl font-semibold mb-4 text-red-100">{originalLabel}</h3>
                    <img src={originalImage} alt="Original" className="rounded-lg shadow-lg mx-auto max-h-96" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-semibold mb-4 text-red-100">{editedLabel}</h3>
                    <img src={editedImage} alt={`Edited with prompt: ${prompt}`} className="rounded-lg shadow-lg mx-auto max-h-96" />
                    <p className="text-red-200 mt-3 italic text-sm">{promptLabel}: "{prompt}"</p>
                    {onSaveToDrive && (
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={onSaveToDrive}
                                disabled={isSavingToDrive}
                                className="inline-flex items-center gap-2 bg-white hover:bg-red-50 disabled:opacity-60 text-brand-red-800 font-bold py-2.5 px-4 rounded-lg transition shadow-md text-sm"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5zm8.58 0H8.86l6.56 11.5h7.43L16.29 3.5zM9.73 16L6.3 22h13.71l3.43-6H9.73z" />
                                </svg>
                                {isSavingToDrive ? savingToDriveLabel : saveToDriveLabel}
                            </button>
                            {savedDriveLink && (
                                <a
                                    href={savedDriveLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 bg-brand-red-700 hover:bg-brand-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition text-sm"
                                >
                                    {viewInDriveLabel}
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};