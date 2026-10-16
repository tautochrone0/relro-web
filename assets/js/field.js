// The same quiet, drifting hash tree as the dark site, behind the whole page, in paper colours.
(function(){
  var cv = document.getElementById('field'), ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W, H, DPR, F, nodes = [], path = [];
  var DEPTH = window.innerWidth < 700 ? 6 : 7;
  var N = 1 << (DEPTH - 1), SEP = 520, SPREAD = 3200;
  var camY = -900, camX = 0, camZ = 0, TOP = (DEPTH - 1) * SEP;   // start past the fade-in
  var SIG = '214,69,49', ASH = '110,104,93';

  function build(){
    nodes = [];
    var leaves = [];
    for (var i = 0; i < N; i++){
      var r = SPREAD * Math.sqrt((i + .5) / N), a = i * 2.39996323;
      leaves.push({ x:r*Math.cos(a), z:r*Math.sin(a), y:0, l:0, p:null });
    }
    nodes.push(leaves);
    for (var l = 1; l < DEPTH; l++){
      var prev = nodes[l-1], row = [];
      for (var j = 0; j < prev.length/2; j++){
        var c1 = prev[j*2], c2 = prev[j*2+1];
        var n = { x:(c1.x+c2.x)/2, z:(c1.z+c2.z)/2, y:l*SEP, l:l, p:null };
        c1.p = n; c2.p = n; row.push(n);
      }
      nodes.push(row);
    }
    path = []; var idx = 29 % N;
    for (var k = 0; k < DEPTH; k++){ path.push(nodes[k][idx]); idx = idx >> 1; }
  }
  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W*DPR; cv.height = H*DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);
    F = Math.max(W,H) * .8;
  }
  function place(y){
    var lf = Math.max(0, Math.min(DEPTH-1.001, y/SEP));
    var l = Math.floor(lf), t = lf - l, e = t*t*(3-2*t);
    var a = path[l], b = path[Math.min(DEPTH-1, l+1)];
    camX = a.x + (b.x-a.x)*e; camZ = a.z + (b.z-a.z)*e;
  }
  var spin = 0;   // slow turn of the whole tree around the line of sight
  function screen(n, s, cx, cy){
    var x = n.x - camX, z = n.z - camZ, c = Math.cos(spin), si = Math.sin(spin);
    return [cx + (x*c - z*si)*s, cy + (x*si + z*c)*s];
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    // fade out near the top and back in after the restart, so the loop has no visible jump
    var u = (camY + 1400) / (TOP - 200 + 1400);
    ctx.globalAlpha = Math.max(0, Math.min(1, u / .08, (1 - u) / .08));
    var cx = W/2, cy = H*.5, NEAR = 80, FAR = SEP*7;
    var items = [];
    for (var l = 0; l < DEPTH; l++){
      for (var i = 0; i < nodes[l].length; i++){
        var n = nodes[l][i], d = n.y - camY;
        if (d < NEAR || d > FAR) continue;
        var s = F/d, p = screen(n, s, cx, cy);
        items.push({ n:n, d:d, s:s, sx:p[0], sy:p[1],
                     r:Math.max(.5,(l===0?14:18+l*4)*s), fog:Math.max(0,1-d/FAR),
                     on: path.indexOf(n) > -1 });
      }
    }
    items.sort(function(a,b){ return b.d - a.d; });
    for (var k = 0; k < items.length; k++){
      var it = items[k], nd = it.n;
      if (!nd.p) continue;
      var pd = nd.p.y - camY; if (pd < NEAR) continue;
      var pp = screen(nd.p, F/pd, cx, cy), lit = it.on && path.indexOf(nd.p) > -1;
      ctx.beginPath(); ctx.moveTo(it.sx, it.sy);
      ctx.lineTo(pp[0], pp[1]);
      ctx.strokeStyle = lit ? 'rgba('+SIG+','+(.5*it.fog+.25)+')'
                            : 'rgba('+ASH+','+(.32*it.fog+.08)+')';
      ctx.lineWidth = lit ? Math.max(.9,1.6*it.s) : Math.max(.5,.8*it.s);
      ctx.stroke();
    }
    for (var k2 = 0; k2 < items.length; k2++){
      var q = items[k2];
      ctx.beginPath(); ctx.arc(q.sx, q.sy, q.r, 0, 6.2832);
      ctx.fillStyle = q.on ? 'rgba('+SIG+','+(.35*q.fog+.4)+')'
                           : 'rgba('+ASH+','+(.4*q.fog+.1)+')';
      ctx.fill();
    }
  }
  build(); resize(); place(camY); draw();

  if (!reduce){
    var last = performance.now();
    (function loop(now){
      var dt = Math.min(50, now - last); last = now;
      camY += dt * 0.022;                      // a slow, patient ascent, as on the original site
      if (camY > TOP - 200) camY = -1400;
      place(camY); draw();
      requestAnimationFrame(loop);
    })(last);
  }

  var rt;
  window.addEventListener('resize', function(){
    clearTimeout(rt); rt = setTimeout(function(){ resize(); place(camY); draw(); }, 150);
  });
})();
