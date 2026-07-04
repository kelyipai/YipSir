/* =============================================
   vinyl-canvas.js — Hero Canvas: 浮動音符 + 暖色光塵粒子
   ============================================= */
(function () {
  'use strict';

  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var w = 0, h = 0;
  var rafId = null;
  var isVisible = true;

  var mouse = { x: -9999, y: -9999, radius: 120 };

  /* --- 音符 --- */
  var NOTE_SYMBOLS = ['♪', '♫', '♩', '♬', '♭', '♮'];
  var notes = [];

  function Note() {
    this.reset(true);
  }
  Note.prototype.reset = function (initial) {
    this.x = Math.random() * w;
    this.y = initial ? Math.random() * h : h + 30;
    this.size = 14 + Math.random() * 22;
    this.speed = 0.3 + Math.random() * 0.8;
    this.amplitude = 20 + Math.random() * 40;
    this.frequency = 0.005 + Math.random() * 0.01;
    this.phase = Math.random() * Math.PI * 2;
    this.baseX = this.x;
    this.opacity = 0.1 + Math.random() * 0.25;
    this.symbol = NOTE_SYMBOLS[Math.floor(Math.random() * NOTE_SYMBOLS.length)];
    this.color = Math.random() > 0.5 ? '224,176,74' : '200,118,60';
  };
  Note.prototype.update = function () {
    this.y -= this.speed;
    this.x = this.baseX + Math.sin(this.y * this.frequency + this.phase) * this.amplitude;
    if (this.y < -30) {
      this.reset(false);
      this.baseX = Math.random() * w;
    }
    // Mouse repel
    var dx = this.x - mouse.x;
    var dy = this.y - mouse.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < mouse.radius) {
      var force = (mouse.radius - dist) / mouse.radius;
      this.x += dx / dist * force * 15;
      this.y += dy / dist * force * 8;
    }
  };
  Note.prototype.draw = function () {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = 'rgba(' + this.color + ',' + this.opacity + ')';
    ctx.font = this.size + 'px serif';
    ctx.fillText(this.symbol, this.x, this.y);
    ctx.restore();
  };

  /* --- 光塵粒子 --- */
  var motes = [];

  function Mote() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.radius = 0.5 + Math.random() * 2;
    this.opacity = 0.15 + Math.random() * 0.35;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.01 + Math.random() * 0.02;
  }
  Mote.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    this.pulsePhase += this.pulseSpeed;

    // Mouse attract
    var dx = mouse.x - this.x;
    var dy = mouse.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < mouse.radius && dist > 0) {
      this.vx += dx / dist * 0.02;
      this.vy += dy / dist * 0.02;
    }
    // Damping
    this.vx *= 0.99;
    this.vy *= 0.99;

    // Boundary bounce
    if (this.x < 0 || this.x > w) this.vx *= -1;
    if (this.y < 0 || this.y > h) this.vy *= -1;
    this.x = Math.max(0, Math.min(w, this.x));
    this.y = Math.max(0, Math.min(h, this.y));
  };
  Mote.prototype.draw = function () {
    var pulse = 0.7 + Math.sin(this.pulsePhase) * 0.3;
    ctx.save();
    ctx.globalAlpha = this.opacity * pulse;
    ctx.fillStyle = '#e0b04a';
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(224,176,74,0.6)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /* --- Setup --- */
  function getParticleCount() {
    var area = w * h;
    var noteCount = Math.min(18, Math.floor(area / 50000));
    var moteCount = Math.min(60, Math.floor(area / 12000));
    if (area < 400000) { noteCount = 8; moteCount = 25; }
    return { noteCount: noteCount, moteCount: moteCount };
  }

  function resize() {
    w = canvas.offsetWidth;
    h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    var counts = getParticleCount();
    notes = [];
    motes = [];
    for (var i = 0; i < counts.noteCount; i++) notes.push(new Note());
    for (var j = 0; j < counts.moteCount; j++) motes.push(new Mote());
  }

  /* --- Animate --- */
  function animate() {
    if (!isVisible) {
      rafId = null;
      return;
    }
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < motes.length; i++) {
      motes[i].update();
      motes[i].draw();
    }
    for (var j = 0; j < notes.length; j++) {
      notes[j].update();
      notes[j].draw();
    }

    rafId = requestAnimationFrame(animate);
  }

  function start() {
    if (rafId === null && isVisible) {
      animate();
    }
  }

  /* --- Events --- */
  window.addEventListener('resize', function () {
    resize();
  });

  canvas.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', function () {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // Parallax on scroll
  window.addEventListener('scroll', function () {
    var scrollY = window.scrollY;
    if (scrollY < h) {
      canvas.style.transform = 'translateY(' + scrollY * 0.3 + 'px)';
    }
  }, { passive: true });

  // IntersectionObserver to pause when out of view
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        isVisible = entry.isIntersecting;
        if (isVisible) start();
      });
    }, { threshold: 0 });
    observer.observe(canvas);
  }

  /* --- Init --- */
  resize();
  start();
})();
