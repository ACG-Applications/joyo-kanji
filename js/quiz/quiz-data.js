// ==================== QUIZ-DATA.JS V1.0 ====================
// Complete Data Management System
// Handles export, import, reset of all quiz data
// Includes backup, restore, and data migration utilities

// ==================== DATA MANAGER ====================
const DataManager = {
    // Version for migration
    VERSION: '1.0.0',
    
    // Storage keys
    MASTERY_KEY: 'joyo_kanji_mastery',
    PROGRESS_KEY: 'joyo_kanji_progress',
    SETTINGS_KEY: 'joyo_kanji_settings',
    
    // Backup prefix
    BACKUP_PREFIX: 'joyo_kanji_backup_'
};

// ==================== EXPORT FUNCTIONS ====================

// Export all data as a single JSON object
function exportAllData() {
    try {
        const data = {
            version: DataManager.VERSION,
            exportedAt: new Date().toISOString(),
            mastery: getMasteryData(),
            progress: getProgressData(),
            settings: getSettingsData()
        };
        return JSON.stringify(data, null, 2);
    } catch (e) {
        console.error('Failed to export data:', e);
        return null;
    }
}

// Export mastery data only
function exportMasteryOnly() {
    try {
        return JSON.stringify(getMasteryData(), null, 2);
    } catch (e) {
        console.error('Failed to export mastery:', e);
        return null;
    }
}

// Export progress data only
function exportProgressOnly() {
    try {
        return JSON.stringify(getProgressData(), null, 2);
    } catch (e) {
        console.error('Failed to export progress:', e);
        return null;
    }
}

// Export settings only
function exportSettingsOnly() {
    try {
        return JSON.stringify(getSettingsData(), null, 2);
    } catch (e) {
        console.error('Failed to export settings:', e);
        return null;
    }
}

// ==================== IMPORT FUNCTIONS ====================

// Import all data from JSON
function importAllData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        // Validate data
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }
        
        // Check version
        if (data.version && data.version !== DataManager.VERSION) {
            console.warn(`Data version mismatch: ${data.version} vs ${DataManager.VERSION}`);
            // Attempt migration if needed
            if (!confirm(`Data is from version ${data.version}. Current version is ${DataManager.VERSION}. Continue import?`)) {
                return false;
            }
        }
        
        let imported = false;
        
        // Import mastery
        if (data.mastery && typeof data.mastery === 'object') {
            importMasteryData(JSON.stringify(data.mastery));
            imported = true;
        }
        
        // Import progress
        if (data.progress && typeof data.progress === 'object') {
            importProgressData(JSON.stringify(data.progress));
            imported = true;
        }
        
        // Import settings
        if (data.settings && typeof data.settings === 'object') {
            importSettingsData(JSON.stringify(data.settings));
            imported = true;
        }
        
        if (!imported) {
            throw new Error('No valid data found in import file');
        }
        
        return true;
    } catch (e) {
        console.error('Failed to import data:', e);
        return false;
    }
}

// Import mastery data from JSON
function importMasteryData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        if (typeof data !== 'object') {
            throw new Error('Invalid mastery data format');
        }
        
        // Validate level structure
        const validLevels = ['n5', 'n4', 'n3'];
        let valid = false;
        for (const level of validLevels) {
            if (data[level] && typeof data[level] === 'object') {
                valid = true;
                break;
            }
        }
        
        if (!valid) {
            throw new Error('No valid level data found in mastery import');
        }
        
        // Import using MasteryManager
        if (typeof MasteryManager !== 'undefined') {
            MasteryManager.data = data;
            saveMastery();
            return true;
        } else {
            // Direct import if MasteryManager not available
            localStorage.setItem(DataManager.MASTERY_KEY, JSON.stringify(data));
            return true;
        }
    } catch (e) {
        console.error('Failed to import mastery:', e);
        return false;
    }
}

