// ==================== QUIZ-SOUNDS.JS V1.0 ====================
// Complete Sound Effects using Web Audio API
// All sounds generated programmatically - no external files needed
// Lightweight, low-latency, works on all modern browsers

// ==================== SOUND MANAGER ====================
const SoundManager = {
    initialized: false,
    audioContext: null,
    masterGain: null,
    enabled: true,
    
    // Sound presets
    sounds: {
        correct: {
            type: 'melody',
            notes: [523.25, 659.25, 783.99], // C5, E5, G5 (C major triad)
            durations: [0.12, 0.12, 0.20],
            gain: 0.20
        },
        wrong: {
            type: 'tone',
            notes: [330.00, 293.66], // E4, D4 (descending minor)
            durations: [0.15, 0.25],
            gain: 0.18
        },
        countdown: {
            type: 'tone',
            notes: [440.00], // A4
            durations: [0.08],
            gain: 0.10
        },
        countdownStart: {
            type: 'tone',
            notes: [523.25, 659.25], // C5, E5 (ascending)
            durations: [0.10, 0.15],
            gain: 0.15
        },
        complete: {
            type: 'melody',
            notes: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6
            durations: [0.10, 0.10, 0.10, 0.30],
            gain: 0.18
        },
        click: {
            type: 'tone',
            notes: [800.00],
            durations: [0.04],
            gain: 0.06
        }
    }
};

// ==================== INITIALIZE AUDIO CONTEXT ====================
function initAudio() {
    if (SoundManager.initialized) return true;
    
    try {
        // Create audio context with fallback for older browsers
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            console.warn('Web Audio API not supported');
            SoundManager.enabled = false;
            return false;
        }
        
        SoundManager.audioContext = new AudioContext();
        SoundManager.masterGain = SoundManager.audioContext.createGain();
        SoundManager.masterGain.gain.value = 0.8;
        SoundManager.masterGain.connect(SoundManager.audioContext.destination);
        
        SoundManager.initialized = true;
        
        // Resume context if suspended (autoplay policy)
        if (SoundManager.audioContext.state === 'suspended') {
            SoundManager.audioContext.resume().catch(() => {
                // User interaction will resume it
            });
        }
        
        console.log('🔊 Sound Manager initialized');
        return true;
    } catch (e) {
        console.warn('Failed to initialize audio:', e);
        SoundManager.enabled = false;
        return false;
    }
}

// ==================== RESUME AUDIO CONTEXT ====================
function resumeAudioContext() {
    if (!SoundManager.initialized || !SoundManager.audioContext) {
        return initAudio();
    }
    
    if (SoundManager.audioContext.state === 'suspended') {
        SoundManager.audioContext.resume().catch(() => {
            // Will resume on next user interaction
        });
    }
    return SoundManager.audioContext.state === 'running';
}

// ==================== CREATE OSCILLATOR ====================
function createTone(frequency, duration, gainValue = 0.15, type = 'sine') {
    const ctx = SoundManager.audioContext;
    if (!ctx) return null;
    
    try {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + 0.005);
        gain.gain.linearRampToValueAtTime(gainValue * 0.5, ctx.currentTime + duration * 0.7);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
        
        oscillator.connect(gain);
        gain.connect(SoundManager.masterGain);
        
        return { oscillator, gain, duration };
    } catch (e) {
        return null;
    }
}

// ==================== PLAY SINGLE TONE ====================
function playTone(frequency, duration, gain = 0.15, type = 'sine') {
    if (!SoundManager.enabled) return;
    if (!resumeAudioContext()) return;
    
    const ctx = SoundManager.audioContext;
    if (!ctx) return;
    
    try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        // Smooth envelope
        const now = ctx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(gain, now + 0.005);
        gainNode.gain.linearRampToValueAtTime(gain * 0.3, now + duration * 0.6);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(SoundManager.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
        
        // Clean up
        setTimeout(() => {
            try {
                oscillator.disconnect();
                gainNode.disconnect();
            } catch (e) {}
        }, (duration + 0.1) * 1000);
        
    } catch (e) {
        // Silently fail
    }
}

// ==================== PLAY MELODY ====================
function playMelody(notes, durations, gain = 0.15, type = 'sine') {
    if (!SoundManager.enabled) return;
    if (!resumeAudioContext()) return;
    
    const ctx = SoundManager.audioContext;
    if (!ctx) return;
    
    try {
        let startTime = ctx.currentTime + 0.02;
        
        notes.forEach((freq, index) => {
            const duration = durations[index] || durations[0] || 0.12;
            
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.type = type;
            oscillator.frequency.value = freq;
            
            const endTime = startTime + duration;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.005);
            gainNode.gain.linearRampToValueAtTime(gain * 0.3, endTime - duration * 0.2);
            gainNode.gain.linearRampToValueAtTime(0, endTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(SoundManager.masterGain);
            
            oscillator.start(startTime);
            oscillator.stop(endTime + 0.02);
            
            // Clean up
            setTimeout(() => {
                try {
                    oscillator.disconnect();
                    gainNode.disconnect();
                } catch (e) {}
            }, (endTime - ctx.currentTime + 0.1) * 1000);
            
            startTime += duration + 0.015;
        });
    } catch (e) {
        // Silently fail
    }
}

