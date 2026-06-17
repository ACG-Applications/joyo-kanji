// ==================== JOYO KANJI CORE ====================
// Main application logic for Joyo Kanji Dictionary

// ==================== STATE ====================
let currentLevel = 'n5';
let currentData = [];
let furiganaHidden = false;
let ttsEnabled = true;
let selectedKanji = new Set();
let searchTerm = '';

// ==================== DOM REFS ====================
const dom = {
    grid: document.getElementById('kanjiGrid'),
    search: document.getElementById('searchInput'),
    resultCount: document.getElementById('resultCount'),
    selectedCount: document.getElementById('selectedCount'),
    selectAll: document.getElementById('selectAll'),
    printBtn: document.getElementById('printBtn'),
    clearSelection: document.getElementById('clearSelectionBtn'),
    furiganaToggle: document.getElementById('furiganaToggle'),
    ttsToggle: document.getElementById('ttsToggle'),
    modal: document.getElementById('detailModal'),
    detailContent: document.getElementById('detailContent'),
    modalClose: document.querySelector('.modal-close'),
    levelBtns: document.querySelectorAll('.level-btn')
};

// ==================== DATA LOADING ====================
function getDataForLevel(level) {
    switch(level) {
        case 'n5': 
            if (typeof joyoN5Data !== 'undefined' && joyoN5Data && joyoN5Data.length > 0) {
                return joyoN5Data;
            } else {
                console.warn('joyoN5Data not found or empty. Check that N5-Joyo.js is loaded correctly.');
                return [];
            }
        case 'n4': 
            if (typeof joyoN4Data !== 'undefined' && joyoN4Data && joyoN4Data.length > 0) {
                return joyoN4Data;
            } else {
                console.warn('joyoN4Data not found or empty. Check that N4-Joyo.js is loaded correctly.');
                return [];
            }
        case 'n3': 
            if (typeof joyoN3Data !== 'undefined' && joyoN3Data && joyoN3Data.length > 0) {
                return joyoN3Data;
            } else {
                console.warn('joyoN3Data not found or empty. Check that N3-Joyo.js is loaded correctly.');
                return [];
            }
        case 'all': 
            return [
                ...(typeof joyoN5Data !== 'undefined' && joyoN5Data ? joyoN5Data : []),
                ...(typeof joyoN4Data !== 'undefined' && joyoN4Data ? joyoN4Data : []),
                ...(typeof joyoN3Data !== 'undefined' && joyoN3Data ? joyoN3Data : [])
            ];
        default: 
            console.warn('Unknown level:', level);
            return [];
    }
}

function getKanjiData(kanjiList) {
    const allData = getDataForLevel('all');
    return allData.filter(d => kanjiList.includes(d.kanji));
}

// ==================== SVG HELPERS ====================
function getSvgPath(unicode) {
    const padded = unicode.padStart(5, '0').toUpperCase();
    const clean = unicode.replace(/^0+/, '').toUpperCase();
    
    // Try both with and without leading zeros
    const paths = [
        `images/kanji-strokes/${padded}.svg`,
        `images/kanji-strokes/${clean}.svg`,
        `./images/kanji-strokes/${padded}.svg`,
        `./images/kanji-strokes/${clean}.svg`
    ];
    
    // For GitHub Pages, try with repo name
    if (window.location.hostname.includes('github.io')) {
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 1 && pathParts[1]) {
            const repo = pathParts[1];
            paths.unshift(`/${repo}/images/kanji-strokes/${padded}.svg`);
            paths.unshift(`/${repo}/images/kanji-strokes/${clean}.svg`);
        }
    }
    
    return paths;
}

