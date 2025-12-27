import React, { useState } from 'react';
import { X, Check, AlertCircle, Download, Edit2, RotateCcw, CheckCircle, Eye, ZoomIn, Clock } from 'lucide-react';
import JSZip from 'jszip';

/**
 * Batch Review Component
 * Review all processed results before final export
 */
export function BatchReview({
    results,
    onClose,
    onEdit,
    onReprocess,
    onApprove,
    onExportAll
}) {
    const [selectedId, setSelectedId] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const approvedCount = results.filter(r => r.approved).length;
    const totalDone = results.filter(r => r.status === 'done').length;

    const handleExportAll = async () => {
        setIsExporting(true);
        try {
            const approved = results.filter(r => r.approved);
            if (approved.length === 0) {
                alert('No approved items to export');
                setIsExporting(false);
                return;
            }

            const withImages = approved.filter(r => r.exportedImage);
            if (withImages.length === 0) {
                alert('Charts have not been rendered yet.\n\nTo export, click "Edit Data" for each item to open it in the editor, then export from there.\n\nBatch rendering coming soon!');
                setIsExporting(false);
                return;
            }

            const zip = new JSZip();

            withImages.forEach((item, index) => {
                // Convert base64 to blob
                const base64Data = item.exportedImage.split(',')[1];
                const binaryData = atob(base64Data);
                const bytes = new Uint8Array(binaryData.length);
                for (let i = 0; i < binaryData.length; i++) {
                    bytes[i] = binaryData.charCodeAt(i);
                }

                const filename = item.sku ?
                    `${item.sku}-size-chart.jpg` :
                    `size-chart-${index + 1}.jpg`;

                zip.file(filename, bytes);
            });

            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `size-charts-${new Date().toISOString().split('T')[0]}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed: ' + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const selectedResult = results.find(r => r.id === selectedId);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-yellow-500" />
                        Review Results
                    </h2>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                            {approvedCount}/{totalDone} approved
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportAll}
                        disabled={approvedCount === 0 || isExporting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 text-black text-sm font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? 'Exporting...' : `Export ${approvedCount} as ZIP`}
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Results Grid */}
                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {results.filter(r => r.status === 'done').map((result) => (
                            <div
                                key={result.id}
                                onClick={() => setSelectedId(result.id)}
                                className={`group relative bg-zinc-800 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${result.approved ? 'border-green-500' : 'border-white/10 hover:border-white/30'
                                    } ${selectedId === result.id ? 'ring-2 ring-yellow-500' : ''}`}
                            >
                                {/* Preview Image - show source image or exported */}
                                <div className="aspect-square relative">
                                    {result.preview ? (
                                        <img
                                            src={result.exportedImage || result.preview}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                            <AlertCircle className="w-8 h-8 text-red-400" />
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Status Badge */}
                                    <div className="absolute top-2 right-2">
                                        {result.approved ? (
                                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 bg-orange-500/80 rounded-full flex items-center justify-center shadow-lg">
                                                <AlertCircle className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Hover Actions */}
                                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onApprove(result.id, !result.approved); }}
                                                className={`flex-1 py-1 text-xs font-medium rounded ${result.approved
                                                    ? 'bg-red-500/80 text-white hover:bg-red-500'
                                                    : 'bg-green-500/80 text-white hover:bg-green-500'
                                                    } transition-colors`}
                                            >
                                                {result.approved ? 'Unapprove' : 'Approve'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-2 bg-zinc-900">
                                    <p className="text-xs text-white font-medium truncate">
                                        {result.sku || result.file?.name || 'Chart'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {result.processingTime?.toFixed(1)}s
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview Panel */}
                {selectedResult && (
                    <div className="w-96 border-l border-white/10 bg-zinc-900 p-4 overflow-y-auto">
                        <h3 className="text-sm font-bold text-white mb-3">Preview</h3>

                        {/* Large Preview - show source */}
                        {(selectedResult.exportedImage || selectedResult.preview) && (
                            <div className="rounded-lg overflow-hidden border border-white/10 mb-4">
                                <img
                                    src={selectedResult.exportedImage || selectedResult.preview}
                                    alt=""
                                    className="w-full"
                                />
                                {!selectedResult.exportedImage && (
                                    <p className="text-xs text-yellow-500 p-2 bg-yellow-500/10 text-center">
                                        Source image - chart not rendered yet
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Data Summary */}
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-xs text-gray-500 uppercase mb-1">SKU</h4>
                                <p className="text-sm text-white">{selectedResult.sku || '-'}</p>
                            </div>

                            {selectedResult.chartData && (
                                <div>
                                    <h4 className="text-xs text-gray-500 uppercase mb-1">Extracted Data</h4>
                                    <div className="bg-black/30 rounded-lg p-2 text-xs font-mono text-gray-300 max-h-40 overflow-auto">
                                        <p>Sizes: {selectedResult.chartData.headers?.length || 0} columns</p>
                                        <p>Rows: {selectedResult.chartData.data?.length || 0}</p>
                                        {selectedResult.chartData.headers?.map((h, i) => (
                                            <p key={i} className="text-yellow-500">{h}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-3">
                                <button
                                    onClick={() => onEdit(selectedResult.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 text-white text-xs font-medium rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Edit Data
                                </button>
                                <button
                                    onClick={() => onReprocess(selectedResult.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 text-white text-xs font-medium rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reprocess
                                </button>
                            </div>

                            <button
                                onClick={() => onApprove(selectedResult.id, !selectedResult.approved)}
                                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-bold rounded-lg transition-colors ${selectedResult.approved
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-green-500 text-white hover:bg-green-400'
                                    }`}
                            >
                                {selectedResult.approved ? (
                                    <>
                                        <X className="w-4 h-4" />
                                        Remove Approval
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Approve for Export
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
