                                           

export const BOARD_VIEWBOX = { width: 700, height: 540 }         ;
export const STAGE_BOX_HEIGHT = 60;

export function getStageBoxWidth(name        )         {
    return name.length >= 14 ? 236 : (name.length >= 12 ? 216 : 180);
}

export function getStageLabelFontSize(txt        )         {
    return txt.length >= 15 ? 11 : (txt.length >= 12 ? 12 : 14);
}

export function renderBoardBackdropSvg(cat          )         {
    if (cat === 'defense') {
        return `<g class="board-backdrop" aria-hidden="true">
            <!-- Top Panel: 第1の防御 -->
            <rect x="16" y="10" width="668" height="166" rx="14" fill="#F4F8F7" stroke="#D0DCD8" stroke-width="2"/>
            <text x="32" y="32" font-size="13" font-weight="900" fill="#2E403B">🛡️ 第1の防御：物理的・化学的防御（体表・粘膜での阻止）</text>
            <text x="125" y="64" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">物理的防御（皮膚・気管）</text>
            <text x="350" y="64" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">化学的防御①（涙・だ液）</text>
            <text x="575" y="64" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">化学的防御②（皮膚・粘膜）</text>

            <!-- Middle Panel: 第2の防御 -->
            <rect x="16" y="186" width="668" height="154" rx="14" fill="#F4F8F7" stroke="#D0DCD8" stroke-width="2"/>
            <text x="32" y="208" font-size="13" font-weight="900" fill="#2E403B">⚔️ 第2の防御：獲得免疫と二次応答（抗体産生量グラフ）</text>
            <line x1="64" y1="316" x2="370" y2="316" stroke="#64748B" stroke-width="1.5"/>
            <line x1="64" y1="316" x2="64" y2="228" stroke="#64748B" stroke-width="1.5"/>
            <path d="M 74 314 Q 125 288 180 312" fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-dasharray="4 3"/>
            <text x="128" y="280" text-anchor="middle" font-size="10" font-weight="700" fill="#2563EB">一次応答</text>
            <path d="M 205 314 Q 255 234 355 244" fill="none" stroke="#EF4444" stroke-width="3"/>
            <text x="295" y="236" text-anchor="middle" font-size="10" font-weight="700" fill="#DC2626">二次応答（急速・大量）</text>
            <path d="M 384 276 L 436 276" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>

            <!-- Bottom Panel: 免疫関連疾患 -->
            <rect x="16" y="350" width="668" height="180" rx="14" fill="#F4F8F7" stroke="#D0DCD8" stroke-width="2"/>
            <text x="32" y="372" font-size="13" font-weight="900" fill="#2E403B">🏥 免疫関連疾患の3分類（強すぎる ／ 弱すぎる ／ 標的の誤認）</text>
            <text x="125" y="408" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">強すぎる過剰反応</text>
            <text x="350" y="408" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">弱すぎる免疫不全</text>
            <text x="575" y="408" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">自己を攻撃する異常</text>
        </g>`;
    } else {
        return `<g class="board-backdrop" aria-hidden="true">
            <rect x="16" y="10" width="668" height="520" rx="14" fill="#FDFBF7" stroke="#E6DFD5" stroke-width="2"/>
            <text x="36" y="36" font-size="14" font-weight="900" fill="#7C2D12">🩸 ABO式血液型と凝集反応 2×2 マトリクス</text>
            <!-- Card 1 -->
            <rect x="32" y="52" width="308" height="222" rx="12" fill="#FFFFFF" stroke="#E6DFD5" stroke-width="1.5"/>
            <text x="186" y="82" text-anchor="middle" font-size="12" font-weight="800" fill="#7C2D12">凝集原: A ｜ 凝集素: β</text>
            <text x="186" y="112" text-anchor="middle" font-size="11" font-weight="700" fill="#57534E">抗A血清: ＋（凝集） ／ 抗B血清: －</text>
            <!-- Card 2 -->
            <rect x="360" y="52" width="308" height="222" rx="12" fill="#FFFFFF" stroke="#E6DFD5" stroke-width="1.5"/>
            <text x="514" y="82" text-anchor="middle" font-size="12" font-weight="800" fill="#7C2D12">凝集原: B ｜ 凝集素: α</text>
            <text x="514" y="112" text-anchor="middle" font-size="11" font-weight="700" fill="#57534E">抗A血清: － ／ 抗B血清: ＋（凝集）</text>
            <!-- Card 3 -->
            <rect x="32" y="290" width="308" height="222" rx="12" fill="#FFFFFF" stroke="#E6DFD5" stroke-width="1.5"/>
            <text x="186" y="320" text-anchor="middle" font-size="12" font-weight="800" fill="#7C2D12">凝集原: A・B ｜ 凝集素: なし</text>
            <text x="186" y="350" text-anchor="middle" font-size="11" font-weight="700" fill="#57534E">抗A血清: ＋（凝集） ／ 抗B血清: ＋（凝集）</text>
            <!-- Card 4 -->
            <rect x="360" y="290" width="308" height="222" rx="12" fill="#FFFFFF" stroke="#E6DFD5" stroke-width="1.5"/>
            <text x="514" y="320" text-anchor="middle" font-size="12" font-weight="800" fill="#7C2D12">凝集原: なし ｜ 凝集素: α・β</text>
            <text x="514" y="350" text-anchor="middle" font-size="11" font-weight="700" fill="#57534E">抗A血清: － ／ 抗B血清: －</text>
        </g>`;
    }
}


//# sourceURL=board-svg.ts