// ==================== QUIZ-CORE.JS V3.5 ====================
// Fixed: Proper sentence lookup for specific readings using EXACT reading match
// Uses the reading from the data file to build the lookup key

// ==================== QUIZ CORE CLASS ====================
class QuizCore {
    constructor(settings) {
        this.settings = settings;
        this.questions = [];
        this.originalQuestions = [];
        this.currentIndex = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.answered = false;
        this.results = null;
        this.wrongQuestions = [];
        this.questionHistory = [];
        this.level = settings.level || 'n5';
        this.count = settings.count || 20;
        this.quizType = settings.quizType || 'onyomi';
        this.includeMastered = settings.includeMastered !== false;
        this.soundEffects = settings.soundEffects !== false;
        this.retryMode = false;
        
        this.questionTypes = [
            'onyomi',
            'kunyomi',
            'meaning'
        ];
        
        console.log('🎯 QuizCore V3.5 initialized with settings:', this.settings);
    }

    // ==================== START QUIZ ====================
    start() {
        this.generateQuestions();
        this.originalQuestions = this.questions.slice();
        this.retryMode = false;
        this.currentIndex = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.answered = false;
        this.results = null;
        this.wrongQuestions = [];
        this.questionHistory = [];
        
        if (this.questions.length === 0) {
            console.error('No questions generated!');
            return false;
        }
        
        console.log('🎯 Quiz started with ' + this.questions.length + ' questions');
        return true;
    }

    // ==================== RETRY QUIZ ====================
    retry() {
        console.log('🔄 retry() called with originalQuestions:', this.originalQuestions.length);
        
        if (this.originalQuestions.length === 0) {
            console.warn('No original questions to retry!');
            return false;
        }
        
        this.retryMode = true;
        this.currentIndex = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.answered = false;
        this.results = null;
        this.wrongQuestions = [];
        this.questionHistory = [];
        
        this.questions = this.shuffleArray(this.originalQuestions.slice());
        
        console.log('🔄 Retry quiz with ' + this.questions.length + ' questions (shuffled)');
        return true;
    }

    // ==================== GENERATE QUESTIONS ====================
    generateQuestions() {
        var level = this.level;
        var count = this.count;
        var includeMastered = this.includeMastered;
        var quizType = this.quizType;
        
        var availableKanji = this.getAvailableKanji(level, includeMastered, quizType);
        
        if (availableKanji.length === 0) {
            console.warn('No kanji available for quiz');
            this.questions = [];
            return;
        }
        
        availableKanji = this.shuffleArray(availableKanji);
        var questionCount = Math.min(count, availableKanji.length);
        
        var questions = [];
        var selectedKanji = availableKanji.slice(0, questionCount);
        
        for (var i = 0; i < selectedKanji.length; i++) {
            var kanjiData = selectedKanji[i];
            var question = this.generateQuestion(quizType, kanjiData);
            if (question) {
                questions.push(question);
            }
        }
        
        this.questions = this.shuffleArray(questions);
        
        console.log('📝 Generated ' + this.questions.length + ' questions');
    }

    // ==================== GET AVAILABLE KANJI ====================
    getAvailableKanji(level, includeMastered, quizType) {
        var data = [];
        var allData = getDataForLevel(level);
        
        if (!allData || allData.length === 0) {
            console.warn('No data found for level:', level);
            return [];
        }
        
        var masteryTypeMap = {
            'onyomi': 'onyomi',
            'kunyomi': 'kunyomi',
            'meaning': 'meaning'
        };
        var masteryType = masteryTypeMap[quizType] || 'onyomi';
        
        if (!includeMastered) {
            var mastery = getMasteryData();
            var levelMastery = mastery[level] || {};
            
            data = allData.filter(function(d) {
                var kanjiMastery = levelMastery[d.kanji];
                if (!kanjiMastery) return true;
                var typeData = kanjiMastery[masteryType];
                return !(typeData && typeData.mastered === true);
            });
        } else {
            data = allData.slice();
        }
        
        return data;
    }

