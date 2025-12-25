import React, { useState, useEffect } from 'react';
import { Loader2, Settings, Key, Download, Info, Upload, Palette, Layout, Sliders, Table, ChevronLeft, ChevronRight, Sparkles, X, Eye, Image, Wand2, ZoomIn, ZoomOut, RotateCcw, Plus } from 'lucide-react';
import { ImageUpload } from './components/ImageUpload';
import { DataEditor } from './components/DataEditor';
import { BrandSelector } from './components/BrandSelector';
import { extractDataFromOCR } from './lib/ocr';
import { ChartPreview } from './components/ChartPreview';
import { StyleControls } from './components/StyleControls';
import { BackgroundPresets } from './components/BackgroundPresets';
import { ColorPresets } from './components/ColorPresets';
import { toJpeg } from 'html-to-image';

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
  const [previewZoom, setPreviewZoom] = useState(0.8); // Default to slightly zoomed out for better fit
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
          return !node.classList?.contains('pointer-events-none') &&
            !node.classList?.contains('border') &&
            !node.classList?.contains('export-hidden');
        },
        cacheBust: true,
        includeFontFaces: true,
        includeStyle: true,
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

  const tabs = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'design', label: 'Design', icon: Palette, disabled: !chartData },
    { id: 'layout', label: 'Layout', icon: Layout, disabled: !chartData },
    { id: 'data', label: 'Data', icon: Table, disabled: !chartData },
  ];

  return (
    <div className="h-screen bg-black text-gray-100 flex flex-col overflow-hidden selection:bg-yellow-500 selection:text-black">
      {/* Top Navigation Bar */}
      <nav className="h-20 bg-black/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-8 shrink-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] group-hover:scale-110 transition-all duration-500 p-2.5">
              <img src="/logo.svg" className="w-full h-full object-contain" alt="Favicon" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none">
                SIZE CHART <span className="text-yellow-500">PRO</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Neural Engine Active</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
              Export Graphic
            </button>
          )}
          <div className="w-px h-8 bg-white/5 mx-2" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAbout(!showAbout)}
              className="p-3 rounded-xl hover:bg-white/5 transition-all text-gray-500 hover:text-white group"
              title="About System"
            >
              <Info className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 rounded-xl hover:bg-white/5 transition-all text-gray-500 hover:text-white group"
              title="Global Settings"
            >
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-white/10 p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 pointer-events-none" />
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 transition-all text-gray-400 hover:text-white z-50 bg-black/50 backdrop-blur-sm border border-white/5"
              aria-label="Close Settings"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                  <Key className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white">OCR Settings</h3>
                  <p className="text-xs text-yellow-500/70 uppercase tracking-widest font-bold">API Authentication</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Connect your custom OCR engine for lightning-fast data extraction. Leave empty to use the public demo key.
              </p>
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="ocr_..."
                  className="w-full px-4 py-4 border border-white/10 rounded-2xl bg-white/5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveKey(apiKey)}
                  className="px-8 py-3 text-sm bg-yellow-500 text-black rounded-2xl font-bold hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20 active:scale-95"
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="w-20 h-20 mx-auto rounded-3xl bg-yellow-500 flex items-center justify-center shadow-xl shadow-yellow-500/20 animate-pulse-glow p-4">
                <img src="/logo.svg" className="w-full h-full object-contain" alt="Logo" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-3xl text-white">Size Chart Gen</h3>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-yellow-500" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400">Source Image</h3>
                    </div>
                  </div>
                  <ImageUpload onImageSelect={handleImageSelect} onSKUExtracted={handleSKUExtracted} apiKey={apiKey} />
                </div>

                {selectedImage && !chartData && !isProcessing && (
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
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">Chart Generated!</span>
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
        <main className="flex-1 bg-black/60 flex items-center justify-center p-6 overflow-hidden relative">
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
                style={{ transform: `scale(${previewZoom})` }}
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

              {/* Zoom Controls Overlay - Compact by default, expands on hover */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
                <div className="flex items-center gap-1 px-2 py-2 bg-neutral-900/30 backdrop-blur-md border border-white/5 rounded-full shadow-2xl opacity-30 hover:opacity-100 hover:bg-neutral-900/90 hover:px-6 hover:py-3 hover:gap-6 transition-all duration-500 ease-out group">
                  <button
                    onClick={() => setPreviewZoom(prev => Math.max(0.2, prev - 0.1))}
                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-0 w-0 overflow-hidden opacity-0 group-hover:opacity-100 group-hover:w-44 group-hover:gap-4 transition-all duration-500 px-0 border-white/10 group-hover:px-4 group-hover:border-x">
                    <input
                      type="range"
                      min="0.2"
                      max="1.5"
                      step="0.05"
                      value={previewZoom}
                      onChange={(e) => setPreviewZoom(parseFloat(e.target.value))}
                      className="w-28 accent-yellow-500 h-1.5 rounded-full cursor-pointer"
                    />
                    <span className="text-[10px] font-black text-white w-10 text-center">{Math.round(previewZoom * 100)}%</span>
                  </div>
                  <button
                    onClick={() => setPreviewZoom(prev => Math.min(1.5, prev + 0.1))}
                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <div className="w-0 group-hover:w-px h-6 bg-white/10 transition-all duration-500" />
                  <button
                    onClick={() => setPreviewZoom(0.8)}
                    className="p-2 rounded-full hover:bg-white/10 text-yellow-500 hover:text-yellow-400 transition-all active:scale-90 opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto overflow-hidden"
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
    </div >
  );
}

export default App;
