// ==================== QUIZ-UI.JS V3.6 ====================
// Fixed: Displays the correct sentence for the reading type being tested
// Uses readingType and readingValue to look up the correct example
// Improved UI: Removed "音読み例:" label, cleaner display
// Added: Furigana toggle support for quiz display

// ==================== QUIZ UI STATE ====================
var QuizUI = {
    settings: {
        level: 'n5',
        count: 20,
        quizType: 'onyomi',
        includeMastered: true,
        soundEffects: true
    },
    
    quiz: null,
    isOpen: false,
    isPlaying: false,
    isReviewMode: false,
    reviewQuestions: [],
    reviewIndex: 0,
    reviewCorrect: 0,
    reviewWrong: 0,
    reviewWeakList: [],
    
    dom: {}
};

// ==================== INITIALIZATION ====================
function initQuizUI() {
    console.log('📝 Initializing Quiz UI V3.6...');
    
    QuizUI.dom = {
        overlay: document.getElementById('quizModalOverlay'),
        modal: document.getElementById('quizModal'),
        closeBtn: document.getElementById('quizModalClose'),
        settingsArea: document.getElementById('quizSettingsArea'),
        playArea: document.getElementById('quizPlayArea'),
        resultsArea: document.getElementById('quizResultsArea'),
        reviewArea: document.getElementById('quizReviewArea'),
        
        levelBtns: document.querySelectorAll('.quiz-level-btn'),
        typeBtns: document.querySelectorAll('.quiz-type-btn'),
        countInput: document.getElementById('quizCount'),
        includeMastered: document.getElementById('quizIncludeMastered'),
        soundEffects: document.getElementById('quizSoundEffects'),
        startBtn: document.getElementById('quizStartBtn'),
        cancelBtn: document.getElementById('quizCancelBtn'),
        
        countdownOverlay: document.getElementById('quizCountdownOverlay'),
        countdownNumber: document.getElementById('quizCountdownNumber'),
        countdownLabel: document.getElementById('quizCountdownLabel'),
        countdownInfo: document.getElementById('quizCountdownInfo'),
        
        header: document.getElementById('quizHeader'),
        headerLevel: document.getElementById('quizHeaderLevel'),
        headerProgress: document.getElementById('quizHeaderProgress'),
        headerCorrect: document.getElementById('quizHeaderCorrect'),
        headerWrong: document.getElementById('quizHeaderWrong'),
        headerTimer: document.getElementById('quizHeaderTimer'),
        
        questionPrompt: document.getElementById('quizQuestionPrompt'),
        sentence: document.getElementById('quizSentence'),
        optionsContainer: document.getElementById('quizOptionsContainer'),
        feedback: document.getElementById('quizFeedback'),
        feedbackResult: document.getElementById('quizFeedbackResult'),
        feedbackAnswer: document.getElementById('quizFeedbackAnswer'),
        kanjiInfo: document.getElementById('quizKanjiInfo'),
        nextBtn: document.getElementById('quizNextBtn'),
        
        hintBtn: document.getElementById('quizHintBtn'),
        ttsBtn: document.getElementById('quizTtsBtn'),
        skipBtn: document.getElementById('quizSkipBtn'),
        
        resultsScore: document.getElementById('quizResultsScore'),
        resultsTime: document.getElementById('quizResultsTime'),
        breakdownContainer: document.getElementById('quizBreakdownContainer'),
        weakContainer: document.getElementById('quizWeakContainer'),
        reviewWrongBtn: document.getElementById('quizReviewWrongBtn'),
        retryBtn: document.getElementById('quizRetryBtn'),
        continueBtn: document.getElementById('quizContinueBtn'),
        
        reviewHeader: document.getElementById('quizReviewHeader'),
        reviewProgress: document.getElementById('quizReviewProgress'),
        reviewProgressBar: document.getElementById('quizReviewProgressBar'),
        reviewQuestion: document.getElementById('quizReviewQuestion'),
        reviewOptions: document.getElementById('quizReviewOptions'),
        reviewFeedback: document.getElementById('quizReviewFeedback'),
        reviewNextBtn: document.getElementById('quizReviewNextBtn'),
        reviewComplete: document.getElementById('quizReviewComplete'),
        reviewScore: document.getElementById('quizReviewScore'),
        reviewWeak: document.getElementById('quizReviewWeak'),
        reviewPracticeBtn: document.getElementById('quizReviewPracticeBtn'),
        reviewContinueBtn: document.getElementById('quizReviewContinueBtn')
    };
    
    if (!QuizUI.dom.overlay) {
        console.error('❌ Quiz overlay not found!');
        return;
    }
    console.log('✅ Quiz overlay found:', QuizUI.dom.overlay);
    
    setupQuizUIEvents();
    setDefaultSettings();
    console.log('📝 Quiz UI initialized');
}