// ==================== LOAD SVG WITH MULTIPLE ATTEMPTS ====================
function loadSvg(unicode, kanji, container) {
    const paths = getSvgPath(unicode);
    let attemptIndex = 0;
    
    function tryNextPath() {
        if (attemptIndex >= paths.length) {
            // All paths failed, show the kanji as fallback
            container.innerHTML = `<span class="fallback-char" style="font-size:24px;color:#999;">${kanji}</span>`;
            return;
        }
        
        const path = paths[attemptIndex++];
        const img = document.createElement('img');
        img.src = path;
        img.alt = `Stroke order for ${kanji}`;
        img.loading = 'lazy';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        
        img.onload = function() {
            container.innerHTML = '';
            container.appendChild(img);
            console.log(`✅ Loaded SVG for ${kanji}: ${path}`);
        };
        
        img.onerror = function() {
            console.log(`❌ Failed to load SVG for ${kanji}: ${path}`);
            tryNextPath();
        };
        
        container.innerHTML = '';
        container.appendChild(img);
    }
    
    tryNextPath();
}

// ==================== STICKY TOOLBAR ====================
function updateStickyToolbar() {
    const header = document.querySelector('.app-header');
    const toolbar = document.querySelector('.selection-toolbar');
    if (header && toolbar) {
        const headerHeight = header.offsetHeight;
        toolbar.style.top = headerHeight + 'px';
    }
}
window.addEventListener('resize', updateStickyToolbar);

// ==================== FURIGANA WRAPPER ====================
function wrapFurigana(text) {
    if (!text) return '';
    return text.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)（([^（）]+)）/g, (_, kanji, furigana) => {
        return `<ruby>${kanji}<rt>${furigana}</rt></ruby>`;
    });
}

// ==================== TTS ====================
function speakText(text) {
    if (!ttsEnabled || !text) return;
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.85;
        utterance.pitch = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
}

// ==================== SELECTION UI ====================
function updateSelectionUI() {
    const count = selectedKanji.size;
    dom.selectedCount.textContent = `${count} selected`;
    dom.printBtn.disabled = count === 0;
    dom.selectAll.checked = count > 0 && count === currentData.length;
}

// ==================== RENDERING ====================
function renderGrid() {
    const data = getDataForLevel(currentLevel);
    const filtered = data.filter(d => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return d.kanji.includes(term) ||
               d.meaning.toLowerCase().includes(term) ||
               d.onyomi.toLowerCase().includes(term) ||
               (d.kunyomi && d.kunyomi.toLowerCase().includes(term)) ||
               (d.example && d.example.sentence && d.example.sentence.includes(term));
    });

    currentData = filtered;
    dom.resultCount.textContent = `${filtered.length} kanji`;

    if (filtered.length === 0) {
        dom.grid.innerHTML = `
            <div class="no-results">
                <h3>🔍 No kanji found</h3>
                <p>Try adjusting your search or selecting a different level.</p>
            </div>
        `;
        updateStickyToolbar();
        return;
    }

    let html = '';
    filtered.forEach(d => {
        const isSelected = selectedKanji.has(d.kanji);
        const levelClass = d.level || 'n3';
        const containerId = `svg-${d.unicode}-${Math.random().toString(36).substr(2, 5)}`;
        
        html += `
            <div class="kanji-card ${isSelected ? 'selected' : ''}" data-kanji="${d.kanji}">
                <input type="checkbox" class="select-checkbox" data-kanji="${d.kanji}" ${isSelected ? 'checked' : ''}>
                <div class="kanji-char">${d.kanji}</div>
                ${d.onyomi ? `<div class="kanji-readings">${d.onyomi}</div>` : ''}
                <div class="kanji-meaning">${d.meaning}</div>
                <div class="stroke-svg" id="${containerId}" data-unicode="${d.unicode}">
                    <!-- SVG will be loaded here -->
                </div>
                <span class="level-badge ${levelClass}">${levelClass.toUpperCase()}</span>
            </div>
        `;
    });
    dom.grid.innerHTML = html;

    // Load SVGs for each card
    filtered.forEach(d => {
        const containerId = `svg-${d.unicode}-${Math.random().toString(36).substr(2, 5)}`;
        // Find the container by looking for the data-unicode attribute
        const container = document.querySelector(`.stroke-svg[data-unicode="${d.unicode}"]`);
        if (container) {
            loadSvg(d.unicode, d.kanji, container);
        }
    });

    document.querySelectorAll('.kanji-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.select-checkbox')) return;
            const kanji = card.dataset.kanji;
            showDetail(kanji);
        });
    });
    document.querySelectorAll('.select-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            e.stopPropagation();
            const kanji = cb.dataset.kanji;
            if (cb.checked) {
                selectedKanji.add(kanji);
            } else {
                selectedKanji.delete(kanji);
            }
            updateSelectionUI();
            renderGrid();
        });
    });
    updateStickyToolbar();
}

