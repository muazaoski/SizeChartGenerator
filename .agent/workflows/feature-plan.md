---
description: Size Chart Generator Feature Enhancement Plan
---

# Size Chart Generator - Feature Enhancement Plan

## 🎯 Features to Implement

### 1. ⏱️ Generation Time Counter
**Priority:** Easy - Do first
- Add timer display showing AI processing time
- Show "Processing... 0.0s" during OCR
- Display final time after completion

### 2. 🎨 Revamped Preset System  
**Priority:** Medium - Core feature
- Create new `PresetManager` component
- Allow users to save/load complete presets including:
  - Logo (URL or uploaded file)
  - Colors (header, row, text, border)
  - Background (solid color, gradient, or image)
  - Table styles (fonts, spacing, borders)
  - Notes template
- Local storage for persistence
- Import/Export presets as JSON

### 3. 📦 Batch Upload
**Priority:** Medium
- Modify `ImageUpload` to accept multiple files
- Add `BatchQueue` component to show all queued images
- Display thumbnails with status (pending/processing/done/error)
- Allow removing items from queue

### 4. 📋 Upload by Paste (Ctrl+V)
**Priority:** Easy
- Add document-level paste event listener
- Support pasting images from clipboard
- Add to batch queue if multiple images pasted

### 5. 🔄 Batch Generation with Preset Selector
**Priority:** High - Best feature
- Process multiple images sequentially
- For each image:
  - Option to apply same preset to all
  - OR select preset per image
- Show progress: "Processing 3/10..."
- Queue management (pause, cancel, skip)

### 6. ✅ Result Review Before Export
**Priority:** High - Quality control
- After all images processed, show review grid
- Each result shows:
  - Thumbnail of original
  - Generated chart preview
  - Extracted data summary (sizes, measurements)
  - Status indicator (✅ correct / ⚠️ needs edit)
- User can:
  - Click to edit individual chart data
  - Mark as "approved" or "needs fix"
  - Re-process single image with different preset
- Only approved items go to final export
- Batch export as ZIP

---

## 📁 New File Structure

```
src/
├── components/
│   ├── ImageUpload.jsx          (modify for batch + paste)
│   ├── BatchQueue.jsx           (NEW - batch queue display)
│   ├── PresetManager.jsx        (NEW - preset system)
│   ├── PresetCard.jsx           (NEW - single preset display)
│   ├── GenerationTimer.jsx      (NEW - processing timer)
│   └── BatchExport.jsx          (NEW - batch export as ZIP)
├── lib/
│   ├── presetStorage.js         (NEW - localStorage for presets)
│   └── batchProcessor.js        (NEW - batch processing logic)
└── App.jsx                       (integrate new features)
```

---

## 🔧 Implementation Order

1. **Phase 1: Timer** (10 min)
   - Add `processingTime` state
   - Start timer on OCR, stop on complete
   - Display in UI

2. **Phase 2: Paste Upload** (15 min)
   - Add paste event listener
   - Parse clipboard for images
   - Add to current upload

3. **Phase 3: Batch Upload** (30 min)
   - Modify ImageUpload for multiple files
   - Create BatchQueue component
   - State management for queue

4. **Phase 4: Preset System** (1 hour)
   - Create preset data structure
   - Build PresetManager component
   - Save/Load from localStorage
   - Apply preset to chart

5. **Phase 5: Batch Generation** (1 hour)
   - Sequential processing with presets
   - Progress tracking
   - Batch export to ZIP

---

## 📊 Data Structures

### Preset Object
```javascript
const preset = {
  id: "uuid",
  name: "My Brand Preset",
  createdAt: "2024-12-28T00:00:00Z",
  settings: {
    logo: {
      url: "data:image/...",
      position: { x: 0, y: 0 },
      scale: 1
    },
    colors: {
      header: "#000000",
      row: "#f3f4f6",
      altRow: "#ffffff",
      text: "#000000",
      border: "#e5e7eb"
    },
    background: {
      type: "solid" | "gradient" | "image",
      value: "#ffffff" | "url(...)"
    },
    table: {
      position: { x: 0, y: 0 },
      scale: 1,
      borderRadius: 8,
      padding: 16
    },
    notes: {
      show: true,
      position: { x: 0, y: 0 },
      content: { title: "...", items: [...] }
    },
    title: "SIZE CHART"
  }
};
```

### Batch Queue Item
```javascript
const queueItem = {
  id: "uuid",
  file: File,
  preview: "data:image/...",
  status: "pending" | "processing" | "done" | "error",
  presetId: "preset-uuid" | null,
  result: { chartData, chartStyles, exportedImage } | null,
  error: "Error message" | null,
  processingTime: 0
};
```

---

## 🚀 Let's Start!

Ready to implement? Say "go" and we start with Phase 1 (Timer).
