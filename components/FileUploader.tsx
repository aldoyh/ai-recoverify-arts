import React, { useCallback } from 'react';

interface FileUploaderProps {
    onFileChange: (file: File | null) => void;
    originalImage: string | null;
    label: string;
    promptText: string;
    subtext: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileChange, originalImage, label, promptText, subtext }) => {
    const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileChange(e.dataTransfer.files[0]);
        }
    }, [onFileChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileChange(e.target.files[0]);
        }
    };

    return (
        <div>
            <label htmlFor="image-upload" className="block mb-2 text-sm font-medium text-red-100">
                {label}
            </label>
            <label
                htmlFor="image-upload-input"
                className="flex justify-center items-center w-full h-48 border-2 border-dashed border-brand-red-600 rounded-lg cursor-pointer bg-brand-red-900 hover:bg-brand-red-800/60 transition duration-300"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {originalImage ? (
                    <img src={originalImage} alt="Preview" className="h-full w-full object-contain p-2" />
                ) : (
                    <div className="text-center text-red-200">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2">{promptText}</p>
                        <p className="text-xs">{subtext}</p>
                    </div>
                )}
                <input
                    id="image-upload-input"
                    name="image"
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleInputChange}
                />
            </label>
        </div>
    );
};