    // ==================== GENERATE QUESTION ====================
    generateQuestion(quizType, kanjiData) {
        switch (quizType) {
            case 'onyomi':
                return this.generateOnyomiQuestion(kanjiData);
            case 'kunyomi':
                return this.generateKunyomiQuestion(kanjiData);
            case 'meaning':
                return this.generateMeaningQuestion(kanjiData);
            default:
                return null;
        }
    }

    // ==================== ON'YOMI QUESTION ====================
    generateOnyomiQuestion(kanjiData) {
        var reading = kanjiData.onyomi;
        if (!reading) return null;
        
        var readingItems = this.splitReadings(reading);
        if (readingItems.length === 0) return null;
        
        // Use the FIRST onyomi reading - this should be the primary reading
        var correctReading = readingItems[0];
        
        console.log('🔍 ONYOMI question for:', kanjiData.kanji, 'reading:', correctReading);
        
        // Look up sentence data for THIS SPECIFIC onyomi reading
        var sentenceData = this.getSentenceData(kanjiData.kanji, correctReading, 'onyomi');
        
        if (!sentenceData) {
            console.warn('⚠️ No onyomi sentence found for:', kanjiData.kanji, correctReading);
            console.warn('   Available keys:', Object.keys(this.getQuizSentenceData()[kanjiData.kanji] || {}));
        } else {
            console.log('✅ Onyomi sentence found:', sentenceData.sentence);
        }
        
        var question = {
            type: 'onyomi',
            typeLabel: 'On\'yomi Reading',
            prompt: kanjiData.kanji,
            correctAnswer: correctReading,
            options: [],
            targetKanji: kanjiData.kanji,
            level: kanjiData.level || this.level,
            sentenceData: sentenceData,
            readingType: 'onyomi',
            readingValue: correctReading
        };
        
        // Generate wrong options
        var allKanji = getDataForLevel(this.level);
        var otherKanji = allKanji.filter(function(d) { return d.kanji !== kanjiData.kanji; });
        var wrongOptions = [];
        var shuffledOther = this.shuffleArray(otherKanji);
        
        for (var i = 0; i < shuffledOther.length; i++) {
            if (wrongOptions.length >= 3) break;
            var other = shuffledOther[i];
            var otherReading = other.onyomi;
            if (otherReading) {
                var otherItems = this.splitReadings(otherReading);
                if (otherItems.length > 0) {
                    var randomReading = otherItems[Math.floor(Math.random() * otherItems.length)];
                    if (randomReading && randomReading !== correctReading && wrongOptions.indexOf(randomReading) === -1) {
                        wrongOptions.push(randomReading);
                    }
                }
            }
        }
        
        while (wrongOptions.length < 3) {
            var fallbacks = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と'];
            for (var j = 0; j < fallbacks.length; j++) {
                var fb = fallbacks[j];
                if (wrongOptions.indexOf(fb) === -1 && fb !== correctReading && wrongOptions.length < 3) {
                    wrongOptions.push(fb);
                }
            }
        }
        
        question.options = this.shuffleArray([correctReading].concat(wrongOptions.slice(0, 3)));
        return question;
    }

