// App State
const state = {
    currentScreen: 'screen-home',
    calmness: 0,
    questionIndex: 0,
    characterStage: 1,
    history: [] // optional: for tracking choices
};

// Configuration
const CALMNESS_MAX = 100;
const CALMNESS_MIN = 0;
const QUESTIONS_COUNT = 5;

// Evolution Thresholds
const STAGE_2_THRESHOLD = 30;
const STAGE_3_THRESHOLD = 65;

// Questions Data (New Spec)
/*
Q1. これを買わなくても、今の生活は特に困らない？ -> Yes:+20, No:+5
Q2. 同じ用途の物を、すでに持っている？ -> Yes:+15, No:+5
Q3. 1週間後でも、同じ熱量で欲しいと思っていそう？ -> No:+25, Yes:+0  (Logic check: Spec says No=+25. Usually Yes would be "I still want it", but let's follow spec strictly. Maybe "No" implies "I won't want it" so buying now is impulsive? Spec text: "1週間後でも、同じ熱量で欲しいと思っていそう？ ・いいえ → +25 ・はい → +0". Wait, if I say "No" (I won't want it later), that's a VERY good reason not to buy, hence very calm/rational to realize that. So +25 makes sense.)
Q4. 今の気分（ワクワク・ストレス・ご褒美感）が、買いたい理由の大半を占めている？ -> No:+20, Yes:+0
Q5. これを買ったことで、後悔する可能性は低いと言い切れる？ -> Yes:+20, No:+5
*/
const questions = [
    // Q1
    { text: "これを買わなくても、今の生活は特に困らない？", yes: 20, no: 5 },

    // Q2
    { text: "同じ用途の物を、すでに持っている？", yes: 15, no: 5 },

    // Q3
    { text: "1週間後でも、同じ熱量で欲しいと思っていそう？", yes: 0, no: 25 },

    // Q4
    { text: "今の気分（ワクワク・ストレス・ご褒美感）が、買いたい理由の大半を占めている？", yes: 0, no: 20 },

    // Q5
    { text: "これを買ったことで、後悔する可能性は低いと言い切れる？", yes: 20, no: 5 }
];

// DOM Elements
const screens = {
    home: document.getElementById('screen-home'),
    quiz: document.getElementById('screen-quiz'),
    cutin: document.getElementById('screen-cutin'),
    final: document.getElementById('screen-final'),
    result: document.getElementById('screen-result')
};

const ui = {
    meterFill: document.getElementById('meter-fill'),
    meterValue: document.getElementById('meter-value'),
    currentQ: document.getElementById('current-q'),
    totalQ: document.getElementById('total-q'),
    questionText: document.getElementById('question-text'),
    charContainer: document.getElementById('character'),
    charFinal: document.getElementById('character-final'),
    resultText: document.getElementById('result-text')
};

// Initialization
function init() {
    setupEventListeners();
    updateUI();
}

function setupEventListeners() {
    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-yes').addEventListener('click', () => handleAnswer(true));
    document.getElementById('btn-no').addEventListener('click', () => handleAnswer(false));

    // Final Actions
    document.getElementById('btn-buy').addEventListener('click', () => showResult(true));
    document.getElementById('btn-dont-buy').addEventListener('click', () => showResult(false));
    document.getElementById('btn-back-home').addEventListener('click', goHome);
}

// Logic
function startGame() {
    state.calmness = 0;
    state.questionIndex = 0;
    state.characterStage = 1;
    state.history = [];

    updateCharacterStage(1);
    switchScreen('quiz');
    loadQuestion();
    updateUI();
}

function switchScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(el => el.classList.add('hidden'));

    // Show target
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
    }
    state.currentScreen = screenName;

    // Header visibility: Only show on home
    const header = document.querySelector('.app-header');
    if (header) {
        if (screenName === 'home') {
            header.classList.remove('hidden');
        } else {
            header.classList.add('hidden');
        }
    }
}

function loadQuestion() {
    if (state.questionIndex >= questions.length) {
        switchScreen('final');
        return;
    }

    const q = questions[state.questionIndex];
    ui.questionText.textContent = q.text;
    ui.currentQ.textContent = state.questionIndex + 1;
    ui.totalQ.textContent = QUESTIONS_COUNT;
}

function handleAnswer(isYes) {
    const q = questions[state.questionIndex];
    const change = isYes ? q.yes : q.no;

    // Simple update animation or feedback could go here

    updateCalmness(change);

    // Log answer (optional)
    state.history.push({ q: q.text, a: isYes });

    // Move to next
    state.questionIndex++;

    // Check evolution AFTER updating calmness but BEFORE showing next question?
    // Spec says: "冷静値が閾値に達したら、カットイン画面へ"
    // We should check if stage changed.
    const prevStage = state.characterStage;
    const nextStage = calculateStage(state.calmness);

    if (nextStage > prevStage) {
        // Evolution!
        triggerEvolution(nextStage, () => {
            loadQuestion(); // Load next question after cutin
        });
    } else {
        loadQuestion();
    }

    updateUI();
}

function updateCalmness(delta) {
    state.calmness += delta;
    // Clamp
    if (state.calmness > CALMNESS_MAX) state.calmness = CALMNESS_MAX;
    if (state.calmness < CALMNESS_MIN) state.calmness = CALMNESS_MIN;
}

function calculateStage(calmness) {
    // Stage 1: 0-29
    // Stage 2: 30-64
    // Stage 3: 65-100

    if (calmness >= STAGE_3_THRESHOLD) return 3;
    if (calmness >= STAGE_2_THRESHOLD) return 2;
    return 1;
}

function updateCharacterStage(newStage) {
    state.characterStage = newStage;

    // Update DOM classes for character
    // Remove old stage classes
    ui.charContainer.classList.remove('stage-1', 'stage-2', 'stage-3');
    ui.charContainer.classList.add(`stage-${newStage}`);

    ui.charFinal.classList.remove('stage-1', 'stage-2', 'stage-3');
    ui.charFinal.classList.add(`stage-${newStage}`);
}

const CUTIN_WORDS = ["COOL", "NICE", "GOOD"];

function triggerEvolution(newStage, onComplete) {
    // Random Word
    const word = CUTIN_WORDS[Math.floor(Math.random() * CUTIN_WORDS.length)];
    const cutinText = document.querySelector('.cutin-text');
    if (cutinText) cutinText.textContent = word;

    // Show Cut-in
    const cutin = screens.cutin;
    cutin.classList.remove('hidden');

    // Wait for animation
    setTimeout(() => {
        cutin.classList.add('hidden');
        updateCharacterStage(newStage);
        if (onComplete) onComplete();
    }, 1200); // 1.2s as per spec
}

function updateUI() {
    ui.meterValue.textContent = state.calmness;
    ui.meterFill.style.width = `${state.calmness}%`;
}

function showResult(didBuy) {
    const text = didBuy ? "これはもう衝動買いではないようですね。" : "冷静な判断です";
    ui.resultText.textContent = text;
    switchScreen('result');
}

function goHome() {
    switchScreen('home');
}

// Start
init();
