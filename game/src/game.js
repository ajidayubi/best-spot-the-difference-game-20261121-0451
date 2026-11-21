// Wiring for Lantern Harbour: the loop, the input, the state
// machine, and the deterministic shot staging the screenshots use.
//
// A shot is chosen with ?shot=start|play|play2|win|over&seed=1:
//   start  title screen over scene 1, nothing found yet
//   play   scene 1 mid-play, 3 of 7 found, 4 remaining
//   play2  scene 2 mid-play, 5 of 7 found, 2 remaining
//   win    results screen, all three scenes complete
//   over   game-over screen after the timer ran out
// Without a shot parameter the game starts on its title screen and
// plays normally. Every shot renders the same pixels on every run.
(function () {
  'use strict';

  var PANEL_W = 600;
  var PANEL_H = 440;

  var game = SpotModel.createGame();
  var leftCanvas = null;
  var rightCanvas = null;
  var shot = null;
  var missMark = null; // {canvas, x, y, until}
  var hintMark = null; // {diff, until}
  var lastTickSecond = -1;
  var lastTime = 0;

  function $(id) {
    return document.getElementById(id);
  }

  function sceneDiffs() {
    return SpotScenes.SCENES[game.level].diffs;
  }

  function sceneName() {
    return SpotScenes.SCENES[game.level].name;
  }

  function updateHud() {
    $('hud-level').textContent = 'Scene ' + (game.level + 1) + ' of 3 — ' + sceneName();
    $('hud-found').textContent = 'Found ' + SpotModel.foundCount(game) + ' / 7';
    $('hud-remaining').textContent = SpotModel.remainingCount(game) + ' remaining';
    $('hud-score').textContent = 'Score ' + game.score;
    var seconds = Math.max(0, Math.ceil(game.timeLeft));
    $('hud-time').textContent = '⏱ ' + seconds + 's';
    $('hud-time').classList.toggle('low', game.timeLeft <= 10 && game.status === 'playing');
    var bar = $('time-bar');
    if (bar) bar.style.width = Math.max(0, (game.timeLeft / SpotModel.currentLevel(game).time) * 100) + '%';
    $('hud-mistakes').textContent = game.mistakes === 0 ? '' : 'Misses: ' + game.mistakes;
  }

  function paint() {
    SpotRender.drawPanel(leftCanvas, game.level, 0, game.found);
    SpotRender.drawPanel(rightCanvas, game.level, 1, game.found);
    var now = performance.now();
    if (missMark && now < missMark.until) {
      var ctx = missMark.canvas.getContext('2d');
      SpotRender.drawMiss(ctx, missMark.x, missMark.y);
    } else {
      missMark = null;
    }
    if (hintMark && now < hintMark.until) {
      var pulse = (Math.sin(now / 180) + 1) / 2;
      var c0 = leftCanvas.getContext('2d');
      var c1 = rightCanvas.getContext('2d');
      SpotRender.drawHintRing(c0, hintMark.diff, pulse);
      SpotRender.drawHintRing(c1, hintMark.diff, pulse);
    } else {
      hintMark = null;
    }
  }

  function showTitle() {
    paint();
    SpotRender.drawOverlay(
      leftCanvas,
      'Lantern Harbour',
      ['Find 7 differences in each of 3 scenes.', 'Click a difference on either picture.', 'Press Enter or click Start to play.'],
      '#ffd93d'
    );
    SpotRender.drawOverlay(
      rightCanvas,
      'Spot the Difference',
      ['7 differences · 90 seconds a scene', 'Wrong click −25 · Hint −50', 'H for hint · M to mute · R to restart'],
      '#7fc4d8'
    );
  }

  function showEndScreen() {
    paint();
    if (game.status === 'win') {
      SpotRender.drawOverlay(
        leftCanvas,
        'You found them all!',
        ['All 3 scenes complete.', 'Final score: ' + game.score, 'Mistakes: ' + game.mistakes + ' · Hints: ' + game.hintsUsed],
        '#2ecc71'
      );
      SpotRender.drawOverlay(
        rightCanvas,
        'Lanterns lit!',
        ['Thanks for playing Lantern Harbour.', 'Press R or click Play Again', 'to light the lanterns once more.'],
        '#ffd93d'
      );
    } else if (game.status === 'gameover') {
      SpotRender.drawOverlay(
        leftCanvas,
        "Time's up!",
        ['You found ' + SpotModel.foundCount(game) + ' of 7 in ' + sceneName() + '.', 'Score: ' + game.score, 'Press R or click Play Again to retry.'],
        '#e74c3c'
      );
      SpotRender.drawOverlay(
        rightCanvas,
        'The lanterns dim…',
        ['The differences are still hiding.', 'Try again — they are in the same places.', 'Press R or click Play Again.'],
        '#7fc4d8'
      );
    } else if (game.status === 'levelClear') {
      SpotRender.drawOverlay(
        leftCanvas,
        'Scene complete!',
        [sceneName() + ' — all 7 found.', 'Scene score: ' + game.levelScore, 'Press Enter or click Next Scene.'],
        '#2ecc71'
      );
      SpotRender.drawOverlay(
        rightCanvas,
        'Next: ' + SpotScenes.SCENES[game.level + 1].name,
        ['7 more differences are hiding there.', '', 'Press Enter or click Next Scene.'],
        '#ffd93d'
      );
    }
  }

  function refresh() {
    updateHud();
    if (game.status === 'title') {
      showTitle();
    } else if (game.status === 'playing') {
      paint();
    } else {
      showEndScreen();
    }
  }

  function panelCoords(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * PANEL_W,
      y: ((event.clientY - rect.top) / rect.height) * PANEL_H,
    };
  }

  function onPanelClick(canvas, event) {
    if (shot) return; // staged screenshots are not played
    if (game.status === 'title') {
      startPlaying();
      return;
    }
    if (game.status === 'levelClear') {
      SpotModel.advanceLevel(game);
      refresh();
      return;
    }
    if (game.status === 'win' || game.status === 'gameover') {
      startPlaying();
      return;
    }
    var pos = panelCoords(canvas, event);
    var before = game.status;
    var result = SpotModel.click(game, pos.x, pos.y, sceneDiffs());
    if (result === 'found') {
      SpotAudio.found();
      if (game.status === 'levelClear') SpotAudio.levelClear();
      if (game.status === 'win') SpotAudio.win();
    } else if (result === 'miss') {
      SpotAudio.wrong();
      missMark = { canvas: canvas, x: pos.x, y: pos.y, until: performance.now() + 600 };
    }
    if (before === 'playing') refresh();
  }

  function startPlaying() {
    SpotModel.startGame(game);
    lastTickSecond = -1;
    refresh();
  }

  function nextScene() {
    if (game.status !== 'levelClear') return;
    SpotModel.advanceLevel(game);
    refresh();
  }

  function useHint() {
    if (shot || game.status !== 'playing') return;
    var diff = SpotModel.useHint(game, sceneDiffs());
    if (diff) {
      SpotAudio.found();
      hintMark = { diff: diff, until: performance.now() + 1600 };
      if (game.status === 'levelClear') SpotAudio.levelClear();
      if (game.status === 'win') SpotAudio.win();
      refresh();
    }
  }

  function toggleMute() {
    SpotAudio.setMuted(!SpotAudio.isMuted());
    $('btn-sound').textContent = SpotAudio.isMuted() ? '🔇 Sound off' : '🔊 Sound on';
  }

  function loop(now) {
    var dt = Math.min(0.1, (now - lastTime) / 1000 || 0);
    lastTime = now;
    if (!shot && game.status === 'playing') {
      SpotModel.tick(game, dt);
      var seconds = Math.ceil(game.timeLeft);
      if (game.timeLeft <= 10 && seconds !== lastTickSecond) {
        lastTickSecond = seconds;
        SpotAudio.tick();
      }
      if (game.status !== 'playing') {
        if (game.status === 'gameover') SpotAudio.wrong();
        refresh();
      } else {
        updateHud();
      }
    }
    if (!shot) requestAnimationFrame(loop);
  }

  // Stage a deterministic screenshot state from the URL.
  function applyShot(name) {
    shot = name;
    if (name === 'start') {
      game.status = 'title';
      game.level = 0;
      game.found = [];
      game.score = 0;
      game.timeLeft = 90;
    } else if (name === 'play') {
      game.status = 'playing';
      game.level = 0;
      game.found = ['sun', 'flag', 'cloud'];
      game.score = 300;
      game.timeLeft = 62;
    } else if (name === 'play2') {
      game.status = 'playing';
      game.level = 1;
      game.found = ['mushroom', 'bird', 'flower', 'owl', 'stone'];
      game.score = 740;
      game.timeLeft = 41;
    } else if (name === 'win') {
      game.status = 'win';
      game.level = 2;
      game.found = ['lantern', 'star', 'awning', 'cat', 'oranges', 'window', 'moon'];
      game.score = 2540;
      game.timeLeft = 34;
      game.totalFound = 21;
    } else if (name === 'over') {
      game.status = 'gameover';
      game.level = 0;
      game.found = ['sun', 'flag'];
      game.score = 175;
      game.timeLeft = 0;
    }
    refresh();
  }

  function init() {
    leftCanvas = $('panel-left');
    rightCanvas = $('panel-right');
    leftCanvas.width = PANEL_W;
    leftCanvas.height = PANEL_H;
    rightCanvas.width = PANEL_W;
    rightCanvas.height = PANEL_H;

    leftCanvas.addEventListener('click', function (e) { onPanelClick(leftCanvas, e); });
    rightCanvas.addEventListener('click', function (e) { onPanelClick(rightCanvas, e); });
    $('btn-start').addEventListener('click', function () {
      if (game.status === 'levelClear') nextScene();
      else startPlaying();
    });
    $('btn-hint').addEventListener('click', useHint);
    $('btn-sound').addEventListener('click', toggleMute);
    $('btn-restart').addEventListener('click', startPlaying);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        if (game.status === 'title' || game.status === 'win' || game.status === 'gameover') startPlaying();
        else if (game.status === 'levelClear') nextScene();
        e.preventDefault();
      } else if (e.key === 'h' || e.key === 'H') {
        useHint();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'r' || e.key === 'R') {
        startPlaying();
      }
    });

    var params = new URLSearchParams(window.location.search);
    var shotName = params.get('shot');
    if (shotName) {
      applyShot(shotName);
    } else {
      refresh();
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
