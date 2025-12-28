import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Loader2, Play, Trash2, Image, Clock, Star, ChevronDown } from 'lucide-react';
import { getPresets } from '../lib/presetStorage';

/**
 * Batch Queue Component
 * Shows all queued images with their processing status and preset selectors
 */
export function BatchQueue({
    queue,
    onRemove,
    onProcess,
    onProcessAll,
    onClear,
    onUpdatePreset,
    isProcessing,
    currentIndex
}) {
    const [presets, setPresets] = useState([]);
    const [globalPreset, setGlobalPreset] = useState('');

    useEffect(() => {
        setPresets(getPresets());
    }, []);

    const pendingCount = queue.filter(item => item.status === 'pending').length;
    const doneCount = queue.filter(item => item.status === 'done').length;
    const errorCount = queue.filter(item => item.status === 'error').length;

    const handleGlobalPresetChange = (presetId) => {
        setGlobalPreset(presetId);
        queue.forEach(item => {
            if (item.status === 'pending' && onUpdatePreset) {
                onUpdatePreset(item.id, presetId);
            }
        });
    };

    if (queue.length === 0) return null;

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                            Batch Queue
                        </h3>
                        <span className="px-2 py-0.5 bg-zinc-800 text-gray-400 text-[10px] font-medium rounded">
                            {queue.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {pendingCount > 0 && !isProcessing && (
                            <button
                                onClick={onProcessAll}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                            >
                                <Play className="w-3 h-3" />
                                Process ({pendingCount})
                            </button>
                        )}
                        <button
                            onClick={onClear}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Clear all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Global Preset Selector */}
                {presets.length > 0 && pendingCount > 0 && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                        <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Apply to all</span>
                        <div className="relative flex-1">
                            <select
                                value={globalPreset}
                                onChange={(e) => handleGlobalPresetChange(e.target.value)}
                                className="w-full appearance-none cursor-pointer px-2 py-1 pr-7 bg-zinc-800 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-yellow-500 hover:border-white/20 transition-colors"
                            >
                                <option value="">No preset (use current)</option>
                                {presets.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            {isProcessing && (
                <div className="h-0.5 bg-zinc-800">
                    <div
                        className="h-full bg-yellow-500 transition-all duration-300"
                        style={{ width: `${((queue.length - pendingCount) / queue.length) * 100}%` }}
                    />
                </div>
            )}

            {/* Queue items */}
            <div className="max-h-48 overflow-y-auto">
                {queue.map((item, index) => (
                    <div
                        key={item.id}
                        className={`flex items-center gap-2 px-3 py-2 border-b border-white/5 last:border-0 ${item.status === 'processing' ? 'bg-yellow-500/5' :
                                item.status === 'done' ? 'bg-green-500/5' :
                                    item.status === 'error' ? 'bg-red-500/5' : ''
                            }`}
                    >
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                            {item.preview ? (
                                <img src={item.preview} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Image className="w-4 h-4 text-gray-600" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium truncate">
                                {item.file?.name?.replace(/\.[^/.]+$/, '') || `Image ${index + 1}`}
                            </p>
                            <div className="text-[10px]">
                                {item.status === 'processing' && (
                                    <span className="text-yellow-500 flex items-center gap-1">
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> Processing
                                    </span>
                                )}
                                {item.status === 'done' && (
                                    <span className="text-green-500 flex items-center gap-1">
                                        <Check className="w-2.5 h-2.5" /> Done
                                    </span>
                                )}
                                {item.status === 'error' && (
                                    <span className="text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-2.5 h-2.5" /> Error
                                    </span>
                                )}
                                {item.status === 'pending' && (
                                    <span className="text-gray-500">Pending</span>
                                )}
                            </div>
                        </div>

                        {/* Preset Selector (only for pending) */}
                        {item.status === 'pending' && presets.length > 0 && (
                            <div className="relative">
                                <select
                                    value={item.presetId || ''}
                                    onChange={(e) => onUpdatePreset && onUpdatePreset(item.id, e.target.value)}
                                    className="appearance-none cursor-pointer w-20 px-2 py-1 pr-5 bg-zinc-800 border border-white/10 rounded text-[10px] text-gray-400 focus:outline-none focus:border-yellow-500 hover:border-white/20 transition-colors truncate"
                                    title="Select preset"
                                >
                                    <option value="">Default</option>
                                    {presets.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-gray-500 pointer-events-none" />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            {item.status === 'pending' && !isProcessing && (
                                <button
                                    onClick={() => onProcess(item.id)}
                                    className="p-1.5 text-yellow-500 hover:bg-yellow-500/10 rounded transition-colors"
                                    title="Process"
                                >
                                    <Play className="w-3 h-3" />
                                </button>
                            )}
                            {item.status !== 'processing' && (
                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    title="Remove"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Dark theme styles for select options */}
            <style>{`
                select option {
                    background-color: #18181b;
                    color: #e4e4e7;
                    padding: 8px;
                }
                select option:checked {
                    background-color: #27272a;
                }
            `}</style>
        </div>
    );
}
