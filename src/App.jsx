import React, { useState, useEffect } from 'react';
import { Loader2, Settings, Key, Download, Info, Upload, Palette, Layout, Sliders, Table, ChevronLeft, ChevronRight, Sparkles, X, Eye, Image, Wand2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
          .replace(/outline-blue-500/g, '')
          .replace(/outline-blue-400\/50/g, '');
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
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Size Chart Generator
              </h1>
              <p className="text-xs text-gray-500">AI-Powered Design Tool</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {chartData && (
            <button
              onClick={() => handleExport('jpeg')}
              disabled={isExporting}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </button>
          )}
          <button
            onClick={() => setShowAbout(!showAbout)}
            className="p-2.5 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2.5 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Custom OCR Settings</h3>
                  <p className="text-xs text-gray-500">Private API Authentication</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                You can use the default public key for free, or enter your private OCR API key if you have a custom deployment.
              </p>
              <input
                type="password"
                placeholder="ocr_..."
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveKey(apiKey)}
                  className="px-5 py-2 text-sm bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg font-medium hover:from-violet-600 hover:to-fuchsia-600 transition-all shadow-lg shadow-violet-500/20"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-2xl">Size Chart Generator</h3>
              <p className="text-gray-400">
                Transform your size charts into premium 1:1 graphics with AI-powered data extraction and beautiful design presets.
              </p>
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-gray-500">Crafted with 💜 by</p>
                <p className="text-lg font-semibold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Muaz Azri
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
                    className="px-4 py-2 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
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
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300 shrink-0`}>
          {/* Tab Navigation */}
          <div className={`border-b border-white/5 ${sidebarCollapsed ? 'py-2' : 'p-4'}`}>
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id)}
                    disabled={tab.disabled}
                    className={`p-3 rounded-xl transition-all ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-400'
                      : tab.disabled
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    title={tab.label}
                  >
                    <tab.icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id)}
                    disabled={tab.disabled}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-400 border border-violet-500/20'
                      : tab.disabled
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-violet-400" />
                    <h3 className="font-semibold text-sm">Source Image</h3>
                  </div>
                  <ImageUpload onImageSelect={handleImageSelect} onSKUExtracted={handleSKUExtracted} apiKey={apiKey} />
                </div>

                {selectedImage && !chartData && !isProcessing && (
                  <div className="space-y-3">
                    <button
                      onClick={() => processImage(selectedImage)}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-semibold hover:from-violet-600 hover:to-fuchsia-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
                    >
                      <Wand2 className="w-5 h-5" />
                      Generate Size Chart
                    </button>
                  </div>
                )}

                {isProcessing && (
                  <div className="py-8 flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-violet-500 animate-spin" />
                      <Wand2 className="w-6 h-6 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Analyzing with AI...</p>
                      <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
                    </div>
                    <button
                      onClick={() => setIsProcessing(false)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Cancel
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
                    <Layout className="w-4 h-4 text-violet-400" />
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
                    <Image className="w-4 h-4 text-violet-400" />
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
                    <Palette className="w-4 h-4 text-violet-400" />
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
                    <Sliders className="w-4 h-4 text-violet-400" />
                    <h3 className="font-semibold text-sm">Position & Scale</h3>
                  </div>
                  <StyleControls
                    selectedElement={selectedElement}
                    styles={chartStyles}
                    onStyleChange={setChartStyles}
                  />
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                  <div className="flex items-start gap-3">
                    <Eye className="w-4 h-4 text-violet-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Pro Tip</p>
                      <p className="text-xs text-gray-400 mt-1">
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
                    <Table className="w-4 h-4 text-violet-400" />
                    <h3 className="font-semibold text-sm">Table Data</h3>
                  </div>
                  <DataEditor
                    initialData={chartData}
                    onSave={(data) => setChartData(data)}
                  />
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                  <div className="flex items-start gap-3">
                    <Eye className="w-4 h-4 text-violet-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Inline Editing</p>
                      <p className="text-xs text-gray-400 mt-1">
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
        <main className="flex-1 bg-slate-950/50 flex items-center justify-center p-6 overflow-hidden">
          {!chartData ? (
            <div className="text-center max-w-md">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center">
                <Image className="w-10 h-10 text-gray-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">No Chart Yet</h2>
              <p className="text-gray-500 text-sm">
                Upload a size chart image and click Generate to create a beautiful, customizable graphic.
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

              {/* Zoom Controls Overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full shadow-2xl z-30">
                <button
                  onClick={() => setPreviewZoom(prev => Math.max(0.2, prev - 0.1))}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 px-2 border-x border-white/5">
                  <input
                    type="range"
                    min="0.2"
                    max="1.5"
                    step="0.05"
                    value={previewZoom}
                    onChange={(e) => setPreviewZoom(parseFloat(e.target.value))}
                    className="w-24 accent-violet-500 h-1 rounded-lg"
                  />
                  <span className="text-[10px] font-mono text-gray-400 w-8">{Math.round(previewZoom * 100)}%</span>
                </div>
                <button
                  onClick={() => setPreviewZoom(prev => Math.min(1.5, prev + 0.1))}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewZoom(0.8)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
