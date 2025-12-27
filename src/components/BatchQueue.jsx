import React from 'react';
import { X, Check, AlertCircle, Loader2, Play, Trash2, Image, Clock } from 'lucide-react';

/**
 * Batch Queue Component
 * Shows all queued images with their processing status
 */
export function BatchQueue({
    queue,
    onRemove,
    onProcess,
    onProcessAll,
    onClear,
    isProcessing,
    currentIndex
}) {
    const pendingCount = queue.filter(item => item.status === 'pending').length;
    const doneCount = queue.filter(item => item.status === 'done').length;
    const errorCount = queue.filter(item => item.status === 'error').length;

    if (queue.length === 0) return null;

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
            <div className="max-h-48 overflow-y-auto">
                {queue.map((item, index) => (
                    <div
                        key={item.id}
                        className={`flex items-center gap-3 p-2 border-b border-white/5 last:border-0 ${item.status === 'processing' ? 'bg-yellow-500/10' :
                                item.status === 'done' ? 'bg-green-500/5' :
                                    item.status === 'error' ? 'bg-red-500/5' : ''
                            }`}
                    >
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/30 flex-shrink-0">
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

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            {item.status === 'pending' && !isProcessing && (
                                <button
                                    onClick={() => onProcess(item.id)}
                                    className="p-1 bg-yellow-500/20 text-yellow-500 rounded hover:bg-yellow-500/30 transition-colors"
                                    title="Process this"
                                >
                                    <Play className="w-3 h-3" />
                                </button>
                            )}
                            {item.status !== 'processing' && (
                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="p-1 bg-white/5 text-gray-500 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    title="Remove"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
