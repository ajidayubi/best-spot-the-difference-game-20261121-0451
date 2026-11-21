// Node simulation test for Lantern Harbour: plays whole games through
// the pure model and validates every scene's difference zones.
// Run: node test/sim.mjs (from the repository root, or anywhere —
// paths resolve from this file).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const model = require(join(here, '..', 'game', 'src', 'model.js'));
const scenes = require(join(here, '..', 'game', 'src', 'scenes.js'));

let failures = 0;
function check(name, ok, extra) {
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (extra !== undefined ? ' — ' + extra : ''));
  if (!ok) failures++;
}

// Every scene: exactly 7 differences, unique ids, zones inside the panel.
for (const scene of scenes.SCENES) {
  check(scene.id + ' has 7 differences', scene.diffs.length === 7, String(scene.diffs.length));
  const ids = new Set(scene.diffs.map((d) => d.id));
  check(scene.id + ' ids are unique', ids.size === 7);
  for (const d of scene.diffs) {
    check(
      scene.id + '/' + d.id + ' zone inside panel',
      d.x - d.r >= 0 && d.x + d.r <= scenes.W && d.y - d.r >= 0 && d.y + d.r <= scenes.H,
      `(${d.x},${d.y},r${d.r})`,
    );
  }
}

// A full playthrough: click every difference in every scene, in
// order, and the game must end in 'win' with the right score.
{
  const g = model.createGame();
  model.startGame(g);
  let expectedScore = 0;
  for (let level = 0; level < scenes.SCENES.length; level++) {
    const diffs = scenes.SCENES[level].diffs;
    check('level ' + (level + 1) + ' starts playing', g.status === 'playing');
    for (const d of diffs) {
      const r = model.click(g, d.x, d.y, diffs);
      check('click ' + scenes.SCENES[level].id + '/' + d.id + ' found', r === 'found');
    }
    // 7 finds at 100 each, plus the time bonus for the untouched 90s.
    expectedScore += 700 + 90 * model.TIME_BONUS_PER_SECOND;
    if (level < scenes.SCENES.length - 1) {
      check('level ' + (level + 1) + ' clears', g.status === 'levelClear', g.status);
      model.advanceLevel(g);
    }
  }
  check('full playthrough ends in win', g.status === 'win', g.status);
  check('total found is 21', g.totalFound === 21, String(g.totalFound));
  check('score is 7*100*3 + 3 time bonuses', g.score === expectedScore, g.score + ' vs ' + expectedScore);
}

// A wrong click costs 25 points and counts a mistake; clicking the
// same difference twice does not pay again.
{
  const g = model.createGame();
  model.startGame(g);
  const diffs = scenes.SCENES[0].diffs;
  const r1 = model.click(g, 5, 5, diffs);
  check('click on empty water is a miss', r1 === 'miss');
  check('miss counts one mistake', g.mistakes === 1);
  check('score stays at 0 after a miss at 0', g.score === 0);
  const d = diffs[0];
  check('click on a difference is found', model.click(g, d.x, d.y, diffs) === 'found');
  check('score is 100 after one find', g.score === 100);
  const r2 = model.click(g, d.x, d.y, diffs);
  check('clicking the same difference again is a miss', r2 === 'miss');
  check('score drops to 75 after the second miss', g.score === 75, String(g.score));
}

// A hint reveals one difference for 50 points.
{
  const g = model.createGame();
  model.startGame(g);
  const diffs = scenes.SCENES[0].diffs;
  model.click(g, diffs[0].x, diffs[0].y, diffs);
  const revealed = model.useHint(g, diffs);
  check('hint reveals a difference', revealed !== null && revealed.id === diffs[1].id, revealed && revealed.id);
  check('score is 100 - 50 after one find and one hint', g.score === 50, String(g.score));
  check('hintsUsed counts 1', g.hintsUsed === 1);
}

// The timer ends the run at zero.
{
  const g = model.createGame();
  model.startGame(g);
  model.tick(g, 89.5);
  check('still playing at 0.5s left', g.status === 'playing');
  model.tick(g, 1);
  check('game over at 0s', g.status === 'gameover', g.status);
  check('timeLeft clamps at 0', g.timeLeft === 0);
}

// Clicks do nothing before the game starts.
{
  const g = model.createGame();
  const r = model.click(g, 100, 100, scenes.SCENES[0].diffs);
  check('click on the title screen is idle', r === 'idle');
}

console.log(failures === 0 ? '\nALL SIM CHECKS PASSED' : `\n${failures} SIM CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
