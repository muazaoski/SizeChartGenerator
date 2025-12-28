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
        // Apply to all pending items
        queue.forEach(item => {
            if (item.status === 'pending' && onUpdatePreset) {
                onUpdatePreset(item.id, presetId);
            }
        });
    };

    if (queue.length === 0) return null;

    // Common select styles for dark theme
    const selectClass = `
        appearance-none cursor-pointer
        px-3 py-1.5 pr-8
        bg-zinc-900 border border-white/10 rounded-lg
        text-xs text-white font-medium
        focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30
        hover:border-white/20 transition-colors
    `;

    return (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Batch Queue
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full">
                            {queue.length} total
                        </span>
                        {doneCount > 0 && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> {doneCount}
                            </span>
                        )}
                        {errorCount > 0 && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {errorCount}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {pendingCount > 0 && !isProcessing && (
                        <button
                            onClick={onProcessAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                        >
                            <Play className="w-3.5 h-3.5" />
                            Process All ({pendingCount})
                        </button>
                    )}
                    <button
                        onClick={onClear}
                        className="p-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        title="Clear all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Global Preset Selector */}
            {presets.length > 0 && pendingCount > 0 && (
                <div className="px-3 py-2 border-b border-white/5 bg-yellow-500/5 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                    <span className="text-xs text-yellow-500 font-medium whitespace-nowrap">Apply to all:</span>
                    <div className="relative flex-1">
                        <select
                            value={globalPreset}
                            onChange={(e) => handleGlobalPresetChange(e.target.value)}
                            className={selectClass}
                            style={{ width: '100%' }}
                        >
                            <option value="">No preset (use current)</option>
                            {presets.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>
            )}

            {/* Progress bar */}
            {isProcessing && (
                <div className="h-1 bg-black">
                    <div
                        className="h-full bg-yellow-500 transition-all duration-300"
                        style={{ width: `${((queue.length - pendingCount) / queue.length) * 100}%` }}
                    />
                </div>
            )}

            {/* Queue items */}
            <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {queue.map((item, index) => (
                    <div
                        key={item.id}
                        className={`flex items-center gap-3 p-2 ${item.status === 'processing' ? 'bg-yellow-500/10' :
                            item.status === 'done' ? 'bg-green-500/5' :
                                item.status === 'error' ? 'bg-red-500/5' : ''
                            }`}
                    >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/30 flex-shrink-0">
                            {item.preview ? (
                                <img src={item.preview} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Image className="w-5 h-5 text-gray-600" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium truncate">
                                {item.file?.name || `Image ${index + 1}`}
                            </p>
                            <p className="text-[10px] text-gray-500">
                                {item.status === 'processing' && (
                                    <span className="text-yellow-500 flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                                    </span>
                                )}
                                {item.status === 'done' && (
                                    <span className="text-green-500 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Done
                                        {item.processingTime && ` (${item.processingTime.toFixed(1)}s)`}
                                    </span>
                                )}
                                {item.status === 'error' && (
                                    <span className="text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {item.error || 'Failed'}
                                    </span>
                                )}
                                {item.status === 'pending' && (
                                    <span className="text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Pending
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Preset Selector (only for pending) */}
                        {item.status === 'pending' && presets.length > 0 && (
                            <div className="relative">
                                <select
                                    value={item.presetId || ''}
                                    onChange={(e) => onUpdatePreset && onUpdatePreset(item.id, e.target.value)}
                                    className="appearance-none cursor-pointer px-2 py-1 pr-6 bg-zinc-900 border border-white/10 rounded text-[10px] text-gray-300 focus:outline-none focus:border-yellow-500 max-w-[90px] hover:border-white/20 transition-colors"
                                    title="Select preset"
                                >
                                    <option value="">Default</option>
                                    {presets.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            {item.status === 'pending' && !isProcessing && (
                                <button
                                    onClick={() => onProcess(item.id)}
                                    className="p-1.5 bg-yellow-500/20 text-yellow-500 rounded hover:bg-yellow-500/30 transition-colors"
                                    title="Process this"
                                >
                                    <Play className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {item.status !== 'processing' && (
                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="p-1.5 bg-white/5 text-gray-500 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    title="Remove"
                                >
                                    <X className="w-3.5 h-3.5" />
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
                    padding: 8px 12px;
                }
                select option:hover,
                select option:focus,
                select option:checked {
                    background-color: #27272a;
                    color: #fbbf24;
                }
            `}</style>
        </div>
    );
}
