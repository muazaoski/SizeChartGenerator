import { useState } from 'react';

export function ApplyDesignDialog({ source, results, onApply, onClose }) {
    const targets = results.filter(r => r.id !== source.id && r.chartData);
    const [selected, setSelected] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    return <div className="absolute inset-0 z-20 bg-black/80 flex items-center justify-center p-5" role="dialog" aria-modal="true" aria-label="Apply design to charts">
        <div className="bg-zinc-900 border border-white/15 rounded-2xl p-6 w-full max-w-lg text-white">
            <h3 className="font-semibold text-lg">Apply this design</h3>
            <p className="mt-2 text-sm text-zinc-400">Copy the background, logo, colours and layout from {source.sku || source.file?.name || 'this chart'}. Each chart keeps its measurements, SKU and notes.</p>
            <div className="my-4 flex gap-4 text-xs text-yellow-400">
                <button disabled={busy} onClick={() => setSelected(targets.map(r => r.id))}>Select all</button>
                <button disabled={busy} onClick={() => setSelected([])}>Clear</button>
            </div>
            <div className="max-h-72 overflow-auto space-y-2">
                {targets.map(r => <label key={r.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer">
                    <input type="checkbox" disabled={busy} checked={selected.includes(r.id)} onChange={e => setSelected(ids => e.target.checked ? [...ids, r.id] : ids.filter(id => id !== r.id))} className="accent-yellow-400" />
                    <img src={r.exportedImage || r.preview} alt="" className="w-10 h-10 object-contain rounded" />
                    <span className="truncate text-sm">{r.sku || r.file?.name || 'Chart'}</span>
                </label>)}
            </div>
            {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-3 mt-5">
                <button autoFocus disabled={busy} onClick={onClose} className="px-4 py-2 text-sm">Cancel</button>
                <button disabled={!selected.length || busy} onClick={async () => {
                    setBusy(true); setError('');
                    try { await onApply(source.id, selected); onClose(); }
                    catch (err) { setError(err.message); }
                    finally { setBusy(false); }
                }} className="bg-yellow-400 text-black font-semibold rounded-xl px-4 py-2 text-sm disabled:opacity-40">{busy ? 'Applying…' : `Apply to ${selected.length} ${selected.length === 1 ? 'chart' : 'charts'}`}</button>
            </div>
        </div>
    </div>;
}
