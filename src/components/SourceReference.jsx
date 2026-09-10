import { useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

export function SourceReference({ src }) {
    const [zoom, setZoom] = useState(1);
    return <aside className="w-[28%] max-w-[420px] min-w-[220px] h-full flex flex-col border-r border-white/10 bg-zinc-950 shrink-0">
        <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-white/10">
            <h2 className="text-sm font-semibold">Original source</h2>
            <div className="flex items-center gap-1">
                <button aria-label="Zoom out source" onClick={() => setZoom(v => Math.max(1, v - 0.5))} disabled={zoom === 1} className="p-1.5 disabled:opacity-30"><ZoomOut size={16} /></button>
                <button onClick={() => setZoom(1)} className="text-xs w-10" title="Fit source">{zoom * 100}%</button>
                <button aria-label="Zoom in source" onClick={() => setZoom(v => Math.min(3, v + 0.5))} disabled={zoom === 3} className="p-1.5 disabled:opacity-30"><ZoomIn size={16} /></button>
            </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-3">
            <img src={src} alt="Original size chart reference" draggable={false} style={{ width: `${zoom * 100}%`, maxWidth: 'none' }} />
        </div>
        <p className="p-3 text-xs text-zinc-500">Keep the original beside your edits.</p>
    </aside>;
}
