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
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg hover:bg-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Save Preset
                </button>
                <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-700/50 text-gray-300 border border-white/5 rounded-lg hover:bg-slate-700 cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
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
                <div className="bg-slate-800/50 border border-white/5 p-3 rounded-xl space-y-3">
                    <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Preset name..."
                        className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg bg-slate-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveCurrent()}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveCurrent}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Save
                        </button>
                        <button
                            onClick={() => setShowSaveDialog(false)}
                            className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
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
                                    "aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200",
                                    isSelected
                                        ? "border-violet-500 ring-2 ring-violet-500/30 scale-95"
                                        : "border-white/10 hover:border-violet-500/50 hover:scale-[0.98]"
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
                                    <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                                        <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-white" />
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
                    className="w-full text-xs text-gray-500 hover:text-red-400 transition-colors py-1"
                >
                    Clear background
                </button>
            )}
        </div>
    );
}