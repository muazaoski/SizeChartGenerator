import React, { useState, useLayoutEffect, useRef } from 'react';
import { X, AlertCircle, Download, Edit2, RotateCcw, CheckCircle, Columns2, ZoomIn, ZoomOut, Clock } from 'lucide-react';
import JSZip from 'jszip';
import { ApplyDesignDialog } from './ApplyDesignDialog';

/**
 * Batch Review Component
 * Review all processed results before final export
 */
export function BatchReview({
    results,
    onClose,
    onEdit,
    onReprocess,
    onToggleExport,
    onApplyDesign,
    saveStatus
}) {
    const [selectedId, setSelectedId] = useState(null);
    const [applyingDesign, setApplyingDesign] = useState(false);
    const [comparing, setComparing] = useState(false);
    const [zooms, setZooms] = useState({});
    const setImageZoom = (label, value) => setZooms(previous => ({
        ...previous,
        [label]: typeof value === 'function' ? value(previous[label] || 1) : value
    }));
    const zoomTarget = useRef(null);

    useLayoutEffect(() => {
        const target = zoomTarget.current;
        if (!target) return;
        const { container, image, x, y } = target;
        const rect = image.getBoundingClientRect();
        const viewport = container.getBoundingClientRect();
        const scale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        container.scrollLeft += rect.left + (rect.width - width) / 2 + x * width - viewport.left - container.clientWidth / 2;
        container.scrollTop += rect.top + (rect.height - height) / 2 + y * height - viewport.top - container.clientHeight / 2;
        zoomTarget.current = null;
    }, [zooms]);

    const handleImageZoom = (event, label) => {
        const zoom = zooms[label] || 1;
        const button = event.currentTarget;
        const image = button.querySelector('img');
        const container = button.parentElement;
        if (zoom > 1) {
            zoomTarget.current = null;
            setImageZoom(label, 1);
            container.scrollTo(0, 0);
            return;
        }
        const rect = image.getBoundingClientRect();
        const scale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        if (width > 0 && height > 0) {
            zoomTarget.current = {
                container, image,
                x: event.detail === 0 ? 0.5 : Math.max(0, Math.min(1, (event.clientX - rect.left - (rect.width - width) / 2) / width)),
                y: event.detail === 0 ? 0.5 : Math.max(0, Math.min(1, (event.clientY - rect.top - (rect.height - height) / 2) / height))
            };
        }
        setImageZoom(label, 2);
    };
    const [isExporting, setIsExporting] = useState(false);

    const readyResults = results.filter(r => r.status === 'done' && r.exportedImage);
    const exportCount = readyResults.filter(r => r.includeInExport !== false).length;
    const totalDone = results.filter(r => r.status === 'done').length;

    const handleExportAll = async () => {
        setIsExporting(true);
        try {
            const withImages = readyResults.filter(r => r.includeInExport !== false);
            if (withImages.length === 0) return;

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

    const selectedResult = results.find(r => r.id === selectedId) || results.find(r => r.status === 'done');

    return (
        <div className="fixed inset-0 bg-[#101113] z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-yellow-500" />
                        Review Results
                    </h2>
                    <span role="status" className="text-[10px] text-zinc-400">{saveStatus}</span>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                            {exportCount} selected
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportAll}
                        disabled={exportCount === 0 || isExporting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 text-black text-sm font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? 'Exporting...' : `Download ${exportCount} ${exportCount === 1 ? 'chart' : 'charts'} (ZIP)`}
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-auto md:overflow-hidden min-h-0">
                {/* Results Grid */}
                <div className="flex-1 min-w-0 p-5 md:overflow-y-auto">
                    <div className="mb-5"><h3 className="text-base font-semibold text-white">Your charts <span className="text-gray-500">({totalDone})</span></h3><p className="mt-1 text-xs text-gray-400">Ready charts are included automatically. Uncheck any you want to skip.</p></div>
                    <div className="mb-4 flex items-center gap-3 text-xs">
                        <button disabled={isExporting || !readyResults.length} onClick={() => readyResults.forEach(r => onToggleExport(r.id, true))} className="text-yellow-400 hover:underline disabled:opacity-40">Select all</button>
                        <span className="text-gray-600">/</span>
                        <button disabled={isExporting || !exportCount} onClick={() => readyResults.forEach(r => onToggleExport(r.id, false))} className="text-gray-400 hover:text-white disabled:opacity-40">Clear selection</button>
                        {totalDone > readyResults.length && <span className="text-gray-400">{totalDone - readyResults.length} without a preview: open Edit Data and save to include.</span>}
                    </div>
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))' }}>
                        {results.filter(r => r.status === 'done').map((result) => (
                            <div
                                key={result.id}
                                role="button"
                                tabIndex={0}
                                aria-label={`Review ${result.sku || result.file?.name || 'chart'}`}
                                onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSelectedId(result.id); } }}
                                onClick={() => setSelectedId(result.id)}
                                className={`group relative bg-zinc-800 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${!result.exportedImage || result.includeInExport === false ? 'border-white/5' : 'border-white/10 hover:border-white/30'
                                    } ${selectedResult?.id === result.id ? 'ring-2 ring-yellow-500' : ''}`}
                            >
                                {/* Preview Image - show source image or exported */}
                                <div className="aspect-square relative">
                                    {result.preview ? (
                                        <>
                                            {/* Exported Image (default) */}
                                            <img
                                                src={result.exportedImage || result.preview}
                                                alt=""
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/75 text-white text-[10px] font-semibold uppercase rounded">{result.exportedImage ? 'Generated' : 'Source only'}</div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                            <AlertCircle className="w-8 h-8 text-red-400" />
                                        </div>
                                    )}

                                    {/* Overlay */}


                                    <label onClick={e => e.stopPropagation()} className="absolute right-2 top-2 flex cursor-pointer items-center gap-2 rounded-lg bg-black/80 px-2 py-1.5 text-xs text-white">
                                        <input type="checkbox" aria-label={`Include ${result.sku || result.file?.name || 'chart'} in download`} checked={!!result.exportedImage && result.includeInExport !== false} disabled={!result.exportedImage || isExporting} onChange={e => onToggleExport(result.id, e.target.checked)} className="h-4 w-4 accent-yellow-400" />
                                        {result.exportedImage ? 'Include' : 'No preview'}
                                    </label>
                                </div>

                                {/* Info */}
                                <div className="p-3 bg-zinc-900">
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
                    <div className="w-full md:w-[360px] shrink-0 border-l border-white/10 bg-zinc-900 p-5 md:overflow-y-auto">
                        <h3 className="text-sm font-bold text-white mb-3">Chart details</h3>

                        {/* Large Preview - show source */}
                        {(selectedResult.exportedImage || selectedResult.preview) && (
                            <div className="rounded-lg overflow-hidden border border-white/10 mb-4">
                                <img
                                    src={selectedResult.exportedImage || selectedResult.preview}
                                    alt=""
                                    className="aspect-square w-full object-contain"
                                />
                                {!selectedResult.exportedImage && (
                                    <p className="text-xs text-yellow-500 p-2 bg-yellow-500/10 text-center">
                                        Source image - chart not rendered yet
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => { setComparing(true); setZooms({}); }}
                            disabled={!selectedResult.preview || !selectedResult.exportedImage}
                            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-3 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        ><Columns2 size={17} />Compare source &amp; generated</button>
                        {!selectedResult.exportedImage && <p className="mb-4 text-xs text-gray-400">Save from the editor to create a generated preview for comparison.</p>}
                        {/* Data Summary */}
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-xs text-gray-500 uppercase mb-1">SKU</h4>
                                <p className="text-sm text-white">{selectedResult.sku || selectedResult.file?.name || '-'}</p>
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

                            <button disabled={!selectedResult.design || results.filter(r => r.chartData).length < 2} onClick={() => setApplyingDesign(true)} className="w-full rounded-xl border border-yellow-400/30 bg-yellow-400/10 py-2.5 text-sm text-yellow-400 disabled:opacity-40">Apply design to other charts</button>
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

                            <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white">
                                <input type="checkbox" checked={!!selectedResult.exportedImage && selectedResult.includeInExport !== false} disabled={!selectedResult.exportedImage || isExporting} onChange={e => onToggleExport(selectedResult.id, e.target.checked)} className="h-4 w-4 accent-yellow-400" />
                                Include in download
                            </label>
                        </div>
                    </div>
                )}
            </div>
            {applyingDesign && selectedResult && <ApplyDesignDialog source={selectedResult} results={results} onApply={onApplyDesign} onClose={() => setApplyingDesign(false)} />}
            {comparing && selectedResult && (
                <div role="dialog" aria-modal="true" aria-label="Compare source and generated" onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setComparing(false); } }} className="absolute inset-0 z-10 flex flex-col bg-[#101113] text-white">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                        <div><h3 className="font-semibold">Source &amp; generated</h3><p className="mt-1 max-w-xs truncate text-xs text-gray-400">{selectedResult.sku || selectedResult.file?.name || 'Chart comparison'}</p></div>
                        <div className="flex items-center gap-2">
                            <button autoFocus onClick={() => setComparing(false)} className="ml-2 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm"><X size={17} />Close</button>
                        </div>
                    </header>
                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-5 md:grid-cols-2">
                        {[['Original source', selectedResult.preview], ['Generated chart', selectedResult.exportedImage]].map(([label, url]) => {
                            const zoom = zooms[label] || 1;
                            return (
                            <section key={label} className="flex min-h-[300px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                                    <h4 className="text-sm font-medium">{label}</h4>
                                    <div className="flex items-center gap-2" role="group" aria-label={`${label} zoom controls`}>
                            <button aria-label="Zoom out" disabled={zoom <= 1} onClick={() => setImageZoom(label, v => Math.max(1, v - 0.25))} className="rounded-lg bg-white/10 p-2 disabled:opacity-30"><ZoomOut size={18} /></button>
                            <button onClick={() => setImageZoom(label, 1)} className="rounded-lg bg-white/10 px-3 py-2 text-xs" title="Reset zoom">{Math.round(zoom * 100)}%</button>
                            <button aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setImageZoom(label, v => Math.min(3, v + 0.25))} className="rounded-lg bg-white/10 p-2 disabled:opacity-30"><ZoomIn size={18} /></button>
                                    </div>
                                </div>
                                <div className="min-h-0 flex-1 overflow-auto p-3"><button
                                    type="button"
                                    aria-label={`${zoom > 1 ? 'Zoom out' : 'Zoom in'} ${label.toLowerCase()}`}
                                    aria-pressed={zoom > 1}
                                    onClick={event => handleImageZoom(event, label)}
                                    className={`block border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400 ${zoom > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                                    style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
                                ><img src={url} alt={label} draggable={false} className="h-full w-full object-contain" /></button></div>
                            </section>
                            );
                        })}
                    </div>
                    <p className="px-5 pb-4 text-xs text-gray-400">Click either image to zoom in. Click again to zoom out. Scroll to inspect details.</p>
                </div>
            )}
        </div>
    );
}
