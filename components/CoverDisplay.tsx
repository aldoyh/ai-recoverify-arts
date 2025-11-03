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
}

export const CoverDisplay: React.FC<CoverDisplayProps> = ({ data, title, downloadButtonText, summaryLabel, promptLabel, urlLabel, metadataNoticeText }) => {
    return (
        <section className="mt-12 bg-brand-red-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-brand-red-600 animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-6 text-white">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                    <img src={data.imageUrl} alt={`Generated cover for ${data.youtubeUrl}`} className="rounded-lg shadow-lg mx-auto w-full" />
                     <a
                        href={data.imageUrl}
                        download={`cover-${data.id}.jpg`}
                        className="w-full mt-4 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                    >
                        {downloadButtonText}
                    </a>
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