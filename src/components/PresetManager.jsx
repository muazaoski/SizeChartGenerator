import React, { useState, useEffect } from 'react';
import { Save, Trash2, Download, Upload, Plus, Check, Star, X, Edit2 } from 'lucide-react';
import { ColorPresets } from './ColorPresets';
import { BackgroundPresets } from './BackgroundPresets';
import { BrandSelector } from './BrandSelector';
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

    // Local state for preset creation (mirrors main app)
    const [presetStyles, setPresetStyles] = useState({
        headerColor: '#000000',
        rowColor: '#f3f4f6',
        textColor: '#000000',
    });
    const [presetTemplate, setPresetTemplate] = useState('/backgrounds/white-solid.jpg');
    const [presetBrand, setPresetBrand] = useState(null);
    const [presetName, setPresetName] = useState('');

    useEffect(() => {
        setPresets(getPresets());
    }, []);

    // Reset create form when opening
    useEffect(() => {
        if (showCreate) {
            // Start with current app settings
            setPresetStyles({
                headerColor: chartStyles.headerColor || '#000000',
                rowColor: chartStyles.rowColor || '#f3f4f6',
                textColor: chartStyles.textColor || '#000000',
            });
            setPresetTemplate(customTemplate || '/backgrounds/white-solid.jpg');
            setPresetBrand(selectedBrand);
            setPresetName('');
        }
    }, [showCreate, chartStyles, customTemplate, selectedBrand]);

    const handleSaveNewPreset = () => {
        if (!presetName.trim()) {
            alert('Please enter a preset name');
            return;
        }

        const preset = createDefaultPreset(presetName.trim());
        preset.settings = {
            logo: {
                url: presetBrand?.logo || null,
                position: { x: 0, y: 0 },
                scale: 1
            },
            colors: {
                header: presetStyles.headerColor,
                row: presetStyles.rowColor,
                text: presetStyles.textColor,
                altRow: '#ffffff',
                border: '#e5e7eb'
            },
            background: {
                type: presetTemplate?.startsWith('data:') ? 'image' : 'solid',
                value: presetTemplate
            },
            table: { position: { x: 0, y: 0 }, scale: 1, borderRadius: 8 },
            notes: { show: true, position: { x: 0, y: 0 }, scale: 1, content: null },
            title: ''
        };

        addPreset(preset);
        setPresets(getPresets());
        setShowCreate(false);
        setPresetName('');
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

    const handlePresetStyleChange = (newStyles) => {
        setPresetStyles(prev => ({ ...prev, ...newStyles }));
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        {showCreate ? 'Create New Preset' : 'Preset Manager'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {!showCreate && (
                            <>
                                <button
                                    onClick={exportPresetsAsJSON}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-xs font-medium rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                </button>
                                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-xs font-medium rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                                    <Upload className="w-4 h-4" />
                                    Import
                                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                </label>
                            </>
                        )}
                        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {showCreate ? (
                        /* ============ CREATE NEW PRESET ============ */
                        <div className="p-6 space-y-6">
                            {/* Preset Name */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preset Name</label>
                                <input
                                    type="text"
                                    placeholder="My Brand Preset..."
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                    className="w-full mt-2 px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-500"
                                    autoFocus
                                />
                            </div>

                            {/* Brand Logo - Using same component */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Brand Logo</label>
                                <BrandSelector
                                    selectedBrand={presetBrand}
                                    onSelect={setPresetBrand}
                                    onLogoUpload={(logoData) => setPresetBrand({ id: 'custom', logo: logoData })}
                                />
                            </div>

                            {/* Colors - Using same component */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Colors</label>
                                <ColorPresets
                                    onStyleChange={handlePresetStyleChange}
                                    currentStyles={presetStyles}
                                />
                            </div>

                            {/* Background - Using same component */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Background</label>
                                <BackgroundPresets
                                    onTemplateSelect={setPresetTemplate}
                                    currentTemplate={presetTemplate}
                                    currentStyles={presetStyles}
                                    onStyleChange={handlePresetStyleChange}
                                    onCustomBackgroundUpload={setPresetTemplate}
                                />
                            </div>

                            {/* Preview */}
                            <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Preview</label>
                                <div
                                    className="w-full h-32 rounded-lg overflow-hidden relative"
                                    style={{
                                        backgroundImage: `url(${presetTemplate})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    <div className="absolute inset-4 flex flex-col justify-center">
                                        <div
                                            className="h-6 rounded-t flex items-center px-2"
                                            style={{ backgroundColor: presetStyles.headerColor }}
                                        >
                                            <span className="text-[10px] font-bold" style={{ color: '#fff' }}>HEADER</span>
                                        </div>
                                        <div
                                            className="h-5 flex items-center px-2"
                                            style={{ backgroundColor: presetStyles.rowColor }}
                                        >
                                            <span className="text-[10px]" style={{ color: presetStyles.textColor }}>Row Data</span>
                                        </div>
                                        <div
                                            className="h-5 rounded-b flex items-center px-2"
                                            style={{ backgroundColor: presetStyles.rowColor, opacity: 0.8 }}
                                        >
                                            <span className="text-[10px]" style={{ color: presetStyles.textColor }}>Row Data</span>
                                        </div>
                                    </div>
                                    {presetBrand?.logo && (
                                        <img
                                            src={presetBrand.logo}
                                            alt=""
                                            className="absolute top-2 right-2 h-8 w-auto object-contain bg-white rounded p-1"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 py-3 bg-white/5 text-gray-400 text-sm font-bold rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveNewPreset}
                                    className="flex-1 py-3 bg-yellow-500 text-black text-sm font-bold rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Preset
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ============ PRESET LIST ============ */
                        <div className="p-6">
                            {/* Create Button */}
                            <button
                                onClick={() => setShowCreate(true)}
                                className="w-full py-4 mb-6 border-2 border-dashed border-yellow-500/30 rounded-xl text-yellow-500 font-bold text-sm uppercase tracking-wider hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Preset
                            </button>

                            {/* Preset Grid */}
                            {presets.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No presets saved yet</p>
                                    <p className="text-xs mt-1">Click "Create New Preset" to make your first one</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {presets.map((preset) => (
                                        <div
                                            key={preset.id}
                                            className="group bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 overflow-hidden transition-colors"
                                        >
                                            {/* Preview */}
                                            <div
                                                className="h-24 relative"
                                                style={{
                                                    backgroundImage: `url(${preset.settings?.background?.value || '/backgrounds/white-solid.jpg'})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center'
                                                }}
                                            >
                                                <div className="absolute inset-3 flex flex-col justify-center">
                                                    <div
                                                        className="h-5 rounded-t"
                                                        style={{ backgroundColor: preset.settings?.colors?.header || '#000' }}
                                                    />
                                                    <div
                                                        className="h-4 rounded-b"
                                                        style={{ backgroundColor: preset.settings?.colors?.row || '#f3f4f6' }}
                                                    />
                                                </div>
                                                {preset.settings?.logo?.url && (
                                                    <img
                                                        src={preset.settings.logo.url}
                                                        alt=""
                                                        className="absolute top-2 right-2 h-6 w-auto object-contain bg-white rounded p-0.5"
                                                    />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="p-3">
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
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(preset.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex border-t border-white/5">
                                                <button
                                                    onClick={() => handleApplyPreset(preset)}
                                                    className="flex-1 py-2 text-xs font-bold text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                                                >
                                                    Apply
                                                </button>
                                                <button
                                                    onClick={() => { setEditingId(preset.id); setEditName(preset.name); }}
                                                    className="px-3 py-2 text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePreset(preset.id)}
                                                    className="px-3 py-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
