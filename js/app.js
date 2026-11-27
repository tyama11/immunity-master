import { CATEGORY_CONFIG, DIFFICULTY_LABELS, getItemsForCategory, getOniRankInfo } from './data.js';
import { byId, bySelector } from './dom.js';
import { ONI_BONUS_SECONDS, ONI_PENALTY_SECONDS, ONI_TIME_LIMIT, buildOniQuestion, buildStandardCards, computeRemainingSeconds, isBonusCombo } from './game-logic.js';
import { shuffleInPlace } from './random.js';
import { createSoundFx } from './sound.js';
import { createProgressStore, safeLocalStorage } from './storage.js';
                                                             

const storage = safeLocalStorage();
const progress = createProgressStore(storage);
const SOUND_FX = createSoundFx(storage);

const state = {
    category: 'defense'            ,
    difficulty: 'easy'              ,
    score: 0,
    combo: 0,
    maxCombo: 0,
    totalQuestions: 0,
    selectedItemId: null                 ,
    currentOniStageId: null                 ,
    items: []          ,
    nextUid: 0,
    timeLeft: ONI_TIME_LIMIT,
    lastTickSecond: -1,
    oniEndTime: 0,
    isPlaying: false,
    justUnlockedOni: false,
    timerInterval: null                                         ,
    toastTimeout: null                                        ,
    returnTimeout: null                                        
};

const els = {
    homeScreen: byId('home-screen'),
    gameScreen: byId('game-screen'),
    mainArea: bySelector('.main'),
    homeDesc: byId('home-desc'),
    earnedTitleBanner: byId('earned-title-banner'),
    ruleOniItem: byId('rule-oni-item'),
    btnOni: byId                   ('btn-oni'),
    homeMuteBtn: byId                   ('home-mute-btn'),
    gameMuteBtn: byId                   ('game-mute-btn'),
    tabScore1: byId('tab-score-1'),
    tabScore2: byId('tab-score-2'),
    categoryTabs: document.querySelectorAll                   ('.category-tab'),
    modeButtons: document.querySelectorAll                   ('.mode-btn'),
    homeBtn: byId                   ('home-btn'),
    modeDisplay: byId('mode-display'),
    trayTitleText: byId('tray-title-text'),
    trayHint: byId('tray-hint'),
    progressContainer: byId('progress-container'),
    timerBadge: byId('timer-badge'),
    timerText: byId('timer-text'),
    comboBadge: byId('combo-badge'),
    scoreText: byId('score-text'),
    progressFill: byId('progress-fill'),
    boardSvg: byId               ('board-svg'),
    cardList: byId('card-list'),
    toast: byId('toast'),
    clearOverlay: byId('clear-overlay'),
    clearTitle: byId('clear-title'),
    clearSubtitle: byId('clear-subtitle'),
    clearActions: byId('clear-actions'),
    autoReturnText: byId('auto-return-text'),
    retryBtn: byId                   ('retry-btn'),
    overlayHomeBtn: byId                   ('overlay-home-btn')
};

function init()       {
    els.categoryTabs.forEach((tab) => tab.addEventListener('click', () => {
        SOUND_FX.playTap();
        const cat = tab.dataset['category']            ;
        setCategory(cat);
    }));
    els.modeButtons.forEach((btn) => btn.addEventListener('click', () => {
        SOUND_FX.playTap();
        startGame(btn.dataset['difficulty']              );
    }));
    els.homeBtn.addEventListener('click', () => { SOUND_FX.playTap(); resetToHome(); });
    els.overlayHomeBtn.addEventListener('click', () => { SOUND_FX.playTap(); resetToHome(); });
    els.retryBtn.addEventListener('click', () => { SOUND_FX.playTap(); els.clearOverlay.classList.remove('active'); startGame(state.difficulty); });
    const mute = () => { SOUND_FX.toggleMute(); syncMute(); };
    els.homeMuteBtn.addEventListener('click', mute);
    els.gameMuteBtn.addEventListener('click', mute);
    syncMute();

    els.boardSvg.addEventListener('click', (e) => {
        if (!state.isPlaying || state.difficulty === 'oni' || !state.selectedItemId) return;
        const node = (e.target                  )?.closest             ('.stage-node.interactive-target');
        if (node) attemptPlace(node.dataset['stage'] ?? '');
    });
    els.boardSvg.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && state.isPlaying && state.difficulty !== 'oni') {
            const node = (e.target                  )?.closest             ('.stage-node.interactive-target');
            if (node) { e.preventDefault(); attemptPlace(node.dataset['stage'] ?? ''); }
        }
    });
    document.addEventListener('keydown', (e) => {
        if (!els.gameScreen.classList.contains('active') || !state.isPlaying) return;
        if (state.difficulty === 'oni' && /^[1-9]$/.test(e.key)) {
            const t = els.cardList.querySelectorAll             ('.bio-card')[Number(e.key) - 1];
            if (t) { e.preventDefault(); t.click(); }
        } else if (e.key === 'Escape' && state.selectedItemId) {
            state.selectedItemId = null; renderCards();
        }
    });
    setCategory('defense');
    updateTabScores();
}