// Import progress data from JSON
function importProgressData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        if (typeof data !== 'object') {
            throw new Error('Invalid progress data format');
        }
        
        // Validate level structure
        const validLevels = ['n5', 'n4', 'n3'];
        let valid = false;
        for (const level of validLevels) {
            if (data[level] && typeof data[level] === 'object') {
                valid = true;
                break;
            }
        }
        
        if (!valid) {
            throw new Error('No valid level data found in progress import');
        }
        
        // Import using ProgressManager
        if (typeof ProgressManager !== 'undefined') {
            ProgressManager.data = data;
            saveProgress();
            return true;
        } else {
            // Direct import if ProgressManager not available
            localStorage.setItem(DataManager.PROGRESS_KEY, JSON.stringify(data));
            return true;
        }
    } catch (e) {
        console.error('Failed to import progress:', e);
        return false;
    }
}

// Import settings from JSON
function importSettingsData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        if (typeof data !== 'object') {
            throw new Error('Invalid settings data format');
        }
        
        // Validate required fields
        const required = ['defaultLevel', 'defaultCount', 'defaultDifficulty', 'includeMastered', 'soundEffects'];
        for (const field of required) {
            if (!(field in data)) {
                console.warn(`Missing field in settings: ${field}`);
            }
        }
        
        // Import settings
        localStorage.setItem(DataManager.SETTINGS_KEY, JSON.stringify(data));
        
        // Update UI if QuizUI is available
        if (typeof QuizUI !== 'undefined' && QuizUI.settings) {
            QuizUI.settings = data;
        }
        
        return true;
    } catch (e) {
        console.error('Failed to import settings:', e);
        return false;
    }
}

// ==================== BACKUP FUNCTIONS ====================

// Create a backup
function createBackup() {
    const data = exportAllData();
    if (!data) return null;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `${DataManager.BACKUP_PREFIX}${timestamp}`;
    
    try {
        localStorage.setItem(key, data);
        console.log(`📦 Backup created: ${key}`);
        return key;
    } catch (e) {
        console.error('Failed to create backup:', e);
        return null;
    }
}

// Get all backups
function getBackups() {
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(DataManager.BACKUP_PREFIX)) {
            backups.push(key);
        }
    }
    return backups.sort().reverse();
}

// Restore from backup
function restoreBackup(key) {
    try {
        const data = localStorage.getItem(key);
        if (!data) {
            throw new Error('Backup not found');
        }
        
        const result = importAllData(data);
        if (result) {
            console.log(`📦 Restored from backup: ${key}`);
            return true;
        } else {
            throw new Error('Failed to import backup data');
        }
    } catch (e) {
        console.error('Failed to restore backup:', e);
        return false;
    }
}

// Delete a backup
function deleteBackup(key) {
    try {
        localStorage.removeItem(key);
        console.log(`📦 Deleted backup: ${key}`);
        return true;
    } catch (e) {
        console.error('Failed to delete backup:', e);
        return false;
    }
}

// Clean old backups (keep latest N)
function cleanOldBackups(keep = 10) {
    const backups = getBackups();
    if (backups.length <= keep) return;
    
    const toDelete = backups.slice(keep);
    for (const key of toDelete) {
        deleteBackup(key);
    }
    console.log(`🧹 Cleaned ${toDelete.length} old backups`);
}

// ==================== RESET FUNCTIONS ====================

// Reset all data (with confirmation)
function resetAllData(confirmMessage = 'This will permanently delete ALL quiz data including mastery, progress, and settings. Are you sure?') {
    if (!confirm(confirmMessage)) {
        return false;
    }
    
    try {
        // Reset mastery
        if (typeof resetAllMastery === 'function') {
            resetAllMastery();
        } else {
            localStorage.removeItem(DataManager.MASTERY_KEY);
        }
        
        // Reset progress
        if (typeof resetAllProgress === 'function') {
            resetAllProgress();
        } else {
            localStorage.removeItem(DataManager.PROGRESS_KEY);
        }
        
        // Reset settings
        localStorage.removeItem(DataManager.SETTINGS_KEY);
        
        console.log('🗑️ All data reset');
        return true;
    } catch (e) {
        console.error('Failed to reset data:', e);
        return false;
    }
}

