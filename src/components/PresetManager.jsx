import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Download, Upload, Plus, Check, Star, X, Edit2 } from 'lucide-react';
import {
    getPresets,
    addPreset,
    deletePreset,
    updatePreset,
    createDefaultPreset,
    stateToPresetSettings,
    presetSettingsToState,
    exportPresetsAsJSON,
    importPresetsFromJSON
} from '../lib/presetStorage';

export function PresetManager({
    chartStyles,
    customTemplate,
    selectedBrand,
    onApplyPreset,
    onClose
}) {
    const [presets, setPresets] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [showSaveNew, setShowSaveNew] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');

    useEffect(() => {
        setPresets(getPresets());
    }, []);

    const handleSaveNewPreset = () => {
        if (!newPresetName.trim()) return;

        const preset = createDefaultPreset(newPresetName.trim());
        preset.settings = stateToPresetSettings(chartStyles, customTemplate, selectedBrand);

        addPreset(preset);
        setPresets(getPresets());
        setNewPresetName('');
        setShowSaveNew(false);
    };

    const handleUpdatePreset = (id) => {
        const settings = stateToPresetSettings(chartStyles, customTemplate, selectedBrand);
        updatePreset(id, { settings, updatedAt: new Date().toISOString() });
        setPresets(getPresets());
    };

    const handleDeletePreset = (id) => {
        if (confirm('Delete this preset?')) {
            deletePreset(id);
            setPresets(getPresets());
        }
    };

    const handleApplyPreset = (preset) => {
        const state = presetSettingsToState(preset.settings);
        onApplyPreset(state);
    };

    const handleRename = (id) => {
        if (editName.trim()) {
            updatePreset(id, { name: editName.trim() });
            setPresets(getPresets());
        }
        setEditingId(null);
        setEditName('');
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                await importPresetsFromJSON(file);
                setPresets(getPresets());
            } catch (err) {
                alert('Failed to import presets: ' + err.message);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Preset Manager
                    </h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 p-4 border-b border-white/5">
                    <button
                        onClick={() => setShowSaveNew(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-black text-sm font-medium rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Save Current
                    </button>
                    <button
                        onClick={exportPresetsAsJSON}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Import
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                </div>

                {/* Save New Form */}
                {showSaveNew && (
                    <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Preset name..."
                                value={newPresetName}
                                onChange={(e) => setNewPresetName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveNewPreset()}
                                className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                                autoFocus
                            />
                            <button
                                onClick={handleSaveNewPreset}
                                className="px-3 py-2 bg-yellow-500 text-black text-sm font-medium rounded-lg hover:bg-yellow-400 transition-colors"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { setShowSaveNew(false); setNewPresetName(''); }}
                                className="px-3 py-2 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Preset List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {presets.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No presets saved yet</p>
                            <p className="text-xs mt-1">Save your current settings as a preset</p>
                        </div>
                    ) : (
                        presets.map((preset) => (
                            <div
                                key={preset.id}
                                className="group flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors"
                            >
                                {/* Color Preview */}
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                    <div
                                        className="w-full h-1/2"
                                        style={{ backgroundColor: preset.settings?.colors?.header || '#000' }}
                                    />
                                    <div
                                        className="w-full h-1/2"
                                        style={{ backgroundColor: preset.settings?.colors?.row || '#f3f4f6' }}
                                    />
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    {editingId === preset.id ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onBlur={() => handleRename(preset.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleRename(preset.id)}
                                            className="w-full px-2 py-1 bg-black/30 border border-yellow-500 rounded text-white text-sm focus:outline-none"
                                            autoFocus
                                        />
                                    ) : (
                                        <h4 className="text-white font-medium text-sm truncate">{preset.name}</h4>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        {new Date(preset.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleApplyPreset(preset)}
                                        className="p-1.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors"
                                        title="Apply"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleUpdatePreset(preset.id)}
                                        className="p-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                                        title="Update with current"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => { setEditingId(preset.id); setEditName(preset.name); }}
                                        className="p-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                                        title="Rename"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePreset(preset.id)}
                                        className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
