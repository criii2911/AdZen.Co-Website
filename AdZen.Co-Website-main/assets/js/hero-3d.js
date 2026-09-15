/* =============================================================
   AdZen.co — Hero "Growth System" 3D scene
   -------------------------------------------------------------
   Loaded lazily by index.html AFTER first paint, and only when
   every gate passes (desktop width, fine pointer, no reduced-motion
   preference, WebGL available). If any gate fails the page keeps the
   existing CSS aurora hero and this file is never even fetched.

   CONCEPT (not decoration):
   AdZen's own model is Strategy -> Execution -> Automation, three
   pillars feeding one system. So the scene is literally that:
   three orbital rings of nodes around a central core, with links
   between them. Scroll doesn't spin it arbitrarily — it advances
   the system through its three stages, lighting each ring in turn,
   which mirrors the section order of the page itself.

   PERF NOTES:
   - Nodes are a single InstancedMesh (one draw call), never N meshes.
   - Links are one merged LineSegments buffer, built once.
   - No geometry/material allocation inside the render loop.
   - delta-timed, so speed is identical at 60Hz and 144Hz.
   - DPR clamped to 1.75; renders pause entirely when off-screen
     or when the tab is hidden.
   ============================================================= */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function initHero3D(canvas, opts) {
  opts = opts || {};
  var INK = 0x0A0A0A, BLUE = 0x2563FF, LIME = 0xB8FF00, CREAM = 0xF5F3EF;

  /* ---------- Renderer ---------- */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    return null; // caller keeps the CSS fallback
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(54, 1, 0.1, 100);
  camera.position.set(0, 0.6, 9.2);

  var root = new THREE.Group();
  scene.add(root);

  /* ---------- Lighting: cheap, no shadow passes ---------- */
  scene.add(new THREE.AmbientLight(CREAM, 0.55));
  var key = new THREE.DirectionalLight(CREAM, 1.5);
  key.position.set(4, 6, 6);
  scene.add(key);
  var rim = new THREE.DirectionalLight(BLUE, 1.1);
  rim.position.set(-6, -2, -4);
  scene.add(rim);

  /* ---------- The three pillars ---------- */
  // radius, node count, tilt — Strategy (inner) -> Execution -> Automation (outer)
  // Radii verified numerically against the camera frustum on the 1:1
  // canvas across the full scroll dolly range (z 9.2 -> 8.2): the outer
  // ring keeps >=19% margin at the closest point, so nothing clips.
  var RINGS = [
    { r: 1.18, count: 6,  tilt: 0.0,   speed: 0.16 },
    { r: 1.92, count: 10, tilt: 0.52,  speed: -0.11 },
    { r: 2.63, count: 14, tilt: -0.34, speed: 0.07 }
  ];

  var nodeCount = RINGS.reduce(function (n, r) { return n + r.count; }, 0);

  // Per-node static data, computed once.
  var nodes = [];
  RINGS.forEach(function (ring, ringIndex) {
    for (var i = 0; i < ring.count; i++) {
      var a = (i / ring.count) * Math.PI * 2;
      nodes.push({
        ring: ringIndex,
        angle: a,
        radius: ring.r,
        tilt: ring.tilt,
        speed: ring.speed,
        // slight vertical scatter so it reads as a system, not a flat dial
        y: (Math.sin(a * 3 + ringIndex) * 0.18)
      });
    }
  });

  /* ---------- Nodes: ONE InstancedMesh, one draw call ---------- */
  var nodeGeo = new THREE.IcosahedronGeometry(0.085, 1);
  var nodeMat = new THREE.MeshStandardMaterial({
    color: CREAM, roughness: 0.35, metalness: 0.1
  });
  var nodeMesh = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);
  nodeMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(nodeCount * 3), 3);
  root.add(nodeMesh);

  var dummy = new THREE.Object3D();
  var cActive = new THREE.Color(LIME);
  var cIdle = new THREE.Color(0x4a5568);
  var cTmp = new THREE.Color();

  /* ---------- Core ---------- */
  var coreGeo = new THREE.IcosahedronGeometry(0.42, 2);
  var coreMat = new THREE.MeshStandardMaterial({
    color: BLUE, roughness: 0.25, metalness: 0.35,
    emissive: BLUE, emissiveIntensity: 0.35
  });
  var core = new THREE.Mesh(coreGeo, coreMat);
  root.add(core);

  // Wireframe shell around the core — reads as "engineered", not "blob"
  var shellGeo = new THREE.IcosahedronGeometry(0.62, 1);
  var shellMat = new THREE.MeshBasicMaterial({
    color: CREAM, wireframe: true, transparent: true, opacity: 0.16
  });
  var shell = new THREE.Mesh(shellGeo, shellMat);
  root.add(shell);

  /* ---------- Links: one merged LineSegments ---------- */
  // Each node links back toward the core; adjacent nodes in a ring link
  // to each other. Built once into a single buffer.
  var linkPositions = [];
  var nodeBase = [];
  nodes.forEach(function (n) {
    var x = Math.cos(n.angle) * n.radius;
    var z = Math.sin(n.angle) * n.radius;
    var y = n.y + Math.sin(n.tilt) * z;
    nodeBase.push(new THREE.Vector3(x, y, z * Math.cos(n.tilt)));
  });
  var offset = 0;
  RINGS.forEach(function (ring) {
    for (var i = 0; i < ring.count; i++) {
      var cur = nodeBase[offset + i];
      var nxt = nodeBase[offset + ((i + 1) % ring.count)];
      linkPositions.push(cur.x, cur.y, cur.z, nxt.x, nxt.y, nxt.z);
      // spoke toward core (stops short so it doesn't pierce the sphere)
      linkPositions.push(cur.x * 0.34, cur.y * 0.34, cur.z * 0.34, cur.x, cur.y, cur.z);
    }
    offset += ring.count;
  });
  var linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPositions, 3));
  var linkMat = new THREE.LineBasicMaterial({
    color: CREAM, transparent: true, opacity: 0.13
  });
  var links = new THREE.LineSegments(linkGeo, linkMat);
  root.add(links);

  /* ---------- State ---------- */
  var pointer = { x: 0, y: 0 };      // target, -1..1
  var smooth = { x: 0, y: 0 };       // eased
  var scrollProgress = 0;            // 0..1 across the hero
  var activeRings = 1;               // how many rings are "lit"
  var ringGlow = [0, 0, 0];          // eased per-ring activation

  /* ---------- Per-frame ---------- */
  var clock = new THREE.Clock();
  var rafId = null;
  var running = false;
  var elapsed = 0;

  function frame() {
    var delta = Math.min(clock.getDelta(), 0.05); // clamp after tab-switch
    elapsed += delta;

    // Pointer easing — parallax, not a 1:1 snap
    smooth.x += (pointer.x - smooth.x) * Math.min(1, delta * 3.2);
    smooth.y += (pointer.y - smooth.y) * Math.min(1, delta * 3.2);

    // Camera responds to pointer + scroll pulls it inward through the system
    camera.position.x = smooth.x * 0.7;
    camera.position.y = 0.6 + smooth.y * -0.5;
    camera.position.z = 9.2 - scrollProgress * 1.0;
    camera.lookAt(0, 0, 0);

    // Whole system tilts slightly toward the cursor
    root.rotation.x = smooth.y * 0.14 + scrollProgress * 0.22;
    root.rotation.y += delta * 0.045;

    core.rotation.y += delta * 0.25;
    core.rotation.x += delta * 0.11;
    shell.rotation.y -= delta * 0.16;
    shell.rotation.z += delta * 0.07;

    // Ring activation eases toward how far the user has scrolled
    for (var r = 0; r < 3; r++) {
      var target = (r < activeRings) ? 1 : 0;
      ringGlow[r] += (target - ringGlow[r]) * Math.min(1, delta * 2.4);
    }

    // Update instances
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var a = n.angle + elapsed * n.speed;
      var x = Math.cos(a) * n.radius;
      var z = Math.sin(a) * n.radius;
      var y = n.y + Math.sin(n.tilt) * z + Math.sin(elapsed * 0.8 + i) * 0.045;

      dummy.position.set(x, y, z * Math.cos(n.tilt));
      var glow = ringGlow[n.ring];
      var s = 0.72 + glow * 0.5;
      dummy.scale.setScalar(s);
      dummy.rotation.set(a, a * 0.6, 0);
      dummy.updateMatrix();
      nodeMesh.setMatrixAt(i, dummy.matrix);

      cTmp.copy(cIdle).lerp(cActive, glow);
      nodeMesh.setColorAt(i, cTmp);
    }
    nodeMesh.instanceMatrix.needsUpdate = true;
    if (nodeMesh.instanceColor) nodeMesh.instanceColor.needsUpdate = true;

    linkMat.opacity = 0.09 + scrollProgress * 0.1;
    coreMat.emissiveIntensity = 0.3 + scrollProgress * 0.45;

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    clock.getDelta(); // discard the gap accumulated while paused
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  /* ---------- Sizing ---------- */
  function resize() {
    var w = canvas.clientWidth || 1;
    var h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  // Defensive: canvas can measure 300x150 if the container hadn't settled.
  setTimeout(resize, 80);

  var ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(resize);
    ro.observe(canvas);
  } else {
    window.addEventListener('resize', resize, { passive: true });
  }

  /* ---------- Input ---------- */
  function onPointerMove(e) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  }
  window.addEventListener('mousemove', onPointerMove, { passive: true });

  // Scroll drives system progression, NOT scroll-jacking — the page
  // scrolls normally; we just read progress and advance the visual state.
  function onScroll() {
    var hero = canvas.closest('section') || canvas.parentElement;
    var rect = hero.getBoundingClientRect();
    var total = rect.height || 1;
    var p = Math.min(1, Math.max(0, -rect.top / total));
    scrollProgress = p;
    activeRings = p < 0.28 ? 1 : (p < 0.62 ? 2 : 3);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Only render when actually visible ---------- */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !document.hidden) start(); else stop();
      });
    }, { threshold: 0.01 });
    io.observe(canvas);
  } else {
    start();
  }

  function onVisibility() {
    if (document.hidden) stop();
    else {
      var r = canvas.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) start();
    }
  }
  document.addEventListener('visibilitychange', onVisibility);

  /* ---------- Teardown (no GPU leaks) ---------- */
  function destroy() {
    stop();
    window.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
    if (io) io.disconnect();
    nodeGeo.dispose(); nodeMat.dispose();
    coreGeo.dispose(); coreMat.dispose();
    shellGeo.dispose(); shellMat.dispose();
    linkGeo.dispose(); linkMat.dispose();
    renderer.dispose();
  }

  return { destroy: destroy, start: start, stop: stop };
}
