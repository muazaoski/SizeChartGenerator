import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Loader2, Play, Trash2, Image, ChevronDown } from 'lucide-react';
import { getPresets } from '../lib/presetStorage';

export function BatchQueue({
    queue,
    onRemove,
    onProcess,
    onProcessAll,
    onClear,
    onUpdatePreset,
    isProcessing
}) {
    const [presets, setPresets] = useState([]);
    const [globalPreset, setGlobalPreset] = useState('');

    useEffect(() => {
        setPresets(getPresets());
    }, []);

    const pendingCount = queue.filter(item => item.status === 'pending').length;

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
        <div className="mt-4 space-y-3">
            {/* Header Row */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Queue ({queue.length})
                </span>
                <div className="flex items-center gap-2">
                    {pendingCount > 0 && !isProcessing && (
                        <button
                            onClick={onProcessAll}
                            className="px-3 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                        >
                            Process All
                        </button>
                    )}
                    <button
                        onClick={onClear}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                        title="Clear"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Global Preset */}
            {presets.length > 0 && pendingCount > 0 && (
                <div className="relative">
                    <select
                        value={globalPreset}
                        onChange={(e) => handleGlobalPresetChange(e.target.value)}
                        className="w-full appearance-none px-3 py-2 pr-8 bg-zinc-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    >
                        <option value="">Apply preset to all...</option>
                        {presets.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
            )}

            {/* Progress */}
            {isProcessing && (
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${((queue.length - pendingCount) / queue.length) * 100}%` }}
                    />
                </div>
            )}

            {/* Items */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {queue.map((item, index) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 bg-zinc-900/50 rounded-lg border border-white/5"
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

                        {/* Name + Status */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-white truncate">
                                {item.file?.name?.split('.')[0] || `Image ${index + 1}`}
                            </p>
                            {item.status === 'processing' && (
                                <p className="text-[10px] text-yellow-500 flex items-center gap-1">
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Processing
                                </p>
                            )}
                            {item.status === 'done' && (
                                <p className="text-[10px] text-green-500 flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5" /> Done
                                </p>
                            )}
                            {item.status === 'error' && (
                                <p className="text-[10px] text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-2.5 h-2.5" /> Failed
                                </p>
                            )}
                            {item.status === 'pending' && (
                                <p className="text-[10px] text-gray-500">Pending</p>
                            )}
                        </div>

                        {/* Individual Preset */}
                        {item.status === 'pending' && presets.length > 0 && (
                            <select
                                value={item.presetId || ''}
                                onChange={(e) => onUpdatePreset?.(item.id, e.target.value)}
                                className="appearance-none w-16 px-1.5 py-1 bg-zinc-800 border border-white/10 rounded text-[10px] text-gray-400 focus:outline-none focus:border-yellow-500 truncate"
                            >
                                <option value="">-</option>
                                {presets.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        )}

                        {/* Actions */}
                        {item.status === 'pending' && !isProcessing && (
                            <button
                                onClick={() => onProcess(item.id)}
                                className="p-1 text-yellow-500 hover:bg-yellow-500/10 rounded transition-colors"
                            >
                                <Play className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {item.status !== 'processing' && (
                            <button
                                onClick={() => onRemove(item.id)}
                                className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <style>{`
                select option {
                    background: #18181b;
                    color: #fff;
                }
            `}</style>
        </div>
    );
}
