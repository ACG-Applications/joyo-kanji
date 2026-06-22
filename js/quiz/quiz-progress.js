// ==================== QUIZ-PROGRESS.JS V3.0 ====================
// Complete Progress Tracking System - 3 Types
// Tracks: onyomi, kunyomi, meaning

// ==================== PROGRESS MANAGER ====================
var ProgressManager = {
    STORAGE_KEY: 'joyo_kanji_progress',
    data: {},
    initialized: false
};

// ==================== DATA STRUCTURE ====================
/*
{
    "n5": {
        "totalQuizzes": 5,
        "totalQuestions": 100,
        "correctAnswers": 62,
        "wrongAnswers": 38,
        "averageScore": 62,
        "lastQuizDate": "2026-06-18",
        "dailyProgress": {
            "2026-06-14": { "correct": 8, "wrong": 2, "score": 80 }
        },
        "weeklyAverage": 70,
        "bestScore": 90,
        "worstScore": 50,
        "typeBreakdown": {
            "onyomi": { "correct": 20, "wrong": 5, "score": 80 },
            "kunyomi": { "correct": 15, "wrong": 10, "score": 60 },
            "meaning": { "correct": 12, "wrong": 3, "score": 80 }
        },
        "questionHistory": []
    }
}
*/

// ==================== INITIALIZATION ====================
function initProgress() {
    if (ProgressManager.initialized) return;
    
    try {
        var stored = localStorage.getItem(ProgressManager.STORAGE_KEY);
        if (stored) {
            ProgressManager.data = JSON.parse(stored);
        } else {
            ProgressManager.data = {
                n5: createLevelData(),
                n4: createLevelData(),
                n3: createLevelData()
            };
            saveProgress();
        }
        ProgressManager.initialized = true;
        console.log('📊 Progress Manager initialized');
    } catch (e) {
        console.warn('Failed to load progress data:', e);
        ProgressManager.data = {
            n5: createLevelData(),
            n4: createLevelData(),
            n3: createLevelData()
        };
        ProgressManager.initialized = true;
    }
}

function createLevelData() {
    return {
        totalQuizzes: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        averageScore: 0,
        lastQuizDate: null,
        dailyProgress: {},
        weeklyAverage: 0,
        bestScore: 0,
        worstScore: 100,
        typeBreakdown: {
            onyomi: { correct: 0, wrong: 0, score: 0 },
            kunyomi: { correct: 0, wrong: 0, score: 0 },
            meaning: { correct: 0, wrong: 0, score: 0 }
        },
        questionHistory: []
    };
}

function saveProgress() {
    try {
        localStorage.setItem(ProgressManager.STORAGE_KEY, JSON.stringify(ProgressManager.data));
    } catch (e) {
        console.warn('Failed to save progress data:', e);
    }
}

function getProgressData() {
    if (!ProgressManager.initialized) initProgress();
    return ProgressManager.data;
}

function getLevelProgress(level) {
    if (!ProgressManager.initialized) initProgress();
    return ProgressManager.data[level] || createLevelData();
}

function getDailyProgress(level, date) {
    var levelData = getLevelProgress(level);
    return levelData.dailyProgress[date] || null;
}

function getTodayProgress(level) {
    var today = getTodayString();
    return getDailyProgress(level, today);
}

