// Rendering for Lantern Harbour: paints both panels, the green
// markers on found differences, the red flash on a miss, and the
// end-of-scene overlays. The HUD itself lives in the DOM (crisp text
// at small sizes); this file owns everything drawn on canvas.
(function (root) {
  'use strict';

  var MARKER_COLOR = '#2ecc71';
  var MARKER_RING = '#ffffff';

  // Paint one panel (left = variant 0, right = variant 1) and ring
  // every difference the player has already found in it.
  function drawPanel(canvas, sceneIndex, variant, foundIds) {
    var ctx = canvas.getContext('2d');
    root.SpotScenes.drawScene(ctx, sceneIndex, variant);
    var diffs = root.SpotScenes.SCENES[sceneIndex].diffs;
    for (var i = 0; i < diffs.length; i++) {
      if (foundIds.indexOf(diffs[i].id) !== -1) {
        drawMarker(ctx, diffs[i]);
      }
    }
  }

  // A green ring with a check mark, drawn over a found difference.
  function drawMarker(ctx, diff) {
    ctx.save();
    ctx.strokeStyle = MARKER_COLOR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(diff.x, diff.y, diff.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = MARKER_RING;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(diff.x, diff.y, diff.r + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = MARKER_COLOR;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(diff.x - diff.r * 0.45, diff.y);
    ctx.lineTo(diff.x - diff.r * 0.1, diff.y + diff.r * 0.35);
    ctx.lineTo(diff.x + diff.r * 0.5, diff.y - diff.r * 0.35);
    ctx.stroke();
    ctx.restore();
  }

  // A brief red X where a wrong click landed.
  function drawMiss(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    var r = 14;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r);
    ctx.lineTo(x + r, y + r);
    ctx.moveTo(x + r, y - r);
    ctx.lineTo(x - r, y + r);
    ctx.stroke();
    ctx.restore();
  }

  // A translucent overlay panel with a title, a few lines, and a
  // hint of what to press next. Used for title, level-clear, win
  // and game-over states.
  function drawOverlay(canvas, title, lines, accent) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    ctx.save();
    ctx.fillStyle = 'rgba(13, 27, 62, 0.82)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent || '#ffd93d';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, h / 2 - 60);
    ctx.fillStyle = '#f5ead6';
    ctx.font = '20px Georgia, serif';
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], w / 2, h / 2 - 10 + i * 32);
    }
    ctx.restore();
  }

  // Draw a soft pulsing ring around one difference, for the hint.
  function drawHintRing(ctx, diff, pulse) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 217, 61, ' + (0.55 + 0.45 * pulse) + ')';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(diff.x, diff.y, diff.r + 6 + 4 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  var api = {
    drawPanel: drawPanel,
    drawMarker: drawMarker,
    drawMiss: drawMiss,
    drawOverlay: drawOverlay,
    drawHintRing: drawHintRing,
  };
  root.SpotRender = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
