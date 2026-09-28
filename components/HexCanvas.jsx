'use client';
import { useEffect, useRef } from 'react';

export default function HexCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let nodes = [], W, H;
    let animId;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function hexPath(cx, cy, r, rot) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + rot;
        i === 0
          ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
          : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
    }

    function init() {
      nodes = [];
      const smallCount = Math.min(45, Math.floor((W * H) / 10000));
      for (let i = 0; i < smallCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: Math.cos(ang) * (0.12 + Math.random() * 0.18),
          vy: Math.sin(ang) * (0.12 + Math.random() * 0.18),
          r: 10 + Math.random() * 12,
          rot: Math.random() * Math.PI,
          rotV: (Math.random() - 0.5) * 0.006,
          phase: Math.random() * Math.PI * 2,
          layer: 'small',
        });
      }
      const medCount = Math.min(12, Math.floor((W * H) / 55000));
      for (let i = 0; i < medCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: Math.cos(ang) * (0.07 + Math.random() * 0.12),
          vy: Math.sin(ang) * (0.07 + Math.random() * 0.12),
          r: 28 + Math.random() * 14,
          rot: Math.random() * Math.PI,
          rotV: (Math.random() - 0.5) * 0.002,
          phase: Math.random() * Math.PI * 2,
          layer: 'medium',
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const lightMode = document.body.classList.contains('light');

      if (!lightMode) {
        ctx.fillStyle = 'rgba(4,8,16,0.93)';
        ctx.fillRect(0, 0, W, H);
      }

      const MAX = 160;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX) {
            const a = (1 - d / MAX) * 0.22;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = lightMode
              ? `rgba(20,40,200,${(a * 0.7).toFixed(3)})`
              : `rgba(255,138,0,${a.toFixed(3)})`;
            ctx.lineWidth = (1 - d / MAX) * 1.6;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        n.rot += n.rotV;
        n.phase += 0.013;
        if (n.x < -n.r * 2) n.x = W + n.r;
        if (n.x > W + n.r * 2) n.x = -n.r;
        if (n.y < -n.r * 2) n.y = H + n.r;
        if (n.y > H + n.r * 2) n.y = -n.r;

        const p = 0.5 + 0.5 * Math.sin(n.phase);
        const isSmall = n.layer === 'small';

        const glowR = n.r * (isSmall ? 1.6 : 2.2);
        const glowA = isSmall ? 0.07 * p : 0.13 * p;
        const glowColor = lightMode
          ? `rgba(20,40,220,${glowA.toFixed(3)})`
          : `rgba(255,138,0,${glowA.toFixed(3)})`;
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        grd.addColorStop(0, glowColor);
        grd.addColorStop(1, lightMode ? 'rgba(20,40,220,0)' : 'rgba(255,138,0,0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();

        const fillA = isSmall ? 0.03 + 0.04 * p : 0.05 + 0.07 * p;
        hexPath(n.x, n.y, n.r, n.rot);
        ctx.fillStyle = lightMode
          ? `rgba(20,40,220,${(fillA * 1.4).toFixed(3)})`
          : `rgba(255,138,0,${fillA.toFixed(3)})`;
        ctx.fill();

        const strokeA = isSmall ? 0.28 + 0.28 * p : 0.5 + 0.32 * p;
        hexPath(n.x, n.y, n.r, n.rot);
        ctx.strokeStyle = lightMode
          ? `rgba(20,40,220,${(strokeA * 0.9).toFixed(3)})`
          : `rgba(255,160,40,${strokeA.toFixed(3)})`;
        ctx.lineWidth = isSmall ? 0.8 : 1.3; ctx.stroke();

        if (!isSmall) {
          hexPath(n.x, n.y, n.r * 0.5, n.rot);
          ctx.strokeStyle = lightMode
            ? `rgba(255,138,0,${(0.25 + 0.2 * p).toFixed(3)})`
            : `rgba(255,138,0,${(0.18 + 0.18 * p).toFixed(3)})`;
          ctx.lineWidth = 0.7; ctx.stroke();
        }

        const dotR = isSmall ? 1.4 : 2.4;
        const dotA = isSmall ? 0.4 + 0.3 * p : 0.65 + 0.35 * p;
        ctx.beginPath();
        ctx.arc(n.x, n.y, dotR, 0, Math.PI * 2);
        ctx.fillStyle = lightMode
          ? `rgba(255,120,0,${dotA.toFixed(3)})`
          : `rgba(255,180,60,${dotA.toFixed(3)})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    }

    function handleResize() { resize(); init(); }
    window.addEventListener('resize', handleResize);
    resize(); init(); draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="hexCanvas"
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}
