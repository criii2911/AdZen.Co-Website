/* =============================================================
   AdZen.co — Hero "Ascent" (raw WebGL, no libraries, ~6KB gz)
   -------------------------------------------------------------
   This scene shows a stack of precise glass-and-metal plates that
   assemble into an ascending, rotating tower — moving like a staged
   mechanical build (plates settle one after another, then each
   breathes on its own tiny phase) — because AdZen's whole idea is
   *engineered*, compounding growth: the stepped climb, built rather
   than hoped for.

   Why raw WebGL and not Three.js: the scene is 9 boxes and one shader.
   Three would add ~150KB gz for features we never touch. This file is
   the whole renderer.

   Material (all in the fragment shader — no textures, no env map):
     - procedural studio reflection: soft light panels + cool/lime tints
     - fresnel rim, machined bevel highlights on every edge
     - barely-there etched grid on top faces (precision, not wireframe)
   Motion: slow yaw sweep, per-plate drift, cursor tilt (lerped),
   scroll "unstack" (plates part as the hero exits).
   Performance: one rAF loop that stops when the hero is off-screen,
   covered, or the tab is hidden; DPR capped; 9 draw calls.
   ============================================================= */

var VERT = [
  'attribute vec3 a_pos; attribute vec3 a_nrm;',
  'uniform mat4 u_vp; uniform mat4 u_model; uniform mediump vec3 u_size;',
  'varying vec3 v_n; varying vec3 v_w; varying vec3 v_lp;',
  'void main(){',
  '  vec3 lp = a_pos * u_size;',
  '  vec4 w = u_model * vec4(lp, 1.0);',
  '  v_w = w.xyz; v_lp = lp;',
  '  v_n = mat3(u_model) * a_nrm;',
  '  gl_Position = u_vp * w;',
  '}'
].join('\n');

var FRAG = [
  'precision mediump float;',
  'varying vec3 v_n; varying vec3 v_w; varying vec3 v_lp;',
  'uniform vec3 u_eye; uniform vec3 u_size; uniform float u_hot; uniform float u_a;',
  'vec3 env(vec3 r){',
  '  float y = r.y * .5 + .5;',
  '  vec3 c = mix(vec3(.004,.005,.009), vec3(.035,.045,.085), smoothstep(0.,1.,y));',
  '  float p1 = smoothstep(.30,.38,r.x) * (1.-smoothstep(.46,.56,r.x)) * smoothstep(-.4,.0,r.y) * (1.-smoothstep(.6,.95,r.y));',
  '  c += vec3(.45,.62,1.) * p1 * 2.2;',
  '  float p2 = smoothstep(.70,.80,r.y) * (1.-smoothstep(.84,.93,r.y)) * (1.-smoothstep(.2,.55,abs(r.x)));',
  '  c += vec3(1.,.97,.92) * p2 * 2.4;',
  '  float p3 = smoothstep(-.62,-.54,r.x) * (1.-smoothstep(-.46,-.38,r.x)) * smoothstep(-.2,.2,r.y) * (1.-smoothstep(.5,.8,r.y));',
  '  c += vec3(.72,1.,.2) * p3 * 1.1;',
  '  c += vec3(.72,1.,.25) * smoothstep(-.5,-.95,r.y) * .12;',
  '  return c;',
  '}',
  'void main(){',
  '  vec3 N = normalize(v_n);',
  '  vec3 V = normalize(u_eye - v_w);',
  '  vec3 R = reflect(-V, N);',
  '  R = normalize(R + vec3(v_lp.x * .32, v_lp.y * .5, v_lp.z * .26));',
  '  float ndv = max(dot(N,V), 0.);',
  '  float fres = pow(1. - ndv, 3.);',
  '  float key = max(dot(N, normalize(vec3(.5,.9,.45))), 0.);',
  '  vec3 col = vec3(.008,.01,.016) + vec3(.03,.04,.07) * key;',
  '  col += env(R) * (.3 + 1.1 * fres);',
  '  vec3 hs = u_size * .5;',
  '  vec3 a = abs(v_lp);',
  '  vec3 an = abs(N);',
  '  vec3 q = hs - a;',
  '  float d = an.x > .5 ? min(q.y, q.z) : (an.y > .5 ? min(q.x, q.z) : min(q.x, q.y));',
  '  float edge = 1. - smoothstep(0., .016, d);',
  '  float edgeSoft = 1. - smoothstep(0., .09, d);',
  '  vec3 ec = mix(vec3(.62,.74,1.), vec3(.72,1.,.0), u_hot);',
  '  col += ec * edge * (.75 + 1.2 * fres) + ec * edgeSoft * .05;',
  '  float top = step(.8, N.y);',
  '  vec2 g = abs(fract(v_lp.xz * 4.) - .5);',
  '  float line = 1. - smoothstep(0., .03, min(g.x, g.y));',
  '  col += vec3(.5,.62,1.) * line * top * .035 * (1. - edgeSoft);',
  '  col += vec3(.72,1.,.0) * u_hot * (top * .32 + .06) * (1. - smoothstep(.0, .6, length(v_lp.xz)));',
  '  col = col / (1. + col * .7);',
  '  col = pow(col, vec3(.82));',
  '  gl_FragColor = vec4(col, 1.) * u_a;',
  '}'
].join('\n');