// ==================== SETUP EVENTS ====================
function setupQuizUIEvents() {
    var d = QuizUI.dom;
    
    if (d.closeBtn) {
        d.closeBtn.addEventListener('click', function() { QuizUI.closeModal(); });
    }
    
    if (d.overlay) {
        d.overlay.addEventListener('click', function(e) {
            if (e.target === this) { QuizUI.closeModal(); }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && QuizUI.isOpen) { QuizUI.closeModal(); }
    });
    
    if (d.levelBtns) {
        d.levelBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                d.levelBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                QuizUI.settings.level = this.dataset.level;
            });
        });
    }
    
    if (d.typeBtns) {
        d.typeBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                d.typeBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                QuizUI.settings.quizType = this.dataset.type;
            });
        });
    }
    
    if (d.countInput) {
        d.countInput.addEventListener('change', function() {
            var val = parseInt(this.value);
            if (!isNaN(val) && val >= 10) {
                QuizUI.settings.count = val;
            }
        });
    }
    
    if (d.includeMastered) {
        d.includeMastered.addEventListener('change', function(e) {
            QuizUI.settings.includeMastered = e.target.checked;
        });
    }
    
    if (d.soundEffects) {
        d.soundEffects.addEventListener('change', function(e) {
            QuizUI.settings.soundEffects = e.target.checked;
        });
    }
    
    if (d.startBtn) {
        d.startBtn.addEventListener('click', startQuizFromSettings);
    }
    
    if (d.cancelBtn) {
        d.cancelBtn.addEventListener('click', QuizUI.closeModal);
    }
    
    if (d.nextBtn) {
        d.nextBtn.addEventListener('click', onNextQuestion);
    }
    
    if (d.hintBtn) d.hintBtn.addEventListener('click', onHintClick);
    if (d.ttsBtn) d.ttsBtn.addEventListener('click', onTtsClick);
    if (d.skipBtn) d.skipBtn.addEventListener('click', onSkipQuestion);
    
    if (d.reviewWrongBtn) d.reviewWrongBtn.addEventListener('click', startReviewMode);
    if (d.retryBtn) d.retryBtn.addEventListener('click', retryQuiz);
    if (d.continueBtn) d.continueBtn.addEventListener('click', QuizUI.closeModal);
    
    if (d.reviewNextBtn) {
        d.reviewNextBtn.addEventListener('click', onReviewNext);
    }
    
    if (d.reviewPracticeBtn) {
        d.reviewPracticeBtn.addEventListener('click', function() {
            if (QuizUI.reviewWeakList && QuizUI.reviewWeakList.length > 0) {
                QuizUI.reviewWeakList.forEach(function(kanji) {
                    if (typeof selectedKanji !== 'undefined') {
                        selectedKanji.add(kanji);
                    }
                });
                if (typeof updateSelectionUI !== 'undefined') updateSelectionUI();
                if (typeof renderGrid !== 'undefined') renderGrid();
            }
            QuizUI.closeModal();
        });
    }
    if (d.reviewContinueBtn) {
        d.reviewContinueBtn.addEventListener('click', QuizUI.closeModal);
    }
    
    document.addEventListener('keydown', function(e) {
        if (!QuizUI.isPlaying || !QuizUI.isOpen) return;
        if (e.key >= '1' && e.key <= '4') {
            var idx = parseInt(e.key) - 1;
            var btns = document.querySelectorAll('.quiz-option-btn:not(.disabled)');
            if (btns[idx]) btns[idx].click();
        }
        if ((e.key === 'Enter' || e.key === ' ') && QuizUI.dom.nextBtn && QuizUI.dom.nextBtn.classList.contains('open')) {
            e.preventDefault();
            QuizUI.dom.nextBtn.click();
        }
    });
    
    // Listen for furigana toggle changes from the main app
    document.addEventListener('furiganaToggleChanged', function() {
        refreshQuizDisplay();
    });
}

// ==================== SET DEFAULT SETTINGS ====================
function setDefaultSettings() {
    var d = QuizUI.dom;
    if (!d) return;
    
    var levelBtn = document.querySelector('.quiz-level-btn[data-level="n5"]');
    if (levelBtn) {
        d.levelBtns.forEach(function(b) { b.classList.remove('active'); });
        levelBtn.classList.add('active');
        QuizUI.settings.level = 'n5';
    }
    
    var typeBtn = document.querySelector('.quiz-type-btn[data-type="onyomi"]');
    if (typeBtn) {
        d.typeBtns.forEach(function(b) { b.classList.remove('active'); });
        typeBtn.classList.add('active');
        QuizUI.settings.quizType = 'onyomi';
    }
    
    if (d.countInput) {
        var val = parseInt(d.countInput.value);
        if (!isNaN(val) && val >= 10) {
            QuizUI.settings.count = val;
        } else {
            QuizUI.settings.count = 20;
            d.countInput.value = 20;
        }
    }
}