    // ==================== KUN'YOMI QUESTION ====================
    generateKunyomiQuestion(kanjiData) {
        var reading = kanjiData.kunyomi;
        if (!reading) return null;
        
        var readingItems = this.splitReadings(reading);
        if (readingItems.length === 0) return null;
        
        // Use the FIRST kunyomi reading
        var correctReading = readingItems[0];
        
        console.log('🔍 KUNYOMI question for:', kanjiData.kanji, 'reading:', correctReading);
        
        // Look up sentence data for THIS SPECIFIC kunyomi reading
        var sentenceData = this.getSentenceData(kanjiData.kanji, correctReading, 'kunyomi');
        
        if (!sentenceData) {
            console.warn('⚠️ No kunyomi sentence found for:', kanjiData.kanji, correctReading);
            console.warn('   Available keys:', Object.keys(this.getQuizSentenceData()[kanjiData.kanji] || {}));
        } else {
            console.log('✅ Kunyomi sentence found:', sentenceData.sentence);
        }
        
        var question = {
            type: 'kunyomi',
            typeLabel: 'Kun\'yomi Reading',
            prompt: kanjiData.kanji,
            correctAnswer: correctReading,
            options: [],
            targetKanji: kanjiData.kanji,
            level: kanjiData.level || this.level,
            sentenceData: sentenceData,
            readingType: 'kunyomi',
            readingValue: correctReading
        };
        
        var allKanji = getDataForLevel(this.level);
        var otherKanji = allKanji.filter(function(d) { return d.kanji !== kanjiData.kanji; });
        var wrongOptions = [];
        var shuffledOther = this.shuffleArray(otherKanji);
        
        for (var i = 0; i < shuffledOther.length; i++) {
            if (wrongOptions.length >= 3) break;
            var other = shuffledOther[i];
            var otherReading = other.kunyomi;
            if (otherReading) {
                var otherItems = this.splitReadings(otherReading);
                if (otherItems.length > 0) {
                    var randomReading = otherItems[Math.floor(Math.random() * otherItems.length)];
                    if (randomReading && randomReading !== correctReading && wrongOptions.indexOf(randomReading) === -1) {
                        wrongOptions.push(randomReading);
                    }
                }
            }
        }
        
        while (wrongOptions.length < 3) {
            var fallbacks = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と'];
            for (var j = 0; j < fallbacks.length; j++) {
                var fb = fallbacks[j];
                if (wrongOptions.indexOf(fb) === -1 && fb !== correctReading && wrongOptions.length < 3) {
                    wrongOptions.push(fb);
                }
            }
        }
        
        question.options = this.shuffleArray([correctReading].concat(wrongOptions.slice(0, 3)));
        return question;
    }

    // ==================== MEANING QUESTION ====================
    generateMeaningQuestion(kanjiData) {
        var meaning = kanjiData.meaning;
        if (!meaning) return null;
        
        var question = {
            type: 'meaning',
            typeLabel: 'Meaning',
            prompt: kanjiData.kanji,
            correctAnswer: meaning,
            options: [],
            targetKanji: kanjiData.kanji,
            level: kanjiData.level || this.level,
            sentenceData: this.getFirstSentenceData(kanjiData.kanji),
            readingType: 'meaning',
            readingValue: 'meaning'
        };
        
        var allKanji = getDataForLevel(this.level);
        var otherKanji = allKanji.filter(function(d) { return d.kanji !== kanjiData.kanji; });
        var wrongOptions = [];
        var shuffledOther = this.shuffleArray(otherKanji);
        
        for (var i = 0; i < shuffledOther.length; i++) {
            if (wrongOptions.length >= 3) break;
            var other = shuffledOther[i];
            if (other.meaning && other.meaning !== meaning && wrongOptions.indexOf(other.meaning) === -1) {
                wrongOptions.push(other.meaning);
            }
        }
        
        while (wrongOptions.length < 3) {
            var fallbacks = ['person', 'thing', 'place', 'time', 'water', 'fire', 'tree', 'mountain', 'river', 'sea', 'book', 'house', 'road', 'sky', 'wind'];
            for (var j = 0; j < fallbacks.length; j++) {
                var fb = fallbacks[j];
                if (wrongOptions.indexOf(fb) === -1 && fb !== meaning && wrongOptions.length < 3) {
                    wrongOptions.push(fb);
                }
            }
        }
        
        question.options = this.shuffleArray([meaning].concat(wrongOptions.slice(0, 3)));
        return question;
    }

    // ==================== GET SENTENCE DATA ====================
    getSentenceData(kanji, reading, readingType) {
        var levelData = this.getQuizSentenceData();
        if (!levelData) {
            console.warn('⚠️ No sentence data available for level:', this.level);
            return null;
        }
        
        if (!levelData[kanji]) {
            console.warn('⚠️ No sentence data for kanji:', kanji);
            return null;
        }
        
        // IMPORTANT: The reading must match EXACTLY what's in the data file
        // The data file uses the reading as-is (e.g., "ゼン", not "ぜん")
        var key = readingType + '_' + reading;
        
        console.log('🔍 Looking for key:', key);
        console.log('   Available keys:', Object.keys(levelData[kanji]));
        
        var entry = levelData[kanji][key];
        if (!entry) {
            console.warn('⚠️ No sentence found for:', kanji, reading, readingType, 'key:', key);
            return null;
        }
        
        var parts = entry.split('§');
        
        return {
            sentence: parts[0] || '',
            readingText: parts[1] || '',
            english: parts[2] || '',
            displayHtml: parts[3] || '',
            raw: entry
        };
    }