function recordQuizCompletion(level, results) {
    if (!ProgressManager.initialized) initProgress();
    
    var levelData = ProgressManager.data[level];
    if (!levelData) return;
    
    var today = getTodayString();
    var correct = results.correct || 0;
    var wrong = results.wrong || 0;
    var total = correct + wrong;
    var score = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    levelData.totalQuizzes += 1;
    levelData.totalQuestions += total;
    levelData.correctAnswers += correct;
    levelData.wrongAnswers += wrong;
    levelData.lastQuizDate = today;
    
    var totalAnswered = levelData.correctAnswers + levelData.wrongAnswers;
    levelData.averageScore = totalAnswered > 0 
        ? Math.round((levelData.correctAnswers / totalAnswered) * 100) 
        : 0;
    
    if (score > levelData.bestScore) levelData.bestScore = score;
    if (score < levelData.worstScore) levelData.worstScore = score;
    
    if (!levelData.dailyProgress[today]) {
        levelData.dailyProgress[today] = { correct: 0, wrong: 0, score: 0 };
    }
    levelData.dailyProgress[today].correct += correct;
    levelData.dailyProgress[today].wrong += wrong;
    var dailyTotal = levelData.dailyProgress[today].correct + levelData.dailyProgress[today].wrong;
    levelData.dailyProgress[today].score = dailyTotal > 0 
        ? Math.round((levelData.dailyProgress[today].correct / dailyTotal) * 100) 
        : 0;
    
    if (results.breakdown) {
        for (var type in results.breakdown) {
            if (levelData.typeBreakdown[type]) {
                levelData.typeBreakdown[type].correct += results.breakdown[type].correct || 0;
                levelData.typeBreakdown[type].wrong += results.breakdown[type].wrong || 0;
                var typeTotal = levelData.typeBreakdown[type].correct + levelData.typeBreakdown[type].wrong;
                levelData.typeBreakdown[type].score = typeTotal > 0 
                    ? Math.round((levelData.typeBreakdown[type].correct / typeTotal) * 100) 
                    : 0;
            }
        }
    }
    
    updateWeeklyAverage(level);
    
    if (results.questionHistory) {
        levelData.questionHistory = levelData.questionHistory.concat(results.questionHistory);
        if (levelData.questionHistory.length > 500) {
            levelData.questionHistory = levelData.questionHistory.slice(-500);
        }
    }
    
    saveProgress();
}

function updateWeeklyAverage(level) {
    var levelData = ProgressManager.data[level];
    if (!levelData) return;
    
    var today = new Date();
    var weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    var weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    var totalCorrect = 0;
    var totalWrong = 0;
    
    for (var date in levelData.dailyProgress) {
        if (date >= weekAgoStr) {
            totalCorrect += levelData.dailyProgress[date].correct || 0;
            totalWrong += levelData.dailyProgress[date].wrong || 0;
        }
    }
    
    var total = totalCorrect + totalWrong;
    levelData.weeklyAverage = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
}

function getWeakAreas(level, limit) {
    if (limit === undefined) limit = 3;
    var levelData = getLevelProgress(level);
    var breakdown = levelData.typeBreakdown || {};
    
    var typeNames = {
        'onyomi': 'On\'yomi',
        'kunyomi': 'Kun\'yomi',
        'meaning': 'Meaning'
    };
    
    var scores = [];
    for (var type in breakdown) {
        var data = breakdown[type];
        var total = data.correct + data.wrong;
        if (total === 0) continue;
        var score = Math.round((data.correct / total) * 100);
        scores.push({
            type: type,
            label: typeNames[type] || type,
            score: score,
            correct: data.correct,
            wrong: data.wrong,
            total: total
        });
    }
    
    scores.sort(function(a, b) { return a.score - b.score; });
    return scores.slice(0, limit);
}

function getWeakKanji(level, limit) {
    if (limit === undefined) limit = 10;
    var levelData = getLevelProgress(level);
    var history = levelData.questionHistory || [];
    
    var wrongCounts = {};
    var totalCounts = {};
    
    for (var i = 0; i < history.length; i++) {
        var entry = history[i];
        var kanji = entry.kanji;
        if (!kanji) continue;
        if (!totalCounts[kanji]) {
            totalCounts[kanji] = 0;
            wrongCounts[kanji] = 0;
        }
        totalCounts[kanji]++;
        if (!entry.correct) {
            wrongCounts[kanji]++;
        }
    }
    
    var weak = [];
    for (var kanji in totalCounts) {
        var total = totalCounts[kanji];
        var wrong = wrongCounts[kanji] || 0;
        var pct = Math.round((wrong / total) * 100);
        weak.push({
            kanji: kanji,
            wrong: wrong,
            total: total,
            percentage: pct
        });
    }
    
    weak.sort(function(a, b) { return b.percentage - a.percentage || b.wrong - a.wrong; });
    return weak.slice(0, limit);
}

