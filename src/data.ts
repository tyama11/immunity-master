import type { Category, Difficulty, RankInfo, StageItem } from './types.ts';

export const TAB1_ITEMS: readonly StageItem[] = [
    { stageId: 'm1', name: '角質層・繊毛運動', emoji: '🧱', hint: '皮膚・粘膜による物理的防御', x: 125, y: 118, boxLabel: '物理的防御' },
    { stageId: 'm2', name: 'リゾチーム', emoji: '💧', hint: '涙やだ液に含まれ細菌の細胞壁を分解', x: 350, y: 118, boxLabel: '化学的防御①' },
    { stageId: 'm3', name: 'ディフェンシン', emoji: '🛡️', hint: '皮膚や粘膜上皮で細菌の細胞膜を破壊', x: 575, y: 118, boxLabel: '化学的防御②' },
    { stageId: 'm4', name: '記憶細胞', emoji: '🧠', hint: '二次応答で急速・強力な反応を起こす', x: 535, y: 276, boxLabel: '獲得免疫' },
    { stageId: 'm5', name: 'アレルギー', emoji: '🤧', hint: '強すぎる過剰反応（花粉・鶏卵など）', x: 125, y: 464, boxLabel: '強すぎる免疫' },
    { stageId: 'm6', name: 'HIV（エイズ）', emoji: '⚠️', hint: 'ヘルパーT細胞を破壊する免疫不全', x: 350, y: 464, boxLabel: '弱すぎる免疫' },
    { stageId: 'm7', name: '自己免疫疾患', emoji: '💥', hint: '免疫寛容の異常で自分の体を攻撃', x: 575, y: 464, boxLabel: '標的の誤認' }
];

export const TAB2_ITEMS: readonly StageItem[] = [
    { stageId: 'a1', name: 'A型（凝集原A・凝集素β）', emoji: '🅰️', hint: '抗A抗体で凝集し、抗B抗体では凝集しない', x: 186, y: 206, boxLabel: 'A型' },
    { stageId: 'a2', name: 'B型（凝集原B・凝集素α）', emoji: '🅱️', hint: '抗B抗体で凝集し、抗A抗体では凝集しない', x: 514, y: 206, boxLabel: 'B型' },
    { stageId: 'a3', name: 'AB型（凝集原A,B・なし）', emoji: '🆎', hint: '抗A・抗Bの両方で凝集する', x: 186, y: 444, boxLabel: 'AB型' },
    { stageId: 'a4', name: 'O型（なし・凝集素α,β）', emoji: '🅾️', hint: '抗A・抗Bのどちらでも凝集しない', x: 514, y: 444, boxLabel: 'O型' }
];

export const CATEGORY_CONFIG: Readonly<Record<Category, { label: string; description: string; trayTitle: string }>> = {
    'defense': {
        label: '🛡️ 生体防御 ＆ 免疫疾患で覚える',
        description: '物理・化学的防御、自然免疫と獲得免疫、免疫関連疾患の分類をマスターしよう！',
        trayTitle: '🛡️ 免疫カード'
    },
    'abo': {
        label: '🩸 ABO式血液型マトリクスで覚える',
        description: '凝集原・凝集素・抗A/抗B血清への反応マトリクスを完成させよう！',
        trayTitle: '🩸 血液型カード'
    }
};

export const DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = {
    easy: '🔰 かんたん',
    normal: '🧪 ふつう',
    oni: '👹 おに (60秒TA)'
};

export function getItemsForCategory(cat: Category): readonly StageItem[] {
    return cat === 'defense' ? TAB1_ITEMS : TAB2_ITEMS;
}

export function getOniRankInfo(score: number): RankInfo {
    if (score >= 20) return { rank: 'S', icon: '👑', title: '免疫と血液型マトリクスの神', className: 'rank-s' };
    if (score >= 14) return { rank: 'A', icon: '🔬', title: '熟練研究者', className: 'rank-a' };
    if (score >= 8) return { rank: 'B', icon: '🧪', title: '一人前ラボ員', className: 'rank-b' };
    return { rank: 'C', icon: '🌱', title: '見習い観察者', className: 'rank-c' };
}