// ==================== SPLIT READINGS INTO INDIVIDUAL ITEMS ====================
function splitReadingsIntoItems(readingsString, isOnyomi) {
    if (!readingsString) return [];
    const items = readingsString.split(/[、・，,\s]+/).filter(s => s.trim().length > 0);
    return items.map(item => ({
        text: item.trim(),
        isOnyomi: isOnyomi
    }));
}

// ==================== BUILD READING HTML WITH CLICKABLE ITEMS ====================
function buildReadingHTML(readingsString, isOnyomi) {
    if (!readingsString) return '';
    const items = splitReadingsIntoItems(readingsString, isOnyomi);
    if (items.length === 0) return '';
    
    const className = isOnyomi ? 'onyomi-item' : 'kunyomi-item';
    const label = isOnyomi ? '音' : '訓';
    const labelRomaji = isOnyomi ? "On'yomi" : "Kun'yomi";
    
    let itemsHTML = items.map(item => {
        return `<span class="reading-item ${className}" data-reading="${item.text}" data-is-onyomi="${isOnyomi}">
            ${item.text}
            <span class="tts-tooltip">🔊 Click to hear</span>
        </span>`;
    }).join('');
    
    return `
        <div class="reading-row">
            <span class="reading-label"><ruby>${label}<rt>${labelRomaji === "On'yomi" ? "おん" : "くん"}</rt></ruby> (${labelRomaji}):</span>
            <span class="${isOnyomi ? 'onyomi-text' : 'kunyomi-text'}">${itemsHTML}</span>
        </div>
    `;
}

// ==================== DETAIL VIEW ====================
let currentDetailKanji = null;

function showDetail(kanji) {
    currentDetailKanji = kanji;
    const allData = getDataForLevel('all');
    const d = allData.find(item => item.kanji === kanji);
    if (!d) {
        console.warn('Kanji not found:', kanji);
        return;
    }

    const levelClass = d.level || 'n3';
    const containerId = `detail-svg-${d.unicode}`;

    let readingsHtml = '';
    if (d.onyomi) {
        readingsHtml += buildReadingHTML(d.onyomi, true);
    }
    if (d.kunyomi) {
        readingsHtml += buildReadingHTML(d.kunyomi, false);
    }
    if (!readingsHtml) {
        readingsHtml = '<span style="color:#999;">No readings available</span>';
    }

    const sentenceHtml = d.example && d.example.sentence ? wrapFurigana(d.example.sentence) : 'No example available';
    const translationText = d.example && d.example.english ? d.example.english : 'No translation available';
    const readingText = d.example && d.example.reading ? d.example.reading : '';

    let html = `
        <div class="detail-header">
            <div class="detail-kanji">${d.kanji}</div>
            <div class="detail-stroke" id="${containerId}">
                <!-- SVG will be loaded here -->
            </div>
        </div>
        
        <div class="detail-readings ${furiganaHidden ? 'hide-furigana' : ''}">
            ${readingsHtml}
        </div>
        
        <div class="detail-meaning">${d.meaning}</div>
        
        <div class="detail-level-wrap">
            <span class="detail-level ${levelClass}">${levelClass.toUpperCase()}</span>
        </div>
        
        <div class="detail-example" data-reading="${readingText}">
            <div class="sentence ${furiganaHidden ? 'hide-furigana' : ''}">${sentenceHtml}</div>
            <div class="translation">→ ${translationText}</div>
            <span class="click-hint">💡 Click sentence to listen</span>
            <div class="detail-actions">
                <button class="btn-practice" data-kanji="${d.kanji}">📚 Add to Practice</button>
            </div>
        </div>
    `;

    dom.detailContent.innerHTML = html;
    dom.modal.classList.add('open');

    // Load the SVG
    const container = document.getElementById(containerId);
    if (container) {
        loadSvg(d.unicode, d.kanji, container);
    }

    if (ttsEnabled) {
        dom.detailContent.querySelectorAll('.reading-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const reading = item.dataset.reading;
                if (reading) {
                    speakText(reading);
                }
            });
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const reading = item.dataset.reading;
                    if (reading) {
                        speakText(reading);
                    }
                }
            });
        });
        
        const exampleContainer = dom.detailContent.querySelector('.detail-example');
        if (exampleContainer) {
            exampleContainer.addEventListener('click', (e) => {
                if (e.target.closest('.btn-practice')) return;
                const reading = exampleContainer.dataset.reading;
                if (reading) {
                    speakText(reading);
                }
            });
        }
    }

    const addBtn = dom.detailContent.querySelector('.btn-practice');
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const k = addBtn.dataset.kanji;
            selectedKanji.add(k);
            updateSelectionUI();
            renderGrid();
            dom.modal.classList.remove('open');
        });
    }
}

