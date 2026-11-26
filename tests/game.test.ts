import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TAB1_ITEMS, TAB2_ITEMS, getOniRankInfo } from '../src/data.ts';
import { buildOniQuestion, buildStandardCards, isBonusCombo } from '../src/game-logic.ts';

describe('immunity-master data & logic', () => {
    it('both tabs have items with hints', () => {
        assert.ok(TAB1_ITEMS.length >= 4);
        assert.ok(TAB2_ITEMS.length >= 4);
        assert.ok(buildStandardCards('defense').items.length === TAB1_ITEMS.length);
        assert.ok(buildStandardCards('abo').items.length === TAB2_ITEMS.length);
    });

    it('buildOniQuestion produces 3 choices including target', () => {
        const q = buildOniQuestion('defense', null, 0);
        assert.equal(q.choices.length, 3);
        assert.ok(q.choices.some((c) => c.stageId === q.target.stageId));
        assert.equal(getOniRankInfo(20).rank, 'S');
        assert.equal(isBonusCombo(5), true);
    });
});

describe('DOM & index.html integrity', () => {
    const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
    const html = readFileSync(join(rootDir, 'index.html'), 'utf8');
    const appTs = readFileSync(join(rootDir, 'src/app.ts'), 'utf8');

    it('every byId(...) in src/app.ts exists in index.html and cache-busters match', () => {
        for (const m of appTs.matchAll(/byId(?:<[^>]+>)?\('([^']+)'\)/g)) {
            assert.ok(html.includes(`id="${m[1]}"`) , `Missing id="${m[1]}"`);
        }
        const cssMatch = html.match(/href="css\/style\.css\?v=([^"]+)"/);
        const jsMatch = html.match(/<script type="module" src="js\/app\.js\?v=([^"]+)"><\/script>/);
        assert.equal(cssMatch?.[1], jsMatch?.[1]);
    });
});