    // ==================== GET FIRST SENTENCE DATA (for meaning questions) ====================
    getFirstSentenceData(kanji) {
        var levelData = this.getQuizSentenceData();
        if (!levelData) return null;
        if (!levelData[kanji]) return null;
        
        var kanjiData = levelData[kanji];
        var keys = Object.keys(kanjiData);
        
        for (var i = 0; i < keys.length; i++) {
            var entry = kanjiData[keys[i]];
            if (entry) {
                var parts = entry.split('§');
                return {
                    sentence: parts[0] || '',
                    readingText: parts[1] || '',
                    english: parts[2] || '',
                    displayHtml: parts[3] || '',
                    raw: entry
                };
            }
        }
        return null;
    }

    // ==================== GET QUIZ SENTENCE DATA ====================
    getQuizSentenceData() {
        var level = this.level;
        switch(level) {
            case 'n5': 
                if (typeof N5QuizSentences !== 'undefined') {
                    console.log('✅ Using N5QuizSentences data');
                    return N5QuizSentences;
                } else {
                    console.warn('⚠️ N5QuizSentences not loaded!');
                    return null;
                }
            case 'n4': 
                if (typeof N4QuizSentences !== 'undefined') {
                    console.log('✅ Using N4QuizSentences data');
                    return N4QuizSentences;
                } else {
                    console.warn('⚠️ N4QuizSentences not loaded!');
                    return null;
                }
            case 'n3': 
                if (typeof N3QuizSentences !== 'undefined') {
                    console.log('✅ Using N3QuizSentences data');
                    return N3QuizSentences;
                } else {
                    console.warn('⚠️ N3QuizSentences not loaded!');
                    return null;
                }
            case 'all':
                var combined = {};
                if (typeof N5QuizSentences !== 'undefined') {
                    combined = { ...combined, ...N5QuizSentences };
                }
                if (typeof N4QuizSentences !== 'undefined') {
                    combined = { ...combined, ...N4QuizSentences };
                }
                if (typeof N3QuizSentences !== 'undefined') {
                    combined = { ...combined, ...N3QuizSentences };
                }
                console.log('✅ Using combined sentence data for All Levels');
                return combined;
            default: 
                console.warn('⚠️ Unknown level:', level);
                return null;
        }
    }

    // ==================== HELPER: SPLIT READINGS ====================
    splitReadings(readings) {
        if (!readings) return [];
        // Split by common delimiters: 、, ，, space, comma
        var items = readings.split(/[、・，,\s]+/).filter(function(s) { 
            return s.trim().length > 0; 
        });
        return items.map(function(s) { return s.trim(); });
    }

    // ==================== HELPER: SHUFFLE ARRAY ====================
    shuffleArray(array) {
        var shuffled = array.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    }

    // ==================== GET CURRENT QUESTION ====================
    getCurrentQuestion() {
        if (this.currentIndex >= this.questions.length) {
            return null;
        }
        return this.questions[this.currentIndex];
    }

    // ==================== GET CURRENT INDEX ====================
    getCurrentIndex() {
        return this.currentIndex;
    }

    // ==================== GET TOTAL QUESTIONS ====================
    getTotalQuestions() {
        return this.questions.length;
    }

    // ==================== GET CORRECT COUNT ====================
    getCorrectCount() {
        return this.correctCount;
    }

    // ==================== GET WRONG COUNT ====================
    getWrongCount() {
        return this.wrongCount;
    }

    // ==================== RECORD CORRECT ====================
    recordCorrect() {
        this.correctCount++;
        this.answered = true;
        
        var question = this.getCurrentQuestion();
        if (question) {
            this.questionHistory.push({
                timestamp: new Date().toISOString(),
                questionType: question.type,
                kanji: question.targetKanji || question.correctAnswer,
                correct: true,
                level: this.level
            });
            this.updateMastery(question, true);
        }
    }

