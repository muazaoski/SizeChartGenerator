import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Type, Check, X } from 'lucide-react';
import { getCustomColorPresets, saveCustomColorPreset, deleteCustomColorPreset } from '../lib/presets';

const defaultColorPresets = [
    {
        id: 'classic',
        name: 'Classic',
        headerColor: '#000000',
        rowColor: '#f3f4f6',
        textColor: '#000000'
    },
    {
        id: 'ocean',
        name: 'Ocean',
        headerColor: '#0ea5e9',
        rowColor: '#e0f2fe',
        textColor: '#0c4a6e'
    },
    {
        id: 'forest',
        name: 'Forest',
        headerColor: '#16a34a',
        rowColor: '#dcfce7',
        textColor: '#14532d'
    },
    {
        id: 'sunset',
        name: 'Sunset',
        headerColor: '#f97316',
        rowColor: '#fed7aa',
        textColor: '#7c2d12'
    },
    {
        id: 'royal',
        name: 'Royal',
        headerColor: '#7c3aed',
        rowColor: '#ede9fe',
        textColor: '#4c1d95'
    },
    {
        id: 'rose',
        name: 'Rose',
        headerColor: '#e11d48',
        rowColor: '#ffe4e6',
        textColor: '#831843'
    },
    {
        id: 'midnight',
        name: 'Midnight',
        headerColor: '#1e293b',
        rowColor: '#e2e8f0',
        textColor: '#0f172a'
    },
    {
        id: 'gold',
        name: 'Gold',
        headerColor: '#d97706',
        rowColor: '#fef3c7',
        textColor: '#78350f'
    }
];

export function ColorPresets({ onStyleChange, currentStyles }) {
    const [customPresets, setCustomPresets] = useState([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [presetName, setPresetName] = useState('');

    useEffect(() => {
        setCustomPresets(getCustomColorPresets());
    }, []);

    const allPresets = [...defaultColorPresets, ...customPresets];

    const handleSaveCurrent = () => {
        if (!presetName.trim()) {
            alert('Please enter a preset name');
            return;
        }

        const newPreset = saveCustomColorPreset({
            name: presetName,
            headerColor: currentStyles.headerColor,
            rowColor: currentStyles.rowColor,
            textColor: currentStyles.textColor
        });

        if (newPreset) {
            setCustomPresets([...customPresets, newPreset]);
            setPresetName('');
            setShowSaveDialog(false);
        }
    };

    const handleDeletePreset = (presetId, e) => {
        e.stopPropagation();
        if (confirm('Delete this preset?')) {
            deleteCustomColorPreset(presetId);
            setCustomPresets(customPresets.filter(p => p.id !== presetId));
        }
    };

    const handleChange = (key, value) => {
        const newStyles = { ...currentStyles, [key]: value };
        onStyleChange(newStyles);
    };

    const isActivePreset = (preset) => {
        return currentStyles.headerColor === preset.headerColor &&
            currentStyles.rowColor === preset.rowColor &&
            currentStyles.textColor === preset.textColor;
    };

    return (
        <div className="space-y-4">
            {/* Chart Title */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5" />
                    Chart Title
                </label>
                <input
                    type="text"
                    value={currentStyles.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g. MEN'S T-SHIRT SIZE GUIDE"
                    className="w-full px-4 py-3 text-sm border border-white/10 rounded-xl bg-white/[0.03] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 font-medium"
                />
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Header</label>
                    <div className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                        <input
                            type="color"
                            value={currentStyles.headerColor || '#000000'}
                            onChange={(e) => handleChange('headerColor', e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent overflow-hidden"
                        />
                        <span className="text-[10px] text-gray-300 font-mono font-bold">{currentStyles.headerColor?.toUpperCase()}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Alt Row</label>
                    <div className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                        <input
                            type="color"
                            value={currentStyles.rowColor || '#f3f4f6'}
                            onChange={(e) => handleChange('rowColor', e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent overflow-hidden"
                        />
                        <span className="text-[10px] text-gray-300 font-mono font-bold">{currentStyles.rowColor?.toUpperCase()}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Text</label>
                    <div className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                        <input
                            type="color"
                            value={currentStyles.textColor || '#000000'}
                            onChange={(e) => handleChange('textColor', e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent overflow-hidden"
                        />
                        <span className="text-[10px] text-gray-300 font-mono font-bold">{currentStyles.textColor?.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={() => setShowSaveDialog(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/20 transition-all active:scale-[0.98]"
            >
                <Plus className="w-4 h-4" />
                Capture as Preset
            </button>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Identifier (e.g. Neo-Noir)"
                        className="w-full px-4 py-3 text-sm border border-white/10 rounded-xl bg-black text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 font-medium"
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveCurrent()}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveCurrent}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-black rounded-xl hover:bg-yellow-400 transition-all active:scale-[0.95]"
                        >
                            <Save className="w-4 h-4" />
                            Store Preset
                        </button>
                        <button
                            onClick={() => setShowSaveDialog(false)}
                            className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                        >
                            Void
                        </button>
                    </div>
                </div>
            )}

            {/* Color Presets Grid */}
            <div className="space-y-2">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Quick Presets</p>
                <div className="grid grid-cols-4 gap-2">
                    {allPresets.map((preset) => {
                        const isActive = isActivePreset(preset);
                        return (
                            <div
                                key={preset.id}
                                className="group cursor-pointer relative"
                                onClick={() => {
                                    const newStyles = {
                                        scale: currentStyles.scale || 1,
                                        x: currentStyles.x || 0,
                                        y: currentStyles.y || 0,
                                        title: currentStyles.title || '',
                                        logo: currentStyles.logo,
                                        table: currentStyles.table,
                                        note: currentStyles.note,
                                        headerColor: preset.headerColor,
                                        rowColor: preset.rowColor,
                                        textColor: preset.textColor
                                    };
                                    onStyleChange(newStyles);
                                }}
                            >
                                <div className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${isActive
                                    ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] scale-[0.98]'
                                    : 'border-white/5 group-hover:border-yellow-500/50'
                                    }`}>
                                    {/* Color preview stripes */}
                                    <div className="w-full h-1/3" style={{ backgroundColor: preset.headerColor }}></div>
                                    <div className="w-full h-1/3" style={{ backgroundColor: preset.rowColor }}></div>
                                    <div className="w-full h-1/3 flex items-center justify-center bg-zinc-900 border-t border-white/5">
                                        <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: preset.textColor }}>Aa</span>
                                    </div>

                                    {/* Selected Indicator */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-yellow-500/10 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                                            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                                                <Check className="w-4 h-4 text-black font-black" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Delete button for custom presets */}
                                    {preset.createdAt && (
                                        <button
                                            onClick={(e) => handleDeletePreset(preset.id, e)}
                                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            title="Delete"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-[9px] text-center text-gray-500 mt-1 truncate">
                                    {preset.name}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}