import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Undo, Redo, Check } from 'lucide-react';

export function DataEditor({ initialData, onSave }) {
    const [headers, setHeaders] = useState(initialData.headers || []);
    const [data, setData] = useState(initialData.data || []);

    // Undo/Redo state management
    const history = useRef([{ headers: initialData.headers || [], data: initialData.data || [] }]);
    const historyIndex = useRef(0);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    useEffect(() => {
        setHeaders(initialData.headers || []);
        setData(initialData.data || []);
        history.current = [{ headers: initialData.headers || [], data: initialData.data || [] }];
        historyIndex.current = 0;
        setCanUndo(false);
        setCanRedo(false);
    }, [initialData]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                handleRedo();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, historyIndex, history]);

    const addToHistory = (newHeaders, newData) => {
        const newHistory = history.current.slice(0, historyIndex.current + 1);
        newHistory.push({ headers: newHeaders, data: newData });
        history.current = newHistory;
        historyIndex.current = newHistory.length - 1;
        setCanUndo(true);
        setCanRedo(false);
    };

    const handleUndo = () => {
        if (historyIndex.current > 0) {
            const previousState = history.current[historyIndex.current - 1];
            setHeaders([...previousState.headers]);
            setData([...previousState.data]);
            historyIndex.current = historyIndex.current - 1;
            setCanUndo(historyIndex.current > 0);
            setCanRedo(true);
        }
    };

    const handleRedo = () => {
        if (historyIndex.current < history.current.length - 1) {
            const nextState = history.current[historyIndex.current + 1];
            setHeaders([...nextState.headers]);
            setData([...nextState.data]);
            historyIndex.current = historyIndex.current + 1;
            setCanUndo(true);
            setCanRedo(historyIndex.current < history.current.length - 1);
        }
    };

    const handleHeaderChange = (index, value) => {
        const newHeaders = [...headers];
        const oldHeader = newHeaders[index];
        newHeaders[index] = value;

        const newData = data.map(row => {
            const newRow = { ...row };
            if (oldHeader in newRow) {
                newRow[value] = newRow[oldHeader];
                delete newRow[oldHeader];
            }
            return newRow;
        });

        addToHistory(newHeaders, newData);
        setHeaders(newHeaders);
        setData(newData);
    };

    const handleDataChange = (rowIndex, header, value) => {
        const newData = [...data];
        if (!newData[rowIndex]) newData[rowIndex] = {};
        newData[rowIndex][header] = value;

        addToHistory(headers, newData);
        setData(newData);
    };

    const addRow = () => {
        const newRow = {};
        headers.forEach(header => {
            newRow[header] = '';
        });
        const newData = [...data, newRow];
        addToHistory(headers, newData);
        setData(newData);
        onSave({ headers, data: newData }); // Immediately reflect on preview
    };

    const removeRow = (index) => {
        const newData = data.filter((_, i) => i !== index);
        addToHistory(headers, newData);
        setData(newData);
        onSave({ headers, data: newData }); // Immediately reflect on preview
    };

    const addColumn = () => {
        const newHeaders = [...headers, `Col ${headers.length + 1}`];
        addToHistory(newHeaders, data);
        setHeaders(newHeaders);
        onSave({ headers: newHeaders, data }); // Immediately reflect on preview
    };

    const removeColumn = (index) => {
        const colToRemove = headers[index];
        const newHeaders = headers.filter((_, i) => i !== index);

        const newData = data.map(row => {
            const newRow = { ...row };
            delete newRow[colToRemove];
            return newRow;
        });

        addToHistory(newHeaders, newData);
        setHeaders(newHeaders);
        setData(newData);
        onSave({ headers: newHeaders, data: newData }); // Immediately reflect on preview
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        onSave({ headers, data });
        setTimeout(() => setIsSaving(false), 500);
    };


    return (
        <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="flex items-center justify-center p-2 text-sm bg-slate-700/50 text-gray-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo className="w-4 h-4" />
                </button>
                <button
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="flex items-center justify-center p-2 text-sm bg-slate-700/50 text-gray-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Redo (Ctrl+Y)"
                >
                    <Redo className="w-4 h-4" />
                </button>
                <div className="flex-1" />
                <button
                    onClick={addColumn}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-700/50 text-gray-300 rounded-lg hover:bg-slate-700 transition-all"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Column
                </button>
                <button
                    onClick={addRow}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-700/50 text-gray-300 rounded-lg hover:bg-slate-700 transition-all"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Row
                </button>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${isSaving
                        ? 'bg-emerald-500 text-white'
                        : 'bg-violet-500 text-white hover:bg-violet-600'
                        }`}
                >
                    {isSaving ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {isSaving ? 'Saved!' : 'Apply'}
                </button>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-gray-500 uppercase bg-slate-800/50">
                        <tr>
                            {headers.map((header, index) => (
                                <th key={index} className="px-3 py-2.5 min-w-[80px] group relative">
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={header}
                                            onChange={(e) => handleHeaderChange(index, e.target.value)}
                                            className="bg-transparent border-none focus:outline-none focus:ring-0 w-full font-semibold text-gray-300 text-xs"
                                        />
                                        <button
                                            onClick={() => removeColumn(index)}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-400/10 p-1 rounded transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </th>
                            ))}
                            <th className="px-2 py-2.5 w-8"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t border-white/5 hover:bg-white/5 transition-colors group">
                                {headers.map((header, colIndex) => (
                                    <td key={`${rowIndex}-${colIndex}`} className="px-3 py-1.5">
                                        <input
                                            type="text"
                                            value={row[header] || ''}
                                            onChange={(e) => handleDataChange(rowIndex, header, e.target.value)}
                                            className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 rounded px-1.5 py-1 text-gray-200 text-xs"
                                        />
                                    </td>
                                ))}
                                <td className="px-2 py-1.5 text-center">
                                    <button
                                        onClick={() => removeRow(rowIndex)}
                                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No data yet. Add rows and columns to start.
                    </div>
                )}
            </div>

            <p className="text-[10px] text-gray-600">
                Tip: Double-click cells in the preview for inline editing
            </p>
        </div>
    );
}