// ==================== DYNAMIC LEVEL COUNTS ====================
function updateLevelCounts() {
    const n5Count = typeof joyoN5Data !== 'undefined' && joyoN5Data ? joyoN5Data.length : 0;
    const n4Count = typeof joyoN4Data !== 'undefined' && joyoN4Data ? joyoN4Data.length : 0;
    const n3Count = typeof joyoN3Data !== 'undefined' && joyoN3Data ? joyoN3Data.length : 0;
    const allCount = n5Count + n4Count + n3Count;

    const n5Btn = document.querySelector('[data-level="n5"] .count');
    const n4Btn = document.querySelector('[data-level="n4"] .count');
    const n3Btn = document.querySelector('[data-level="n3"] .count');
    const allBtn = document.querySelector('[data-level="all"] .count');

    if (n5Btn) n5Btn.textContent = `(${n5Count})`;
    if (n4Btn) n4Btn.textContent = `(${n4Count})`;
    if (n3Btn) n3Btn.textContent = `(${n3Count})`;
    if (allBtn) allBtn.textContent = `(${allCount})`;

    console.log(`📊 Level counts updated: N5=${n5Count}, N4=${n4Count}, N3=${n3Count}, All=${allCount}`);
}

// ==================== PRINT ====================
function generatePrint() {
    if (selectedKanji.size === 0) {
        alert('Please select at least one kanji to print.');
        return;
    }
    const data = getKanjiData(Array.from(selectedKanji));
    if (data.length === 0) return;

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Kanji Practice Sheet</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', 'Hiragino Sans', 'Yu Gothic', system-ui, sans-serif; padding: 20px; }
        .print-header { text-align: center; padding: 20px 0 10px; border-bottom: 2px solid #333; margin-bottom: 20px; }
        .print-header h1 { font-size: 24px; font-weight: 700; }
        .print-header .subtitle { font-size: 14px; color: #666; }
        .print-header .date { font-size: 12px; color: #999; margin-top: 4px; }
        .print-entry { display: flex; align-items: stretch; border-bottom: 1px dashed #ccc; padding: 12px 0; page-break-inside: avoid; min-height: 140px; }
        .print-entry .print-kanji { font-size: 48px; font-weight: 700; width: 80px; min-width: 80px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid #e0e0e0; padding-right: 16px; }
        .print-entry .print-kanji .print-stroke { width: 30px; height: 30px; margin-top: 4px; }
        .print-entry .print-kanji .print-stroke img { width: 100%; height: 100%; object-fit: contain; }
        .print-entry .print-info { flex: 1; padding-left: 16px; display: flex; flex-direction: column; justify-content: center; }
        .print-entry .print-info .readings { font-size: 14px; font-weight: 600; color: #333; }
        .print-entry .print-info .readings .onyomi-print { color: #4CAF50; }
        .print-entry .print-info .readings .kunyomi-print { color: #2196F3; }
        .print-entry .print-info .meaning { font-size: 13px; font-weight: 500; color: #555; margin: 2px 0; }
        .print-entry .print-info .example { font-size: 14px; color: #333; margin: 2px 0; }
        .print-entry .print-info .example ruby rt { font-size: 10px; }
        .print-entry .print-info .example-en { font-size: 12px; color: #888; margin-left: 8px; }
        .print-entry .print-lines { margin-top: 6px; }
        .print-entry .print-lines div { border-bottom: 1px solid #999; height: 28px; margin: 1px 0; }
        .print-entry .print-lines .line-label { border-bottom: none; height: auto; font-size: 10px; color: #aaa; margin: 0; }
        @page { size: A4 portrait; margin: 15mm 18mm; }
        @media print { body { padding: 0 !important; } }
        @media (max-width: 768px) {
            .print-entry { flex-direction: column !important; padding: 8px 0 !important; }
            .print-entry .print-kanji { width: 100% !important; min-width: auto !important; border-right: none !important; border-bottom: 1px solid #e0e0e0; padding-right: 0 !important; padding-bottom: 8px !important; flex-direction: row !important; gap: 16px !important; font-size: 32px !important; }
            .print-entry .print-info { padding-left: 0 !important; padding-top: 8px !important; }
        }
    </style></head><body>
        <div class="print-header"><h1>📖 Kanji Practice Sheet</h1><div class="subtitle">Joyo Kanji · ${data.length} kanji selected</div><div class="date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
    `;

    data.forEach(d => {
        // For print, we need to get the actual SVG path
        const paths = getSvgPath(d.unicode);
        const primaryPath = paths[0] || `images/kanji-strokes/${d.unicode.padStart(5, '0').toUpperCase()}.svg`;
        const fallbackPath = paths[1] || `images/kanji-strokes/${d.unicode.replace(/^0+/, '').toUpperCase()}.svg`;
        
        html += `
            <div class="print-entry">
                <div class="print-kanji">
                    ${d.kanji}
                    <div class="print-stroke">
                        <img src="${primaryPath}" alt="Stroke order for ${d.kanji}" 
                             onerror="this.onerror=null; this.src='${fallbackPath}'; this.onerror=function(){this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size:20px;color:#ccc;\\'>${d.kanji}</span>';}">
                    </div>
                </div>
                <div class="print-info">
                    <div class="readings">
                        ${d.onyomi ? `<span class="onyomi-print">音: ${d.onyomi}</span>` : ''}
                        ${d.kunyomi ? `<span class="kunyomi-print">訓: ${d.kunyomi}</span>` : ''}
                    </div>
                    <div class="meaning">${d.meaning}</div>
                    <div class="example">
                        ${wrapFurigana(d.example && d.example.sentence ? d.example.sentence : '')}
                        <span class="example-en">→ ${d.example && d.example.english ? d.example.english : ''}</span>
                    </div>
                    <div class="print-lines">
                        <div class="line-label">✍️ Practice writing:</div>
                        <div></div><div></div><div></div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</body></html>`;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Please allow popups to print practice sheets.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
}

// ==================== EVENT LISTENERS ====================
dom.levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        dom.levelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLevel = btn.dataset.level;
        selectedKanji.clear();
        updateSelectionUI();
        renderGrid();
    });
});

dom.search.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderGrid();
});

dom.selectAll.addEventListener('change', (e) => {
    const checked = e.target.checked;
    const data = getDataForLevel(currentLevel);
    const filtered = data.filter(d => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return d.kanji.includes(term) ||
               d.meaning.toLowerCase().includes(term) ||
               d.onyomi.toLowerCase().includes(term) ||
               (d.kunyomi && d.kunyomi.toLowerCase().includes(term)) ||
               (d.example && d.example.sentence && d.example.sentence.includes(term));
    });
    filtered.forEach(d => {
        if (checked) selectedKanji.add(d.kanji);
        else selectedKanji.delete(d.kanji);
    });
    updateSelectionUI();
    renderGrid();
});

dom.clearSelection.addEventListener('click', () => {
    selectedKanji.clear();
    updateSelectionUI();
    renderGrid();
});

dom.printBtn.addEventListener('click', generatePrint);

// Furigana toggle
dom.furiganaToggle.addEventListener('click', () => {
    furiganaHidden = !furiganaHidden;
    dom.furiganaToggle.textContent = furiganaHidden ? '🔤 Furigana: Off' : '🔤 Furigana: On';
    dom.furiganaToggle.classList.toggle('active', furiganaHidden);
    renderGrid();
    if (dom.modal.classList.contains('open') && currentDetailKanji) {
        showDetail(currentDetailKanji);
    }
});

// TTS toggle
dom.ttsToggle.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    dom.ttsToggle.textContent = ttsEnabled ? '🔊 TTS: On' : '🔊 TTS: Off';
    dom.ttsToggle.classList.toggle('active', !ttsEnabled);
    if (dom.modal.classList.contains('open') && currentDetailKanji) {
        showDetail(currentDetailKanji);
    }
});

// Modal close
dom.modalClose.addEventListener('click', () => {
    dom.modal.classList.remove('open');
    currentDetailKanji = null;
});
dom.modal.addEventListener('click', (e) => {
    if (e.target === dom.modal) {
        dom.modal.classList.remove('open');
        currentDetailKanji = null;
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        dom.modal.classList.remove('open');
        currentDetailKanji = null;
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        dom.search.focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        if (selectedKanji.size > 0) {
            e.preventDefault();
            generatePrint();
        }
    }
});

// ==================== CHECK IF SVG FILES EXIST ====================
function checkSvgFiles() {
    console.log('🔍 Checking SVG files...');
    const testCases = [
        { unicode: '4E00', kanji: '一' },
        { unicode: '611B', kanji: '愛' },
        { unicode: '65B0', kanji: '新' }
    ];
    
    testCases.forEach(({ unicode, kanji }) => {
        const paths = getSvgPath(unicode);
        console.log(`Testing ${kanji} (${unicode}):`);
        paths.forEach(path => {
            const img = new Image();
            img.onload = function() {
                console.log(`  ✅ ${path} EXISTS`);
            };
            img.onerror = function() {
                console.log(`  ❌ ${path} NOT FOUND`);
            };
            img.src = path;
        });
    });
}

// ==================== INIT ====================
function init() {
    console.log('🔍 Joyo Kanji Dictionary initializing...');
    console.log('🌐 Host:', window.location.hostname);
    console.log('📁 Path:', window.location.pathname);
    console.log('📊 Data loaded:');
    console.log('  N5:', typeof joyoN5Data !== 'undefined' && joyoN5Data ? joyoN5Data.length : 'undefined');
    console.log('  N4:', typeof joyoN4Data !== 'undefined' && joyoN4Data ? joyoN4Data.length : 'undefined');
    console.log('  N3:', typeof joyoN3Data !== 'undefined' && joyoN3Data ? joyoN3Data.length : 'undefined');
    
    // Log a sample unicode to verify
    if (typeof joyoN3Data !== 'undefined' && joyoN3Data && joyoN3Data.length > 0) {
        const sample = joyoN3Data[0];
        console.log('📝 Sample:', sample.kanji, sample.unicode);
        const paths = getSvgPath(sample.unicode);
        console.log('📝 SVG paths to try:', paths);
    }
    
    currentLevel = 'n5';
    document.querySelector('[data-level="n5"]').classList.add('active');
    updateSelectionUI();
    renderGrid();
    updateLevelCounts();
    setTimeout(updateStickyToolbar, 100);
    
    // Check SVG files after a delay
    setTimeout(checkSvgFiles, 2000);
}

// ==================== START ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}