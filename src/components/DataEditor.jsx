import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Undo, Redo, Check, GripVertical } from 'lucide-react';
import { Reorder, useDragControls, AnimatePresence, motion } from 'framer-motion';

// Draggable Row Component - uses div-based layout for smooth reordering
function DraggableRow({ row, rowIndex, headers, handleDataChange, removeRow, rowId }) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={row}
            id={rowId}
            dragListener={false}
            dragControls={dragControls}
            className="flex items-center border-t border-white/5 hover:bg-white/5 transition-colors group bg-transparent"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            whileDrag={{
                scale: 1.02,
                backgroundColor: 'rgba(250, 204, 21, 0.15)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                zIndex: 50,
                cursor: 'grabbing'
            }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                mass: 0.8
            }}
            layout
            layoutId={rowId}
        >
            {/* Drag Handle */}
            <div className="w-8 flex-shrink-0 px-1 py-2">
                <button
                    onPointerDown={(e) => {
                        e.preventDefault();
                        dragControls.start(e);
                    }}
                    className="cursor-grab active:cursor-grabbing p-1.5 text-gray-600 hover:text-yellow-500 transition-colors touch-none rounded hover:bg-white/10"
                    title="Drag to reorder"
                >
                    <GripVertical className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Data Cells */}
            {headers.map((header, colIndex) => (
                <div
                    key={`${rowId}-${colIndex}`}
                    className="flex-1 min-w-[70px] px-2 py-1.5"
                >
                    <input
                        type="text"
                        value={row[header] || ''}
                        onChange={(e) => handleDataChange(rowIndex, header, e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-yellow-500/50 rounded px-1.5 py-1 text-gray-200 text-xs"
                    />
                </div>
            ))}

            {/* Delete Button */}
            <div className="w-10 flex-shrink-0 px-2 py-1.5 text-center">
                <button
                    onClick={() => removeRow(rowIndex)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1 rounded hover:bg-red-400/10"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </Reorder.Item>
    );
}

export function DataEditor({ initialData, onSave }) {
    const [headers, setHeaders] = useState(initialData.headers || []);
    const [data, setData] = useState(initialData.data || []);

    // Give each row a unique ID for tracking during reorder
    const [rowIds, setRowIds] = useState(() =>
        (initialData.data || []).map((_, i) => `row-${Date.now()}-${i}`)
    );

    // Undo/Redo state management
    const history = useRef([{ headers: initialData.headers || [], data: initialData.data || [] }]);
    const historyIndex = useRef(0);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    useEffect(() => {
        setHeaders(initialData.headers || []);
        setData(initialData.data || []);
        setRowIds((initialData.data || []).map((_, i) => `row-${Date.now()}-${i}`));
        history.current = [{ headers: initialData.headers || [], data: initialData.data || [] }];
        historyIndex.current = 0;
        setCanUndo(false);
        setCanRedo(false);
    }, [initialData]);

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
            onSave({ headers: previousState.headers, data: previousState.data });
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
            onSave({ headers: nextState.headers, data: nextState.data });
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
        const newRowIds = [...rowIds, `row-${Date.now()}`];
        addToHistory(headers, newData);
        setData(newData);
        setRowIds(newRowIds);
        onSave({ headers, data: newData });
    };

    const removeRow = (index) => {
        const newData = data.filter((_, i) => i !== index);
        const newRowIds = rowIds.filter((_, i) => i !== index);
        addToHistory(headers, newData);
        setData(newData);
        setRowIds(newRowIds);
        onSave({ headers, data: newData });
    };

    const addColumn = () => {
        const newHeaders = [...headers, `Col ${headers.length + 1}`];
        addToHistory(newHeaders, data);
        setHeaders(newHeaders);
        onSave({ headers: newHeaders, data });
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
        onSave({ headers: newHeaders, data: newData });
    };

    // Handle row reorder from drag-and-drop
    const handleReorder = (reorderedData) => {
        // Find new order of row IDs based on data order
        const newRowIds = reorderedData.map(row => {
            const originalIndex = data.findIndex(d => d === row);
            return rowIds[originalIndex];
        });

        addToHistory(headers, reorderedData);
        setData(reorderedData);
        setRowIds(newRowIds);
        onSave({ headers, data: reorderedData });
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
                    title="Redo (Ctrl+Shift+Z)"
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
                        : 'bg-yellow-500 text-black hover:bg-yellow-400'
                        }`}
                >
                    {isSaving ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {isSaving ? 'Saved!' : 'Apply'}
                </button>
            </div>

            {/* Data Table with Div-based Layout for Smooth Reordering */}
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-900/30">
                {/* Header Row */}
                <div className="flex items-center text-[10px] text-gray-500 uppercase bg-slate-800/50 border-b border-white/5">
                    <div className="w-8 flex-shrink-0 px-1 py-2.5"></div>
                    {headers.map((header, index) => (
                        <div key={index} className="flex-1 min-w-[70px] px-2 py-2.5 group relative">
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
                        </div>
                    ))}
                    <div className="w-10 flex-shrink-0 px-2 py-2.5"></div>
                </div>

                {/* Draggable Rows */}
                <Reorder.Group
                    axis="y"
                    values={data}
                    onReorder={handleReorder}
                    className="w-full"
                    layoutScroll
                >
                    <AnimatePresence mode="popLayout">
                        {data.map((row, rowIndex) => (
                            <DraggableRow
                                key={rowIds[rowIndex] || `row-${rowIndex}`}
                                row={row}
                                rowIndex={rowIndex}
                                rowId={rowIds[rowIndex] || `row-${rowIndex}`}
                                headers={headers}
                                handleDataChange={handleDataChange}
                                removeRow={removeRow}
                            />
                        ))}
                    </AnimatePresence>
                </Reorder.Group>

                {/* Empty State */}
                {data.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No data yet. Add rows and columns to start.
                    </div>
                )}
            </div>

            <p className="text-[10px] text-gray-600 flex items-center gap-1">
                <GripVertical className="w-3 h-3" />
                Drag rows to reorder • Double-click cells in preview for inline editing
            </p>
        </div>
    );
}
