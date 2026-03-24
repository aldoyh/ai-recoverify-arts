import React from 'react';

interface ResultDisplayProps {
    originalImage: string;
    editedImage: string;
    prompt: string;
    title: string;
    originalLabel: string;
    editedLabel: string;
    promptLabel: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ originalImage, editedImage, prompt, title, originalLabel, editedLabel, promptLabel }) => {
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
                </div>
            </div>
        </section>
    );
};