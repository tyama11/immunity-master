import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getItemsForCategory } from '../src/data.ts';
import {
    BOARD_VIEWBOX,
    STAGE_BOX_HEIGHT,
    getStageBoxWidth,
    getStageLabelFontSize,
    renderBoardBackdropSvg,
} from '../src/board-svg.ts';
import type { Category } from '../src/types.ts';

interface RectBox {
    x: number;
    y: number;
    w: number;
    h: number;
    label?: string;
}

function overlaps(a: RectBox, b: RectBox, pad = 0): boolean {
    return (
        a.x - pad < b.x + b.w &&
        a.x + a.w + pad > b.x &&
        a.y - pad < b.y + b.h &&
        a.y + a.h + pad > b.y
    );
}

function contains(outer: RectBox, inner: RectBox): boolean {
    return (
        inner.x >= outer.x &&
        inner.y >= outer.y &&
        inner.x + inner.w <= outer.x + outer.w &&
        inner.y + inner.h <= outer.y + outer.h
    );
}

function parseAttrs(tag: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    for (const m of tag.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) {
        attrs[m[1]!] = m[2]!;
    }
    return attrs;
}

function parseBackdropElements(svg: string) {
    const panels: RectBox[] = [];
    const shapes: RectBox[] = [];
    const texts: RectBox[] = [];

    const stack: Array<{ tx: number; ty: number }> = [{ tx: 0, ty: 0 }];
    const tokenRe = /<g\b[^>]*>|<\/g>|<rect\b[^>]*\/?>|<circle\b[^>]*\/?>|<polygon\b[^>]*\/?>|<text\b[^>]*>([\s\S]*?)<\/text>/g;

    for (const m of svg.matchAll(tokenRe)) {
        const token = m[0]!;
        const cur = stack[stack.length - 1]!;
        if (token.startsWith('<g')) {
            const attrs = parseAttrs(token);
            const tr = attrs.transform?.match(/translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/);
            const dx = tr ? Number(tr[1]) : 0;
            const dy = tr ? Number(tr[2]) : 0;
            stack.push({ tx: cur.tx + dx, ty: cur.ty + dy });
        } else if (token === '</g>') {
            if (stack.length > 1) stack.pop();
        } else if (token.startsWith('<rect')) {
            const attrs = parseAttrs(token);
            const box: RectBox = {
                x: cur.tx + Number(attrs.x ?? 0),
                y: cur.ty + Number(attrs.y ?? 0),
                w: Number(attrs.width ?? 0),
                h: Number(attrs.height ?? 0),
            };
            if (box.w >= 290 && box.h >= 120) panels.push(box);
            else shapes.push(box);
        } else if (token.startsWith('<circle')) {
            const attrs = parseAttrs(token);
            const cx = cur.tx + Number(attrs.cx ?? 0);
            const cy = cur.ty + Number(attrs.cy ?? 0);
            const r = Number(attrs.r ?? 0);
            shapes.push({ x: cx - r, y: cy - r, w: r * 2, h: r * 2 });
        } else if (token.startsWith('<polygon')) {
            const attrs = parseAttrs(token);
            const pts = (attrs.points ?? '').trim().split(/\s+/).map((p) => p.split(',').map(Number));
            const xs = pts.map((p) => cur.tx + (p[0] ?? 0));
            const ys = pts.map((p) => cur.ty + (p[1] ?? 0));
            const minX = Math.min(...xs);
            const minY = Math.min(...ys);
            shapes.push({ x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY });
        } else if (token.startsWith('<text')) {
            const attrs = parseAttrs(token);
            const content = (m[1] ?? '').trim();
            if (!content) continue;
            const fs = Number(attrs['font-size'] ?? 12);
            const estW = content.length * fs * 0.85;
            const anchor = attrs['text-anchor'] ?? 'start';
            const rawX = cur.tx + Number(attrs.x ?? 0);
            const rawY = cur.ty + Number(attrs.y ?? 0);
            const x = anchor === 'middle' ? rawX - estW / 2 : (anchor === 'end' ? rawX - estW : rawX);
            texts.push({ x, y: rawY - fs, w: estW, h: fs * 1.15, label: content });
        }
    }
    return { panels, shapes, texts };
}

const CATEGORIES: readonly Category[] = ['defense', 'abo'];

describe('immunity-master SVG layout & integrity', () => {
    const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
    const appTs = readFileSync(join(rootDir, 'src/app.ts'), 'utf8');

    it('src/app.ts defines and calls init()', () => {
        assert.ok(appTs.includes('function init(') && appTs.includes('init();'));
    });

    for (const cat of CATEGORIES) {
        it(`[${cat}] foreground boxes stay in bounds, do not overlap each other, and fit inside panels`, () => {
            const items = getItemsForCategory(cat);
            const backdrop = renderBoardBackdropSvg(cat);
            const { panels, shapes, texts } = parseBackdropElements(backdrop);
            const boxes: RectBox[] = items.map((s) => {
                const w = getStageBoxWidth(s.name);
                return {
                    x: s.x - w / 2,
                    y: s.y - STAGE_BOX_HEIGHT / 2,
                    w,
                    h: STAGE_BOX_HEIGHT,
                    label: `${s.stageId}:${s.name}`,
                };
            });

            for (const b of boxes) {
                assert.ok(
                    b.x >= 16 && b.x + b.w <= BOARD_VIEWBOX.width - 16 &&
                    b.y >= 10 && b.y + b.h <= BOARD_VIEWBOX.height - 10,
                    `Box ${b.label} out of safe bounds: ${JSON.stringify(b)}`
                );
                assert.ok(
                    panels.some((p) => contains(p, b)),
                    `Box ${b.label} is not contained in any background panel`
                );
                for (const sh of shapes) {
                    assert.equal(overlaps(b, sh), false, `Box ${b.label} overlaps background shape ${JSON.stringify(sh)}`);
                }
                for (const tx of texts) {
                    assert.equal(overlaps(b, tx), false, `Box ${b.label} overlaps background text "${tx.label}"`);
                }
            }

            for (let i = 0; i < boxes.length; i++) {
                for (let j = i + 1; j < boxes.length; j++) {
                    assert.equal(
                        overlaps(boxes[i]!, boxes[j]!, 4),
                        false,
                        `Boxes ${boxes[i]!.label} and ${boxes[j]!.label} overlap or lack 4px clearance`
                    );
                }
            }
        });

        it(`[${cat}] backdrop has no HTML tags, no answer spoilers, and labels fit box width`, () => {
            const items = getItemsForCategory(cat);
            const backdrop = renderBoardBackdropSvg(cat);
            assert.equal(/<(b|i|br|div|span)\b/i.test(backdrop), false, 'Backdrop must not contain HTML tags');

            for (const s of items) {
                if (s.name.length >= 3) {
                    assert.equal(backdrop.includes(s.name), false, `Backdrop leaks answer "${s.name}"`);
                }
                const w = getStageBoxWidth(s.name);
                const fs = getStageLabelFontSize(s.name);
                assert.ok(s.name.length * fs <= w - 12, `Label "${s.name}" may overflow box width ${w}`);
            }
        });
    }
});