// Reset mastery only
function resetMasteryOnly(confirmMessage = 'This will delete ALL mastery data. Are you sure?') {
    if (!confirm(confirmMessage)) {
        return false;
    }
    
    try {
        if (typeof resetAllMastery === 'function') {
            resetAllMastery();
        } else {
            localStorage.removeItem(DataManager.MASTERY_KEY);
        }
        console.log('🗑️ Mastery data reset');
        return true;
    } catch (e) {
        console.error('Failed to reset mastery:', e);
        return false;
    }
}

// Reset progress only
function resetProgressOnly(confirmMessage = 'This will delete ALL progress data. Are you sure?') {
    if (!confirm(confirmMessage)) {
        return false;
    }
    
    try {
        if (typeof resetAllProgress === 'function') {
            resetAllProgress();
        } else {
            localStorage.removeItem(DataManager.PROGRESS_KEY);
        }
        console.log('🗑️ Progress data reset');
        return true;
    } catch (e) {
        console.error('Failed to reset progress:', e);
        return false;
    }
}

// ==================== SETTINGS FUNCTIONS ====================

// Get settings
function getSettingsData() {
    try {
        const stored = localStorage.getItem(DataManager.SETTINGS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Failed to load settings:', e);
    }
    
    // Default settings
    return {
        defaultLevel: 'n5',
        defaultCount: 20,
        defaultDifficulty: 'mixed',
        includeMastered: true,
        soundEffects: true,
        furiganaOverride: 'auto'
    };
}

// Save settings
function saveSettingsData(settings) {
    try {
        localStorage.setItem(DataManager.SETTINGS_KEY, JSON.stringify(settings));
        return true;
    } catch (e) {
        console.error('Failed to save settings:', e);
        return false;
    }
}

// ==================== DATA SIZE FUNCTIONS ====================

// Get data size in bytes
function getDataSize() {
    let totalSize = 0;
    const keys = [
        DataManager.MASTERY_KEY,
        DataManager.PROGRESS_KEY,
        DataManager.SETTINGS_KEY
    ];
    
    for (const key of keys) {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                totalSize += data.length * 2; // UTF-16
            }
        } catch (e) {
            // Skip
        }
    }
    
    return totalSize;
}

