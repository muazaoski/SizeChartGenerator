import React, { useState, useEffect } from 'react';
import { Save, Trash2, Download, Upload, Plus, Check, Star, X, Edit2, Palette, Image, Layout } from 'lucide-react';
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
    const [showCreate, setShowCreate] = useState(false);
    const [newPreset, setNewPreset] = useState({
        name: '',
        headerColor: '#000000',
        rowColor: '#f3f4f6',
        textColor: '#000000',
        background: '/backgrounds/white-solid.jpg'
    });

    useEffect(() => {
        setPresets(getPresets());
    }, []);

    const handleSaveNewPreset = () => {
        if (!newPreset.name.trim()) return;

        const preset = createDefaultPreset(newPreset.name.trim());
        preset.settings = {
            ...preset.settings,
            colors: {
                header: newPreset.headerColor,
                row: newPreset.rowColor,
                text: newPreset.textColor,
                altRow: '#ffffff',
                border: '#e5e7eb'
            },
            background: {
                type: 'solid',
                value: newPreset.background
            }
        };

        addPreset(preset);
        setPresets(getPresets());
        setNewPreset({
            name: '',
            headerColor: '#000000',
            rowColor: '#f3f4f6',
            textColor: '#000000',
            background: '/backgrounds/white-solid.jpg'
        });
        setShowCreate(false);
    };

    const handleSaveCurrentAsPreset = () => {
        const name = prompt('Preset name:');
        if (!name?.trim()) return;

        const preset = createDefaultPreset(name.trim());
        preset.settings = stateToPresetSettings(chartStyles, customTemplate, selectedBrand);

        addPreset(preset);
        setPresets(getPresets());
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

    const backgroundOptions = [
        { value: '/backgrounds/white-solid.jpg', label: 'White' },
        { value: '/backgrounds/black-solid.jpg', label: 'Black' },
        { value: '/backgrounds/gray-solid.jpg', label: 'Gray' },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
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
                <div className="flex items-center gap-2 p-4 border-b border-white/5 flex-wrap">
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${showCreate ? 'bg-yellow-500 text-black' : 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                            }`}
                    >
                        <Plus className="w-4 h-4" />
                        Create New
                    </button>
                    <button
                        onClick={handleSaveCurrentAsPreset}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <Save className="w-4 h-4" />
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

                {/* Create New Preset Form */}
                {showCreate && (
                    <div className="p-4 bg-yellow-500/5 border-b border-yellow-500/20 space-y-4">
                        <h3 className="text-sm font-bold text-yellow-500 uppercase">Create New Preset</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="col-span-2">
                                <label className="text-xs text-gray-500 uppercase">Preset Name</label>
                                <input
                                    type="text"
                                    placeholder="My Brand Preset..."
                                    value={newPreset.name}
                                    onChange={(e) => setNewPreset(p => ({ ...p, name: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                                />
                            </div>

                            {/* Colors */}
                            <div className="space-y-3">
                                <label className="text-xs text-gray-500 uppercase flex items-center gap-1">
                                    <Palette className="w-3 h-3" /> Colors
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={newPreset.headerColor}
                                            onChange={(e) => setNewPreset(p => ({ ...p, headerColor: e.target.value }))}
                                            className="w-8 h-8 rounded cursor-pointer border border-white/10"
                                        />
                                        <span className="text-xs text-gray-400">Header</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={newPreset.rowColor}
                                            onChange={(e) => setNewPreset(p => ({ ...p, rowColor: e.target.value }))}
                                            className="w-8 h-8 rounded cursor-pointer border border-white/10"
                                        />
                                        <span className="text-xs text-gray-400">Row</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={newPreset.textColor}
                                            onChange={(e) => setNewPreset(p => ({ ...p, textColor: e.target.value }))}
                                            className="w-8 h-8 rounded cursor-pointer border border-white/10"
                                        />
                                        <span className="text-xs text-gray-400">Text</span>
                                    </div>
                                </div>
                            </div>

                            {/* Background */}
                            <div className="space-y-3">
                                <label className="text-xs text-gray-500 uppercase flex items-center gap-1">
                                    <Image className="w-3 h-3" /> Background
                                </label>
                                <select
                                    value={newPreset.background}
                                    onChange={(e) => setNewPreset(p => ({ ...p, background: e.target.value }))}
                                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                                >
                                    {backgroundOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Preview & Save */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-12 rounded-lg overflow-hidden border border-white/10 flex flex-col">
                                    <div className="h-1/2" style={{ backgroundColor: newPreset.headerColor }} />
                                    <div className="h-1/2" style={{ backgroundColor: newPreset.rowColor }} />
                                </div>
                                <span className="text-xs text-gray-500">Preview</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 bg-white/5 text-gray-400 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveNewPreset}
                                    disabled={!newPreset.name.trim()}
                                    className="px-4 py-2 bg-yellow-500 text-black text-sm font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Create Preset
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preset List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {presets.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No presets saved yet</p>
                            <p className="text-xs mt-1">Click "Create New" to make your first preset</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {presets.map((preset) => (
                                <div
                                    key={preset.id}
                                    className="group flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors"
                                >
                                    {/* Color Preview */}
                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
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
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleApplyPreset(preset)}
                                            className="px-3 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                                            title="Apply"
                                        >
                                            Apply
                                        </button>
                                        <button
                                            onClick={() => { setEditingId(preset.id); setEditName(preset.name); }}
                                            className="p-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                            title="Rename"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePreset(preset.id)}
                                            className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
