import { getItemsForCategory } from './data.js';
import { pickRandom, shuffled,          } from './random.js';
                                                            

export const ONI_TIME_LIMIT = 60;
export const ONI_PENALTY_SECONDS = 5;
export const ONI_COMBO_STEP = 5;
export const ONI_BONUS_SECONDS = 3;
export const ONI_TRAY_SIZE = 3;

export function buildStandardCards(cat          , startUid = 0)                                     {
    let uid = startUid;
    const items = getItemsForCategory(cat).map((s) => ({
        id: `item-${uid++}`,
        stageId: s.stageId,
        name: s.name,
        emoji: s.emoji,
        hint: s.hint
    }));
    return { items, nextUid: uid };
}

export function buildOniQuestion(
    cat          ,
    prevStageId               ,
    startUid        ,
    rng      = Math.random
)                                                                            {
    const pool = getItemsForCategory(cat);
    const candidates = pool.filter((s) => s.stageId !== prevStageId);
    const target = pickRandom(candidates.length > 0 ? candidates : pool, rng);
    const distractors = shuffled(pool.filter((s) => s.stageId !== target.stageId), rng).slice(0, ONI_TRAY_SIZE - 1);
    const askHint = rng() < 0.5;
    let uid = startUid;
    const choices = shuffled([target, ...distractors], rng).map((s) => ({
        id: `item-${uid++}`,
        stageId: s.stageId,
        name: askHint ? s.hint : s.name,
        emoji: s.emoji,
        hint: ''
    }));
    return { target, choices, askHint, nextUid: uid };
}

export function computeRemainingSeconds(endTimeMs        , nowMs        )         {
    return Math.ceil(Math.max(0, endTimeMs - nowMs) / 1000);
}

export function isBonusCombo(combo        )          {
    return combo > 0 && combo % ONI_COMBO_STEP === 0;
}


//# sourceURL=game-logic.ts