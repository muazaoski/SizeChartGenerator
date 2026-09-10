import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Settings, Key, Download, Info, Upload, Palette, Layout, Sliders, Table, ChevronLeft, ChevronRight, Sparkles, X, Eye, Image, Wand2, ZoomIn, ZoomOut, RotateCcw, Plus, Star, Layers, Clock } from 'lucide-react';
import { ImageUpload } from './components/ImageUpload';
import { DataEditor } from './components/DataEditor';
import { BrandSelector } from './components/BrandSelector';
import { extractDataFromOCR } from './lib/ocr';
import { ChartPreview } from './components/ChartPreview';
import { StyleControls } from './components/StyleControls';
import { BackgroundPresets } from './components/BackgroundPresets';
import { ColorPresets } from './components/ColorPresets';
import { PresetManager } from './components/PresetManager';
import { BatchQueue } from './components/BatchQueue';
import { BatchReview } from './components/BatchReview';
import { getPresetById, presetSettingsToState } from './lib/presetStorage';
import { toJpeg } from 'html-to-image';
import { loadSession, saveSession } from './lib/sessionStorage';
import { SourceReference } from './components/SourceReference';

// Keep the workspace and batch drafts together in the local session.
function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [customTemplate, setCustomTemplate] = useState('/backgrounds/white-solid.jpg');
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [sku, setSku] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [previewZoom, setPreviewZoom] = useState(0.8);
  const [showSource, setShowSource] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Loading session…');
  const canvasArea = useRef(null);
  const [canvasFit, setCanvasFit] = useState(1);

  // Timer and batch states
  const [processingTime, setProcessingTime] = useState(0);
  const [batchQueue, setBatchQueue] = useState([]);
  const [batchMode, setBatchMode] = useState(false);
  const [showBatchReview, setShowBatchReview] = useState(false);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [batchResults, setBatchResults] = useState([]);
  const [batchRenderItem, setBatchRenderItem] = useState(null); // Current item being rendered
  const [isRendering, setIsRendering] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null); // Track which batch item is being edited
  const processingTimerRef = useRef(null);
  const batchRenderRef = useRef(null); // Ref for hidden render container
  const [chartStyles, setChartStyles] = useState({
    scale: 1,
    x: 0,
    y: 0,
    headerColor: '#000000',
    rowColor: '#f3f4f6',
    textColor: '#000000',
    title: '',
    logo: { x: 0, y: 0, scale: 1 },
    table: { x: 0, y: 0, scale: 1 },
    note: { x: 0, y: 0, scale: 1 },
    notesContent: null
  });

  useEffect(() => {
    let cancelled = false;
    loadSession().then(saved => {
      if (cancelled) return;
      if (saved) {
        setSelectedImage(saved.selectedImage);
        setChartData(saved.chartData);
        setSelectedBrand(saved.selectedBrand);
        setCustomTemplate(saved.customTemplate);
        setChartStyles(saved.chartStyles);
        setSku(saved.sku);
        setBatchQueue(saved.batchQueue.map(item => item.status === 'processing' ? { ...item, status: 'pending' } : item));
        setBatchResults(saved.batchResults);
        setBatchMode(saved.batchMode);
        setEditingBatchId(saved.editingBatchId);
        setShowBatchReview(saved.showBatchReview);
        setActiveTab(saved.activeTab);
        setPreviewZoom(saved.previewZoom);
        setShowSource(saved.showSource ?? true);
      }
      setSaveStatus(saved ? 'Session restored' : 'Autosave on');
      setSessionReady(true);
    }).catch(() => {
      if (!cancelled) { setSaveStatus('Autosave unavailable'); setSessionReady(true); }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    let current = true;
    setSaveStatus('Saving…');
    // IndexedDB retains files and large image previews without localStorage limits.
    saveSession({ selectedImage, chartData, selectedBrand, customTemplate, chartStyles, sku,
      batchQueue, batchResults, batchMode, editingBatchId, showBatchReview, activeTab, previewZoom, showSource })
      .then(() => { if (current) setSaveStatus('Saved on this device'); })
      .catch(() => { if (current) setSaveStatus('Could not autosave — browser storage may be full'); });
    return () => { current = false; };
  }, [sessionReady, selectedImage, chartData, selectedBrand, customTemplate, chartStyles, sku,
    batchQueue, batchResults, batchMode, editingBatchId, showBatchReview, activeTab, previewZoom, showSource]);

  useEffect(() => {
    const node = canvasArea.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setCanvasFit(Math.max(0.1, Math.min(entry.contentRect.width / 1080, (entry.contentRect.height - 100) / 1080)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [sessionReady, chartData, showSource]);

  // ========== GLOBAL UNDO/REDO SYSTEM (Photoshop-style) ==========
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoAction = useRef(false);
  const MAX_HISTORY = 50;

  // Capture current state for history
  const captureState = useCallback(() => {
    return {
      chartData: chartData ? JSON.parse(JSON.stringify(chartData)) : null,
      chartStyles: JSON.parse(JSON.stringify(chartStyles)),
      sku: sku,
      selectedBrand: selectedBrand ? JSON.parse(JSON.stringify(selectedBrand)) : null,
      customTemplate: customTemplate
    };
  }, [chartData, chartStyles, sku, selectedBrand, customTemplate]);

  // Push state to history (called after any canvas change)
  const pushToHistory = useCallback(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    const state = captureState();

    // Remove any future states if we're in the middle of history
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(state);

    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    } else {
      historyIndexRef.current = newHistory.length - 1;
    }

    historyRef.current = newHistory;
  }, [captureState]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;

    isUndoRedoAction.current = true;
    historyIndexRef.current -= 1;
    const state = historyRef.current[historyIndexRef.current];

    if (state) {
      setChartData(state.chartData);
      setChartStyles(state.chartStyles);
      setSku(state.sku);
      setSelectedBrand(state.selectedBrand);
      setCustomTemplate(state.customTemplate);
    }
  }, []);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    isUndoRedoAction.current = true;
    historyIndexRef.current += 1;
    const state = historyRef.current[historyIndexRef.current];

    if (state) {
      setChartData(state.chartData);
      setChartStyles(state.chartStyles);
      setSku(state.sku);
      setSelectedBrand(state.selectedBrand);
      setCustomTemplate(state.customTemplate);
    }
  }, []);

  // Global keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z or Cmd+Shift+Z = Redo (Photoshop style)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+Y = Redo (alternative)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Track state changes and push to history
  useEffect(() => {
    if (chartData) {
      pushToHistory();
    }
  }, [chartData, chartStyles, sku, selectedBrand, customTemplate]);
  // ========== END UNDO/REDO SYSTEM ==========


  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  // Auto-switch to design tab when chart is generated
  useEffect(() => {
    if (chartData && activeTab === 'upload') {
      setActiveTab('design');
    }
  }, [chartData]);

  const handleSaveKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowSettings(false);
  };

  const handleSKUExtracted = (extractedSku) => {
    setSku(extractedSku);
  };

  const processImage = async (imageData) => {
    setIsProcessing(true);
    setError(null);
    setProcessingTime(0);

    // Start timer
    const startTime = Date.now();
    processingTimerRef.current = setInterval(() => {
      setProcessingTime((Date.now() - startTime) / 1000);
    }, 100);

    try {
      const { tableData, sku: extractedSku, notes } = await extractDataFromOCR(imageData, apiKey);

      setChartData(tableData);
      if (extractedSku) {
        setSku(extractedSku);
      }
      if (notes) {
        setChartStyles(prev => ({ ...prev, notesContent: notes }));
      }
    } catch (err) {
      console.error("Processing error:", err);
      setError(err.message || "Failed to process image with Custom OCR");
      setChartData(null);
    } finally {
      // Stop timer
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
        processingTimerRef.current = null;
      }
      setProcessingTime((Date.now() - startTime) / 1000);
      setIsProcessing(false);
    }
  };

  const handleImageSelect = async (imageData) => {
    setSelectedImage(imageData);
    setChartData(null);
    setError(null);
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
  };

  // ========== BATCH PROCESSING HANDLERS ==========

  const handleBatchAdd = (item) => {
    setBatchQueue(prev => [...prev, item]);
    if (!batchMode) setBatchMode(true);
  };

  const handleBatchRemove = (id) => {
    setBatchQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleBatchClear = () => {
    setBatchQueue([]);
    setBatchResults([]);
    setBatchMode(false);
  };

  const handleProcessSingle = async (id) => {
    const item = batchQueue.find(i => i.id === id);
    if (!item) return null;

    // Update status
    setBatchQueue(prev => prev.map(i =>
      i.id === id ? { ...i, status: 'processing' } : i
    ));

    // Snapshot the design before OCR starts so each result owns its settings.
    const preset = item.presetId ? getPresetById(item.presetId) : null;
    const presetState = preset ? presetSettingsToState(preset.settings) : null;
    const design = structuredClone({
      chartStyles: presetState ? presetState.chartStyles : chartStyles,
      customTemplate: presetState ? presetState.customTemplate : customTemplate,
      selectedBrand: presetState
        ? (presetState.brandLogo ? { id: 'custom', logo: presetState.brandLogo } : null)
        : selectedBrand
    });
    const startTime = Date.now();
    try {
      const { tableData, sku: extractedSku } = await extractDataFromOCR(item.preview, apiKey);
      const elapsed = (Date.now() - startTime) / 1000;

      setBatchQueue(prev => prev.map(i =>
        i.id === id ? {
          ...i,
          status: 'done',
          processingTime: elapsed,
          result: { chartData: tableData, sku: extractedSku }
        } : i
      ));

      // Create result object
      const result = {
        id,
        file: item.file,
        preview: item.preview,
        chartData: tableData,
        sku: extractedSku,
        processingTime: elapsed,
        status: 'done',
        includeInExport: true,
        exportedImage: null,
        design,
        presetId: item.presetId || null // Store which preset was selected
      };

      // Add to results for review
      setBatchResults(prev => [...prev, result]);

      return result; // Return for batch processing
    } catch (err) {
      setBatchQueue(prev => prev.map(i =>
        i.id === id ? { ...i, status: 'error', error: err.message } : i
      ));
      return null;
    }
  };

  const handleProcessAll = async () => {
    const pending = batchQueue.filter(i => i.status === 'pending');

    // Step 1: Extract data from all images IN PARALLEL
    const extractPromises = pending.map(item => handleProcessSingle(item.id));
    const results = await Promise.all(extractPromises);
    const extractedResults = results.filter(r => r !== null);

    if (extractedResults.length === 0) {
      setShowBatchReview(true);
      return;
    }

    // Step 2: Render all charts and capture images
    setIsRendering(true);

    for (const result of extractedResults) {
      setBatchRenderItem(result);

      // Wait for React to render the ChartPreview
      await new Promise(r => setTimeout(r, 800));

      // Capture the rendered chart
      if (batchRenderRef.current) {
        try {
          const dataUrl = await toJpeg(batchRenderRef.current, {
            quality: 0.95,
            backgroundColor: '#ffffff',
            pixelRatio: 2
          });

          // Update result with exported image
          setBatchResults(prev => prev.map(r =>
            r.id === result.id ? { ...r, exportedImage: dataUrl } : r
          ));
        } catch (err) {
          console.error('Failed to render chart:', result.id, err);
        }
      }
    }

    setBatchRenderItem(null);
    setIsRendering(false);

    // Show review after all processed and rendered
    setShowBatchReview(true);
  };

  const handleToggleExport = (id, includeInExport) => {
    setBatchResults(prev => prev.map(r =>
      r.id === id ? { ...r, includeInExport } : r
    ));
  };

  const handleApplyDesignToBatch = async (sourceId, targetIds) => {
    const source = batchResults.find(r => r.id === sourceId);
    if (!source?.design) throw new Error('Open and save the source chart first.');
    setIsRendering(true);
    try {
      const updates = [];
      for (const target of batchResults.filter(r => targetIds.includes(r.id) && r.id !== sourceId)) {
        const design = structuredClone(source.design);
        // Text belongs to the target chart; only its visual settings are copied.
        design.chartStyles.title = target.design?.chartStyles.title ?? '';
        design.chartStyles.notesContent = structuredClone(target.design?.chartStyles.notesContent ?? null);
        const next = { ...target, design };
        setBatchRenderItem(next);
        await new Promise(resolve => setTimeout(resolve, 800));
        await document.fonts.ready;
        if (!batchRenderRef.current) throw new Error('Unable to render the selected charts.');
        await Promise.all(Array.from(batchRenderRef.current.querySelectorAll('img')).map(img => img.decode()));
        const exportedImage = await toJpeg(batchRenderRef.current, {
          quality: 0.95, pixelRatio: 2, backgroundColor: '#ffffff',
          filter: node => !node.classList?.contains('export-hidden')
        });
        updates.push({ ...next, exportedImage });
      }
      // Commit together: failed captures leave all original designs intact.
      setBatchResults(previous => previous.map(result => updates.find(r => r.id === result.id) || result));
    } finally {
      setBatchRenderItem(null);
      setIsRendering(false);
    }
  };

  const handleUpdateBatchPreset = (id, presetId) => {
    setBatchQueue(prev => prev.map(item =>
      item.id === id ? { ...item, presetId } : item
    ));
  };

  const handleApplyPreset = (state) => {
    setChartStyles(state.chartStyles);
    setCustomTemplate(state.customTemplate);
    if (state.brandLogo) {
      setSelectedBrand(prev => prev ? { ...prev, logo: state.brandLogo } : { id: 'custom', logo: state.brandLogo });
    }
    setShowPresetManager(false);
  };

  const handleLogoUpload = (logoData) => {
    if (selectedBrand && selectedBrand.id === 'custom') {
      setSelectedBrand({ ...selectedBrand, logo: logoData });
    }
  };

  const handleCustomBackgroundUpload = (backgroundData) => {
    setCustomTemplate(backgroundData);
  };

  const handleStyleChange = (newStyles) => {
    setChartStyles(newStyles);
  };

  const handlePositionChange = (updatedStyles) => {
    setChartStyles(prev => ({ ...prev, ...updatedStyles }));
  };


  const handleExport = async (format) => {
    if (format !== 'jpg' && format !== 'jpeg') {
      alert('Only JPEG export is supported for high quality output.');
      return;
    }

    setIsExporting(true);

    try {
      const chartElement = document.getElementById('chart-preview');
      if (!chartElement) {
        alert('Chart preview not found!');
        return;
      }

      const originalStyles = {
        width: chartElement.style.width,
        height: chartElement.style.height,
        maxWidth: chartElement.style.maxWidth,
        maxHeight: chartElement.style.maxHeight,
        transform: chartElement.style.transform,
        className: chartElement.className,
        position: chartElement.style.position,
        left: chartElement.style.left,
        top: chartElement.style.top,
      };

      const logoImages = chartElement.querySelectorAll('img');
      const originalLogoStyles = Array.from(logoImages).map((logo) => ({
        width: logo.style.width,
        height: logo.style.height,
        maxWidth: logo.style.maxWidth,
        maxHeight: logo.style.maxHeight,
        objectFit: logo.style.objectFit,
      }));

      const tableWrappers = chartElement.querySelectorAll('div[class*="overflow-hidden rounded-2xl"]');

      Object.assign(chartElement.style, {
        width: '1080px',
        height: '1080px',
        maxWidth: '1080px',
        maxHeight: '1080px',
        transform: 'none',
        position: 'relative',
        left: 'auto',
        top: 'auto',
      });

      chartElement.className = chartElement.className.replace('aspect-square', '');

      logoImages.forEach((logo) => {
        logo.style.maxHeight = '120px';
        logo.style.maxWidth = '300px';
        logo.style.objectFit = 'contain';
      });

      tableWrappers.forEach((wrapper) => {
        wrapper.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      });

      // Remove bounding box outline styles for export
      const elementsWithRing = chartElement.querySelectorAll('.export-no-ring');
      const originalRingClasses = Array.from(elementsWithRing).map(el => el.className);
      elementsWithRing.forEach(el => {
        el.className = el.className
          .replace(/outline/g, '')
          .replace(/outline-2/g, '')
          .replace(/outline-yellow-500/g, '')
          .replace(/outline-amber-400\/50/g, '');
      });

      chartElement.offsetHeight;

      const dataUrl = await toJpeg(chartElement, {
        quality: 0.95,
        pixelRatio: 2,
        width: 1080,
        height: 1080,
        backgroundColor: customTemplate ? null : '#ffffff',
        style: {
          transform: 'none',
          width: '1080px',
          height: '1080px',
        },
        filter: (node) => {
          // Keep all image elements (logos, backgrounds)
          if (node.tagName === 'IMG') return true;

          // Exclude hidden export elements and decorative overlays
          if (node.classList?.contains('export-hidden')) return false;

          // Exclude the dotted background overlay (it has both pointer-events-none AND opacity-5)
          if (node.classList?.contains('pointer-events-none') &&
            node.classList?.contains('opacity-5')) return false;

          // Exclude the border overlay at the end
          if (node.classList?.contains('pointer-events-none') &&
            node.classList?.contains('border') &&
            node.classList?.contains('bg-transparent')) return false;

          return true;
        },
        cacheBust: true,
        imagePlaceholder: undefined,
        skipAutoScale: false,
      });


      Object.assign(chartElement.style, originalStyles);
      chartElement.className = originalStyles.className;

      logoImages.forEach((logo, index) => {
        const original = originalLogoStyles[index];
        Object.assign(logo.style, original);
      });

      // Restore ring classes
      elementsWithRing.forEach((el, index) => {
        el.className = originalRingClasses[index];
      });

      const brandName = selectedBrand?.name ? `${selectedBrand.name}-` : '';
      const skuName = sku ? `${sku}-` : '';
      const fileName = brandName || skuName ? `${brandName}${skuName}${new Date().toISOString().split('T')[0]}.jpeg` : `size-chart-${new Date().toISOString().split('T')[0]}.jpeg`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);

      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);

    } catch (error) {
      console.error('Error exporting chart:', error);
      alert(`Failed to export: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveBatchEdit = async () => {
    if (!editingBatchId) return;

    const savedState = captureState();
    const savedEdit = {
      chartData: savedState.chartData,
      sku: savedState.sku,
      design: {
        chartStyles: savedState.chartStyles,
        customTemplate: savedState.customTemplate,
        selectedBrand: savedState.selectedBrand
      },
      exportedImage: null
    };
    // Persist edits even if generating the preview fails.
    setBatchResults(prev => prev.map(result =>
      result.id === editingBatchId ? { ...result, ...savedEdit } : result
    ));
    setIsRendering(true);
    // Give UI time to settle
    await new Promise(r => setTimeout(r, 800));

    try {
      const chartElement = document.getElementById('chart-preview');
      if (chartElement) {
        // Prepare for high-quality capture (matches handleExport logic)
        const originalStyles = {
          width: chartElement.style.width,
          height: chartElement.style.height,
          transform: chartElement.style.transform,
          className: chartElement.className,
          position: chartElement.style.position
        };

        Object.assign(chartElement.style, {
          width: '1080px',
          height: '1080px',
          maxWidth: '1080px',
          maxHeight: '1080px',
          transform: 'none',
          position: 'relative'
        });

        const originalClassName = chartElement.className;
        chartElement.className = chartElement.className.replace('aspect-square', '');

        const dataUrl = await toJpeg(chartElement, {
          quality: 0.9,
          pixelRatio: 1.5,
          width: 1080,
          height: 1080,
          backgroundColor: customTemplate ? null : '#ffffff',
          filter: (node) => {
            if (node.classList?.contains('export-hidden')) return false;
            if (node.classList?.contains('opacity-5')) return false; // Dotted grid
            if (node.classList?.contains('border') && node.classList?.contains('bg-transparent')) return false; // Safe zone border
            return true;
          }
        });

        // Restore styles
        Object.assign(chartElement.style, originalStyles);
        chartElement.className = originalClassName;

        setBatchResults(prev => prev.map(result =>
          result.id === editingBatchId
            ? {
              ...result,
              ...savedEdit,
              exportedImage: dataUrl
            }
            : result
        ));
      }
    } catch (err) {
      console.error('Failed to update batch preview:', err);

    } finally {
      setIsRendering(false);
      setEditingBatchId(null);
      setShowBatchReview(true);
      // Reset editor state to clear for next potential item
      setChartData(null);
      setSku(null);
      setActiveTab('upload');
    }
  };

  const tabs = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'design', label: 'Design', icon: Palette, disabled: !chartData },
    { id: 'layout', label: 'Layout', icon: Layout, disabled: !chartData },
    { id: 'data', label: 'Data', icon: Table, disabled: !chartData },
  ];

  if (!sessionReady) return <div className="h-screen bg-black text-white grid place-items-center">Loading your session…</div>;

  return (
    <div className="h-screen bg-black text-gray-100 flex flex-col overflow-hidden selection:bg-yellow-500 selection:text-black">
      {/* Top Navigation Bar */}
      <nav className="h-20 bg-black/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-8 shrink-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 group cursor-default">
            <img src="/logo.svg" className="w-10 h-10 object-contain group-hover:scale-110 transition-all duration-500" alt="Favicon" />
            <div className="flex flex-col">
              <h1 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none">
                SizeChart<span className="text-yellow-500">PLS</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Size chart generator</p>
              <p role="status" className="text-[10px] text-zinc-400 mt-1">{saveStatus}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {chartData && selectedImage && <button onClick={() => setShowSource(v => !v)} aria-pressed={showSource} className="text-xs text-yellow-400 px-2 py-2">{showSource ? 'Hide source' : 'Show source'}</button>}
          {!!batchResults.length && !editingBatchId && <button onClick={() => setShowBatchReview(true)} className="text-xs text-zinc-300">Review batch</button>}
          {editingBatchId && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingBatchId(null);
                  setChartData(null);
                  setSku(null);
                  setShowBatchReview(true);
                }}
                className="px-6 py-3 text-gray-500 hover:text-red-400 transition-all text-xs font-black uppercase tracking-widest"
              >
                Discard
              </button>
              <button
                onClick={handleSaveBatchEdit}
                className="px-6 py-3 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all duration-300 flex items-center gap-3 shadow-2xl active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                Save
              </button>
            </div>
          )}
          {chartData && (
            <button
              onClick={() => handleExport('jpeg')}
              disabled={isExporting}
              className="px-6 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-yellow-500 transition-all duration-300 flex items-center gap-3 shadow-2xl disabled:opacity-50 active:scale-95"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </button>
          )}
          <div className="w-px h-8 bg-white/5 mx-2" />
          <button
            onClick={() => setShowAbout(!showAbout)}
            className="p-3 rounded-xl hover:bg-white/5 transition-all text-gray-500 hover:text-white group"
            title="About"
          >
            <Info className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </nav>

      {/* About Modal */}

      {showAbout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-white/10 p-10 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 pointer-events-none" />
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative space-y-6">
              <img src="/logo.svg" className="w-16 h-16 mx-auto object-contain" alt="Logo" />
              <div className="space-y-2">
                <h3 className="font-bold text-3xl text-white">SizeChartPLS</h3>
                <p className="text-yellow-500 font-bold uppercase tracking-[0.2em] text-xs">V.2.0 Black Edition</p>
              </div>
              <p className="text-gray-400 leading-relaxed text-sm">
                Transform blurry chart photos into world-class design graphics in seconds using our custom localized OCR engine.
              </p>
              <div className="pt-8 border-t border-white/5 space-y-1">
                <p className="text-xs text-gray-500 font-medium">Developed by</p>
                <p className="text-xl font-bold text-white tracking-tight">
                  Muaz <span className="text-yellow-500">Azri</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/20 p-6 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Something went wrong</h3>
                <p className="text-sm text-gray-400 mb-4">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => {
                      setError(null);
                      processImage(selectedImage);
                    }}
                    className="px-4 py-2 text-sm bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-bold"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-all duration-500 shrink-0`}>
          {/* Tab Navigation */}
          <div className={`border-b border-white/5 ${sidebarCollapsed ? 'py-4' : 'p-6'}`}>
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id)}
                    disabled={tab.disabled}
                    className={`p-3.5 rounded-2xl transition-all relative group ${activeTab === tab.id
                      ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                      : tab.disabled
                        ? 'text-white/10 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-white/5 hover:text-white'
                      }`}
                    title={tab.label}
                  >
                    <tab.icon className="w-5 h-5" />
                    {activeTab === tab.id && (
                      <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1 h-6 bg-yellow-500 rounded-r-full" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id)}
                    disabled={tab.disabled}
                    className={`px-3 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2 border ${activeTab === tab.id
                      ? 'bg-yellow-500 text-black border-yellow-500 shadow-xl shadow-yellow-500/10'
                      : tab.disabled
                        ? 'text-white/10 border-transparent cursor-not-allowed'
                        : 'text-gray-500 border-white/5 hover:bg-white/5 hover:border-white/10'
                      }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'hidden' : 'p-4'}`}>
            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                {/* Top Actions */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowPresetManager(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-400 text-xs font-bold rounded-lg hover:bg-white/10 transition-all"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Presets
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-yellow-500" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400">
                        {batchMode ? 'Add Images' : 'Source Image'}
                      </h3>
                    </div>
                  </div>
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    onBatchAdd={handleBatchAdd}
                    apiKey={apiKey}
                    batchMode={batchMode}
                  />

                  {/* Batch Queue */}
                  {batchQueue.length > 0 && (
                    <BatchQueue
                      queue={batchQueue}
                      onRemove={handleBatchRemove}
                      onProcess={handleProcessSingle}
                      onProcessAll={handleProcessAll}
                      onClear={handleBatchClear}
                      onUpdatePreset={handleUpdateBatchPreset}
                      isProcessing={isProcessing}
                    />
                  )}

                  {/* Show uploaded image preview (single mode only) */}
                  {batchQueue.length === 0 && selectedImage && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Source Preview</p>
                      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/20">
                        <img
                          src={selectedImage}
                          alt="Uploaded source"
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {batchQueue.length === 0 && selectedImage && !chartData && !isProcessing && (
                  <div className="pt-2">
                    <button
                      onClick={() => processImage(selectedImage)}
                      className="w-full py-5 px-6 bg-yellow-500 text-black rounded-2xl font-black uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-yellow-500/20 group"
                    >
                      <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      Generate Now
                    </button>
                  </div>
                )}

                {isProcessing && (
                  <div className="py-12 flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-2 border-white/5 border-t-yellow-500 animate-spin" />
                      <Wand2 className="w-8 h-8 text-yellow-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-bold text-lg text-white">Extracting Data</p>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Neural Engine at work</p>
                      {/* Timer Display */}
                      <div className="flex items-center justify-center gap-1 text-yellow-500 mt-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono font-bold text-lg">{processingTime.toFixed(1)}s</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsProcessing(false)}
                      className="px-4 py-2 rounded-full border border-white/10 text-[10px] uppercase font-bold text-gray-500 hover:text-red-400 hover:border-red-400/20 transition-all"
                    >
                      Force Cancel
                    </button>
                  </div>
                )}

                {chartData && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Chart Generated!</span>
                      </div>
                      {processingTime > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {processingTime.toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Switch to Design tab to customize</p>
                  </div>
                )}
              </div>
            )}

            {/* Design Tab */}
            {activeTab === 'design' && chartData && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-semibold text-sm">Brand Logo</h3>
                  </div>
                  <BrandSelector
                    selectedBrand={selectedBrand}
                    onSelect={handleBrandSelect}
                    onLogoUpload={handleLogoUpload}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-semibold text-sm">Background</h3>
                  </div>
                  <BackgroundPresets
                    currentTemplate={customTemplate}
                    onTemplateSelect={setCustomTemplate}
                    currentStyles={chartStyles}
                    onStyleChange={handleStyleChange}
                    onCustomBackgroundUpload={handleCustomBackgroundUpload}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-semibold text-sm">Color Scheme</h3>
                  </div>
                  <ColorPresets
                    currentStyles={chartStyles}
                    onStyleChange={handleStyleChange}
                  />
                </div>
              </div>
            )}

            {/* Layout Tab */}
            {activeTab === 'layout' && chartData && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-semibold text-sm">Position & Scale</h3>
                  </div>
                  <StyleControls
                    selectedElement={selectedElement}
                    styles={chartStyles}
                    onStyleChange={setChartStyles}
                  />
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-start gap-3">
                    <Eye className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Pro Tip</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Click on elements in the preview to select them, then use the sliders to adjust position and scale.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && chartData && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-semibold text-sm">Table Data</h3>
                  </div>
                  <DataEditor
                    initialData={chartData}
                    onSave={(data) => setChartData(data)}
                  />
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-start gap-3">
                    <Eye className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Inline Editing</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Double-click any text in the preview to edit it directly, just like in Photoshop!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapse Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-3 border-t border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </aside>

        {/* Preview Area */}
        {chartData && selectedImage && showSource && <SourceReference key={selectedImage} src={selectedImage} />}
        <main ref={canvasArea} className="flex-1 min-w-0 bg-black/60 flex items-center justify-center p-3 overflow-hidden relative">
          {!chartData ? (
            <div className="text-center max-w-sm">
              <div className="w-32 h-32 mx-auto mb-8 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl relative">
                <Image className="w-12 h-12 text-gray-700" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black">
                  <Plus className="w-4 h-4 font-bold" />
                </div>
              </div>
              <h2 className="text-2xl font-black mb-3 text-white">READY TO DESIGN?</h2>
              <p className="text-gray-500 text-sm leading-relaxed px-4">
                Upload your raw scan to transform it into a premium high-resolution size chart.
              </p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              <div
                className="transition-transform duration-200 ease-out origin-center"
                style={{ transform: `scale(${showSource && selectedImage ? canvasFit * previewZoom / 0.8 : previewZoom})` }}
              >
                <ChartPreview
                  id="chart-preview"
                  data={chartData}
                  brand={selectedBrand}
                  template={customTemplate}
                  styles={chartStyles}
                  selectedElement={selectedElement}
                  setSelectedElement={setSelectedElement}
                  onPositionChange={handlePositionChange}
                  onExport={handleExport}
                  sku={sku}
                  notes={chartStyles.notesContent}
                  onDataChange={(newData) => setChartData(newData)}
                  onSkuChange={(newSku) => setSku(newSku)}
                  onNotesChange={(newNotes) => setChartStyles(prev => ({ ...prev, notesContent: newNotes }))}
                  className="w-[1080px] h-[1080px] shadow-2xl"
                />
              </div>

              {/* Zoom controls remain visible on every background */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-white/25 rounded-full shadow-2xl">
                  <button
                    onClick={() => setPreviewZoom(prev => Math.max(0.2, prev - 0.1))}
                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 px-2 border-x border-white/20">
                    <input
                      type="range"
                      aria-label="Canvas zoom"
                      min="0.2"
                      max="1.5"
                      step="0.05"
                      value={previewZoom}
                      onChange={(e) => setPreviewZoom(parseFloat(e.target.value))}
                      className="w-12 xl:w-28 accent-yellow-500 h-1.5 rounded-full cursor-pointer"
                    />
                    <span className="text-sm font-bold tabular-nums text-white w-12 text-center">{Math.round(previewZoom * 100)}%</span>
                  </div>
                  <button
                    onClick={() => setPreviewZoom(prev => Math.min(1.5, prev + 0.1))}
                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <div className="w-px h-6 bg-white/20" />
                  <button
                    onClick={() => setPreviewZoom(0.8)}
                    className="p-2 rounded-full hover:bg-white/10 text-yellow-400 hover:text-yellow-300 transition-colors active:scale-90"
                    title="Reset Workspace"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showPresetManager && (
        <PresetManager
          chartStyles={chartStyles}
          customTemplate={customTemplate}
          selectedBrand={selectedBrand}
          onApplyPreset={handleApplyPreset}
          onClose={() => setShowPresetManager(false)}
        />
      )}

      {showBatchReview && (
        <BatchReview
          results={batchResults}
          onClose={() => setShowBatchReview(false)}
          onEdit={(id) => {
            const result = batchResults.find(r => r.id === id);
            if (result) {
              const design = structuredClone(result.design);
              setChartData(structuredClone(result.chartData));
              setSku(result.sku);
              setChartStyles(design.chartStyles);
              setCustomTemplate(design.customTemplate);
              setSelectedBrand(design.selectedBrand);
              setSelectedImage(result.preview);
              setSelectedElement(null);
              // Undo must never restore another batch item's state.
              historyRef.current = [];
              historyIndexRef.current = -1;
              isUndoRedoAction.current = false;
              setEditingBatchId(id);
              setShowBatchReview(false);
            }
          }}
          onReprocess={(id) => {
            handleProcessSingle(id);
          }}
          onToggleExport={handleToggleExport}
          onApplyDesign={handleApplyDesignToBatch}
          saveStatus={saveStatus}
        />
      )}

      {/* Hidden Batch Render Container */}
      {batchRenderItem && (
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '1080px',
            height: '1080px'
          }}
        >
          <div ref={batchRenderRef} style={{ width: '1080px', height: '1080px' }}>
            <ChartPreview
              key={batchRenderItem.id}
              id="batch-chart-preview"
              data={batchRenderItem.chartData}
              brand={batchRenderItem.design.selectedBrand}
              template={batchRenderItem.design.customTemplate}
              styles={batchRenderItem.design.chartStyles}
              notes={batchRenderItem.design.chartStyles.notesContent}
              sku={batchRenderItem.sku}
              selectedElement={null}
              setSelectedElement={() => { }}
              onPositionChange={() => { }}
            />
          </div>
        </div>
      )}

      {/* Batch Rendering Indicator */}
      {isRendering && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
            <p className="text-white font-bold">Rendering Charts...</p>
            <p className="text-gray-500 text-sm mt-1">Please wait</p>
          </div>
        </div>
      )}
    </div >
  );
}

export default App;