// Get formatted data size
function getFormattedDataSize() {
    const bytes = getDataSize();
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ==================== DATA VALIDATION ====================

// Validate all data
function validateData() {
    const results = {
        valid: true,
        issues: [],
        details: {}
    };
    
    // Check mastery data
    try {
        const mastery = getMasteryData();
        if (!mastery || typeof mastery !== 'object') {
            results.issues.push('Mastery data is invalid or missing');
            results.valid = false;
        } else {
            results.details.mastery = 'Valid';
        }
    } catch (e) {
        results.issues.push(`Mastery data error: ${e.message}`);
        results.valid = false;
    }
    
    // Check progress data
    try {
        const progress = getProgressData();
        if (!progress || typeof progress !== 'object') {
            results.issues.push('Progress data is invalid or missing');
            results.valid = false;
        } else {
            results.details.progress = 'Valid';
        }
    } catch (e) {
        results.issues.push(`Progress data error: ${e.message}`);
        results.valid = false;
    }
    
    // Check settings
    try {
        const settings = getSettingsData();
        if (!settings || typeof settings !== 'object') {
            results.issues.push('Settings data is invalid or missing');
            results.valid = false;
        } else {
            results.details.settings = 'Valid';
        }
    } catch (e) {
        results.issues.push(`Settings data error: ${e.message}`);
        results.valid = false;
    }
    
    // Add data size
    results.details.size = getFormattedDataSize();
    
    return results;
}

// ==================== DOWNLOAD/ UPLOAD UTILITIES ====================

// Download data as file
function downloadDataFile(data, filename = 'joyo-kanji-data.json') {
    try {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (e) {
        console.error('Failed to download data:', e);
        return false;
    }
}

// Upload data from file
function uploadDataFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const result = importAllData(data);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// ==================== DATA MIGRATION ====================

// Migrate from old data format to new
function migrateData() {
    console.log('🔄 Checking for data migration...');
    
    let migrated = false;
    
    // Check for old key format
    const oldKeys = ['kanjiMastery', 'quizHistory'];
    for (const key of oldKeys) {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                console.log(`📦 Found old data: ${key}`);
                // Attempt to migrate
                try {
                    const parsed = JSON.parse(data);
                    if (key === 'kanjiMastery') {
                        localStorage.setItem(DataManager.MASTERY_KEY, JSON.stringify(parsed));
                        localStorage.removeItem(key);
                        migrated = true;
                    } else if (key === 'quizHistory') {
                        localStorage.setItem(DataManager.PROGRESS_KEY, JSON.stringify(parsed));
                        localStorage.removeItem(key);
                        migrated = true;
                    }
                } catch (e) {
                    console.warn(`Failed to migrate ${key}:`, e);
                }
            }
        } catch (e) {
            // Skip
        }
    }
    
    if (migrated) {
        console.log('✅ Data migration completed');
    } else {
        console.log('✅ No migration needed');
    }
    
    return migrated;
}

// ==================== AUTO-BACKUP ====================

// Auto-backup on app start
function autoBackup() {
    try {
        // Check if we have data
        const mastery = localStorage.getItem(DataManager.MASTERY_KEY);
        const progress = localStorage.getItem(DataManager.PROGRESS_KEY);
        
        if (mastery || progress) {
            // Create backup if no recent backup
            const backups = getBackups();
            if (backups.length === 0) {
                createBackup();
                console.log('📦 Auto-backup created');
            } else {
                // Check if last backup is more than 24 hours old
                const lastBackup = backups[0];
                const timestamp = lastBackup.replace(DataManager.BACKUP_PREFIX, '');
                const backupDate = new Date(timestamp.replace(/-/g, ':').replace(/T/g, ' '));
                const now = new Date();
                const hoursDiff = (now - backupDate) / (1000 * 60 * 60);
                
                if (hoursDiff > 24) {
                    createBackup();
                    console.log('📦 Auto-backup created (24h+ since last)');
                    cleanOldBackups(10);
                }
            }
        }
    } catch (e) {
        // Silently fail
    }
}

// ==================== EXPOSE GLOBALLY ====================
window.DataManager = DataManager;
window.exportAllData = exportAllData;
window.exportMasteryOnly = exportMasteryOnly;
window.exportProgressOnly = exportProgressOnly;
window.exportSettingsOnly = exportSettingsOnly;
window.importAllData = importAllData;
window.importMasteryData = importMasteryData;
window.importProgressData = importProgressData;
window.importSettingsData = importSettingsData;
window.createBackup = createBackup;
window.getBackups = getBackups;
window.restoreBackup = restoreBackup;
window.deleteBackup = deleteBackup;
window.cleanOldBackups = cleanOldBackups;
window.resetAllData = resetAllData;
window.resetMasteryOnly = resetMasteryOnly;
window.resetProgressOnly = resetProgressOnly;
window.getSettingsData = getSettingsData;
window.saveSettingsData = saveSettingsData;
window.getDataSize = getDataSize;
window.getFormattedDataSize = getFormattedDataSize;
window.validateData = validateData;
window.downloadDataFile = downloadDataFile;
window.uploadDataFile = uploadDataFile;
window.migrateData = migrateData;
window.autoBackup = autoBackup;

// Auto-run migration and backup
migrateData();
autoBackup();

console.log('💾 Data Manager loaded');