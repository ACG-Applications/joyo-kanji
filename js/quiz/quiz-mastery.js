// ==================== QUIZ-MASTERY.JS V3.0 ====================
// Complete Mastery Tracking System - 3 Types
// Tracks: onyomi, kunyomi, meaning

// ==================== MASTERY MANAGER ====================
var MasteryManager = {
    STORAGE_KEY: 'joyo_kanji_mastery',
    MASTERY_THRESHOLD: 3,
    READING_TYPES: ['onyomi', 'kunyomi', 'meaning'],
    data: {},
    initialized: false
};

// ==================== INITIALIZATION ====================
function initMastery() {
    if (MasteryManager.initialized) return;
    
    try {
        var stored = localStorage.getItem(MasteryManager.STORAGE_KEY);
        if (stored) {
            MasteryManager.data = JSON.parse(stored);
        } else {
            MasteryManager.data = {
                n5: {},
                n4: {},
                n3: {}
            };
            saveMastery();
        }
        MasteryManager.initialized = true;
        console.log('🏆 Mastery Manager initialized');
    } catch (e) {
        console.warn('Failed to load mastery data:', e);
        MasteryManager.data = { n5: {}, n4: {}, n3: {} };
        MasteryManager.initialized = true;
    }
}

function saveMastery() {
    try {
        localStorage.setItem(MasteryManager.STORAGE_KEY, JSON.stringify(MasteryManager.data));
    } catch (e) {
        console.warn('Failed to save mastery data:', e);
    }
}

function getMasteryData() {
    if (!MasteryManager.initialized) initMastery();
    return MasteryManager.data;
}

function getKanjiMastery(level, kanji) {
    if (!MasteryManager.initialized) initMastery();
    var levelData = MasteryManager.data[level] || {};
    return levelData[kanji] || null;
}

function getReadingTypeMastery(level, kanji, readingType) {
    var kanjiData = getKanjiMastery(level, kanji);
    if (!kanjiData) return null;
    return kanjiData[readingType] || null;
}

function isMastered(level, kanji, readingType) {
    var data = getReadingTypeMastery(level, kanji, readingType);
    if (!data) return false;
    return data.mastered === true;
}

function isAllMastered(level, kanji) {
    var kanjiData = getKanjiMastery(level, kanji);
    if (!kanjiData) return false;
    
    var types = MasteryManager.READING_TYPES;
    for (var i = 0; i < types.length; i++) {
        var type = types[i];
        var typeData = kanjiData[type];
        if (!typeData || !typeData.mastered) {
            return false;
        }
    }
    return true;
}

function getMasteredCount(level, readingType) {
    if (!MasteryManager.initialized) initMastery();
    var levelData = MasteryManager.data[level] || {};
    var count = 0;
    
    for (var kanji in levelData) {
        var typeData = levelData[kanji][readingType];
        if (typeData && typeData.mastered) {
            count++;
        }
    }
    return count;
}

function getMasteryPercentage(level, readingType) {
    var allData = getDataForLevel(level);
    if (!allData || allData.length === 0) return 0;
    
    var mastered = getMasteredCount(level, readingType);
    return Math.round((mastered / allData.length) * 100);
}

function recordMastery(level, kanji, readingType, correct) {
    if (!MasteryManager.initialized) initMastery();
    
    if (!MasteryManager.data[level]) {
        MasteryManager.data[level] = {};
    }
    
    if (!MasteryManager.data[level][kanji]) {
        MasteryManager.data[level][kanji] = {};
    }
    
    if (!MasteryManager.data[level][kanji][readingType]) {
        MasteryManager.data[level][kanji][readingType] = {
            correct: 0,
            attempts: 0,
            mastered: false,
            lastCorrect: null,
            lastAttempt: null,
            streak: 0
        };
    }
    
    var data = MasteryManager.data[level][kanji][readingType];
    var today = getTodayString();
    
    data.attempts += 1;
    data.lastAttempt = today;
    
    if (correct) {
        data.correct += 1;
        data.lastCorrect = today;
        data.streak += 1;
        
        if (data.correct >= MasteryManager.MASTERY_THRESHOLD) {
            data.mastered = true;
        }
    } else {
        data.streak = 0;
    }
    
    saveMastery();
    return data;
}

