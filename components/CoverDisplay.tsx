import React from 'react';
import type { GenerationHistoryItem } from '../App';

interface CoverDisplayProps {
    data: GenerationHistoryItem;
    title: string;
    downloadButtonText: string;
    summaryLabel: string;
    promptLabel: string;
    urlLabel: string;
    metadataNoticeText: string;
    onSaveToDrive?: () => void;
    isSavingToDrive?: boolean;
    savedDriveLink?: string | null;
    saveToDriveLabel?: string;
    savingToDriveLabel?: string;
    viewInDriveLabel?: string;
}

export const CoverDisplay: React.FC<CoverDisplayProps> = ({
    data,
    title,
    downloadButtonText,
    summaryLabel,
    promptLabel,
    urlLabel,
    metadataNoticeText,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                    <img src={data.imageUrl} alt={`Generated cover for ${data.youtubeUrl}`} className="rounded-lg shadow-lg mx-auto w-full" />
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <a
                            href={data.imageUrl}
                            download={`cover-${data.id}.jpg`}
                            className="flex-1 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                        >
                            {downloadButtonText}
                        </a>
                        {onSaveToDrive && (
                            <button
                                type="button"
                                onClick={onSaveToDrive}
                                disabled={isSavingToDrive}
                                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-red-50 disabled:opacity-60 text-brand-red-800 font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5zm8.58 0H8.86l6.56 11.5h7.43L16.29 3.5zM9.73 16L6.3 22h13.71l3.43-6H9.73z" />
                                </svg>
                                {isSavingToDrive ? savingToDriveLabel : saveToDriveLabel}
                            </button>
                        )}
                    </div>
                    {savedDriveLink && (
                        <div className="mt-3 text-center">
                            <a
                                href={savedDriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-red-100 hover:text-white underline font-semibold"
                            >
                                {viewInDriveLabel} →
                            </a>
                        </div>
                    )}
                </div>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-red-100">{summaryLabel}</h3>
                        <p className="text-red-200 bg-brand-red-900/50 p-3 rounded-md mt-1">"{data.summary}"</p>
                        {data.source === 'metadata' && (
                            <p className="text-xs text-amber-300 mt-2 text-center md:text-start rtl:md:text-right ltr:md:text-left">{metadataNoticeText}</p>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-red-100">{promptLabel}</h3>
                        <p className="text-red-200 bg-brand-red-900/50 p-3 rounded-md mt-1 italic">"{data.prompt}"</p>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-red-100">{urlLabel}</h3>
                        <a href={data.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:underline break-all">{data.youtubeUrl}</a>
                    </div>
                </div>
            </div>
        </section>
    );
};