// Pure game model for Lantern Harbour — Spot the Difference.
// No DOM, no canvas, no timers of its own: the browser loop owns time
// and calls tick(dt), and the Node simulation test requires this file
// and plays whole games through it, so the rules are identical in both.
(function (root) {
  'use strict';

  // One level per scene. time is the seconds the player gets for it,
  // foundNeeded is how many differences hide in it (7 in every scene).
  var LEVELS = [
    { id: 'harbour', name: 'Harbour Sunset', time: 90, foundNeeded: 7 },
    { id: 'forest', name: 'Forest Dawn', time: 90, foundNeeded: 7 },
    { id: 'market', name: 'Night Market', time: 90, foundNeeded: 7 },
  ];

  var POINTS_FOUND = 100;
  var POINTS_HINT_COST = 50;
  var POINTS_WRONG = 25;
  var TIME_BONUS_PER_SECOND = 2;

  function createGame() {
    return {
      status: 'title', // title | playing | levelClear | win | gameover
      level: 0,
      found: [], // ids of the differences found in the current level
      score: 0,
      mistakes: 0,
      hintsUsed: 0,
      timeLeft: LEVELS[0].time,
      levelScore: 0,
      totalFound: 0,
      message: '',
    };
  }

  function currentLevel(game) {
    return LEVELS[game.level];
  }

  function startGame(game) {
    game.status = 'playing';
    game.level = 0;
    game.found = [];
    game.score = 0;
    game.mistakes = 0;
    game.hintsUsed = 0;
    game.timeLeft = LEVELS[0].time;
    game.levelScore = 0;
    game.totalFound = 0;
    game.message = '';
    return game;
  }

  function startLevel(game, index) {
    game.level = index;
    game.found = [];
    game.timeLeft = LEVELS[index].time;
    game.levelScore = 0;
    game.status = 'playing';
    game.message = '';
    return game;
  }

  function foundCount(game) {
    return game.found.length;
  }

  function remainingCount(game) {
    return currentLevel(game).foundNeeded - game.found.length;
  }

  function isFound(game, id) {
    return game.found.indexOf(id) !== -1;
  }

  // A click at panel coordinates (x, y). diffs is the current scene's
  // list of {id, x, y, r}. Returns 'found' | 'already' | 'miss'.
  // A found difference is worth 100 points; a miss costs 25 points
  // (never below zero) and counts as a mistake.
  function click(game, x, y, diffs) {
    if (game.status !== 'playing') return 'idle';
    var best = null;
    var bestD = Infinity;
    for (var i = 0; i < diffs.length; i++) {
      var d = diffs[i];
      if (isFound(game, d.id)) continue;
      var dx = x - d.x;
      var dy = y - d.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= d.r && dist < bestD) {
        best = d;
        bestD = dist;
      }
    }
    if (best === null) {
      game.mistakes += 1;
      game.score = Math.max(0, game.score - POINTS_WRONG);
      game.levelScore = Math.max(0, game.levelScore - POINTS_WRONG);
      return 'miss';
    }
    game.found.push(best.id);
    game.score += POINTS_FOUND;
    game.levelScore += POINTS_FOUND;
    game.totalFound += 1;
    if (game.found.length >= currentLevel(game).foundNeeded) {
      var bonus = Math.round(game.timeLeft) * TIME_BONUS_PER_SECOND;
      game.score += bonus;
      game.levelScore += bonus;
      if (game.level + 1 >= LEVELS.length) {
        game.status = 'win';
        game.message = 'You found them all!';
      } else {
        game.status = 'levelClear';
        game.message = 'Scene complete! +' + bonus + ' time bonus';
      }
    }
    return 'found';
  }

  // Reveal one still-hidden difference (the first by list order the
  // player has not found). Costs 50 points, never below zero.
  // Returns the revealed difference, or null when nothing is left.
  function useHint(game, diffs) {
    if (game.status !== 'playing') return null;
    for (var i = 0; i < diffs.length; i++) {
      if (!isFound(game, diffs[i].id)) {
        var d = diffs[i];
        game.found.push(d.id);
        game.hintsUsed += 1;
        game.score = Math.max(0, game.score - POINTS_HINT_COST);
        game.levelScore = Math.max(0, game.levelScore - POINTS_HINT_COST);
        game.totalFound += 1;
        if (game.found.length >= currentLevel(game).foundNeeded) {
          var bonus = Math.round(game.timeLeft) * TIME_BONUS_PER_SECOND;
          game.score += bonus;
          game.levelScore += bonus;
          if (game.level + 1 >= LEVELS.length) {
            game.status = 'win';
            game.message = 'You found them all!';
          } else {
            game.status = 'levelClear';
            game.message = 'Scene complete! +' + bonus + ' time bonus';
          }
        }
        return d;
      }
    }
    return null;
  }

  // Advance the clock by dt seconds. At zero the run ends — unless the
  // level was already cleared by the click that same tick.
  function tick(game, dt) {
    if (game.status !== 'playing') return game;
    game.timeLeft -= dt;
    if (game.timeLeft <= 0) {
      game.timeLeft = 0;
      game.status = 'gameover';
      game.message = 'Out of time!';
    }
    return game;
  }

  function advanceLevel(game) {
    if (game.status !== 'levelClear') return game;
    return startLevel(game, game.level + 1);
  }

  var api = {
    LEVELS: LEVELS,
    POINTS_FOUND: POINTS_FOUND,
    POINTS_HINT_COST: POINTS_HINT_COST,
    POINTS_WRONG: POINTS_WRONG,
    TIME_BONUS_PER_SECOND: TIME_BONUS_PER_SECOND,
    createGame: createGame,
    currentLevel: currentLevel,
    startGame: startGame,
    startLevel: startLevel,
    foundCount: foundCount,
    remainingCount: remainingCount,
    isFound: isFound,
    click: click,
    useHint: useHint,
    tick: tick,
    advanceLevel: advanceLevel,
  };
  root.SpotModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