function resetKanjiMastery(level, kanji) {
    if (!MasteryManager.initialized) initMastery();
    
    if (MasteryManager.data[level] && MasteryManager.data[level][kanji]) {
        delete MasteryManager.data[level][kanji];
        saveMastery();
        return true;
    }
    return false;
}

function resetLevelMastery(level) {
    if (!MasteryManager.initialized) initMastery();
    
    if (MasteryManager.data[level]) {
        MasteryManager.data[level] = {};
        saveMastery();
        return true;
    }
    return false;
}

function resetAllMastery() {
    if (!MasteryManager.initialized) initMastery();
    
    MasteryManager.data = {
        n5: {},
        n4: {},
        n3: {}
    };
    saveMastery();
    return true;
}

function getMasteryStats(level) {
    if (!MasteryManager.initialized) initMastery();
    var levelData = MasteryManager.data[level] || {};
    var allData = getDataForLevel(level);
    var totalKanji = allData ? allData.length : 0;
    
    var stats = {
        totalKanji: totalKanji,
        mastered: {},
        inProgress: {},
        notStarted: {},
        overall: 0
    };
    
    MasteryManager.READING_TYPES.forEach(function(type) {
        stats.mastered[type] = 0;
        stats.inProgress[type] = 0;
        stats.notStarted[type] = 0;
    });
    
    for (var kanji in levelData) {
        var kanjiData = levelData[kanji];
        for (var j = 0; j < MasteryManager.READING_TYPES.length; j++) {
            var type = MasteryManager.READING_TYPES[j];
            var typeData = kanjiData[type];
            if (typeData) {
                if (typeData.mastered) {
                    stats.mastered[type]++;
                } else if (typeData.attempts > 0) {
                    stats.inProgress[type]++;
                } else {
                    stats.notStarted[type]++;
                }
            } else {
                stats.notStarted[type]++;
            }
        }
    }
    
    if (allData) {
        for (var k = 0; k < allData.length; k++) {
            var kanjiObj = allData[k];
            var kanji = kanjiObj.kanji;
            if (!levelData[kanji]) {
                for (var m = 0; m < MasteryManager.READING_TYPES.length; m++) {
                    var type = MasteryManager.READING_TYPES[m];
                    stats.notStarted[type]++;
                }
            }
        }
    }
    
    var totalMastered = 0;
    var totalPossible = 0;
    for (var n = 0; n < MasteryManager.READING_TYPES.length; n++) {
        var type = MasteryManager.READING_TYPES[n];
        totalMastered += stats.mastered[type];
        totalPossible += totalKanji;
    }
    stats.overall = totalPossible > 0 ? Math.round((totalMastered / totalPossible) * 100) : 0;
    
    return stats;
}

function getMasteryBreakdown(level) {
    if (!MasteryManager.initialized) initMastery();
    var levelData = MasteryManager.data[level] || {};
    var allData = getDataForLevel(level);
    
    var breakdown = {};
    
    if (allData) {
        for (var i = 0; i < allData.length; i++) {
            var kanjiObj = allData[i];
            var kanji = kanjiObj.kanji;
            var kanjiData = levelData[kanji] || {};
            
            breakdown[kanji] = {
                kanji: kanji,
                onyomi: kanjiData.onyomi ? kanjiData.onyomi.mastered : false,
                kunyomi: kanjiData.kunyomi ? kanjiData.kunyomi.mastered : false,
                meaning: kanjiData.meaning ? kanjiData.meaning.mastered : false,
                allMastered: false
            };
            
            var types = ['onyomi', 'kunyomi', 'meaning'];
            var all = true;
            for (var j = 0; j < types.length; j++) {
                if (!breakdown[kanji][types[j]]) {
                    all = false;
                    break;
                }
            }
            breakdown[kanji].allMastered = all;
        }
    }
    
    return breakdown;
}

