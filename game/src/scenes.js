// The three scenes of Lantern Harbour, drawn entirely in code.
// Each scene paints the same picture twice: variant 0 is the original
// on the left panel, variant 1 the changed one on the right. The seven
// differences are the only places the two variants disagree, and each
// one carries the circular hit zone the model clicks against.
//
// Panel space is 600 wide by 440 tall in every scene. Decorative
// scatter (stars, pebbles, grass) comes from the seeded rng so both
// panels agree on everything except the seven differences.
(function (root) {
  'use strict';

  var W = 600;
  var H = 440;

  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function poly(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  function gull(ctx, x, y, s, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10 * s, y);
    ctx.quadraticCurveTo(x - 4 * s, y - 7 * s, x, y);
    ctx.quadraticCurveTo(x + 4 * s, y - 7 * s, x + 10 * s, y);
    ctx.stroke();
  }

  function lantern(ctx, x, y, color, lit) {
    ctx.strokeStyle = '#5a3a28';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x, y - 6);
    ctx.stroke();
    ctx.fillStyle = color;
    ellipse(ctx, x, y + 4, 11, 14);
    ctx.fillStyle = 'rgba(255, 220, 130, 0.9)';
    if (lit) ellipse(ctx, x, y + 4, 6, 8);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x - 11, y - 9, 22, 4);
    ctx.fillRect(x - 11, y + 15, 22, 4);
  }

  // ---------------------------------------------------------- scene 1
  // Harbour Sunset: a fishing harbour at dusk — lighthouse, moored
  // boat, dock, and a string of paper lanterns over the water.
  var HARBOUR_DIFFS = [
    { id: 'sun', label: 'the sun changed colour', x: 468, y: 108, r: 46 },
    { id: 'gull', label: 'an extra gull in the sky', x: 300, y: 82, r: 24 },
    { id: 'flag', label: 'the boat lost its flag', x: 392, y: 232, r: 20 },
    { id: 'lamp', label: 'the lighthouse lamp went dark', x: 92, y: 96, r: 30 },
    { id: 'crate', label: 'an extra crate on the dock', x: 522, y: 398, r: 26 },
    { id: 'cloud', label: 'a cloud vanished', x: 180, y: 72, r: 34 },
    { id: 'lantern', label: 'a lantern changed colour', x: 250, y: 182, r: 18 },
  ];

  function drawHarbour(ctx, variant, rng) {
    // Sky: dusk gradient.
    var sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, '#2c3e70');
    sky.addColorStop(0.55, '#e8703f');
    sky.addColorStop(1, '#ffb347');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 300);

    // Sun. Difference 1: orange on the left, rose-red on the right.
    ctx.fillStyle = variant === 1 ? '#ff5e7a' : '#ffb347';
    circle(ctx, 468, 108, 42);
    ctx.fillStyle = 'rgba(255, 200, 120, 0.35)';
    circle(ctx, 468, 108, 58);

    // Clouds. Difference 6: the cloud at (180, 72) is gone on the right.
    ctx.fillStyle = 'rgba(255, 235, 220, 0.85)';
    if (variant === 0) {
      ellipse(ctx, 180, 72, 46, 14);
      ellipse(ctx, 205, 66, 32, 12);
    }
    ellipse(ctx, 380, 52, 40, 12);
    ellipse(ctx, 404, 46, 26, 10);
    ellipse(ctx, 90, 150, 34, 10);

    // Gulls. Difference 2: an extra gull at (300, 82) on the right.
    gull(ctx, 240, 120, 1, '#3a2c2c');
    gull(ctx, 330, 150, 0.8, '#3a2c2c');
    if (variant === 1) gull(ctx, 300, 82, 1, '#3a2c2c');

    // Sea.
    var sea = ctx.createLinearGradient(0, 260, 0, H);
    sea.addColorStop(0, '#c96a3b');
    sea.addColorStop(1, '#5a2e4a');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 260, W, H - 260);
    ctx.strokeStyle = 'rgba(255, 210, 150, 0.5)';
    ctx.lineWidth = 2;
    for (var i = 0; i < 5; i++) {
      var wy = 285 + i * 28;
      ctx.beginPath();
      ctx.moveTo(20 + i * 12, wy);
      ctx.quadraticCurveTo(150 + i * 40, wy - 6, 300 + i * 30, wy);
      ctx.quadraticCurveTo(450, wy + 6, 580, wy);
      ctx.stroke();
    }

    // Lighthouse. Difference 4: lamp lit on the left, dark on the right.
    ctx.fillStyle = '#f5ead6';
    poly(ctx, [[72, 260], [112, 260], [106, 120], [78, 120]]);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(75, 200, 34, 18);
    ctx.fillRect(78, 150, 28, 14);
    ctx.fillStyle = '#3a2c2c';
    ctx.fillRect(76, 108, 32, 14);
    if (variant === 0) {
      ctx.fillStyle = '#ffe27a';
      circle(ctx, 92, 96, 12);
      ctx.fillStyle = 'rgba(255, 226, 122, 0.25)';
      poly(ctx, [[92, 96], [190, 60], [190, 132]]);
    } else {
      ctx.fillStyle = '#4a4a55';
      circle(ctx, 92, 96, 12);
    }
    ctx.fillStyle = '#3a2c2c';
    poly(ctx, [[72, 108], [112, 108], [92, 84]]);

    // Moored boat with a sail. Difference 3: the red flag is gone
    // on the right.
    ctx.fillStyle = '#7a4a2b';
    poly(ctx, [[330, 300], [470, 300], [450, 330], [350, 330]]);
    ctx.fillStyle = '#f5ead6';
    poly(ctx, [[368, 296], [368, 210], [430, 296]]);
    ctx.strokeStyle = '#5a3a28';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(368, 296);
    ctx.lineTo(368, 200);
    ctx.stroke();
    if (variant === 0) {
      ctx.fillStyle = '#c0392b';
      poly(ctx, [[368, 200], [396, 208], [368, 218]]);
    }

    // Dock planks along the bottom.
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(0, 372, W, 68);
    ctx.strokeStyle = '#4a2c14';
    ctx.lineWidth = 2;
    for (var px = 0; px < W; px += 60) {
      ctx.beginPath();
      ctx.moveTo(px, 372);
      ctx.lineTo(px, H);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.moveTo(0, 396);
    ctx.lineTo(W, 396);
    ctx.stroke();

    // Crates on the dock. Difference 5: an extra crate on the right.
    ctx.fillStyle = '#a8763e';
    ctx.fillRect(480, 396, 30, 30);
    ctx.strokeStyle = '#6b4423';
    ctx.strokeRect(480, 396, 30, 30);
    if (variant === 1) {
      ctx.fillStyle = '#a8763e';
      ctx.fillRect(522, 384, 26, 26);
      ctx.strokeRect(522, 384, 26, 26);
      ctx.beginPath();
      ctx.moveTo(522, 384);
      ctx.lineTo(548, 410);
      ctx.moveTo(548, 384);
      ctx.lineTo(522, 410);
      ctx.stroke();
    }

    // String of paper lanterns over the water. Difference 7: the
    // lantern at (250, 182) is amber on the left, teal on the right.
    ctx.strokeStyle = '#5a3a28';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(140, 150);
    ctx.quadraticCurveTo(300, 196, 470, 150);
    ctx.stroke();
    lantern(ctx, 180, 172, '#ff9f43', true);
    lantern(ctx, 250, 182, variant === 1 ? '#2ec4b6' : '#ff9f43', true);
    lantern(ctx, 320, 182, '#ff9f43', true);
    lantern(ctx, 390, 172, '#e74c3c', true);
  }

  // ---------------------------------------------------------- scene 2
  // Forest Dawn: a misty clearing — old oaks, a stream, mushrooms,
  // a butterfly and a hollow with an owl.
  var FOREST_DIFFS = [
    { id: 'mushroom', label: 'a mushroom vanished', x: 140, y: 362, r: 26 },
    { id: 'bird', label: 'a bird flew away', x: 430, y: 92, r: 22 },
    { id: 'flower', label: 'a flower changed colour', x: 300, y: 390, r: 18 },
    { id: 'rock', label: 'an extra rock by the stream', x: 500, y: 382, r: 24 },
    { id: 'owl', label: 'the owl left its hollow', x: 110, y: 182, r: 26 },
    { id: 'butterfly', label: 'the butterfly changed colour', x: 360, y: 152, r: 22 },
    { id: 'stone', label: 'a stepping stone vanished', x: 250, y: 332, r: 22 },
  ];

  function tree(ctx, x, baseY, s, leaf, trunk) {
    ctx.fillStyle = trunk;
    ctx.fillRect(x - 9 * s, baseY - 120 * s, 18 * s, 120 * s);
    ctx.fillStyle = leaf;
    circle(ctx, x, baseY - 140 * s, 52 * s);
    circle(ctx, x - 38 * s, baseY - 108 * s, 34 * s);
    circle(ctx, x + 38 * s, baseY - 108 * s, 34 * s);
  }

  function mushroom(ctx, x, y, s, cap) {
    ctx.fillStyle = '#f5ead6';
    ctx.fillRect(x - 3 * s, y, 6 * s, 12 * s);
    ctx.fillStyle = cap;
    ctx.beginPath();
    ctx.arc(x, y, 12 * s, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circle(ctx, x - 5 * s, y - 6 * s, 2 * s);
    circle(ctx, x + 4 * s, y - 8 * s, 2 * s);
  }

  function drawForest(ctx, variant, rng) {
    // Pale dawn sky and soft sun.
    var sky = ctx.createLinearGradient(0, 0, 0, 260);
    sky.addColorStop(0, '#bfe3c0');
    sky.addColorStop(1, '#f2e8b8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 300);
    ctx.fillStyle = '#fff3b0';
    circle(ctx, 500, 90, 34);
    ctx.fillStyle = 'rgba(255, 243, 176, 0.35)';
    circle(ctx, 500, 90, 50);

    // Birds. Difference 2: the bird at (430, 92) is gone on the right.
    gull(ctx, 200, 80, 0.9, '#4a3a30');
    gull(ctx, 290, 60, 0.8, '#4a3a30');
    if (variant === 0) gull(ctx, 430, 92, 0.9, '#4a3a30');

    // Ground and stream.
    ctx.fillStyle = '#6fae5e';
    ctx.fillRect(0, 280, W, H - 280);
    ctx.fillStyle = '#7fc4d8';
    poly(ctx, [[180, 440], [260, 280], [330, 280], [300, 440]]);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(265, 300);
    ctx.lineTo(245, 420);
    ctx.stroke();

    // Stepping stone. Difference 7: gone on the right.
    if (variant === 0) {
      ctx.fillStyle = '#9a9a8a';
      ellipse(ctx, 250, 332, 22, 10);
    }

    // Old oaks. Difference 5: the owl in the left tree's hollow.
    tree(ctx, 110, 330, 1.1, '#3e7d32', '#6b4423');
    tree(ctx, 480, 340, 1.25, '#4a8f3c', '#5a3a28');
    tree(ctx, 300, 320, 0.8, '#5aa347', '#6b4423');
    ctx.fillStyle = '#2c1c10';
    ellipse(ctx, 110, 182, 14, 18);
    if (variant === 0) {
      ctx.fillStyle = '#8a6d4b';
      circle(ctx, 110, 182, 11);
      ctx.fillStyle = '#fff';
      circle(ctx, 106, 179, 3);
      circle(ctx, 114, 179, 3);
      ctx.fillStyle = '#222';
      circle(ctx, 106, 179, 1.5);
      circle(ctx, 114, 179, 1.5);
      ctx.fillStyle = '#f2a541';
      poly(ctx, [[110, 184], [106, 190], [114, 190]]);
    }

    // Butterfly. Difference 6: orange on the left, violet on the right.
    var wing = variant === 1 ? '#8e44ad' : '#f39c12';
    ctx.fillStyle = wing;
    ellipse(ctx, 352, 148, 10, 7);
    ellipse(ctx, 368, 148, 10, 7);
    ellipse(ctx, 352, 158, 8, 5);
    ellipse(ctx, 368, 158, 8, 5);
    ctx.strokeStyle = '#3a2c2c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(360, 144);
    ctx.lineTo(360, 162);
    ctx.stroke();

    // Mushrooms. Difference 1: the middle mushroom is gone on the right.
    mushroom(ctx, 120, 356, 1, '#e74c3c');
    if (variant === 0) mushroom(ctx, 142, 362, 0.8, '#e74c3c');
    mushroom(ctx, 162, 360, 0.9, '#c0392b');

    // Flowers along the bottom. Difference 3: the flower at (300, 390)
    // is pink on the left, blue on the right.
    var petals = ['#ff6b9d', '#ffd93d', '#ff6b9d', '#fff', '#ff6b9d'];
    for (var i = 0; i < 5; i++) {
      var fx = 240 + i * 34;
      var fc = i === 2 && variant === 1 ? '#4a90d9' : petals[i];
      ctx.fillStyle = fc;
      for (var p = 0; p < 5; p++) {
        var a = (p / 5) * Math.PI * 2;
        circle(ctx, fx + Math.cos(a) * 7, 388 + Math.sin(a) * 7, 5);
      }
      ctx.fillStyle = '#f2a541';
      circle(ctx, fx, 388, 4);
    }

    // Rock by the stream. Difference 4: extra rock on the right.
    ctx.fillStyle = '#8a8a7a';
    ellipse(ctx, 350, 400, 26, 14);
    if (variant === 1) {
      ctx.fillStyle = '#8a8a7a';
      ellipse(ctx, 500, 382, 24, 13);
    }

    // Grass tufts, seeded so both panels match.
    ctx.strokeStyle = '#4a8f3c';
    ctx.lineWidth = 2;
    for (var g = 0; g < 40; g++) {
      var gx = rng.range(10, W - 10);
      var gy = rng.range(300, H - 8);
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx - 3, gy - 10);
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 3, gy - 9);
      ctx.stroke();
    }
  }

  // ---------------------------------------------------------- scene 3
  // Night Market: lanterns and stalls under a starry sky, a cat
  // asleep on a crate, and the moon over the rooftops.
  var MARKET_DIFFS = [
    { id: 'lantern', label: 'a lantern went out', x: 200, y: 122, r: 24 },
    { id: 'star', label: 'a bright star vanished', x: 520, y: 62, r: 20 },
    { id: 'awning', label: 'an awning changed colour', x: 350, y: 202, r: 26 },
    { id: 'cat', label: 'the cat wandered off', x: 480, y: 382, r: 28 },
    { id: 'oranges', label: 'extra oranges on the stall', x: 150, y: 322, r: 24 },
    { id: 'window', label: 'a window went dark', x: 60, y: 242, r: 22 },
    { id: 'moon', label: 'the moon lost a crater', x: 92, y: 82, r: 30 },
  ];

  function stall(ctx, x, y, w, awningA, awningB) {
    ctx.fillStyle = '#7a4a2b';
    ctx.fillRect(x, y, w, 110);
    ctx.fillStyle = '#8a5a35';
    ctx.fillRect(x, y + 60, w, 10);
    for (var i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? awningA : awningB;
      var sx = x - 8 + (i * (w + 16)) / 6;
      poly(ctx, [[sx, y], [sx + (w + 16) / 6, y], [sx + (w + 16) / 6, y - 34], [sx, y - 34]]);
    }
    ctx.fillStyle = '#3a2c2c';
    ctx.fillRect(x - 8, y - 38, w + 16, 6);
  }

  function drawMarket(ctx, variant, rng) {
    // Night sky, moon and stars. Difference 2: the bright star at
    // (520, 62) is gone on the right. Difference 7: the moon's crater.
    var sky = ctx.createLinearGradient(0, 0, 0, 280);
    sky.addColorStop(0, '#0d1b3e');
    sky.addColorStop(1, '#274b7a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 300);
    ctx.fillStyle = '#f5f0d8';
    circle(ctx, 92, 82, 30);
    if (variant === 0) {
      ctx.fillStyle = '#d8d2b8';
      circle(ctx, 84, 76, 6);
      circle(ctx, 100, 90, 4);
    }
    ctx.fillStyle = '#fff';
    for (var s = 0; s < 26; s++) {
      var sx = rng.range(10, W - 10);
      var sy = rng.range(10, 240);
      var sr = rng.range(1, 2.4);
      circle(ctx, sx, sy, sr);
    }
    if (variant === 0) {
      ctx.fillStyle = '#fffbe0';
      circle(ctx, 520, 62, 4);
      ctx.strokeStyle = 'rgba(255, 251, 224, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(520 - 10, 62);
      ctx.lineTo(520 + 10, 62);
      ctx.moveTo(520, 62 - 10);
      ctx.lineTo(520, 62 + 10);
      ctx.stroke();
    }

    // Rooftops and a lit window. Difference 6: the window at (60, 242)
    // is lit on the left, dark on the right.
    ctx.fillStyle = '#1c2a4a';
    poly(ctx, [[0, 300], [0, 220], [90, 180], [180, 220], [180, 300]]);
    poly(ctx, [[420, 300], [420, 230], [510, 190], [600, 230], [600, 300]]);
    ctx.fillStyle = variant === 0 ? '#ffd93d' : '#2c3a55';
    ctx.fillRect(46, 228, 28, 28);
    ctx.strokeStyle = '#0d1b3e';
    ctx.lineWidth = 2;
    ctx.strokeRect(46, 228, 28, 28);
    ctx.beginPath();
    ctx.moveTo(60, 228);
    ctx.lineTo(60, 256);
    ctx.stroke();

    // Ground.
    ctx.fillStyle = '#3a2c2c';
    ctx.fillRect(0, 300, W, H - 300);
    ctx.fillStyle = '#4a3a30';
    for (var gx = 0; gx < W; gx += 48) {
      ctx.fillRect(gx, 300, 2, H - 300);
    }

    // Two stalls. Difference 3: the right stall's awning is
    // red-and-cream on the left, green-and-cream on the right.
    stall(ctx, 90, 300, 150, '#c0392b', '#f5ead6');
    stall(ctx, 330, 300, 150, variant === 1 ? '#27ae60' : '#c0392b', '#f5ead6');

    // Fruit on the left stall. Difference 5: extra oranges on the right.
    ctx.fillStyle = '#f39c12';
    var oranges = [[120, 322], [136, 322], [152, 322], [128, 308], [144, 308]];
    for (var o = 0; o < oranges.length; o++) circle(ctx, oranges[o][0], oranges[o][1], 8);
    if (variant === 1) {
      circle(ctx, 168, 322, 8);
      circle(ctx, 160, 308, 8);
    }
    ctx.fillStyle = '#e74c3c';
    circle(ctx, 370, 322, 8);
    circle(ctx, 386, 322, 8);
    circle(ctx, 378, 308, 8);
    ctx.fillStyle = '#27ae60';
    circle(ctx, 420, 322, 8);
    circle(ctx, 436, 322, 8);

    // Lantern strings. Difference 1: the lantern at (200, 122) is
    // missing on the right.
    ctx.strokeStyle = '#1c2a4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 96);
    ctx.quadraticCurveTo(300, 140, 540, 96);
    ctx.stroke();
    lantern(ctx, 130, 112, '#ff9f43', true);
    if (variant === 0) lantern(ctx, 200, 122, '#e74c3c', true);
    lantern(ctx, 280, 124, '#ff9f43', true);
    lantern(ctx, 360, 124, '#f2a541', true);
    lantern(ctx, 440, 112, '#e74c3c', true);

    // The cat asleep on a crate. Difference 4: gone on the right.
    ctx.fillStyle = '#a8763e';
    ctx.fillRect(452, 396, 56, 30);
    ctx.strokeStyle = '#6b4423';
    ctx.strokeRect(452, 396, 56, 30);
    if (variant === 0) {
      ctx.fillStyle = '#e8e8e8';
      ellipse(ctx, 480, 386, 22, 11);
      circle(ctx, 462, 378, 9);
      poly(ctx, [[456, 372], [460, 362], [464, 371]]);
      poly(ctx, [[466, 371], [470, 361], [472, 371]]);
      ctx.strokeStyle = '#e8e8e8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(500, 386);
      ctx.quadraticCurveTo(514, 380, 512, 370);
      ctx.stroke();
    }
  }

  var SCENES = [
    { id: 'harbour', name: 'Harbour Sunset', draw: drawHarbour, diffs: HARBOUR_DIFFS, seed: 11 },
    { id: 'forest', name: 'Forest Dawn', draw: drawForest, diffs: FOREST_DIFFS, seed: 22 },
    { id: 'market', name: 'Night Market', draw: drawMarket, diffs: MARKET_DIFFS, seed: 33 },
  ];

  // Paint one panel of a scene. variant 0 is the left picture,
  // variant 1 the right. The rng is fresh per panel so the scatter
  // matches between the two.
  function drawScene(ctx, sceneIndex, variant) {
    var scene = SCENES[sceneIndex];
    var rng = root.SpotRng.makeRng(scene.seed * 1000 + 7);
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    scene.draw(ctx, variant, rng);
    ctx.restore();
  }

  var api = {
    W: W,
    H: H,
    SCENES: SCENES,
    drawScene: drawScene,
  };
  root.SpotScenes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