// ==================== OPEN MODAL ====================
QuizUI.openModal = function() {
    console.log('🔓 QuizUI.openModal called');
    var d = QuizUI.dom;
    
    if (!d || !d.overlay) {
        console.error('❌ QuizUI.dom or overlay not initialized!');
        return;
    }
    
    QuizUI.isOpen = true;
    d.overlay.classList.add('open');
    d.settingsArea.style.display = 'block';
    d.playArea.classList.remove('open');
    d.resultsArea.classList.remove('open');
    d.reviewArea.style.display = 'none';
    document.body.style.overflow = 'hidden';
    
    if (d.countdownOverlay) {
        d.countdownOverlay.classList.remove('open');
    }
    
    console.log('✅ Quiz modal opened');
};

// ==================== CLOSE MODAL ====================
QuizUI.closeModal = function() {
    console.log('🔒 QuizUI.closeModal called');
    var d = QuizUI.dom;
    
    if (!d || !d.overlay) {
        console.error('❌ QuizUI.dom or overlay not initialized!');
        return;
    }
    
    QuizUI.isOpen = false;
    QuizUI.isPlaying = false;
    QuizUI.isReviewMode = false;
    d.overlay.classList.remove('open');
    
    if (d.countdownOverlay) {
        d.countdownOverlay.classList.remove('open');
    }
    
    document.body.style.overflow = '';
    
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    
    if (QuizUI.quiz) {
        if (typeof QuizUI.quiz.cleanup === 'function') {
            QuizUI.quiz.cleanup();
        }
        QuizUI.quiz = null;
    }
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerSeconds = 0;
    }
    
    console.log('✅ Quiz modal closed');
};

// ==================== OPEN/CLOSE WRAPPERS ====================
function openQuizModal() { QuizUI.openModal(); }
function closeQuizModal() { QuizUI.closeModal(); }

// ==================== START QUIZ FROM SETTINGS ====================
function startQuizFromSettings() {
    var d = QuizUI.dom;
    var settings = QuizUI.settings;
    
    if (d.countInput) {
        var val = parseInt(d.countInput.value);
        if (!isNaN(val) && val >= 10) {
            settings.count = val;
        } else {
            settings.count = 20;
            d.countInput.value = 20;
        }
    }
    
    console.log('🚀 Starting quiz with settings:', settings);
    
    var availableKanji = getAvailableKanji(settings.level, settings.includeMastered, settings.quizType);
    if (availableKanji.length === 0) {
        alert('No kanji available for this quiz type. Try a different level or include mastered kanji.');
        return;
    }
    
    if (availableKanji.length < settings.count) {
        settings.count = availableKanji.length;
        if (d.countInput) {
            d.countInput.value = settings.count;
        }
        alert('Only ' + availableKanji.length + ' kanji available. Using all available.');
    }
    
    d.settingsArea.style.display = 'none';
    showCountdown(settings);
}

// ==================== GET AVAILABLE KANJI ====================
function getAvailableKanji(level, includeMastered, quizType) {
    var allData = getDataForLevel(level);
    if (!allData || allData.length === 0) return [];
    
    var masteryTypeMap = {
        'onyomi': 'onyomi',
        'kunyomi': 'kunyomi',
        'meaning': 'meaning'
    };
    var masteryType = masteryTypeMap[quizType] || 'onyomi';
    
    if (!includeMastered) {
        var mastery = getMasteryData();
        var levelMastery = mastery[level] || {};
        
        var data = allData.filter(function(d) {
            var kanjiMastery = levelMastery[d.kanji];
            if (!kanjiMastery) return true;
            var typeData = kanjiMastery[masteryType];
            return !(typeData && typeData.mastered === true);
        });
        return shuffleArray(data);
    } else {
        return shuffleArray(allData.slice());
    }
}

function shuffleArray(array) {
    var shuffled = array.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    return shuffled;
}

// ==================== COUNTDOWN ====================
function showCountdown(settings) {
    var d = QuizUI.dom;
    var levelNames = { 'n5': 'N5', 'n4': 'N4', 'n3': 'N3', 'all': 'All Levels' };
    var typeLabels = {
        'onyomi': 'On\'yomi',
        'kunyomi': 'Kun\'yomi',
        'meaning': 'Meaning'
    };
    
    d.countdownInfo.textContent = (levelNames[settings.level] || 'N5') + ' · ' + settings.count + ' questions · ' + (typeLabels[settings.quizType] || 'On\'yomi');
    d.countdownOverlay.classList.add('open');
    
    var count = 3;
    d.countdownNumber.textContent = count;
    d.countdownLabel.textContent = 'Get Ready!';
    
    function doCountdown() {
        if (count > 1) {
            count--;
            d.countdownNumber.textContent = count;
            d.countdownNumber.style.animation = 'none';
            setTimeout(function() { d.countdownNumber.style.animation = 'countdownPulse 0.8s ease-out'; }, 10);
            setTimeout(doCountdown, 800);
        } else {
            d.countdownNumber.textContent = 'Start!';
            d.countdownLabel.textContent = 'GO!';
            d.countdownNumber.style.animation = 'none';
            setTimeout(function() { d.countdownNumber.style.animation = 'countdownPulse 0.8s ease-out'; }, 10);
            setTimeout(function() {
                d.countdownOverlay.classList.remove('open');
                startQuiz(settings);
            }, 800);
        }
    }
    setTimeout(doCountdown, 800);
}

