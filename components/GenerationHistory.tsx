import React from 'react';
import type { GenerationHistoryItem } from '../App';

interface GenerationHistoryProps {
    history: GenerationHistoryItem[];
    title: string;
    promptLabel: string;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({ history, title, promptLabel }) => {
    if (history.length === 0) {
        return null;
    }

    return (
        <section className="mt-12 bg-brand-red-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-brand-red-600 animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-6 text-white">{title}</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pe-2">
                {history.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-brand-red-900/50 p-3 rounded-lg">
                        <img src={item.imageUrl} alt="Generated thumbnail" className="w-24 h-auto aspect-video rounded-md object-cover flex-shrink-0" />
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-red-100 truncate" title={item.prompt}>
                                {promptLabel}: <span className="italic font-normal">"{item.prompt}"</span>
                            </p>
                            <a href={item.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-white hover:underline truncate block" title={item.youtubeUrl}>
                                {item.youtubeUrl}
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};