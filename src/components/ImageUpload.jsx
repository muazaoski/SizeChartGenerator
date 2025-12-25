import React, { useCallback, useState } from 'react';
import { Upload, X, FileImage, ImagePlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { extractSKUFromImage } from '../lib/skuExtractor';

export function ImageUpload({ onImageSelect, onSKUExtracted, apiKey }) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files[0]);
        }
    };

    const handleFiles = async (file) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                setPreview(reader.result);
                onImageSelect(reader.result);
                // SKU extraction is now handled during the main processing step
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = (e) => {
        e.stopPropagation();
        setPreview(null);
        onImageSelect(null);
    };

    return (
        <div className="w-full">
            <div
                className={cn(
                    "relative rounded-xl transition-all duration-200 ease-out flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden",
                    isDragging
                        ? "border-2 border-violet-500 bg-violet-500/10 scale-[1.01]"
                        : preview
                            ? "border border-white/10 bg-slate-800/30"
                            : "border-2 border-dashed border-white/10 hover:border-violet-500/50 bg-slate-800/20 hover:bg-slate-800/40",
                    preview ? "p-2 min-h-[180px]" : "p-6 min-h-[180px]"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !preview && document.getElementById('file-upload').click()}
            >
                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleChange}
                />

                {preview ? (
                    <div className="relative w-full h-full flex items-center justify-center group">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-w-full max-h-[200px] object-contain rounded-lg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end justify-center pb-4 rounded-lg">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => document.getElementById('file-upload').click()}
                                    className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-xs font-medium rounded-lg hover:bg-white/20 transition-colors flex items-center gap-1.5"
                                >
                                    <ImagePlus className="w-3.5 h-3.5" />
                                    Replace
                                </button>
                                <button
                                    onClick={clearImage}
                                    className="px-3 py-1.5 bg-red-500/80 backdrop-blur-sm text-white text-xs font-medium rounded-lg hover:bg-red-500 transition-colors flex items-center gap-1.5"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 pointer-events-none py-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-xl flex items-center justify-center mx-auto border border-violet-500/20">
                            <Upload className="w-5 h-5 text-violet-400" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-white">Drop image here</h3>
                            <p className="text-xs text-gray-500">
                                or click to browse files
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-600">
                            <FileImage className="w-3 h-3" />
                            <span>JPG, PNG, WEBP</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