function getUnmasteredKanji(level, readingType) {
    if (!MasteryManager.initialized) initMastery();
    var levelData = MasteryManager.data[level] || {};
    var allData = getDataForLevel(level);
    
    if (!allData) return [];
    
    var unmastered = [];
    for (var i = 0; i < allData.length; i++) {
        var kanjiObj = allData[i];
        var kanji = kanjiObj.kanji;
        var typeData = levelData[kanji] ? levelData[kanji][readingType] : null;
        if (!typeData || !typeData.mastered) {
            unmastered.push(kanji);
        }
    }
    
    return unmastered;
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function getMasteryBadgeHTML(level, kanji, readingType) {
    var mastered = isMastered(level, kanji, readingType);
    var typeNames = {
        'onyomi': '音',
        'kunyomi': '訓',
        'meaning': '意'
    };
    
    if (mastered) {
        return '<span class="mastery-badge mastered" title="' + typeNames[readingType] + ' mastered!">⭐</span>';
    } else {
        var data = getReadingTypeMastery(level, kanji, readingType);
        if (data && data.attempts > 0) {
            var progress = Math.min(Math.round((data.correct / MasteryManager.MASTERY_THRESHOLD) * 100), 100);
            return '<span class="mastery-badge in-progress" title="' + typeNames[readingType] + ': ' + data.correct + '/' + MasteryManager.MASTERY_THRESHOLD + '">' + progress + '%</span>';
        } else {
            return '<span class="mastery-badge not-started" title="' + typeNames[readingType] + ': Not started">⬜</span>';
        }
    }
}

function getMasteryBadgeRow(level, kanji) {
    var types = ['onyomi', 'kunyomi', 'meaning'];
    var typeLabels = {
        'onyomi': '音',
        'kunyomi': '訓',
        'meaning': '意'
    };
    
    var html = '<div class="mastery-badges">';
    for (var i = 0; i < types.length; i++) {
        var type = types[i];
        var mastered = isMastered(level, kanji, type);
        var data = getReadingTypeMastery(level, kanji, type);
        var status = '⬜';
        var title = typeLabels[type] + ': Not started';
        
        if (data) {
            if (mastered) {
                status = '⭐';
                title = typeLabels[type] + ': Mastered! (' + data.correct + '/' + MasteryManager.MASTERY_THRESHOLD + ')';
            } else if (data.attempts > 0) {
                status = data.correct + '/' + MasteryManager.MASTERY_THRESHOLD;
                title = typeLabels[type] + ': ' + data.correct + '/' + MasteryManager.MASTERY_THRESHOLD;
            }
        }
        
        var cls = 'mastery-badge';
        if (mastered) cls += ' mastered';
        else if (data && data.attempts > 0) cls += ' in-progress';
        else cls += ' not-started';
        
        html += '<span class="' + cls + '" title="' + title + '">' + status + '</span>';
    }
    html += '</div>';
    return html;
}

function exportMasteryData() {
    if (!MasteryManager.initialized) initMastery();
    return JSON.stringify(MasteryManager.data, null, 2);
}

function importMasteryData(jsonData) {
    try {
        var data = JSON.parse(jsonData);
        if (typeof data !== 'object') throw new Error('Invalid data format');
        
        var validLevels = ['n5', 'n4', 'n3'];
        var valid = true;
        for (var key in data) {
            if (validLevels.indexOf(key) === -1) {
                valid = false;
                break;
            }
        }
        
        if (!valid) {
            if (!data.n5 && !data.n4 && !data.n3) {
                throw new Error('No valid level data found (n5, n4, n3)');
            }
        }
        
        MasteryManager.data = data;
        saveMastery();
        return true;
    } catch (e) {
        console.warn('Failed to import mastery data:', e);
        return false;
    }
}

// ==================== EXPOSE GLOBALLY ====================
window.MasteryManager = MasteryManager;
window.initMastery = initMastery;
window.getMasteryData = getMasteryData;
window.getKanjiMastery = getKanjiMastery;
window.getReadingTypeMastery = getReadingTypeMastery;
window.isMastered = isMastered;
window.isAllMastered = isAllMastered;
window.getMasteredCount = getMasteredCount;
window.getMasteryPercentage = getMasteryPercentage;
window.recordMastery = recordMastery;
window.resetKanjiMastery = resetKanjiMastery;
window.resetLevelMastery = resetLevelMastery;
window.resetAllMastery = resetAllMastery;
window.getMasteryStats = getMasteryStats;
window.getMasteryBreakdown = getMasteryBreakdown;
window.getUnmasteredKanji = getUnmasteredKanji;
window.getMasteryBadgeHTML = getMasteryBadgeHTML;
window.getMasteryBadgeRow = getMasteryBadgeRow;
window.exportMasteryData = exportMasteryData;
window.importMasteryData = importMasteryData;

// Auto-initialize
initMastery();

console.log('🏆 Mastery Manager loaded (V3.0 - 3 Types)');