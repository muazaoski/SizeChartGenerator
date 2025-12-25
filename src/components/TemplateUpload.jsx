import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function TemplateUpload({ onTemplateSelect, currentTemplate }) {
    const [isDragging, setIsDragging] = useState(false);

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

    const handleFiles = (file) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onTemplateSelect(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold mb-2">Background Template</h3>
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-4 transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer min-h-[150px]",
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
                    currentTemplate ? "border-none p-0 overflow-hidden bg-black/5" : ""
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !currentTemplate && document.getElementById('template-upload').click()}
            >
                <input
                    id="template-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleChange}
                />

                {currentTemplate ? (
                    <div className="relative w-full h-full min-h-[150px] flex items-center justify-center group">
                        <img
                            src={currentTemplate}
                            alt="Template"
                            className="max-w-full max-h-[200px] object-contain rounded-lg shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTemplateSelect(null);
                                }}
                                className="bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/90 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 pointer-events-none">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Upload Background</p>
                            <p className="text-xs text-muted-foreground">
                                1080x1080 Recommended
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
