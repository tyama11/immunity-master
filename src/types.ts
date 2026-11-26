export type Category = 'defense' | 'abo';
export type Difficulty = 'easy' | 'normal' | 'oni';
export interface StageItem {
    readonly stageId: string;
    readonly name: string;
    readonly emoji: string;
    readonly hint: string;
    readonly x: number;
    readonly y: number;
    readonly boxLabel: string;
}
export interface Card {
    readonly id: string;
    readonly stageId: string;
    readonly name: string;
    readonly emoji: string;
    readonly hint: string;
}
export interface RankInfo {
    readonly rank: 'S' | 'A' | 'B' | 'C';
    readonly icon: string;
    readonly title: string;
    readonly className: 'rank-s' | 'rank-a' | 'rank-b' | 'rank-c';
}