// ==================== PLAY CHORD ====================
function playChord(frequencies, duration = 0.2, gain = 0.12, type = 'sine') {
    if (!SoundManager.enabled) return;
    if (!resumeAudioContext()) return;
    
    const ctx = SoundManager.audioContext;
    if (!ctx) return;
    
    try {
        const now = ctx.currentTime;
        const oscillators = [];
        const gainNodes = [];
        
        frequencies.forEach((freq) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.type = type;
            oscillator.frequency.value = freq;
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(gain, now + 0.01);
            gainNode.gain.linearRampToValueAtTime(gain * 0.5, now + duration * 0.6);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(SoundManager.masterGain);
            
            oscillator.start(now);
            oscillator.stop(now + duration + 0.02);
            
            oscillators.push(oscillator);
            gainNodes.push(gainNode);
        });
        
        // Clean up
        setTimeout(() => {
            try {
                oscillators.forEach(o => o.disconnect());
                gainNodes.forEach(g => g.disconnect());
            } catch (e) {}
        }, (duration + 0.1) * 1000);
        
    } catch (e) {
        // Silently fail
    }
}

// ==================== PUBLIC SOUND FUNCTIONS ====================

// Play correct answer sound - happy ascending C major triad
function playCorrectSound() {
    if (!SoundManager.enabled) return;
    const s = SoundManager.sounds.correct;
    playMelody(s.notes, s.durations, s.gain, 'sine');
    
    // Add a soft harmonic layer for richness
    setTimeout(() => {
        playChord(
            [s.notes[0] * 2, s.notes[1] * 2, s.notes[2] * 2],
            0.15,
            0.05,
            'sine'
        );
    }, 50);
}

// Play wrong answer sound - descending minor
function playWrongSound() {
    if (!SoundManager.enabled) return;
    const s = SoundManager.sounds.wrong;
    playMelody(s.notes, s.durations, s.gain, 'sawtooth');
}

// Play countdown tick
function playCountdownTick() {
    if (!SoundManager.enabled) return;
    const s = SoundManager.sounds.countdown;
    playTone(s.notes[0], s.durations[0], s.gain, 'sine');
}

// Play countdown start (GO!)
function playCountdownStart() {
    if (!SoundManager.enabled) return;
    const s = SoundManager.sounds.countdownStart;
    playMelody(s.notes, s.durations, s.gain, 'sine');
}

// Play quiz complete sound - happy ascending with flourish
function playCompleteSound() {
    if (!SoundManager.enabled) return;
    const s = SoundManager.sounds.complete;
    playMelody(s.notes, s.durations, s.gain, 'sine');
    
    // Add a soft arpeggio
    setTimeout(() => {
        playMelody(
            [s.notes[0] * 1.5, s.notes[1] * 1.5, s.notes[2] * 1.5, s.notes[3] * 1.5],
            [0.08, 0.08, 0.08, 0.15],
            0.04,
            'sine'
        );
    }, 200);
}

// Play click sound (for button presses)
function playClickSound() {
    if (!SoundManager.enabled) return;
    const s = SoundManager.sounds.click;
    playTone(s.notes[0], s.durations[0], s.gain, 'square');
}

// ==================== UNIVERSAL WRAPPER ====================
// This is the main exported function that quiz-core.js will call
function playSoundEffect(type) {
    // Initialize on first call if not already
    if (!SoundManager.initialized) {
        initAudio();
    }
    
    // Resume context if needed
    resumeAudioContext();
    
    // Play the appropriate sound
    switch (type) {
        case 'correct':
            playCorrectSound();
            break;
        case 'wrong':
            playWrongSound();
            break;
        case 'countdown':
            playCountdownTick();
            break;
        case 'countdownStart':
            playCountdownStart();
            break;
        case 'complete':
            playCompleteSound();
            break;
        case 'click':
            playClickSound();
            break;
        default:
            // Try to play as tone with custom params
            if (typeof type === 'object' && type.frequency) {
                playTone(type.frequency, type.duration || 0.1, type.gain || 0.1, type.wave || 'sine');
            } else {
                playClickSound(); // fallback
            }
            break;
    }
}

// ==================== SETTINGS ====================
function setSoundEnabled(enabled) {
    SoundManager.enabled = enabled;
    if (!enabled && SoundManager.audioContext) {
        SoundManager.audioContext.suspend().catch(() => {});
    } else if (enabled && SoundManager.audioContext) {
        SoundManager.audioContext.resume().catch(() => {});
    }
}

function getSoundEnabled() {
    return SoundManager.enabled;
}

// ==================== DIAGNOSTIC TOOLS ====================
function testSounds() {
    console.log('🔊 Testing sounds...');
    
    // Play each sound in sequence
    const sounds = [
        { name: 'click', fn: () => playSoundEffect('click') },
        { name: 'countdown', fn: () => playSoundEffect('countdown') },
        { name: 'countdownStart', fn: () => playSoundEffect('countdownStart') },
        { name: 'wrong', fn: () => playSoundEffect('wrong') },
        { name: 'correct', fn: () => playSoundEffect('correct') },
        { name: 'complete', fn: () => playSoundEffect('complete') }
    ];
    
    sounds.forEach((sound, index) => {
        setTimeout(() => {
            console.log(`🔊 Playing: ${sound.name}`);
            sound.fn();
        }, index * 400);
    });
    
    setTimeout(() => {
        console.log('✅ Sound test complete');
    }, sounds.length * 400 + 200);
}

// ==================== EXPOSE GLOBALLY ====================
window.SoundManager = SoundManager;
window.initAudio = initAudio;
window.playSoundEffect = playSoundEffect;
window.setSoundEnabled = setSoundEnabled;
window.getSoundEnabled = getSoundEnabled;
window.testSounds = testSounds;
window.playCorrectSound = playCorrectSound;
window.playWrongSound = playWrongSound;
window.playCountdownTick = playCountdownTick;
window.playCountdownStart = playCountdownStart;
window.playCompleteSound = playCompleteSound;
window.playClickSound = playClickSound;

console.log('🔊 Quiz Sounds loaded');