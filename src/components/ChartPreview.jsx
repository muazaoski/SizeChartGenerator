import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { cn } from '../lib/utils';

// Photoshop-like Editable Text Component
const EditableText = memo(({ value, onChange, className = "", style = {}, tag = "span", placeholder = "Enter text..." }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsEditing(true);
    };

    const handleChange = (e) => {
        setEditValue(e.target.value);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (editValue !== value) {
            onChange(editValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            setEditValue(value);
            setIsEditing(false);
        }
    };

    const handleClick = (e) => {
        e.stopPropagation();
    };

    if (isEditing) {
        const Tag = tag === 'span' || tag === 'p' ? 'input' : 'textarea';
        return (
            <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onClick={handleClick}
                className={cn(
                    "bg-white/20 backdrop-blur-sm border-2 border-blue-500 rounded px-1",
                    "outline-none text-center min-w-[40px]",
                    className
                )}
                style={{
                    ...style,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    color: 'inherit',
                    width: `${Math.max(editValue.length * 0.6 + 2, 3)}em`,
                }}
                placeholder={placeholder}
            />
        );
    }

    const Tag = tag;
    return (
        <Tag
            onDoubleClick={handleDoubleClick}
            className={cn(
                "cursor-text hover:bg-blue-500/10 hover:outline hover:outline-2 hover:outline-blue-400/50 rounded transition-all duration-150",
                "select-none inline-block px-0.5",
                className
            )}
            style={style}
            title="Double-click to edit"
        >
            {value || placeholder}
        </Tag>
    );
});