var SHADOW_V = 'attribute vec2 a_p; uniform mat4 u_vp; uniform mat4 u_model; varying vec2 v_p; void main(){ v_p=a_p; gl_Position=u_vp*u_model*vec4(a_p.x,0.,a_p.y,1.); }';
var SHADOW_F = 'precision mediump float; varying vec2 v_p; uniform float u_a; void main(){ float d=length(v_p); float a=(1.-smoothstep(.15,1.,d)); gl_FragColor=vec4(vec3(0.),a*a*.55*u_a); }';

/* ---------- tiny mat4 (column-major) ---------- */
function m4() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
function mul(a, b, o) {
  o = o || new Float32Array(16);
  for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
    o[c*4+r] = a[r]*b[c*4] + a[4+r]*b[c*4+1] + a[8+r]*b[c*4+2] + a[12+r]*b[c*4+3];
  }
  return o;
}
function persp(fovy, asp, n, f) {
  var t = 1 / Math.tan(fovy / 2), o = new Float32Array(16);
  o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f);
  return o;
}
function lookAt(e, c, u) {
  var zx = e[0]-c[0], zy = e[1]-c[1], zz = e[2]-c[2], zl = Math.hypot(zx,zy,zz); zx/=zl; zy/=zl; zz/=zl;
  var xx = u[1]*zz-u[2]*zy, xy = u[2]*zx-u[0]*zz, xz = u[0]*zy-u[1]*zx, xl = Math.hypot(xx,xy,xz); xx/=xl; xy/=xl; xz/=xl;
  var yx = zy*xz-zz*xy, yy = zz*xx-zx*xz, yz = zx*xy-zy*xx;
  return new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0, -(xx*e[0]+xy*e[1]+xz*e[2]), -(yx*e[0]+yy*e[1]+yz*e[2]), -(zx*e[0]+zy*e[1]+zz*e[2]), 1]);
}
function trs(tx, ty, tz, ry, rx, o) {
  var cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
  // Ry * Rx, then translate
  o = o || new Float32Array(16);
  o[0]=cy;   o[1]=0;  o[2]=-sy;   o[3]=0;
  o[4]=sy*sx; o[5]=cx; o[6]=cy*sx; o[7]=0;
  o[8]=sy*cx; o[9]=-sx; o[10]=cy*cx; o[11]=0;
  o[12]=tx; o[13]=ty; o[14]=tz; o[15]=1;
  return o;
}

function compile(gl, type, src) {
  var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(gl, v, f) {
  var p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, v));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, f));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