function getStreak(level) {
    var levelData = getLevelProgress(level);
    var history = levelData.questionHistory || [];
    
    var streak = 0;
    for (var i = history.length - 1; i >= 0; i--) {
        if (history[i].correct) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

function getDailyTrend(level, days) {
    if (days === undefined) days = 7;
    var levelData = getLevelProgress(level);
    var dailyProgress = levelData.dailyProgress || {};
    
    var today = new Date();
    var trend = [];
    
    for (var i = days - 1; i >= 0; i--) {
        var date = new Date(today);
        date.setDate(date.getDate() - i);
        var dateStr = date.toISOString().split('T')[0];
        var dayData = dailyProgress[dateStr] || { correct: 0, wrong: 0, score: 0 };
        trend.push({
            date: dateStr,
            correct: dayData.correct || 0,
            wrong: dayData.wrong || 0,
            score: dayData.score || 0,
            total: (dayData.correct || 0) + (dayData.wrong || 0)
        });
    }
    
    return trend;
}

function getSummaryStats(level) {
    var levelData = getLevelProgress(level);
    
    var total = levelData.correctAnswers + levelData.wrongAnswers;
    var score = total > 0 ? Math.round((levelData.correctAnswers / total) * 100) : 0;
    var today = getTodayString();
    var todayData = levelData.dailyProgress[today] || { correct: 0, wrong: 0 };
    
    return {
        totalQuizzes: levelData.totalQuizzes || 0,
        totalQuestions: total,
        correctAnswers: levelData.correctAnswers || 0,
        wrongAnswers: levelData.wrongAnswers || 0,
        averageScore: levelData.averageScore || 0,
        bestScore: levelData.bestScore || 0,
        worstScore: levelData.worstScore === 100 ? 0 : levelData.worstScore,
        weeklyAverage: levelData.weeklyAverage || 0,
        lastQuizDate: levelData.lastQuizDate,
        todayCorrect: todayData.correct || 0,
        todayWrong: todayData.wrong || 0,
        todayScore: todayData.score || 0,
        streak: getStreak(level)
    };
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function exportProgressData() {
    if (!ProgressManager.initialized) initProgress();
    return JSON.stringify(ProgressManager.data, null, 2);
}

function importProgressData(jsonData) {
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
        
        ProgressManager.data = data;
        saveProgress();
        return true;
    } catch (e) {
        console.warn('Failed to import progress data:', e);
        return false;
    }
}

function resetLevelProgress(level) {
    if (!ProgressManager.initialized) initProgress();
    
    if (ProgressManager.data[level]) {
        ProgressManager.data[level] = createLevelData();
        saveProgress();
        return true;
    }
    return false;
}

function resetAllProgress() {
    if (!ProgressManager.initialized) initProgress();
    
    ProgressManager.data = {
        n5: createLevelData(),
        n4: createLevelData(),
        n3: createLevelData()
    };
    saveProgress();
    return true;
}

function cleanOldProgress(daysToKeep) {
    if (daysToKeep === undefined) daysToKeep = 90;
    if (!ProgressManager.initialized) initProgress();
    
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);
    var cutoffStr = cutoff.toISOString().split('T')[0];
    
    var levels = ['n5', 'n4', 'n3'];
    for (var i = 0; i < levels.length; i++) {
        var level = levels[i];
        var levelData = ProgressManager.data[level];
        if (!levelData) continue;
        
        var daily = levelData.dailyProgress || {};
        for (var date in daily) {
            if (date < cutoffStr) {
                delete daily[date];
            }
        }
        
        if (levelData.questionHistory) {
            levelData.questionHistory = levelData.questionHistory.filter(function(entry) {
                return entry.timestamp && entry.timestamp >= cutoffStr;
            });
        }
    }
    
    saveProgress();
}

// ==================== EXPOSE GLOBALLY ====================
window.ProgressManager = ProgressManager;
window.initProgress = initProgress;
window.getProgressData = getProgressData;
window.getLevelProgress = getLevelProgress;
window.getDailyProgress = getDailyProgress;
window.getTodayProgress = getTodayProgress;
window.recordQuizCompletion = recordQuizCompletion;
window.updateWeeklyAverage = updateWeeklyAverage;
window.getWeakAreas = getWeakAreas;
window.getWeakKanji = getWeakKanji;
window.getStreak = getStreak;
window.getDailyTrend = getDailyTrend;
window.getSummaryStats = getSummaryStats;
window.exportProgressData = exportProgressData;
window.importProgressData = importProgressData;
window.resetLevelProgress = resetLevelProgress;
window.resetAllProgress = resetAllProgress;
window.cleanOldProgress = cleanOldProgress;

// Auto-initialize
initProgress();

console.log('📊 Progress Manager loaded (V3.0 - 3 Types)');