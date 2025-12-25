// Custom color presets management
export const getCustomColorPresets = () => {
    try {
        const saved = localStorage.getItem('customColorPresets');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error loading custom color presets:', error);
        return [];
    }
};

export const saveCustomColorPreset = (preset) => {
    try {
        const presets = getCustomColorPresets();
        const newPreset = {
            id: Date.now().toString(),
            name: preset.name || `Custom Preset ${presets.length + 1}`,
            headerColor: preset.headerColor,
            rowColor: preset.rowColor,
            textColor: preset.textColor,
            createdAt: new Date().toISOString()
        };
        presets.push(newPreset);
        localStorage.setItem('customColorPresets', JSON.stringify(presets));
        return newPreset;
    } catch (error) {
        console.error('Error saving custom color preset:', error);
        return null;
    }
};

export const deleteCustomColorPreset = (presetId) => {
    try {
        const presets = getCustomColorPresets();
        const filtered = presets.filter(p => p.id !== presetId);
        localStorage.setItem('customColorPresets', JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error deleting custom color preset:', error);
        return false;
    }
};

// Background + Color preset combinations
export const getBackgroundPresets = () => {
    try {
        const saved = localStorage.getItem('backgroundPresets');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error loading background presets:', error);
        return [];
    }
};

export const saveBackgroundPreset = (preset) => {
    try {
        const presets = getBackgroundPresets();
        const newPreset = {
            id: Date.now().toString(),
            name: preset.name || `Background Preset ${presets.length + 1}`,
            backgroundPath: preset.backgroundPath,
            headerColor: preset.headerColor,
            rowColor: preset.rowColor,
            textColor: preset.textColor,
            scale: preset.scale || 1,
            createdAt: new Date().toISOString()
        };
        presets.push(newPreset);
        localStorage.setItem('backgroundPresets', JSON.stringify(presets));
        return newPreset;
    } catch (error) {
        console.error('Error saving background preset:', error);
        return null;
    }
};

export const deleteBackgroundPreset = (presetId) => {
    try {
        const presets = getBackgroundPresets();
        const filtered = presets.filter(p => p.id !== presetId);
        localStorage.setItem('backgroundPresets', JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error deleting background preset:', error);
        return false;
    }
};