import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Plus, Trash2, Save, Upload, X, Check } from 'lucide-react';
import { getBackgroundPresets, saveBackgroundPreset, deleteBackgroundPreset } from '../lib/presets';

const backgroundPresets = [
    {
        id: 'blank-white',
        name: 'White',
        path: '/backgrounds/white-solid.jpg'
    },
    {
        id: 'gmax',
        name: 'G-Max',
        path: '/backgrounds/G-max.jpg'
    },
    {
        id: 'gmax-kids',
        name: 'G-Max Kids',
        path: '/backgrounds/Gmax%20Kids.jpg'
    },
    {
        id: 'gmax-kids-2',
        name: 'Kids 2',
        path: '/backgrounds/Gmax%20Kid%202.jpg'
    }
];

export function BackgroundPresets({ onTemplateSelect, currentTemplate, currentStyles, onStyleChange, onCustomBackgroundUpload }) {
    const [customPresets, setCustomPresets] = useState([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [presetName, setPresetName] = useState('');

    const handleCustomBackgroundUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onCustomBackgroundUpload(reader.result);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    useEffect(() => {
        setCustomPresets(getBackgroundPresets());
    }, []);

    const allPresets = [...backgroundPresets, ...customPresets];

    const handleSaveCurrent = () => {
        if (!currentTemplate) {
            alert('Please select a background first');
            return;
        }
        if (!presetName.trim()) {
            alert('Please enter a preset name');
            return;
        }

        const newPreset = saveBackgroundPreset({
            name: presetName,
            backgroundPath: currentTemplate,
            headerColor: currentStyles.headerColor,
            rowColor: currentStyles.rowColor,
            textColor: currentStyles.textColor,
            scale: currentStyles.scale
        });

        if (newPreset) {
            setCustomPresets([...customPresets, newPreset]);
            setPresetName('');
            setShowSaveDialog(false);
        }
    };

    const handleApplyCustomPreset = (preset) => {
        onTemplateSelect(preset.backgroundPath);
        if (onStyleChange) {
            onStyleChange({
                ...currentStyles,
                headerColor: preset.headerColor,
                rowColor: preset.rowColor,
                textColor: preset.textColor,
                scale: preset.scale
            });
        }
    };

    const getPresetPath = (preset) => {
        return preset.path || preset.backgroundPath;
    };

    const handleDeletePreset = (presetId, e) => {
        e.stopPropagation();
        if (confirm('Delete this preset?')) {
            deleteBackgroundPreset(presetId);
            setCustomPresets(customPresets.filter(p => p.id !== presetId));
        }
    };

    return (
        <div className="space-y-3">
            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => setShowSaveDialog(true)}
                    disabled={!currentTemplate}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-black rounded-xl hover:bg-yellow-400 disabled:opacity-30 disabled:grayscale transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Archive
                </button>
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white/[0.05] text-white border border-white/10 rounded-xl hover:bg-white/[0.08] cursor-pointer transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5 text-yellow-500" />
                    Import
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleCustomBackgroundUpload}
                    />
                </label>
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                    <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Template Name..."
                        className="w-full px-4 py-3 text-sm border border-white/10 rounded-xl bg-black text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30 font-medium"
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveCurrent()}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveCurrent}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-black rounded-xl hover:bg-yellow-400 transition-all active:scale-95"
                        >
                            <Save className="w-4 h-4" />
                            Store
                        </button>
                        <button
                            onClick={() => setShowSaveDialog(false)}
                            className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                        >
                            Abort
                        </button>
                    </div>
                </div>
            )}

            {/* Preset Grid */}
            <div className="grid grid-cols-4 gap-2">
                {allPresets.map((preset) => {
                    const isSelected = currentTemplate === getPresetPath(preset);
                    return (
                        <div
                            key={preset.id}
                            className="relative group cursor-pointer"
                            onClick={() => {
                                if (preset.createdAt) {
                                    handleApplyCustomPreset(preset);
                                } else {
                                    onTemplateSelect(preset.path);
                                    if (preset.id === 'blank-white' && onStyleChange) {
                                        onStyleChange({
                                            ...currentStyles,
                                            x: 0,
                                            y: 0,
                                            scale: 1
                                        });
                                    }
                                }
                            }}
                        >
                            <div
                                className={cn(
                                    "aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300",
                                    isSelected
                                        ? "border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] scale-[0.98]"
                                        : "border-white/5 group-hover:border-yellow-500/50"
                                )}
                            >
                                <img
                                    src={getPresetPath(preset)}
                                    alt={preset.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />

                                {/* Selected Indicator */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-yellow-500/10 flex items-center justify-center backdrop-blur-[1px]">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                                            <Check className="w-5 h-5 text-black font-black" />
                                        </div>
                                    </div>
                                )}

                                {/* Delete button for custom presets */}
                                {preset.createdAt && (
                                    <button
                                        onClick={(e) => handleDeletePreset(preset.id, e)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        title="Delete"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {/* Label */}
                            <p className="text-[10px] text-center text-gray-400 mt-1.5 truncate">
                                {preset.name}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Clear Button */}
            {currentTemplate && (
                <button
                    onClick={() => onTemplateSelect(null)}
                    className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-red-500 transition-colors py-2"
                >
                    Wipe Background
                </button>
            )}
        </div>
    );
}