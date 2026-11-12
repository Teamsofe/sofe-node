const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });

  // Read logo as base64 so it loads immediately without network delays
  const logoBase64 = fs.readFileSync(path.join(__dirname, '../public/images/Nodes/SofeLogoHome.png')).toString('base64');
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; background: #050811; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Poppins', sans-serif; }
        canvas { width: 640px; height: 640px; border-radius: 12px; }
      </style>
    </head>
    <body>
      <canvas id="flyer" width="1080" height="1080"></canvas>
      <script>
        const canvas = document.getElementById('flyer');
        const ctx = canvas.getContext('2d');
        const width = 1080;
        const height = 1080;

        function drawRoundedRect(ctx, x, y, width, height, radius) {
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + width - radius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
          ctx.lineTo(x + width, y + height - radius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
          ctx.lineTo(x + radius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
        }

        // Test flyer drawing
        window.drawFlyer = function(logoImg) {
          // 1. Deep Gradient Background
          const bgGrad = ctx.createLinearGradient(0, 0, width, height);
          bgGrad.addColorStop(0, '#060B17');
          bgGrad.addColorStop(0.5, '#091124');
          bgGrad.addColorStop(1, '#0C1733');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, width, height);

          // 2. Ambient Glow Orbs
          const glow1 = ctx.createRadialGradient(140, 140, 20, 140, 140, 480);
          glow1.addColorStop(0, 'rgba(20, 40, 255, 0.35)');
          glow1.addColorStop(1, 'rgba(20, 40, 255, 0)');
          ctx.fillStyle = glow1;
          ctx.fillRect(0, 0, width, height);

          const glow2 = ctx.createRadialGradient(940, 940, 20, 940, 940, 480);
          glow2.addColorStop(0, 'rgba(255, 138, 0, 0.28)');
          glow2.addColorStop(1, 'rgba(255, 138, 0, 0)');
          ctx.fillStyle = glow2;
          ctx.fillRect(0, 0, width, height);

          // 3. Cyber Grid
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.lineWidth = 1;
          for (let x = 60; x < width; x += 60) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
          }
          for (let y = 60; y < height; y += 60) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
          }
          ctx.restore();

          // 4. Outer Tech Border
          ctx.save();
          ctx.strokeStyle = 'rgba(20, 40, 255, 0.4)';
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, 40, 40, width - 80, height - 80, 24);
          ctx.stroke();

          // Corner brackets
          ctx.strokeStyle = '#FF8A00';
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(40, 90); ctx.lineTo(40, 40); ctx.lineTo(90, 40); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(width - 90, 40); ctx.lineTo(width - 40, 40); ctx.lineTo(width - 40, 90); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(40, height - 90); ctx.lineTo(40, height - 40); ctx.lineTo(90, height - 40); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(width - 90, height - 40); ctx.lineTo(width - 40, height - 40); ctx.lineTo(width - 40, height - 90); ctx.stroke();
          ctx.restore();

          // 5. Header Branding: Clean Logo + Academy Lockup (Zero Overlap!)
          ctx.save();
          const logoX = 80;
          const logoY = 72;
          const logoH = 44;
          const logoW = Math.round(logoH * (logoImg.naturalWidth / logoImg.naturalHeight));

          // Draw the brand logo image with crisp contrast & high visibility
          ctx.save();
          // Filter to brighten and enhance the blue and orange on dark background
          ctx.filter = 'brightness(1.5) saturate(1.3) drop-shadow(0 0 12px rgba(0, 180, 255, 0.35))';
          ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
          ctx.restore();

          // Position '• ACADEMY' cleanly right after the logo
          const academyX = logoX + logoW + 18;
          ctx.fillStyle = '#FF8A00';
          ctx.font = '700 22px Poppins, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.fillText('• ACADEMY', academyX, logoY + (logoH / 2));

          // Top-right Pill Badge: VERIFIED ASSESSMENT /
          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
          drawRoundedRect(ctx, width - 360, 72, 280, 44, 22);
          ctx.fill();
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, width - 360, 72, 280, 44, 22);
          ctx.stroke();

          ctx.fillStyle = '#10B981';
          ctx.font = '700 15px Poppins, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('VERIFIED ASSESSMENT /', width - 220, 94);
          ctx.restore();

          // 6. Subtitle & Student Name
          ctx.save();
          ctx.fillStyle = '#FF8A00';
          ctx.font = '700 18px Poppins, sans-serif';
          ctx.letterSpacing = '3px';
          ctx.fillText('OFFICIAL ASSESSMENT SCORECARD', 80, 185);

          ctx.fillStyle = 'rgba(238, 244, 255, 0.6)';
          ctx.font = '500 18px Poppins, sans-serif';
          ctx.fillText('Awarded to', 80, 225);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '800 44px Poppins, sans-serif';
          ctx.fillText('Ekpegbue Shedrack', 80, 275);

          ctx.fillStyle = '#6B8CFF';
          ctx.font = '700 24px Poppins, sans-serif';
          ctx.fillText('Blockchain & Cryptocurrency Foundation', 80, 325);

          ctx.fillStyle = 'rgba(238, 244, 255, 0.85)';
          ctx.font = '500 20px Poppins, sans-serif';
          ctx.fillText('Introduction to Blockchain', 80, 362);
          ctx.restore();

          // 7. Central Score Card
          ctx.save();
          const scoreCardY = 410;
          const scoreCardH = 270;
          const scoreCardW = width - 160;

          ctx.fillStyle = 'rgba(20, 40, 255, 0.12)';
          drawRoundedRect(ctx, 80, scoreCardY, scoreCardW, scoreCardH, 20);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0, 200, 100, 0.5)';
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, 80, scoreCardY, scoreCardW, scoreCardH, 20);
          ctx.stroke();

          // Score Ring
          const ringCenterX = 240;
          const ringCenterY = scoreCardY + 135;
          const ringRadius = 90;

          const ringGlow = ctx.createRadialGradient(ringCenterX, ringCenterY, 40, ringCenterX, ringCenterY, 110);
          ringGlow.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
          ringGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = ringGlow;
          ctx.beginPath();
          ctx.arc(ringCenterX, ringCenterY, 110, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(ringCenterX, ringCenterY, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 6;
          ctx.stroke();

          ctx.fillStyle = '#00E5FF';
          ctx.font = '800 68px Poppins, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('97%', ringCenterX, ringCenterY - 10);

          ctx.fillStyle = 'rgba(238, 244, 255, 0.7)';
          ctx.font = '700 13px Poppins, sans-serif';
          ctx.fillText('PASS: 70%', ringCenterX, ringCenterY + 42);

          // Relative Status / Percentile Badge
          const detailX = 380;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';

          // EXAM PASSED /
          ctx.fillStyle = '#10B981';
          ctx.font = '800 32px Poppins, sans-serif';
          ctx.fillText('EXAM PASSED /', detailX, scoreCardY + 68);

          // Relative Status Pill Badge: "TOP 5% OF SOFIANS"
          const badgeText = '⚡ TOP 5% OF SOFIANS';
          ctx.font = '800 13px Poppins, sans-serif';
          const badgeWidth = ctx.measureText(badgeText).width + 24;
          const badgeX = detailX + 265;
          const badgeY = scoreCardY + 45;

          ctx.fillStyle = 'rgba(255, 138, 0, 0.16)';
          drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 30, 15);
          ctx.fill();
          ctx.strokeStyle = '#FF8A00';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 30, 15);
          ctx.stroke();

          ctx.fillStyle = '#FFB03A';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 15);

          // Detail text
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = 'rgba(238, 244, 255, 0.85)';
          ctx.font = '500 19px Poppins, sans-serif';
          ctx.fillText('Demonstrated high competence in practical Web3 assessment.', detailX, scoreCardY + 120);

          ctx.fillStyle = '#FF8A00';
          ctx.font = '700 17px Poppins, sans-serif';
          ctx.fillText('🏆 +5 XP Earned & Progress Synchronized', detailX, scoreCardY + 172);

          ctx.fillStyle = 'rgba(200, 215, 240, 0.6)';
          ctx.font = '500 14px Poppins, sans-serif';
          ctx.fillText('Verified on Sofe Node Academy • Web3 Ecosystem', detailX, scoreCardY + 215);
          ctx.restore();

          // 8. Bottom Section: Invite & QR
          ctx.save();
          const qrCardY = 720;
          const qrBoxW = 240;
          const qrBoxH = 240;

          ctx.fillStyle = '#FFFFFF';
          drawRoundedRect(ctx, 80, qrCardY, qrBoxW, qrBoxH, 18);
          ctx.fill();

          ctx.fillStyle = '#FF8A00';
          ctx.font = '700 15px Poppins, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Scan to Join & Learn with Me', 80 + qrBoxW / 2, qrCardY + qrBoxH + 34);

          const inviteX = 360;
          ctx.textAlign = 'left';
          ctx.fillStyle = 'rgba(238, 244, 255, 0.65)';
          ctx.font = '600 16px Poppins, sans-serif';
          ctx.fillText('REFERRAL INVITE CODE', inviteX, qrCardY + 38);

          ctx.fillStyle = '#00E5FF';
          ctx.font = '800 36px Poppins, sans-serif';
          ctx.fillText('SOFE-SHEBDWJH7', inviteX, qrCardY + 82);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '600 18px Poppins, sans-serif';
          ctx.fillText('Join Sofe Node Academy to master Web3 & earn rewards', inviteX, qrCardY + 128);

          ctx.fillStyle = 'rgba(238, 244, 255, 0.7)';
          ctx.font = '500 15px Poppins, sans-serif';
          ctx.fillText('Subsidized Foundation Course • Global Bounties • Talent Placements', inviteX, qrCardY + 158);

          ctx.fillStyle = '#6B8CFF';
          ctx.font = '700 16px Poppins, sans-serif';
          ctx.fillText('https://node.sofegroup.com/signup?ref=SOFE-SHEBDWJH7', inviteX, qrCardY + 200);

          ctx.fillStyle = 'rgba(200, 215, 240, 0.45)';
          ctx.font = '500 13px Poppins, sans-serif';
          ctx.fillText('Official Credential • node.sofegroup.com • Powered by Sofe Node Ecosystem', inviteX, qrCardY + 238);
          ctx.restore();
        };

        const img = new Image();
        img.onload = () => {
          window.drawFlyer(img);
          window.ready = true;
        };
        img.src = '${logoDataUri}';
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.ready === true, { timeout: 10000 });
  await page.waitForTimeout(1000); // Wait for fonts

  const canvasElem = await page.$('#flyer');
  await canvasElem.screenshot({ path: path.join(__dirname, '../public/test_flyer_output.png') });
  console.log('Test flyer generated at public/test_flyer_output.png');
  await browser.close();
})();