/* unit cube, per-face normals: 24 verts / 36 indices */
function cube() {
  var P = [], N = [], I = [];
  var faces = [
    [[1,0,0],[0,1,0],[0,0,1]], [[-1,0,0],[0,1,0],[0,0,-1]],
    [[0,1,0],[0,0,1],[1,0,0]], [[0,-1,0],[0,0,-1],[1,0,0]],
    [[0,0,1],[1,0,0],[0,1,0]], [[0,0,-1],[-1,0,0],[0,1,0]]
  ];
  faces.forEach(function (f, i) {
    var n = f[0], u = f[1], v = f[2];
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function (c) {
      P.push(n[0]*.5 + u[0]*c[0]*.5 + v[0]*c[1]*.5, n[1]*.5 + u[1]*c[0]*.5 + v[1]*c[1]*.5, n[2]*.5 + u[2]*c[0]*.5 + v[2]*c[1]*.5);
      N.push(n[0], n[1], n[2]);
    });
    var b = i * 4; I.push(b, b+1, b+2, b, b+2, b+3);
  });
  return { P: new Float32Array(P), N: new Float32Array(N), I: new Uint16Array(I) };
}

export function initHeroForge(canvas, opts) {
  opts = opts || {};
  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  } catch (e) { gl = null; }
  if (!gl) return null;

  var prog, sprog;
  try { prog = program(gl, VERT, FRAG); sprog = program(gl, SHADOW_V, SHADOW_F); }
  catch (err) { if (window.console) console.error('hero-forge shader:', err.message); return null; }

  var geo = cube();
  var pBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pBuf); gl.bufferData(gl.ARRAY_BUFFER, geo.P, gl.STATIC_DRAW);
  var nBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, nBuf); gl.bufferData(gl.ARRAY_BUFFER, geo.N, gl.STATIC_DRAW);
  var iBuf = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.I, gl.STATIC_DRAW);
  var qBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1]), gl.STATIC_DRAW);

  var L = {
    a_pos: gl.getAttribLocation(prog, 'a_pos'), a_nrm: gl.getAttribLocation(prog, 'a_nrm'),
    u_vp: gl.getUniformLocation(prog, 'u_vp'), u_model: gl.getUniformLocation(prog, 'u_model'),
    u_size: gl.getUniformLocation(prog, 'u_size'), u_eye: gl.getUniformLocation(prog, 'u_eye'),
    u_hot: gl.getUniformLocation(prog, 'u_hot'), u_a: gl.getUniformLocation(prog, 'u_a')
  };
  var S = {
    a_p: gl.getAttribLocation(sprog, 'a_p'), u_vp: gl.getUniformLocation(sprog, 'u_vp'),
    u_model: gl.getUniformLocation(sprog, 'u_model'), u_a: gl.getUniformLocation(sprog, 'u_a')
  };

  /* ---------- the tower: 9 plates, each turned a little further ---------- */
  var N = 9, plates = [];
  for (var i = 0; i < N; i++) {
    var k = i / (N - 1);
    plates.push({
      w: 1.9 - k * 0.55,                 // tapers as it climbs
      h: 0.2 + (i === N - 1 ? 0.04 : 0),
      y: -1.55 + i * 0.4,                // base height
      yaw: i * 0.3,                      // progressive turn = the "ascent"
      ph: Math.random() * 6.283, sp: 0.5 + Math.random() * 0.5,
      d: i * 0.1                         // staggered assembly delay
    });
  }

  var vp = m4(), view, proj, model = m4(), tmp = m4();
  var eye = [0, 1.2, 7.9];
  var W = 1, H = 1, dpr = 1;
  var mx = 0, my = 0, tx = 0, ty = 0;      // cursor target / smoothed
  var scrollP = 0, scrollS = 0;            // 0..1 hero-exit progress
  var running = false, suspended = false, inView = true, raf = 0;
  var t0 = performance.now(), lastT = t0, built = 0;
  var maxDpr = opts.maxDpr || 2;
  var frameGap = opts.frameGap || 0;       // ms; >0 caps fps (mobile)

  function size() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    W = Math.max(2, Math.round(r.width * dpr)); H = Math.max(2, Math.round(r.height * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    gl.viewport(0, 0, W, H);
    var asp = W / H;
    proj = persp(0.62, asp, 0.1, 40);
    view = lookAt(eye, [0, 0.0, 0], [0, 1, 0]);
    mul(proj, view, vp);
  }

  var ease = function (t) { t = Math.min(1, Math.max(0, t)); var u = 1 - t; return 1 - u * u * u * u; };

  function draw(now) {
    var t = (now - t0) / 1000;
    tx += (mx - tx) * 0.05; ty += (my - ty) * 0.05;
    var target = opts.getProgress ? (opts.getProgress() || 0) : 0;
    scrollP = Math.min(1, Math.max(0, target)); scrollS += (scrollP - scrollS) * 0.12;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);

    var sweep = Math.sin(t * 0.18) * 0.32;                  // slow yaw sweep
    var gy = -0.55 + sweep + tx * 0.35 + scrollS * 0.9;     // group yaw
    var gx = 0.05 + ty * 0.1 - scrollS * 0.15;              // group pitch
    var lift = scrollS * 0.55;

    /* floor shadow */
    gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(sprog);
    gl.bindBuffer(gl.ARRAY_BUFFER, qBuf);
    gl.enableVertexAttribArray(S.a_p); gl.vertexAttribPointer(S.a_p, 2, gl.FLOAT, false, 0, 0);
    gl.disableVertexAttribArray(L.a_nrm);
    gl.uniformMatrix4fv(S.u_vp, false, vp);
    var sh = trs(0, -1.85 - lift * 0.4, 0, 0, 0, tmp);
    sh[0] = 2.3; sh[10] = 2.3;                               // scale x/z
    gl.uniformMatrix4fv(S.u_model, false, sh);
    gl.uniform1f(S.u_a, Math.max(0, 1 - scrollS * 1.2) * ease(t / 1.2));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(S.a_p);

    /* plates */
    gl.enable(gl.CULL_FACE);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuf); gl.enableVertexAttribArray(L.a_pos); gl.vertexAttribPointer(L.a_pos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuf); gl.enableVertexAttribArray(L.a_nrm); gl.vertexAttribPointer(L.a_nrm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf);
    gl.uniformMatrix4fv(L.u_vp, false, vp);
    gl.uniform3f(L.u_eye, eye[0], eye[1], eye[2]);

    var G = trs(0, 0, 0, gy, gx, m4());
    for (var i = 0; i < N; i++) {
      var p = plates[i];
      var a = ease((t - 0.25 - p.d) / 1.5);                  // assembly: drops in, staggered
      var drop = (1 - a) * (2.4 + i * 0.25);
      var spread = scrollS * (0.28 + i * 0.1);               // unstack on scroll
      var yy = p.y + lift + spread + Math.sin(t * p.sp + p.ph) * 0.022 - drop;
      var yaw = p.yaw + (1 - a) * 0.9 + Math.sin(t * p.sp * 0.7 + p.ph) * 0.012 + scrollS * i * 0.05;
      var M = trs(0, yy, 0, yaw, 0, model);
      mul(G, M, tmp);
      gl.uniformMatrix4fv(L.u_model, false, tmp);
      gl.uniform3f(L.u_size, p.w, p.h, p.w);
      gl.uniform1f(L.u_hot, i === N - 1 ? 1 : 0);
      gl.uniform1f(L.u_a, a);
      gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    }
    gl.disable(gl.BLEND);
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    if (!frameGap || now - lastT >= frameGap) { lastT = now; draw(now); }
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running || suspended || !inView || document.hidden) return; running = true; lastT = 0; if (!raf) raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function suspend(f) { suspended = !!f; if (suspended) stop(); else start(); }

  function onMove(e) {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  }
  function onVis() { if (document.hidden) stop(); else start(); }
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine) window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('visibilitychange', onVis);

  var io = null, ro = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) start(); else stop(); }, { threshold: 0 });
    io.observe(canvas);
  }
  if ('ResizeObserver' in window) { ro = new ResizeObserver(function () { size(); }); ro.observe(canvas); }
  else window.addEventListener('resize', size);

  var lost = false;
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; stop(); if (opts.onLost) opts.onLost(); });

  size();
  draw(performance.now());       // first frame immediately (assembly begins at t≈0)
  start();

  return {
    start: start, stop: stop, suspend: suspend,
    destroy: function () {
      stop(); if (io) io.disconnect(); if (ro) ro.disconnect();
      window.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', onVis);
      var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
    }
  };
}
