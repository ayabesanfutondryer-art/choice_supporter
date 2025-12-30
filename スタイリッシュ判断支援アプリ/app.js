/**
 * Stylish Decision Support App (MVP)
 * logic
 */

console.log('App initialization...');

// --- Constants & Data ---

const QUESTIONS = [
    {
        id: "q1",
        text: "今は疲れたり、感情に振り回されていませんかい？",
        calmAnswers: ["no", "unknown"]
    },
    {
        id: "q2",
        text: "24時間後の自分は「欲しい」って言いますかい？",
        calmAnswers: ["no", "unknown"]
    },
    {
        id: "q3",
        text: "それは今すぐ必要な物ですかい？",
        calmAnswers: ["no", "unknown"]
    },
    {
        id: "q4",
        text: "同じような物、すでに持ってませんかい？",
        calmAnswers: ["yes", "unknown"]
    },
    {
        id: "q5",
        text: "それは自分にとって値段以上の価値がありますかい？",
        calmAnswers: ["no", "unknown"]
    }
];

const LEVEL_DATA = {
    1: { visual: "🐚", label: "Impulse Lv.1", msg: "その勢い、嫌いじゃあござんせんがね。<br>最後は自分で決めなせぇ。" },
    2: { visual: "🐚✨", label: "Calm Lv.2", msg: "おや、少し冷静になれたようでござんすね。<br>さぁ、どうするつもりですかい？" },
    3: { visual: "🐚⚡", label: "Master Lv.3", msg: "ここまで考えた上でのことなら、<br>どっちに転んでも悔いはねぇはずでござんす。" }
};

const CUTIN_DATA = {
    2: { text: "GREAT", visual: "✨" },
    3: { text: "COOL JUDGMENT", visual: "❄️" }
};

// --- State ---

let state = {
    currentScreen: 'home', // home | quiz | result
    questionIndex: 0,
    calmPoints: 0,
    level: 1,
    cutinShown: { 2: false, 3: false }
};

// --- DOM Elements ---

const screens = {
    home: document.getElementById('screen-home'),
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result')
};

const ui = {
    // Shared
    app: document.getElementById('app'),

    // Home
    btnStart: document.getElementById('btn-start'),

    // Quiz
    quizLevelDisplay: document.getElementById('quiz-level-display'),
    quizProgress: document.getElementById('quiz-progress'),
    quizCharVisual: document.getElementById('quiz-char-visual'),
    questionText: document.getElementById('question-text'),
    btnOptions: document.querySelectorAll('.btn-option'),

    // Result
    resultCharVisual: document.getElementById('result-char-visual'),
    resultCharLabel: document.getElementById('result-char-label'),
    resultMessage: document.getElementById('result-message'),
    btnBuy: document.getElementById('btn-buy'),
    btnDontBuy: document.getElementById('btn-dont-buy'),
    btnHome: document.getElementById('btn-home'),

    // Overlay
    cutinOverlay: document.getElementById('cutin-overlay'),
    cutinText: document.getElementById('cutin-text'),
    cutinVisual: document.getElementById('cutin-visual'),
    toast: document.getElementById('toast')
};

// --- Logic functions ---

function init() {
    resetState();
    setupEventListeners();
    render();
}

function resetState() {
    state = {
        currentScreen: 'home',
        questionIndex: 0,
        calmPoints: 0,
        level: 1,
        cutinShown: { 2: false, 3: false }
    };
}

function switchScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(el => el.classList.remove('active'));

    // Show target screen
    screens[screenName].classList.add('active');
    state.currentScreen = screenName;

    // Scroll to top just in case
    window.scrollTo(0, 0);
}

function calculateLevel() {
    // 5 questions max. 
    // Lv1: 0-1
    // Lv2: 2-3
    // Lv3: 4-5
    if (state.calmPoints >= 4) return 3;
    if (state.calmPoints >= 2) return 2;
    return 1;
}

function render() {
    // 1. Screen Switching
    switchScreen(state.currentScreen);

    // 2. Data updating based on screen
    if (state.currentScreen === 'quiz') {
        const q = QUESTIONS[state.questionIndex];
        ui.questionText.textContent = q.text;
        ui.quizProgress.textContent = `Q${state.questionIndex + 1} / ${QUESTIONS.length}`;
        ui.quizLevelDisplay.textContent = state.level;

        ui.quizCharVisual.textContent = LEVEL_DATA[state.level].visual;
        // Animation reset for visual
        triggerAnim(ui.quizCharVisual, 'pop');

    } else if (state.currentScreen === 'result') {
        const lvData = LEVEL_DATA[state.level];
        ui.resultCharVisual.textContent = lvData.visual;
        ui.resultCharLabel.textContent = lvData.label;
        ui.resultMessage.innerHTML = lvData.msg;
    }
}

function triggerAnim(element, animName) {
    // Use CSS class for animation to avoid conflict with existing transforms
    element.classList.remove('anim-pop');
    void element.offsetWidth; // Trigger reflow
    element.classList.add('anim-pop');

    // Remove class after animation finishes (approx 300ms)
    setTimeout(() => {
        element.classList.remove('anim-pop');
    }, 300);
}

function handleAnswer(answerValue) {
    const currentQ = QUESTIONS[state.questionIndex];
    const isCalm = currentQ.calmAnswers.includes(answerValue);

    if (isCalm) {
        state.calmPoints++;
    }

    // Check Level Up
    const newLevel = calculateLevel();
    if (newLevel > state.level) {
        state.level = newLevel;
        // Trigger Cut-in if not shown yet for this level
        if (!state.cutinShown[newLevel]) {
            showCutIn(newLevel, () => {
                nextStep();
            });
            state.cutinShown[newLevel] = true;
            return; // Wait for cut-in to finish
        }
    }

    // No level up or cutoff finished logic
    nextStep();
}

function showCutIn(level, callback) {
    const data = CUTIN_DATA[level];
    ui.cutinText.textContent = data.text;
    ui.cutinVisual.textContent = data.visual;

    ui.cutinOverlay.classList.add('active');

    // Duration: 1.2s
    setTimeout(() => {
        ui.cutinOverlay.classList.remove('active');
        if (callback) callback();
    }, 1200);
}

function nextStep() {
    state.questionIndex++;
    if (state.questionIndex >= QUESTIONS.length) {
        state.currentScreen = 'result';
    }
    render();
}

function showToast(msg) {
    ui.toast.textContent = msg;
    ui.toast.classList.add('show');
    setTimeout(() => {
        ui.toast.classList.remove('show');
    }, 2000);
}

// --- Event Listeners ---

function setupEventListeners() {
    // Home -> Quiz
    ui.btnStart.addEventListener('click', () => {
        resetState(); // Ensure fresh start
        state.currentScreen = 'quiz';
        render();
    });

    // Quiz Options
    ui.btnOptions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const val = e.currentTarget.getAttribute('data-answer');
            handleAnswer(val);
        });
    });

    // Result Actions
    const finishAction = () => {
        showToast("判断完了！お疲れ様でした。");
        setTimeout(() => {
            resetState();
            render();
        }, 1000);
    };

    ui.btnBuy.addEventListener('click', finishAction);
    ui.btnDontBuy.addEventListener('click', finishAction);

    ui.btnHome.addEventListener('click', () => {
        resetState();
        render();
    });
}

// --- Boot ---
window.addEventListener('DOMContentLoaded', init);