function syncMute()       {
    const m = SOUND_FX.isMuted();
    els.homeMuteBtn.textContent = m ? '🔇 音OFF' : '🔊 音ON';
    els.gameMuteBtn.textContent = m ? '🔇' : '🔊';
}

function updateTabScores()       {
    [['defense', els.tabScore1], ['abo', els.tabScore2]].forEach(([c, el]) => {
        const s = progress.getOniBest(c            );
        if (s !== null) { (el               ).textContent = `👹 ${s}問`; (el               ).hidden = false; }
        else (el               ).hidden = true;
    });
    const saved = progress.getOniBest(state.category);
    if (saved === null) { els.earnedTitleBanner.hidden = true; return; }
    const r = getOniRankInfo(saved);
    els.earnedTitleBanner.className = `earned-title-banner ${r.className}`;
    els.earnedTitleBanner.textContent = `称号：${r.icon} ${r.title}`;
    els.earnedTitleBanner.hidden = false;
}

function setCategory(cat          )       {
    state.category = cat;
    els.categoryTabs.forEach((tab) => {
        const a = tab.dataset['category'] === cat;
        tab.classList.toggle('active', a);
        tab.setAttribute('aria-selected', String(a));
    });
    els.homeDesc.textContent = CATEGORY_CONFIG[cat].description;
    const unlocked = progress.isOniUnlocked(cat);
    els.ruleOniItem.hidden = !unlocked;
    els.btnOni.hidden = !unlocked;
    updateTabScores();
}

function renderBoardSvg(oniBlankStageId               )       {
    const items = getItemsForCategory(state.category);
    const backdropSvg = renderBoardBackdropSvg(state.category);
    const nodesSvg = items.map((s, idx) => {
        const isBlank = oniBlankStageId !== null ? s.stageId === oniBlankStageId : true;
        let cls = '';
        let txt = '';
        let labelDisplay = s.boxLabel;

        if (oniBlankStageId !== null) {
            if (isBlank) {
                cls = 'stage-node oni-target-blank interactive-target';
                txt = state.difficulty === 'oni' ? '【 ？ 】' : '？';
                if (state.difficulty === 'normal' || state.difficulty === 'oni') {
                    labelDisplay = `【 ${idx + 1} 】`;
                }
            } else {
                cls = 'stage-node solved';
                txt = s.name;
            }
        } else {
            cls = 'stage-node interactive-target masked';
            if (state.difficulty === 'easy') {
                txt = '？';
                labelDisplay = s.boxLabel;
            } else {
                txt = `【 ${idx + 1} 】`;
                labelDisplay = '';
            }
        }

        const boxW = getStageBoxWidth(s.name);
        const halfW = boxW / 2;
        const labelFontSize = getStageLabelFontSize(txt);
        const boxLabelSvg = labelDisplay ? `<text x="0" y="-10" text-anchor="middle" font-size="11" font-weight="700" fill="#5B6E82">${labelDisplay}</text>` : '';
        const yOffset = labelDisplay ? 12 : 5;

        return `<g class="${cls}" data-stage="${s.stageId}" tabindex="0" role="button" transform="translate(${s.x}, ${s.y})">
            <g class="stage-visual">
                <rect class="stage-box ${isBlank && oniBlankStageId ? 'oni-focus-box' : ''}" x="${-halfW}" y="-30" width="${boxW}" height="60" rx="14" fill="#FFFFFF" stroke="#6F7977" stroke-width="2.5" />
                ${boxLabelSvg}
                <text class="stage-label" x="0" y="${yOffset}" text-anchor="middle" font-size="${labelFontSize}" font-weight="800" fill="#161D1C">${txt}</text>
            </g>
        </g>`;
    }).join('');

    els.boardSvg.innerHTML = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#475569"/></marker></defs>${backdropSvg}${nodesSvg}`;
}