export function ChartPreview({ data, brand, template, styles = {}, selectedElement, setSelectedElement, onPositionChange, onExport, id = "chart-preview", className = "", sku = null, onDataChange, onSkuChange, notes: propNotes, onNotesChange }) {
    const containerRef = useRef(null);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const [scrollOffset, setScrollOffset] = useState(0);
    const [hoveredElement, setHoveredElement] = useState(null);
    const [localData, setLocalData] = useState(data);
    const [localSku, setLocalSku] = useState(sku);
    const [snapGuides, setSnapGuides] = useState({ horizontal: null, vertical: null });

    // Snap threshold in pixels
    const SNAP_THRESHOLD = 10;

    // Default notes
    const defaultNotes = {
        title: 'Please note:',
        items: [
            '1. This size chart should be used as guide.',
            '2. Measurements shown may have a tolerance of 0.3cm - 0.5cm.',
            '3. Suggest taking ONE SIZE LARGER for those with WIDE FEET.'
        ]
    };
    const [localNotes, setLocalNotes] = useState(propNotes || defaultNotes);

    // Update local state when props change
    useEffect(() => {
        setLocalData(data);
    }, [data]);

    useEffect(() => {
        setLocalSku(sku);
    }, [sku]);

    useEffect(() => {
        if (propNotes) {
            setLocalNotes(propNotes);
        }
    }, [propNotes]);

    if (!localData) return null;

    const hasTemplate = !!template;

    // Track scroll position for parallax effect
    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                const container = containerRef.current;
                const rect = container.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const containerCenter = rect.top + rect.height / 2;
                const viewportCenter = viewportHeight / 2;
                const offset = (viewportCenter - containerCenter) * 0.02; // Much more subtle movement (2% instead of 10%)
                setScrollOffset(offset);
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial call

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const { colors, font } = brand || { colors: { primary: '#000', secondary: '#fff', accent: '#ccc' }, font: 'sans-serif' };

    // Default styles if not provided
    const currentStyles = {
        scale: 1,
        x: 0,
        y: 0,
        headerColor: colors.primary,
        rowColor: hasTemplate ? '#ffffff' : 'rgba(0,0,0,0.05)',
        textColor: colors.primary,
        title: '',
        ...styles
    };

    const containerStyle = hasTemplate ? {
        fontFamily: "'Gotham Narrow', sans-serif",
        backgroundImage: `url(${template})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    } : {
        fontFamily: "'Gotham Narrow', sans-serif",
        backgroundColor: colors.secondary,
        color: colors.primary,
    };

    const handleElementMouseDown = (e, elementType) => {
        // Check if clicking on an editable element, input, or button - don't start dragging
        const target = e.target;
        const isEditable = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'BUTTON' ||
            target.closest('button') ||
            target.hasAttribute('title') && target.getAttribute('title') === 'Double-click to edit';

        if (isEditable) {
            // Allow the click to propagate for editing
            return;
        }

        e.stopPropagation();

        isDragging.current = true;
        setSelectedElement(elementType);

        const elementStyles = styles[elementType] || { x: 0, y: 0, scale: 1 };
        dragStart.current = {
            x: e.clientX - elementStyles.x,
            y: e.clientY - elementStyles.y,
            elementType: elementType
        };

        document.addEventListener('mousemove', handleElementMouseMove);
        document.addEventListener('mouseup', handleElementMouseUp);
    };

    const handleElementMouseMove = (e) => {
        if (!isDragging.current) return;

        const elementType = dragStart.current.elementType;
        let newX = e.clientX - dragStart.current.x;
        let newY = e.clientY - dragStart.current.y;

        // Smart snapping logic
        const snapPoints = {
            // Center snap points
            horizontal: [0], // Center Y (0 means centered)
            vertical: [0]    // Center X (0 means centered)
        };

        let activeGuides = { horizontal: null, vertical: null };

        // Check horizontal (Y-axis) snapping
        for (const snapY of snapPoints.horizontal) {
            if (Math.abs(newY - snapY) < SNAP_THRESHOLD) {
                newY = snapY;
                activeGuides.horizontal = snapY;
                break;
            }
        }

        // Check vertical (X-axis) snapping
        for (const snapX of snapPoints.vertical) {
            if (Math.abs(newX - snapX) < SNAP_THRESHOLD) {
                newX = snapX;
                activeGuides.vertical = snapX;
                break;
            }
        }

        setSnapGuides(activeGuides);

        // Throttle updates to prevent excessive re-renders
        requestAnimationFrame(() => {
            // Update individual element position
            const updatedStyles = {
                ...styles,
                [elementType]: {
                    ...styles[elementType],
                    x: newX,
                    y: newY
                }
            };

            onPositionChange(updatedStyles);
        });
    };

    const handleElementMouseUp = () => {
        isDragging.current = false;
        setSnapGuides({ horizontal: null, vertical: null }); // Clear guides on release
        document.removeEventListener('mousemove', handleElementMouseMove);
        document.removeEventListener('mouseup', handleElementMouseUp);
    };

    const handleCanvasClick = (e) => {
        if (e.target === e.currentTarget || e.target.id === id) {
            setSelectedElement(null);
        }
    };

    // Handler for updating header text
    const handleHeaderChange = useCallback((headerIndex, newValue) => {
        const newData = { ...localData };
        const oldHeader = newData.headers[headerIndex];
        const newHeaders = [...newData.headers];
        newHeaders[headerIndex] = newValue;

        // Update all rows to use the new header key
        const newDataRows = newData.data.map(row => {
            const newRow = { ...row };
            if (oldHeader !== newValue) {
                newRow[newValue] = row[oldHeader];
                delete newRow[oldHeader];
            }
            return newRow;
        });

        newData.headers = newHeaders;
        newData.data = newDataRows;
        setLocalData(newData);

        // Propagate changes to parent
        if (onDataChange) {
            onDataChange(newData);
        }
    }, [localData, onDataChange]);

    // Handler for updating cell data
    const handleCellChange = useCallback((rowIndex, header, newValue) => {
        const newData = { ...localData };
        const newDataRows = [...newData.data];
        newDataRows[rowIndex] = { ...newDataRows[rowIndex], [header]: newValue };
        newData.data = newDataRows;
        setLocalData(newData);

        // Propagate changes to parent
        if (onDataChange) {
            onDataChange(newData);
        }
    }, [localData, onDataChange]);

    // Handler for updating SKU
    const handleSkuChange = useCallback((newSku) => {
        setLocalSku(newSku);
        if (onSkuChange) {
            onSkuChange(newSku);
        }
    }, [onSkuChange]);

    // Handler for updating note title
    const handleNoteTitleChange = useCallback((newTitle) => {
        const newNotes = { ...localNotes, title: newTitle };
        setLocalNotes(newNotes);
        if (onNotesChange) {
            onNotesChange(newNotes);
        }
    }, [localNotes, onNotesChange]);

    // Handler for updating note items
    const handleNoteItemChange = useCallback((index, newValue) => {
        const newItems = [...localNotes.items];
        newItems[index] = newValue;
        const newNotes = { ...localNotes, items: newItems };
        setLocalNotes(newNotes);
        if (onNotesChange) {
            onNotesChange(newNotes);
        }
    }, [localNotes, onNotesChange]);

    // Handler for adding a new note line
    const handleAddNoteLine = useCallback(() => {
        const newItems = [...localNotes.items, `${localNotes.items.length + 1}. New note`];
        const newNotes = { ...localNotes, items: newItems };
        setLocalNotes(newNotes);
        if (onNotesChange) {
            onNotesChange(newNotes);
        }
    }, [localNotes, onNotesChange]);

    // Handler for removing a note line
    const handleRemoveNoteLine = useCallback((index) => {
        if (localNotes.items.length <= 1) return; // Keep at least one item
        const newItems = localNotes.items.filter((_, i) => i !== index);
        const newNotes = { ...localNotes, items: newItems };
        setLocalNotes(newNotes);
        if (onNotesChange) {
            onNotesChange(newNotes);
        }
    }, [localNotes, onNotesChange]);

    // Transform handle styles
    const handleStyle = "w-2.5 h-2.5 bg-white border-2 border-blue-500 z-10";
    const edgeHandleStyle = "w-2 h-2 bg-white border-2 border-blue-500 z-10";

    // Bounding Box Component with Transform Handles
    const BoundingBox = memo(({ children, elementType, className = "" }) => {
        const isSelected = selectedElement === elementType;
        const isHovered = hoveredElement === elementType;
        const displayClass = className.includes('block') ? '' : 'inline-block';

        const handleScaleStart = (e, corner) => {
            e.stopPropagation();
            e.preventDefault();

            isDragging.current = true;
            const elementStyles = styles[elementType] || { x: 0, y: 0, scale: 1, rotate: 0 };

            dragStart.current = {
                type: 'scale',
                corner,
                startX: e.clientX,
                startY: e.clientY,
                startScale: elementStyles.scale || 1,
                elementType: elementType
            };

            document.addEventListener('mousemove', handleTransformMove);
            document.addEventListener('mouseup', handleTransformMouseUp);
        };

        const handleRotateStart = (e) => {
            e.stopPropagation();
            e.preventDefault();

            const element = e.currentTarget.closest('.gpu-accelerated');
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            isDragging.current = true;
            const elementStyles = styles[elementType] || { x: 0, y: 0, scale: 1, rotate: 0 };

            dragStart.current = {
                type: 'rotate',
                centerX,
                centerY,
                startAngle: Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI),
                currentRotation: elementStyles.rotate || 0,
                elementType: elementType
            };

            document.addEventListener('mousemove', handleTransformMove);
            document.addEventListener('mouseup', handleTransformMouseUp);
        };

        const handleTransformMove = (e) => {
            if (!isDragging.current) return;
            const ds = dragStart.current;
            const elementType = ds.elementType;

            if (ds.type === 'scale') {
                const diffX = e.clientX - ds.startX;
                const diffY = e.clientY - ds.startY;
                const distance = Math.sqrt(diffX * diffX + diffY * diffY);
                const direction = (diffX + diffY) > 0 ? 1 : -1;

                // Simple proportional scaling
                const newScale = Math.max(0.1, ds.startScale + (direction * distance * 0.005));

                requestAnimationFrame(() => {
                    const updatedStyles = {
                        ...styles,
                        [elementType]: {
                            ...styles[elementType],
                            scale: newScale
                        }
                    };
                    onPositionChange(updatedStyles);
                });
            } else if (ds.type === 'rotate') {
                const angle = Math.atan2(e.clientY - ds.centerY, e.clientX - ds.centerX) * (180 / Math.PI);
                let newRotate = ds.currentRotation + (angle - ds.startAngle);

                // Snap to 45 degree increments if shift is held
                if (e.shiftKey) {
                    newRotate = Math.round(newRotate / 45) * 45;
                }

                requestAnimationFrame(() => {
                    const updatedStyles = {
                        ...styles,
                        [elementType]: {
                            ...styles[elementType],
                            rotate: newRotate
                        }
                    };
                    onPositionChange(updatedStyles);
                });
            }
        };

        const handleTransformMouseUp = () => {
            isDragging.current = false;
            document.removeEventListener('mousemove', handleTransformMove);
            document.removeEventListener('mouseup', handleTransformMouseUp);
        };

        const elementStyles = currentStyles[elementType] || { x: 0, y: 0, scale: 1, rotate: 0 };
        const rotation = elementStyles.rotate || 0;
        const scale = elementStyles.scale || 1;
        const x = elementStyles.x || 0;
        const y = elementStyles.y || 0;

        // Inverse scale for handles and outlines to keep them consistent
        const inverseScale = 1 / scale;
        const handleSize = 10 * inverseScale;
        const handleOffset = -5 * inverseScale;
        const outlineWidth = 2 * inverseScale;

        return (
            <div
                className={cn(
                    "gpu-accelerated export-no-ring transition-transform duration-75 ease-out",
                    displayClass,
                    isSelected && "z-40",
                    className
                )}
                onMouseDown={(e) => handleElementMouseDown(e, elementType)}
                onMouseEnter={() => setHoveredElement(elementType)}
                onMouseLeave={() => setHoveredElement(null)}
                style={{
                    cursor: isSelected ? 'move' : 'pointer',
                    transformOrigin: 'center center',
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
                    outline: isSelected ? `${outlineWidth}px solid #3b82f6` : isHovered ? `${outlineWidth}px solid rgba(147, 197, 253, 0.5)` : 'none',
                    outlineOffset: '2px'
                }}
            >
                {children}

                {/* Transform handles - only show when selected */}
                {isSelected && (
                    <>
                        {/* Corner handles */}
                        <div
                            className="export-hidden absolute bg-white border border-blue-500 z-50 shadow-sm"
                            style={{
                                width: `${handleSize}px`,
                                height: `${handleSize}px`,
                                top: `${handleOffset}px`,
                                left: `${handleOffset}px`,
                                cursor: 'nw-resize'
                            }}
                            onMouseDown={(e) => handleScaleStart(e, 'nw')}
                        />
                        <div
                            className="export-hidden absolute bg-white border border-blue-500 z-50 shadow-sm"
                            style={{
                                width: `${handleSize}px`,
                                height: `${handleSize}px`,
                                top: `${handleOffset}px`,
                                right: `${handleOffset}px`,
                                cursor: 'ne-resize'
                            }}
                            onMouseDown={(e) => handleScaleStart(e, 'ne')}
                        />
                        <div
                            className="export-hidden absolute bg-white border border-blue-500 z-50 shadow-sm"
                            style={{
                                width: `${handleSize}px`,
                                height: `${handleSize}px`,
                                bottom: `${handleOffset}px`,
                                left: `${handleOffset}px`,
                                cursor: 'sw-resize'
                            }}
                            onMouseDown={(e) => handleScaleStart(e, 'sw')}
                        />
                        <div
                            className="export-hidden absolute bg-white border border-blue-500 z-50 shadow-sm"
                            style={{
                                width: `${handleSize}px`,
                                height: `${handleSize}px`,
                                bottom: `${handleOffset}px`,
                                right: `${handleOffset}px`,
                                cursor: 'se-resize'
                            }}
                            onMouseDown={(e) => handleScaleStart(e, 'se')}
                        />

                        {/* Edge handles */}
                        <div
                            className="export-hidden absolute bg-white border border-blue-500 z-50 shadow-sm"
                            style={{
                                width: `${handleSize}px`,
                                height: `${handleSize}px`,
                                top: `${handleOffset}px`,
                                left: '50%',
                                marginLeft: `${handleOffset}px`,
                                cursor: 'n-resize'
                            }}
                            onMouseDown={(e) => handleScaleStart(e, 'n')}
                        />
                        <div
                            className="export-hidden absolute bg-white border border-blue-500 z-50 shadow-sm"
                            style={{
                                width: `${handleSize}px`,
                                height: `${handleSize}px`,
                                bottom: `${handleOffset}px`,
                                left: '50%',
                                marginLeft: `${handleOffset}px`,
                                cursor: 's-resize'
                            }}
                            onMouseDown={(e) => handleScaleStart(e, 's')}
                        />
                        <div
                            className="export-hidden absolute bg-white border border-blue-500 z-50 shadow-sm"
                            style={{
                                width: `${handleSize}px`,
                                height: `${handleSize}px`,
                                left: `${handleOffset}px`,
                                top: '50%',
                                marginTop: `${handleOffset}px`,
                                cursor: 'w-resize'
                            }}
                            onMouseDown={(e) => handleScaleStart(e, 'w')}
                        />
                        <div
                            className="export-hidden absolute bg-white border border-blue-500 z-50 shadow-sm"
                            style={{
                                width: `${handleSize}px`,
                                height: `${handleSize}px`,
                                right: `${handleOffset}px`,
                                top: '50%',
                                marginTop: `${handleOffset}px`,
                                cursor: 'e-resize'
                            }}
                            onMouseDown={(e) => handleScaleStart(e, 'e')}
                        />

                        {/* Center move icon */}
                        <div className="export-hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <svg width={20 * inverseScale} height={20 * inverseScale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                                <path d="M12 2L12 22M2 12L22 12M12 2L8 6M12 2L16 6M12 22L8 18M12 22L16 18M2 12L6 8M2 12L6 16M22 12L18 8M22 12L18 16" />
                            </svg>
                        </div>

                        {/* Rotate handle */}
                        <div
                            className="export-hidden absolute left-1/2 -translate-x-1/2 cursor-grab flex items-center justify-center bg-white rounded-full border border-blue-500 shadow-md"
                            style={{
                                width: `${handleSize * 2.5}px`,
                                height: `${handleSize * 2.5}px`,
                                top: `${handleOffset * 6}px`
                            }}
                            onMouseDown={handleRotateStart}
                            title="Rotate"
                        >
                            <svg width={14 * inverseScale} height={14 * inverseScale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.07.74 5.61 1.97" />
                                <path d="M21 3v6h-6" />
                            </svg>
                        </div>
                    </>
                )}
            </div>
        );
    });

    return (
        <div className="w-full h-full flex justify-center items-center relative">
            <div className={cn("relative overflow-hidden shadow-2xl rounded-xl w-full h-full", className)}>
                {/* 1080x1080 Container */}
                <div
                    id={id}
                    ref={containerRef}
                    className="w-full h-full max-w-[1080px] max-h-[1080px] relative flex flex-col items-center justify-center overflow-hidden aspect-square transition-transform duration-75 ease-out gpu-accelerated"
                    style={{
                        ...containerStyle,
                        transform: `translateY(${scrollOffset}px)`
                    }}
                    onClick={handleCanvasClick}
                >
                    {!hasTemplate && (
                        <div className="absolute inset-0 opacity-5 pointer-events-none"
                            style={{ backgroundImage: `radial-gradient(${colors.primary} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}
                        />
                    )}

                    {/* Content Container */}
                    <div className={cn(
                        "flex flex-col items-center origin-center gpu-accelerated",
                        hasTemplate ? "absolute" : "w-full p-16"
                    )}>

                        {/* Brand Logo */}
                        {brand && brand.logo && (
                            <BoundingBox elementType="logo" className="mb-6 flex justify-center">
                                <img
                                    src={brand.logo}
                                    alt={brand.name}
                                    className="h-32 w-auto object-contain pointer-events-none select-none"
                                    style={{ maxHeight: '120px', maxWidth: '300px' }}
                                    draggable="false"
                                    onDragStart={(e) => e.preventDefault()}
                                />
                            </BoundingBox>
                        )}

                        {/* Optional Title */}
                        {currentStyles.title && (
                            <BoundingBox elementType="title" className="mb-8 flex justify-center">
                                <h2
                                    className="text-5xl font-bold uppercase tracking-wider text-center"
                                    style={{ color: currentStyles.textColor }}
                                >
                                    {currentStyles.title}
                                </h2>
                            </BoundingBox>
                        )}

                        {/* The Table */}
                        <BoundingBox elementType="table" className="w-full">
                            <div
                                className="overflow-hidden rounded-2xl w-full"
                                style={{
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                }}
                            >
                                <table className="text-center border-collapse rounded-2xl overflow-hidden w-full" style={{ minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: currentStyles.headerColor, color: '#ffffff' }}>
                                            {localData.headers.map((header, i) => (
                                                <th key={i} className="py-6 px-8 text-3xl font-bold uppercase tracking-wider border-r last:border-r-0 border-white/20">
                                                    <EditableText
                                                        value={header}
                                                        onChange={(newValue) => handleHeaderChange(i, newValue)}
                                                        placeholder="Header"
                                                        tag="span"
                                                    />
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {localData.data.map((row, i) => (
                                            <tr
                                                key={i}
                                                style={{
                                                    backgroundColor: i % 2 === 0 ? '#ffffff' : currentStyles.rowColor,
                                                    color: currentStyles.textColor
                                                }}
                                            >
                                                {localData.headers.map((header, j) => (
                                                    <td key={j} className="py-5 px-8 text-3xl font-medium border-r last:border-r-0 border-gray-200">
                                                        <EditableText
                                                            value={row[header] || ''}
                                                            onChange={(newValue) => handleCellChange(i, header, newValue)}
                                                            placeholder="-"
                                                            tag="span"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </BoundingBox>

                        {/* Note Section */}
                        <BoundingBox elementType="note" className="w-full mt-8">
                            <div
                                className="p-4 rounded-lg text-white text-left"
                                style={{ backgroundColor: currentStyles.headerColor }}
                            >
                                <p className="font-semibold mb-2">
                                    <EditableText
                                        value={localNotes.title}
                                        onChange={handleNoteTitleChange}
                                        placeholder="Note title"
                                        tag="span"
                                    />
                                </p>
                                <div className="text-sm space-y-1">
                                    {localNotes.items.map((item, index) => (
                                        <div key={index} className="group flex items-center gap-2">
                                            <EditableText
                                                value={item}
                                                onChange={(newValue) => handleNoteItemChange(index, newValue)}
                                                placeholder={`Note ${index + 1}`}
                                                tag="span"
                                                className="flex-1"
                                            />
                                            {localNotes.items.length > 1 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveNoteLine(index);
                                                    }}
                                                    className="export-hidden opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-100 transition-all text-xs font-bold"
                                                    title="Remove line"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </BoundingBox>

                        {/* Add Line Button - Floating outside the note */}
                        {selectedElement === 'note' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddNoteLine();
                                }}
                                className="export-hidden py-1 px-3 rounded-full bg-violet-500/80 hover:bg-violet-500 text-white text-xs font-medium transition-all flex items-center justify-center gap-1 shadow-lg mt-2"
                            >
                                <span className="text-sm leading-none">+</span> Add Note
                            </button>
                        )}
                    </div>



                    {/* SKU Overlay - Bottom Right Corner of Generated Image */}
                    {(localSku || onSkuChange) && (
                        <div className="absolute bottom-4 right-4 z-10">
                            <div className="text-white text-xs font-medium bg-black/60 backdrop-blur-sm rounded px-2 py-1 shadow-lg flex items-center gap-1">
                                <span>SKU:</span>
                                <EditableText
                                    value={localSku || ''}
                                    onChange={handleSkuChange}
                                    placeholder="Enter SKU"
                                    tag="span"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Overlay to scale it down visually in the UI but keep 1080px real size for export */}
                <div className="absolute inset-0 bg-transparent pointer-events-none border border-border/20" />

                {/* Smart Snap Guide Lines */}
                {snapGuides.vertical !== null && (
                    <div
                        className="absolute top-0 bottom-0 w-px pointer-events-none z-50"
                        style={{
                            left: '50%',
                            background: 'linear-gradient(to bottom, transparent, #00d9ff, transparent)',
                            boxShadow: '0 0 8px #00d9ff',
                        }}
                    />
                )}
                {snapGuides.horizontal !== null && (
                    <div
                        className="absolute left-0 right-0 h-px pointer-events-none z-50"
                        style={{
                            top: '50%',
                            background: 'linear-gradient(to right, transparent, #00d9ff, transparent)',
                            boxShadow: '0 0 8px #00d9ff',
                        }}
                    />
                )}
            </div>
        </div>
    );
}
