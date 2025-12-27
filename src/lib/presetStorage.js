/**
 * Preset Storage Library
 * Handles saving, loading, and managing presets in localStorage
 */

const STORAGE_KEY = 'sizechart_presets';
const ACTIVE_PRESET_KEY = 'sizechart_active_preset';

// Default preset structure
export const createDefaultPreset = (name = 'New Preset') => ({
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    settings: {
        logo: {
            url: null,
            position: { x: 0, y: 0 },
            scale: 1
        },
        colors: {
            header: '#000000',
            row: '#f3f4f6',
            altRow: '#ffffff',
            text: '#000000',
            border: '#e5e7eb'
        },
        background: {
            type: 'solid', // 'solid', 'gradient', 'image'
            value: '/backgrounds/white-solid.jpg'
        },
        table: {
            position: { x: 0, y: 0 },
            scale: 1,
            borderRadius: 8
        },
        notes: {
            show: true,
            position: { x: 0, y: 0 },
            scale: 1,
            content: null
        },
        title: ''
    }
});

// Get all presets from localStorage
export const getPresets = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Failed to load presets:', e);
        return [];
    }
};

// Save all presets to localStorage
export const savePresets = (presets) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
        return true;
    } catch (e) {
        console.error('Failed to save presets:', e);
        return false;
    }
};

// Add a new preset
export const addPreset = (preset) => {
    const presets = getPresets();
    presets.push(preset);
    return savePresets(presets);
};

// Update an existing preset
export const updatePreset = (id, updates) => {
    const presets = getPresets();
    const index = presets.findIndex(p => p.id === id);
    if (index !== -1) {
        presets[index] = { ...presets[index], ...updates };
        return savePresets(presets);
    }
    return false;
};

// Delete a preset
export const deletePreset = (id) => {
    const presets = getPresets().filter(p => p.id !== id);
    return savePresets(presets);
};

// Get preset by ID
export const getPresetById = (id) => {
    return getPresets().find(p => p.id === id) || null;
};

// Set active preset ID
export const setActivePresetId = (id) => {
    localStorage.setItem(ACTIVE_PRESET_KEY, id || '');
};

// Get active preset ID
export const getActivePresetId = () => {
    return localStorage.getItem(ACTIVE_PRESET_KEY) || null;
};

// Convert current app state to preset settings
export const stateToPresetSettings = (chartStyles, customTemplate, selectedBrand) => ({
    logo: {
        url: selectedBrand?.logo || null,
        position: chartStyles.logo || { x: 0, y: 0 },
        scale: chartStyles.logo?.scale || 1
    },
    colors: {
        header: chartStyles.headerColor || '#000000',
        row: chartStyles.rowColor || '#f3f4f6',
        altRow: '#ffffff',
        text: chartStyles.textColor || '#000000',
        border: '#e5e7eb'
    },
    background: {
        type: customTemplate?.startsWith('data:') ? 'image' : 'solid',
        value: customTemplate || '/backgrounds/white-solid.jpg'
    },
    table: {
        position: chartStyles.table || { x: 0, y: 0 },
        scale: chartStyles.table?.scale || 1,
        borderRadius: 8
    },
    notes: {
        show: true,
        position: chartStyles.note || { x: 0, y: 0 },
        scale: chartStyles.note?.scale || 1,
        content: chartStyles.notesContent || null
    },
    title: chartStyles.title || ''
});

// Apply preset settings to app state
export const presetSettingsToState = (settings) => ({
    chartStyles: {
        scale: 1,
        x: 0,
        y: 0,
        headerColor: settings.colors.header,
        rowColor: settings.colors.row,
        textColor: settings.colors.text,
        title: settings.title,
        logo: settings.logo.position,
        table: settings.table.position,
        note: settings.notes.position,
        notesContent: settings.notes.content
    },
    customTemplate: settings.background.value,
    brandLogo: settings.logo.url
});

// Export presets as JSON file
export const exportPresetsAsJSON = () => {
    const presets = getPresets();
    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sizechart-presets-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// Import presets from JSON file
export const importPresetsFromJSON = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    const existing = getPresets();
                    const merged = [...existing, ...imported.map(p => ({ ...p, id: crypto.randomUUID() }))];
                    savePresets(merged);
                    resolve(merged);
                } else {
                    reject(new Error('Invalid preset file format'));
                }
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
};