    // ==================== RECORD WRONG ====================
    recordWrong() {
        this.wrongCount++;
        this.answered = true;
        
        var question = this.getCurrentQuestion();
        if (question) {
            this.questionHistory.push({
                timestamp: new Date().toISOString(),
                questionType: question.type,
                kanji: question.targetKanji || question.correctAnswer,
                correct: false,
                level: this.level
            });
            this.wrongQuestions.push(question);
            this.updateMastery(question, false);
        }
    }

    // ==================== UPDATE MASTERY ====================
    updateMastery(question, correct) {
        var kanji = question.targetKanji || question.correctAnswer;
        var level = this.level;
        
        var masteryTypeMap = {
            'onyomi': 'onyomi',
            'kunyomi': 'kunyomi',
            'meaning': 'meaning'
        };
        
        var masteryType = masteryTypeMap[question.type] || 'onyomi';
        
        if (typeof recordMastery === 'function') {
            recordMastery(level, kanji, masteryType, correct);
        }
    }

    // ==================== NEXT QUESTION ====================
    nextQuestion() {
        if (this.currentIndex >= this.questions.length - 1) {
            return null;
        }
        this.currentIndex++;
        this.answered = false;
        return this.getCurrentQuestion();
    }

    // ==================== GET RESULTS ====================
    getResults() {
        var total = this.questions.length;
        var correct = this.correctCount;
        var wrong = this.wrongCount;
        var score = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        var breakdown = {};
        var typeNames = {
            'onyomi': 'On\'yomi',
            'kunyomi': 'Kun\'yomi',
            'meaning': 'Meaning'
        };
        
        for (var i = 0; i < this.questionTypes.length; i++) {
            var type = this.questionTypes[i];
            breakdown[type] = { correct: 0, wrong: 0, label: typeNames[type] || type };
        }
        
        for (var j = 0; j < this.questionHistory.length; j++) {
            var entry = this.questionHistory[j];
            if (breakdown[entry.questionType]) {
                if (entry.correct) {
                    breakdown[entry.questionType].correct++;
                } else {
                    breakdown[entry.questionType].wrong++;
                }
            }
        }
        
        for (var typeKey in breakdown) {
            if (breakdown[typeKey].correct === 0 && breakdown[typeKey].wrong === 0) {
                delete breakdown[typeKey];
            }
        }
        
        this.results = {
            total: total,
            correct: correct,
            wrong: wrong,
            score: score,
            breakdown: breakdown,
            questionHistory: this.questionHistory,
            quizType: this.quizType,
            isRetry: this.retryMode
        };
        
        this.recordProgress();
        
        return this.results;
    }

    // ==================== RECORD PROGRESS ====================
    recordProgress() {
        if (!this.retryMode && typeof recordQuizCompletion === 'function' && this.results) {
            recordQuizCompletion(this.level, this.results);
        } else if (this.retryMode) {
            console.log('🔄 Skipping progress recording for retry');
        }
    }

    // ==================== GET WRONG QUESTIONS ====================
    getWrongQuestions() {
        return this.wrongQuestions;
    }

    // ==================== CLEANUP ====================
    cleanup() {
        this.questions = [];
        this.originalQuestions = [];
        this.currentIndex = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.answered = false;
        this.results = null;
        this.wrongQuestions = [];
        this.questionHistory = [];
        console.log('🧹 QuizCore cleaned up');
    }

    // ==================== GET QUIZ STATS ====================
    getStats() {
        var total = this.questions.length;
        var remaining = total - this.currentIndex - (this.answered ? 1 : 0);
        var answered = this.correctCount + this.wrongCount;
        
        return {
            total: total,
            current: this.currentIndex + 1,
            remaining: remaining,
            answered: answered,
            correct: this.correctCount,
            wrong: this.wrongCount,
            progress: total > 0 ? Math.round((answered / total) * 100) : 0
        };
    }
}

// ==================== EXPOSE GLOBALLY ====================
window.QuizCore = QuizCore;

console.log('🎯 Quiz Core loaded (V3.5 - Fixed Reading-Specific Sentence Lookup)');