function startGame(difficulty            )       {
    stopTimers();
    state.difficulty = difficulty;
    state.score = 0; state.combo = 0; state.maxCombo = 0;
    state.selectedItemId = null; state.currentOniStageId = null;
    state.timeLeft = ONI_TIME_LIMIT; state.lastTickSecond = -1; state.isPlaying = true;

    const isOni = difficulty === 'oni';
    els.progressContainer.classList.toggle('oni-active', isOni);
    els.timerBadge.hidden = !isOni;
    els.scoreText.hidden = !isOni;
    els.progressFill.classList.toggle('timer-fill', isOni);
    els.modeDisplay.textContent = `${CATEGORY_CONFIG[state.category].label} / ${DIFFICULTY_LABELS[difficulty]}`;

    if (isOni) {
        els.trayTitleText.textContent = '❓ ？に入るのは？';
        els.trayHint.textContent = '👆クリック または 1・2・3キーで回答';
        nextOni();
        updateOniHud();
        state.oniEndTime = Date.now() + ONI_TIME_LIMIT * 1000;
        state.timerInterval = setInterval(() => {
            const rem = Math.max(0, state.oniEndTime - Date.now());
            state.timeLeft = computeRemainingSeconds(state.oniEndTime, Date.now());
            if (state.timeLeft <= 10 && state.timeLeft > 0 && state.timeLeft !== state.lastTickSecond) {
                state.lastTickSecond = state.timeLeft; SOUND_FX.playTick();
            }
            updateOniHud(rem);
            if (rem <= 0) { stopTimers(); handleOniTimeUp(); }
        }, 100);
    } else {
        els.trayTitleText.textContent = CATEGORY_CONFIG[state.category].trayTitle;
        els.trayHint.textContent = '👆カードを選んで図の枠をクリック';
        renderBoardSvg(null);
        const built = buildStandardCards(state.category, state.nextUid);
        state.nextUid = built.nextUid;
        state.items = shuffleInPlace(built.items);
        state.totalQuestions = state.items.length;
        els.progressFill.style.width = '0%';
        renderCards();
    }
    els.homeScreen.classList.remove('active');
    els.gameScreen.classList.add('active');
}

function nextOni()       {
    const q = buildOniQuestion(state.category, state.currentOniStageId, state.nextUid);
    state.currentOniStageId = q.target.stageId;
    state.nextUid = q.nextUid;
    state.items = q.choices;
    els.trayTitleText.textContent = q.askHint ? '❓ ？の時期・項目はどれ？' : '❓ ？に入る名称は？';
    renderBoardSvg(q.target.stageId);
    renderCards();
}

function renderCards()       {
    els.cardList.innerHTML = '';
    const isOni = state.difficulty === 'oni';
    const isEasy = state.difficulty === 'easy';
    els.cardList.classList.toggle('oni-choices', isOni);
    state.items.forEach((item, idx) => {
        const card = document.createElement('div');
        const sel = state.selectedItemId === item.id;
        card.className = `bio-card${sel ? ' selected' : ''}`;
        card.tabIndex = 0;
        const iconHtml = isEasy ? `<div class="feature-icon">${item.emoji}</div>` : '';
        const hintHtml = item.hint && !isOni ? `<div class="hint">${item.hint}</div>` : '';
        card.innerHTML = `${iconHtml}<div class="info"><div class="name">${item.name}</div>${hintHtml}</div>`;
        if (isOni && idx < 9) card.insertAdjacentHTML('afterbegin', `<span class="key-badge">${idx + 1}</span>`);
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
        card.addEventListener('click', () => {
            if (!state.isPlaying) return;
            if (isOni) {
                if (item.stageId === state.currentOniStageId) {
                    state.score++; state.combo++; state.maxCombo = Math.max(state.maxCombo, state.combo);
                    if (isBonusCombo(state.combo)) { state.oniEndTime += ONI_BONUS_SECONDS * 1000; SOUND_FX.playBonus(); showToast(`🔥 ${state.combo}連続！ +3秒！`); }
                    else { SOUND_FX.playCorrect(state.combo); showToast('⭕ 正解！'); }
                    updateOniHud(); nextOni();
                } else {
                    state.combo = 0; SOUND_FX.playWrong(); state.oniEndTime -= ONI_PENALTY_SECONDS * 1000;
                    showToast(`❌ ミス！ -${ONI_PENALTY_SECONDS}秒`);
                    const rem = Math.max(0, state.oniEndTime - Date.now());
                    if (rem <= 0) { stopTimers(); handleOniTimeUp(); } else { updateOniHud(rem); nextOni(); }
                }
                return;
            }
            SOUND_FX.playTap();
            state.selectedItemId = sel ? null : item.id;
            renderCards();
        });
        els.cardList.appendChild(card);
    });
}

