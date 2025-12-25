import React from 'react';
import { Move, AlignLeft, AlignCenter, AlignRight, ArrowUp, Minus, ArrowDown, MousePointer } from 'lucide-react';

export function StyleControls({ selectedElement, styles, onStyleChange }) {
    const getElementDisplayName = (element) => {
        if (element === 'all') return 'All Elements';
        if (element === 'logo') return 'Logo';
        if (element === 'table') return 'Table';
        if (element === 'note') return 'Note';
        if (element === 'title') return 'Title';
        return element;
    };

    const handleAlignment = (direction) => {
        if (!selectedElement || selectedElement === 'all') return;

        const positions = {
            'left': { x: -200 },
            'center': { x: 0 },
            'right': { x: 200 },
            'top': { y: -200 },
            'middle': { y: 0 },
            'bottom': { y: 200 }
        };

        const position = positions[direction];
        if (!position) return;

        const updatedStyles = {
            ...styles,
            [selectedElement]: {
                ...styles[selectedElement],
                ...position
            }
        };

        onStyleChange(updatedStyles);
    };

    const handleScaleChange = (value) => {
        if (!selectedElement) return;

        const updatedStyles = {
            ...styles,
            [selectedElement]: {
                ...styles[selectedElement],
                scale: value
            }
        };
        onStyleChange(updatedStyles);
    };

    const currentScale = selectedElement ? (styles[selectedElement]?.scale || 1) : 1;

    return (
        <div className="space-y-4">
            {selectedElement ? (
                <div className="space-y-4">
                    {/* Selected Element Badge */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <Move className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-yellow-400/90 font-bold uppercase tracking-wider">
                            {getElementDisplayName(selectedElement)}
                        </span>
                        <span className="text-[10px] text-gray-500 ml-auto uppercase font-bold">MOVE MODE</span>
                    </div>

                    {/* Scale Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Scale Factor</label>
                            <span className="text-xs text-yellow-500 font-mono font-bold">{currentScale.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={currentScale}
                            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                            className="slider-custom w-full"
                        />
                    </div>

                    {/* Alignment Controls */}
                    <div className="space-y-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                        <div className="text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">Alignment</div>

                        {/* Horizontal */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Horizontal</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleAlignment('left')}
                                    className="flex-1 flex items-center justify-center p-2 text-xs bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-500 text-gray-400 rounded-lg transition-all"
                                    title="Align Left"
                                >
                                    <AlignLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleAlignment('center')}
                                    className="flex-1 flex items-center justify-center p-2 text-xs bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-500 text-gray-400 rounded-lg transition-all"
                                    title="Align Center"
                                >
                                    <AlignCenter className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleAlignment('right')}
                                    className="flex-1 flex items-center justify-center p-2 text-xs bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-500 text-gray-400 rounded-lg transition-all"
                                    title="Align Right"
                                >
                                    <AlignRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Vertical */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Vertical</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleAlignment('top')}
                                    className="flex-1 flex items-center justify-center p-2 text-xs bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-500 text-gray-400 rounded-lg transition-all"
                                    title="Align Top"
                                >
                                    <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleAlignment('middle')}
                                    className="flex-1 flex items-center justify-center p-2 text-xs bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-500 text-gray-400 rounded-lg transition-all"
                                    title="Align Middle"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleAlignment('bottom')}
                                    className="flex-1 flex items-center justify-center p-2 text-xs bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-500 text-gray-400 rounded-lg transition-all"
                                    title="Align Bottom"
                                >
                                    <ArrowDown className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-4 px-4 py-8 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <MousePointer className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-300">Standby</p>
                        <p className="text-xs text-gray-500 leading-relaxed uppercase tracking-tighter">Select an element to refine</p>
                    </div>
                </div>
            )}
        </div>
    );
}