// ==================== START QUIZ ====================
function startQuiz(settings) {
    var d = QuizUI.dom;
    
    if (typeof QuizCore !== 'undefined') {
        QuizUI.quiz = new QuizCore(settings);
        QuizUI.quiz.start();
    } else {
        console.error('QuizCore not loaded!');
        return;
    }
    
    d.playArea.classList.add('open');
    QuizUI.isPlaying = true;
    renderQuestion(QuizUI.quiz.getCurrentQuestion());
}

// ==================== RENDER QUESTION ====================
function renderQuestion(question) {
    var d = QuizUI.dom;
    if (!question) { showQuizResults(); return; }
    
    var total = QuizUI.quiz.getTotalQuestions();
    var current = QuizUI.quiz.getCurrentIndex() + 1;
    var correct = QuizUI.quiz.getCorrectCount();
    var wrong = QuizUI.quiz.getWrongCount();
    
    d.headerLevel.textContent = QuizUI.settings.level.toUpperCase();
    d.headerProgress.textContent = 'Question ' + current + '/' + total;
    d.headerCorrect.innerHTML = '✅ <span>' + correct + '</span>';
    d.headerWrong.innerHTML = '❌ <span>' + wrong + '</span>';
    
    updateTimer();
    
    var typeLabel = question.typeLabel || 'Select the correct answer';
    d.questionPrompt.textContent = typeLabel + ':';
    
    renderSentence(question);
    renderOptions(question);
    
    d.feedback.classList.remove('open');
    d.nextBtn.classList.remove('open');
    d.hintBtn.disabled = false;
    d.ttsBtn.disabled = false;
    d.skipBtn.disabled = false;
    
    document.querySelectorAll('.quiz-option-btn').forEach(function(btn) {
        btn.classList.remove('selected', 'correct', 'wrong', 'disabled', 'show-correct');
    });
}

// ==================== RENDER SENTENCE ====================
function renderSentence(question) {
    var d = QuizUI.dom;
    var sentence = d.sentence;
    
    console.log('📝 Rendering sentence for:', question.targetKanji, 'type:', question.readingType, 'reading:', question.readingValue);
    
    // Show the prompt (kanji) at the top
    var promptDisplay = '<div style="font-size:48px;font-weight:700;color:#8B0000;margin-bottom:8px;">' + question.prompt + '</div>';
    
    // Check if we have sentence data specific to this reading type
    if (question.sentenceData && question.sentenceData.displayHtml) {
        // Display the correct example for this reading type - NO LABEL
        console.log('✅ Displaying', question.readingType, 'example for:', question.targetKanji);
        console.log('   Sentence:', question.sentenceData.sentence);
        console.log('   Display HTML:', question.sentenceData.displayHtml.substring(0, 100) + '...');
        
        // Get the display HTML
        var displayHtml = question.sentenceData.displayHtml;
        
        // If furigana is hidden globally, strip the ruby tags
        if (typeof furiganaHidden !== 'undefined' && furiganaHidden === true) {
            // Remove ruby tags and keep only the text content
            displayHtml = displayHtml.replace(/<ruby>(.*?)<rt>.*?<\/rt>(.*?)<\/ruby>/g, '$1$2');
            // Clean up any remaining rt tags
            displayHtml = displayHtml.replace(/<rt>.*?<\/rt>/g, '');
            // Remove empty ruby tags
            displayHtml = displayHtml.replace(/<ruby><\/ruby>/g, '');
        }
        
        // Just show the sentence without any label
        var sentenceDisplay = '<div style="font-size:18px;font-weight:600;color:#000000;padding:8px 12px;background:#ffffff;border-radius:8px;border:1px solid #e0e0e0;margin-top:4px;">' + 
            displayHtml + '</div>';
        sentence.innerHTML = promptDisplay + sentenceDisplay;
        return;
    }
    
    // Fallback: If no sentence data, just show the prompt
    console.warn('⚠️ No sentence data for:', question.targetKanji, question.readingType, question.readingValue);
    sentence.innerHTML = promptDisplay;
}

// ==================== RENDER OPTIONS ====================
function renderOptions(question) {
    var d = QuizUI.dom;
    var container = d.optionsContainer;
    var options = question.options || [];
    var letters = ['①', '②', '③', '④'];
    var html = '';
    
    options.forEach(function(opt, idx) {
        html += '<button class="quiz-option-btn" data-index="' + idx + '" data-value="' + opt + '">' +
            '<span class="option-letter">' + letters[idx] + '</span>' +
            '<span class="option-kanji">' + opt + '</span>' +
        '</button>';
    });
    
    container.innerHTML = html;
    container.querySelectorAll('.quiz-option-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { onOptionClick(this, question); });
    });
}