function attemptPlace(stageId        )       {
    const idx = state.items.findIndex((i) => i.id === state.selectedItemId);
    if (idx === -1) return;
    const item = state.items[idx] ;
    if (item.stageId === stageId) {
        state.score++;
        SOUND_FX.playCorrect(1);
        showToast(`⭕ 正解！ ${item.name}`);
        const node = els.boardSvg.querySelector             (`[data-stage="${stageId}"]`);
        if (node) {
            node.classList.remove('masked', 'interactive-target');
            node.classList.add('solved');
            const lbl = node.querySelector('.stage-label');
            if (lbl) lbl.textContent = item.name;
        }
        state.items.splice(idx, 1);
        state.selectedItemId = null;
        els.progressFill.style.width = `${(state.score / state.totalQuestions) * 100}%`;
        renderCards();
        if (state.score >= state.totalQuestions) handleGameClear();
    } else {
        SOUND_FX.playWrong();
        showToast('❌ 違うみたい…');
        state.selectedItemId = null;
        renderCards();
    }
}

function updateOniHud(rem = state.timeLeft * 1000)       {
    els.timerText.textContent = String(state.timeLeft);
    els.scoreText.textContent = `🏆 ${state.score}問`;
    els.progressFill.style.width = `${Math.min(100, (rem / (ONI_TIME_LIMIT * 1000)) * 100)}%`;
}

function showToast(msg        )       {
    els.toast.innerHTML = msg;
    els.toast.style.backgroundColor = msg.includes('❌') ? 'rgba(239, 68, 68, 0.95)' : 'rgba(13, 148, 136, 0.95)';
    els.toast.classList.add('show');
    if (state.toastTimeout !== null) clearTimeout(state.toastTimeout);
    state.toastTimeout = setTimeout(() => els.toast.classList.remove('show'), 1200);
}

function handleGameClear()       {
    state.isPlaying = false;
    let unlockedNow = false;
    const k = state.category;
    if (state.difficulty === 'normal' && !progress.isOniUnlocked(k)) {
        progress.unlockOni(k); state.justUnlockedOni = true; unlockedNow = true;
    }
    SOUND_FX.playClear(unlockedNow);
    els.clearTitle.innerHTML = '🎊 素晴らしい！ 🎊';
    els.clearSubtitle.innerHTML = unlockedNow ? 'すべてマスターしました！<div class="unlock-message">どこかでとびらがひらいたようだ…！</div>' : 'すべてマスターしました！';
    els.clearActions.hidden = true; els.autoReturnText.hidden = false;
    els.clearOverlay.classList.add('active');
    state.returnTimeout = setTimeout(resetToHome, unlockedNow ? 4500 : 3000);
}

function handleOniTimeUp()       {
    state.isPlaying = false;
    const k = state.category;
    const prev = progress.getOniBest(k) ?? -1;
    const best = Math.max(prev, state.score);
    if (state.score > prev) progress.setOniBest(k, best);
    updateTabScores();
    const r = getOniRankInfo(state.score);
    SOUND_FX.playTimeUp(r.rank === 'S' || r.rank === 'A');
    els.clearTitle.innerHTML = '⏱️ タイムアップ！';
    els.clearSubtitle.innerHTML = `<div class="rank-showcase ${r.className}"><span class="rank-letter">${r.rank}</span><span class="rank-title-text">${r.icon} ${r.title}</span></div><div style="font-size:40px;font-weight:900;color:var(--primary);">${state.score}問正解！</div><div>ベスト記録：<b>${best} 問</b></div>`;
    els.clearActions.hidden = false; els.autoReturnText.hidden = true;
    els.clearOverlay.classList.add('active');
}

function stopTimers()       {
    if (state.timerInterval !== null) clearInterval(state.timerInterval);
    if (state.returnTimeout !== null) clearTimeout(state.returnTimeout);
    state.timerInterval = null; state.returnTimeout = null;
}

function resetToHome()       {
    stopTimers(); state.isPlaying = false;
    els.clearOverlay.classList.remove('active');
    els.gameScreen.classList.remove('active');
    els.homeScreen.classList.add('active');
    setCategory(state.category);
    state.justUnlockedOni = false;
}

init();


//# sourceURL=app.ts