// ==================== ON OPTION CLICK ====================
function onOptionClick(btn, question) {
    if (btn.classList.contains('disabled')) return;
    
    var selectedValue = btn.dataset.value;
    var isCorrect = selectedValue === question.correctAnswer;
    
    document.querySelectorAll('.quiz-option-btn').forEach(function(b) { b.classList.add('disabled'); });
    btn.classList.add('selected');
    
    if (isCorrect) {
        btn.classList.add('correct');
        QuizUI.quiz.recordCorrect();
        if (QuizUI.settings.soundEffects) playSound('correct');
    } else {
        btn.classList.add('wrong');
        QuizUI.quiz.recordWrong();
        if (QuizUI.settings.soundEffects) playSound('wrong');
        document.querySelectorAll('.quiz-option-btn').forEach(function(b) {
            if (b.dataset.value === question.correctAnswer) b.classList.add('show-correct');
        });
    }
    
    showFeedback(question, isCorrect);
    
    var d = QuizUI.dom;
    d.headerCorrect.innerHTML = '✅ <span>' + QuizUI.quiz.getCorrectCount() + '</span>';
    d.headerWrong.innerHTML = '❌ <span>' + QuizUI.quiz.getWrongCount() + '</span>';
    d.nextBtn.classList.add('open');
}

function showFeedback(question, isCorrect) {
    var d = QuizUI.dom;
    d.feedbackResult.innerHTML = isCorrect ? '<span class="correct-text">✅ Correct!</span>' : '<span class="wrong-text">❌ Wrong!</span>';
    d.feedbackAnswer.innerHTML = isCorrect ? '' : 'The correct answer was: <span class="highlight-answer">' + question.correctAnswer + '</span>';
    
    renderKanjiInfo(question);
    d.feedback.classList.add('open');
}

// ==================== RENDER KANJI INFO ====================
function renderKanjiInfo(question) {
    var d = QuizUI.dom;
    var container = d.kanjiInfo;
    var allData = getDataForLevel('all');
    var kanjiData = null;
    
    for (var i = 0; i < allData.length; i++) {
        if (allData[i].kanji === question.targetKanji) { kanjiData = allData[i]; break; }
    }
    
    if (!kanjiData) { container.innerHTML = ''; return; }
    
    // Build the info display with Kanji : Meaning format
    var html = '<div class="quiz-kanji-info">';
    
    // Show Kanji with its meaning inline: "金 : gold" with different styles
    html += '<div style="font-size:20px;font-weight:700;color:#8B0000;margin-bottom:8px;">';
    html += kanjiData.kanji;
    html += ' <span style="font-weight:400;color:#333333;">: ' + kanjiData.meaning + '</span>';
    html += '</div>';
    
    // Show readings in a compact table
    html += '<div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:14px;font-weight:600;color:#000000;margin-bottom:8px;">';
    
    if (kanjiData.onyomi) {
        html += '<span style="font-weight:700;">Onyomi:</span>';
        html += '<span>' + kanjiData.onyomi + '</span>';
    }
    
    if (kanjiData.kunyomi) {
        html += '<span style="font-weight:700;">Kunyomi:</span>';
        html += '<span>' + kanjiData.kunyomi + '</span>';
    }
    
    html += '</div>';
    
    // Show the specific example used
    if (question.sentenceData && question.sentenceData.sentence) {
        // Get the display HTML
        var displayHtml = question.sentenceData.displayHtml || question.sentenceData.sentence;
        
        // If furigana is hidden globally, strip the ruby tags
        if (typeof furiganaHidden !== 'undefined' && furiganaHidden === true) {
            displayHtml = displayHtml.replace(/<ruby>(.*?)<rt>.*?<\/rt>(.*?)<\/ruby>/g, '$1$2');
            displayHtml = displayHtml.replace(/<rt>.*?<\/rt>/g, '');
            displayHtml = displayHtml.replace(/<ruby><\/ruby>/g, '');
        }
        
        html += '<div style="font-size:15px;font-weight:600;color:#000000;padding:8px 12px;background:#ffffff;border-radius:6px;">';
        html += displayHtml;
        if (question.sentenceData.english) {
            html += '<br><span style="font-weight:600;color:#000000;opacity:0.7;">→ ' + question.sentenceData.english + '</span>';
        }
        html += '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// ==================== REFRESH QUIZ ON FURIGANA TOGGLE ====================
function refreshQuizDisplay() {
    if (QuizUI.isPlaying && QuizUI.quiz) {
        var currentQuestion = QuizUI.quiz.getCurrentQuestion();
        if (currentQuestion) {
            renderSentence(currentQuestion);
            // Also update kanji info if feedback is open
            var feedback = document.getElementById('quizFeedback');
            if (feedback && feedback.classList.contains('open')) {
                renderKanjiInfo(currentQuestion);
            }
        }
    }
}

// ==================== ON NEXT QUESTION ====================
function onNextQuestion() {
    var d = QuizUI.dom;
    d.feedback.classList.remove('open');
    d.nextBtn.classList.remove('open');
    var nextQuestion = QuizUI.quiz.nextQuestion();
    if (nextQuestion) { renderQuestion(nextQuestion); } else { showQuizResults(); }
}

// ==================== CONTROL HANDLERS ====================
function onHintClick() {
    var question = QuizUI.quiz.getCurrentQuestion();
    if (!question) return;
    alert('💡 Hint: The answer is ' + question.correctAnswer.length + ' characters long.');
}

function onTtsClick() {
    var question = QuizUI.quiz.getCurrentQuestion();
    if (!question) return;
    var text = question.correctAnswer;
    if (question.sentenceData && question.sentenceData.readingText) {
        text = question.sentenceData.readingText;
    } else if (question.example && question.example.reading) {
        text = question.example.reading;
    } else if (question.example && question.example.sentence) {
        text = question.example.sentence;
    }
    speakText(text);
}

function onSkipQuestion() {
    var d = QuizUI.dom;
    QuizUI.quiz.recordWrong();
    d.headerWrong.innerHTML = '❌ <span>' + QuizUI.quiz.getWrongCount();
    var question = QuizUI.quiz.getCurrentQuestion();
    document.querySelectorAll('.quiz-option-btn').forEach(function(btn) {
        btn.classList.add('disabled');
        if (btn.dataset.value === question.correctAnswer) btn.classList.add('show-correct');
    });
    showFeedback(question, false);
    d.feedbackResult.innerHTML = '<span class="wrong-text">⏭️ Skipped</span>';
    d.feedbackAnswer.innerHTML = 'The correct answer was: <span class="highlight-answer">' + question.correctAnswer + '</span>';
    d.nextBtn.classList.add('open');
}

// ==================== TIMER ====================
var timerInterval = null;
var timerSeconds = 0;

function updateTimer() {
    var d = QuizUI.dom;
    if (!timerInterval) {
        timerSeconds = 0;
        timerInterval = setInterval(function() {
            timerSeconds++;
            var mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
            var secs = String(timerSeconds % 60).padStart(2, '0');
            d.headerTimer.textContent = '⏱️ ' + mins + ':' + secs;
        }, 1000);
    }
}

function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

// ==================== SHOW QUIZ RESULTS ====================
function showQuizResults() {
    var d = QuizUI.dom;
    QuizUI.isPlaying = false;
    stopTimer();
    d.playArea.classList.remove('open');
    d.resultsArea.classList.add('open');
    
    var results = QuizUI.quiz.getResults();
    var total = results.total;
    var correct = results.correct;
    var wrong = results.wrong;
    var score = Math.round((correct / total) * 100);
    
    var scoreMessage = '';
    if (score === 100) {
        scoreMessage = '🎉 Perfect Score! Amazing job!';
    } else if (score >= 80) {
        scoreMessage = '🌟 Excellent!';
    } else if (score >= 60) {
        scoreMessage = '📚 Good job! Keep practicing!';
    } else {
        scoreMessage = '💪 Keep practicing! You\'ll get there!';
    }
    
    d.resultsScore.innerHTML = '<div class="quiz-results-score">' + correct + '/' + total + '<span class="score-percent">(' + score + '%)</span></div><div class="score-label">' + scoreMessage + '</div>';
    
    var mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    var secs = String(timerSeconds % 60).padStart(2, '0');
    d.resultsTime.textContent = '⏱️ Time: ' + mins + ':' + secs;
    
    renderBreakdown(results.breakdown);
    renderWeakAreas(results.breakdown);
    
    if (wrong > 0) {
        d.reviewWrongBtn.style.display = 'block';
        d.reviewWrongBtn.textContent = '📝 Review Wrong Answers (' + wrong + ' questions)';
    } else {
        d.reviewWrongBtn.style.display = 'none';
    }
}

function renderBreakdown(breakdown) {
    var d = QuizUI.dom;
    var container = d.breakdownContainer;
    var html = '';
    
    for (var type in breakdown) {
        var data = breakdown[type];
        var total = data.correct + data.wrong;
        if (total === 0) continue;
        var score = Math.round((data.correct / total) * 100);
        var label = data.label || type;
        var barClass = 'good';
        if (score < 40) barClass = 'weak';
        else if (score < 70) barClass = 'ok';
        html += '<div class="quiz-breakdown-item"><span class="bar-label">' + label + '</span><div class="bar-track"><div class="bar-fill ' + barClass + '" style="width:' + score + '%"></div></div><span class="bar-score">' + data.correct + '/' + total + ' (' + score + '%)</span></div>';
    }
    container.innerHTML = html || '<p style="font-weight:600;color:#000000;">No data available.</p>';
}

function renderWeakAreas(breakdown) {
    var d = QuizUI.dom;
    var container = d.weakContainer;
    
    var sorted = [];
    for (var type in breakdown) {
        var data = breakdown[type];
        var total = data.correct + data.wrong;
        if (total > 0) {
            var score = data.correct / total;
            sorted.push({ type: type, data: data, score: score, label: data.label || type });
        }
    }
    sorted.sort(function(a, b) { return a.score - b.score; });
    
    var allPerfect = true;
    for (var i = 0; i < sorted.length; i++) {
        if (sorted[i].score < 1) {
            allPerfect = false;
            break;
        }
    }
    
    if (sorted.length === 0 || allPerfect) {
        container.innerHTML = '<div style="font-size:15px;font-weight:700;color:#2e7d32;padding:8px 0;">🎉 All areas mastered! No weak spots to report!</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < sorted.length; i++) {
        var item = sorted[i];
        var total = item.data.correct + item.data.wrong;
        var score = Math.round((item.data.correct / total) * 100);
        var icon = score < 40 ? '🔴' : score < 70 ? '🟡' : '🟢';
        html += '<div class="quiz-weak-item"><span class="weak-icon">' + icon + '</span><span>' + item.label + ': ' + score + '% (' + item.data.correct + '/' + total + ')</span></div>';
    }
    container.innerHTML = html;
}

// ==================== REVIEW MODE ====================
function startReviewMode() {
    var d = QuizUI.dom;
    var wrongAnswers = QuizUI.quiz.getWrongQuestions();
    if (wrongAnswers.length === 0) { alert('No wrong answers to review! 🎉'); return; }
    
    QuizUI.isReviewMode = true;
    QuizUI.reviewQuestions = wrongAnswers;
    QuizUI.reviewIndex = 0;
    QuizUI.reviewCorrect = 0;
    QuizUI.reviewWrong = 0;
    QuizUI.reviewWeakList = [];
    
    d.resultsArea.classList.remove('open');
    d.reviewArea.style.display = 'block';
    
    d.reviewComplete.style.display = 'none';
    d.reviewNextBtn.style.display = 'block';
    d.reviewNextBtn.textContent = 'Next →';
    d.reviewNextBtn.disabled = true;
    
    renderReviewQuestion();
}

function renderReviewQuestion() {
    var d = QuizUI.dom;
    var questions = QuizUI.reviewQuestions;
    var index = QuizUI.reviewIndex;
    
    if (index >= questions.length) { 
        showReviewComplete(); 
        return; 
    }
    
    var question = questions[index];
    var total = questions.length;
    
    d.reviewHeader.textContent = '📝 Review ' + (index + 1) + '/' + total + ' (Previously wrong)';
    d.reviewProgress.textContent = 'Progress: ' + (index + 1) + '/' + total + ' reviewed';
    d.reviewProgressBar.style.width = ((index / total) * 100) + '%';
    
    var typeLabel = question.typeLabel || 'Question';
    d.reviewQuestion.innerHTML = '<div style="font-size:16px;font-weight:700;color:#000000;margin-bottom:8px;">' + typeLabel + ':</div><div style="font-size:20px;font-weight:700;color:#000000;">' + question.prompt + '</div>';
    
    if (question.sentenceData && question.sentenceData.displayHtml) {
        var displayHtml = question.sentenceData.displayHtml;
        
        // If furigana is hidden globally, strip the ruby tags
        if (typeof furiganaHidden !== 'undefined' && furiganaHidden === true) {
            displayHtml = displayHtml.replace(/<ruby>(.*?)<rt>.*?<\/rt>(.*?)<\/ruby>/g, '$1$2');
            displayHtml = displayHtml.replace(/<rt>.*?<\/rt>/g, '');
            displayHtml = displayHtml.replace(/<ruby><\/ruby>/g, '');
        }
        
        d.reviewQuestion.innerHTML += '<div style="font-size:14px;font-weight:600;color:#000000;margin-top:6px;padding:6px 10px;background:#f8f9fa;border-radius:6px;">' + displayHtml + '</div>';
    }
    
    var options = question.options || [];
    var letters = ['①', '②', '③', '④'];
    var html = '';
    options.forEach(function(opt, idx) {
        html += '<button class="quiz-option-btn" data-index="' + idx + '" data-value="' + opt + '"><span class="option-letter">' + letters[idx] + '</span><span class="option-kanji">' + opt + '</span></button>';
    });
    d.reviewOptions.innerHTML = html;
    d.reviewFeedback.style.display = 'none';
    
    d.reviewNextBtn.style.display = 'block';
    d.reviewNextBtn.textContent = (index === questions.length - 1) ? 'Finish Review' : 'Next →';
    d.reviewNextBtn.disabled = true;
    
    d.reviewComplete.style.display = 'none';
    
    d.reviewOptions.querySelectorAll('.quiz-option-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { onReviewOptionClick(this, question); });
    });
}

function onReviewOptionClick(btn, question) {
    if (btn.classList.contains('disabled')) return;
    
    var selectedValue = btn.dataset.value;
    var isCorrect = selectedValue === question.correctAnswer;
    
    document.querySelectorAll('#quizReviewOptions .quiz-option-btn').forEach(function(b) { 
        b.classList.add('disabled'); 
    });
    
    if (isCorrect) { 
        btn.classList.add('correct'); 
        QuizUI.reviewCorrect++; 
    } else { 
        btn.classList.add('wrong'); 
        QuizUI.reviewWrong++; 
        QuizUI.reviewWeakList.push(question.targetKanji || question.correctAnswer);
        document.querySelectorAll('#quizReviewOptions .quiz-option-btn').forEach(function(b) {
            if (b.dataset.value === question.correctAnswer) {
                b.classList.add('show-correct');
            }
        });
    }
    
    var d = QuizUI.dom;
    d.reviewFeedback.style.display = 'block';
    d.reviewFeedback.innerHTML = isCorrect ? 
        '<span style="font-size:16px;font-weight:700;color:#2e7d32;">✅ Correct in review!</span>' : 
        '<span style="font-size:16px;font-weight:700;color:#c62828;">❌ Still wrong. Correct answer: ' + question.correctAnswer + '</span>';
    
    d.reviewNextBtn.disabled = false;
    
    var questions = QuizUI.reviewQuestions;
    var index = QuizUI.reviewIndex;
    if (index === questions.length - 1) {
        d.reviewNextBtn.textContent = 'Finish Review';
    }
}

function onReviewNext() {
    console.log('📝 Review Next clicked');
    QuizUI.reviewIndex++;
    renderReviewQuestion();
}

function showReviewComplete() {
    var d = QuizUI.dom;
    var total = QuizUI.reviewQuestions.length;
    var correct = QuizUI.reviewCorrect;
    var score = Math.round((correct / total) * 100);
    var originalScore = QuizUI.quiz.getResults().score;
    var improvement = score - originalScore;
    
    d.reviewNextBtn.style.display = 'none';
    
    d.reviewHeader.textContent = '📝 Review Complete!';
    d.reviewProgress.textContent = 'Complete! ' + total + '/' + total + ' reviewed';
    d.reviewProgressBar.style.width = '100%';
    d.reviewQuestion.innerHTML = '';
    d.reviewOptions.innerHTML = '';
    d.reviewFeedback.style.display = 'none';
    d.reviewComplete.style.display = 'block';
    
    d.reviewScore.innerHTML = 
        '<div style="font-size:24px;font-weight:700;color:#000000;">Review Score: ' + correct + '/' + total + ' (' + score + '%)</div>' +
        '<div style="font-size:18px;font-weight:600;color:#000000;margin-top:4px;">Original Score: ' + originalScore + '%</div>' +
        '<div style="font-size:16px;font-weight:600;color:#000000;margin-top:4px;">' + 
            (improvement >= 0 ? '📈 Improvement: +' + improvement + '%' : '📉 Slight drop: ' + improvement + '%') + 
        '</div>';
    
    if (QuizUI.reviewWeakList.length > 0) {
        var weakSet = {};
        for (var i = 0; i < QuizUI.reviewWeakList.length; i++) {
            weakSet[QuizUI.reviewWeakList[i]] = true;
        }
        var html = '<div style="font-size:15px;font-weight:700;color:#000000;margin-top:12px;">Still Weak:</div>';
        for (var kanji in weakSet) {
            html += '<div style="font-size:14px;font-weight:600;color:#000000;padding:2px 0;">❌ ' + kanji + '</div>';
        }
        d.reviewWeak.innerHTML = html;
        d.reviewPracticeBtn.style.display = 'block';
    } else {
        d.reviewWeak.innerHTML = '<div style="font-size:15px;font-weight:700;color:#2e7d32;">🎉 All reviewed correctly!</div>';
        d.reviewPracticeBtn.style.display = 'none';
    }
}

// ==================== RETRY QUIZ ====================
function retryQuiz() {
    console.log('🔄 Retry Quiz clicked');
    var d = QuizUI.dom;
    
    d.resultsArea.classList.remove('open');
    
    if (!QuizUI.quiz) {
        console.error('❌ No quiz to retry!');
        alert('No quiz to retry. Please start a new quiz.');
        return;
    }
    
    var success = QuizUI.quiz.retry();
    
    if (!success) {
        console.error('❌ Failed to retry quiz!');
        alert('Failed to retry quiz. Please start a new quiz.');
        return;
    }
    
    d.playArea.classList.add('open');
    QuizUI.isPlaying = true;
    renderQuestion(QuizUI.quiz.getCurrentQuestion());
    
    console.log('🔄 Retry Quiz started with same ' + QuizUI.quiz.getTotalQuestions() + ' questions (shuffled)');
}

// ==================== SOUND EFFECTS ====================
function playSound(type) {
    if (typeof playSoundEffect === 'function') {
        playSoundEffect(type);
    } else {
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            if (type === 'correct') { osc.frequency.value = 523; gain.gain.value = 0.15; }
            else if (type === 'wrong') { osc.frequency.value = 330; gain.gain.value = 0.15; }
            else { osc.frequency.value = 440; gain.gain.value = 0.1; }
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {}
    }
}

// ==================== EXPOSE GLOBALLY ====================
window.QuizUI = QuizUI;
window.initQuizUI = initQuizUI;
window.openQuizModal = openQuizModal;
window.closeQuizModal = closeQuizModal;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initQuizUI, 100);
    });
} else {
    setTimeout(initQuizUI, 100);
}

console.log('📝 Quiz UI loaded (V3.6 - Furigana Toggle Support)');