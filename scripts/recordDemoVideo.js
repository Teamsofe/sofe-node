const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function recordDemo() {
  const videoDir = path.join(__dirname, '../public/videos');
  const artifactDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\76387a38-17b7-4178-b226-3aae639acecb';

  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  console.log('🎬 Launching Chrome for 1080p demo recording...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080']
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: videoDir,
      size: { width: 1920, height: 1080 }
    },
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Helper to inject HUD Overlay
  async function setupHUD() {
    await page.evaluate(() => {
      if (document.getElementById('demo-hud-root')) return;

      const hud = document.createElement('div');
      hud.id = 'demo-hud-root';
      hud.style.position = 'fixed';
      hud.style.top = '0';
      hud.style.left = '0';
      hud.style.width = '100vw';
      hud.style.height = '100vh';
      hud.style.pointerEvents = 'none';
      hud.style.zIndex = '999999';
      hud.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      hud.innerHTML = `
        <!-- Top HUD Banner (Centered so it doesn't obstruct Dashboard title or Certificate) -->
        <div style="position: absolute; top: 12px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 14px; background: rgba(10, 15, 30, 0.95); border: 1px solid rgba(59, 130, 246, 0.55); backdrop-filter: blur(10px); padding: 7px 22px; border-radius: 9999px; box-shadow: 0 4px 25px rgba(0,0,0,0.65);">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 10px #ef4444; animation: pulse 1.5s infinite;"></div>
          <span style="color: #94a3b8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Meta AI Hackathon</span>
          <span style="color: #475569;">|</span>
          <span style="color: #38bdf8; font-size: 13px; font-weight: 700;">Sofe AI Tutor (muse-spark-1.3)</span>
          <span style="color: #475569;">|</span>
          <span id="hud-timer" style="color: #f8fafc; font-size: 13px; font-family: monospace; font-weight: 700;">0:00</span>
          <span style="color: #475569;">|</span>
          <span id="hud-scene-badge" style="color: #fbbf24; font-size: 12px; font-weight: 700; text-transform: uppercase;">SCENE 1: THE HOOK</span>
        </div>

        <!-- Subtitles Bar -->
        <div style="position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); width: 85%; max-width: 1100px;">
          <div id="hud-subtitles" style="background: rgba(10, 15, 30, 0.95); border: 1px solid rgba(59, 130, 246, 0.45); backdrop-filter: blur(12px); border-radius: 12px; padding: 12px 24px; color: #f8fafc; font-size: 17px; font-weight: 500; text-align: center; line-height: 1.4; box-shadow: 0 8px 32px rgba(0,0,0,0.7);">
            Sofe Node trains, validates, and deploys native Web3 talent across Africa through our Academy and campus network.
          </div>
        </div>

        <!-- Simulated Pointer Cursor -->
        <div id="hud-cursor" style="position: absolute; top: 500px; left: 500px; width: 22px; height: 22px; border-radius: 50%; background: rgba(56, 189, 248, 0.75); border: 2.5px solid #ffffff; transform: translate(-50%, -50%); transition: top 0.4s ease-out, left 0.4s ease-out; box-shadow: 0 0 18px #38bdf8; display: none;"></div>
      `;

      document.body.appendChild(hud);
    });
  }

  async function updateHUD(timeStr, sceneTitle, subtitleText, cursorX, cursorY) {
    await page.evaluate(({ timeStr, sceneTitle, subtitleText, cursorX, cursorY }) => {
      const timer = document.getElementById('hud-timer');
      const badge = document.getElementById('hud-scene-badge');
      const subs = document.getElementById('hud-subtitles');
      const cursor = document.getElementById('hud-cursor');

      if (timer) timer.textContent = timeStr;
      if (badge) badge.textContent = sceneTitle;
      if (subs) subs.textContent = subtitleText;

      if (cursor && cursorX !== undefined && cursorY !== undefined) {
        cursor.style.display = 'block';
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
      }
    }, { timeStr, sceneTitle, subtitleText, cursorX, cursorY });
  }

  console.log('🌐 Loading classroom view on http://localhost:3000/course-view?course=foundation&demo=true...');
  await page.goto('http://localhost:3000/course-view?course=foundation&demo=true', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await setupHUD();

  // ════════════════════════════════════════════════════════════════════════════
  // 1. THE HOOK & DISTRIBUTION REALITY (0:00 - 0:20)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('🎬 Recording Scene 1: The Hook & Distribution Reality...');
  await updateHUD('0:05', 'SCENE 1: THE HOOK & DISTRIBUTION REALITY', 'Sofe Node trains, validates, and deploys native Web3 talent across Africa through our Academy and distributed campus network.', 250, 120);
  await page.waitForTimeout(5000);

  await updateHUD('0:12', 'SCENE 1: THE HOOK & DISTRIBUTION REALITY', 'Giving Web3 ecosystems verified builders to scale their products across emerging markets.', 400, 250);
  await page.waitForTimeout(5000);

  await updateHUD('0:18', 'SCENE 1: THE BOTTLENECK', 'Technical bootcamps suffer from high cognitive load; when students fail module exams, static courses fail to adapt to their knowledge gaps.', 500, 400);
  await page.waitForTimeout(5000);

  // ════════════════════════════════════════════════════════════════════════════
  // 2. THE ARCHITECTURE & GUARDRAILS (0:20 - 0:45)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('🎬 Recording Scene 2: The Architecture & Guardrails...');
  await updateHUD('0:24', 'SCENE 2: SOFE AI TUTOR (MUSE-SPARK-1.3)', 'We integrated the Sofe AI Tutor directly into the live classroom, powered by Meta\'s muse-spark-1.3.', 1600, 120);
  
  // Click Sofe AI Tutor tab in desktop sidebar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.cv-desktop-sidebar .cv-tab-btn'));
    const tutorBtn = btns.find(b => b.innerText.includes('Tutor'));
    if (tutorBtn) tutorBtn.click();
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);

  await updateHUD('0:30', 'SCENE 2: DYNAMIC KNOWLEDGE BASE', 'Tutors inject raw course curriculum directly into Firestore, leveraging Muse Spark\'s context window without brittle vector DB overhead.', 1600, 250);
  await page.waitForTimeout(4000);

  // Type and submit the test prompt into chat
  await updateHUD('0:35', 'SCENE 2: ANTI-HALLUCINATION GUARDRAILS', 'Querying: "What is a blockchain ledger and its application in mini grid?"', 1550, 780);
  
  await page.evaluate(() => {
    const textarea = document.querySelector('.cv-desktop-sidebar textarea') || document.querySelector('.cv-desktop-sidebar input[placeholder*="Ask"]');
    if (textarea) {
      textarea.value = 'What is a blockchain ledger and its application in mini grid?';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const sendBtn = Array.from(document.querySelectorAll('.cv-desktop-sidebar button')).find(b => b.innerText.includes('Send'));
    if (sendBtn) sendBtn.click();
    window.scrollTo(0, 0);
  });

  await updateHUD('0:40', 'SCENE 2: ANTI-HALLUCINATION GUARDRAILS', 'Muse Spark explains ledger mechanics from curriculum, but strictly refuses the out-of-scope mini-grid question.', 1600, 450);
  // Give time for LLM to stream the response
  await page.waitForTimeout(9000);

  // ════════════════════════════════════════════════════════════════════════════
  // 3. COST-CACHED SUMMARIES & PRE-EXAM PREP (0:45 - 1:10)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('🎬 Recording Scene 3: Cost-Cached Summaries & Practice...');
  
  // Click Summary Tab
  await updateHUD('0:48', 'SCENE 3: COST-CACHED SUMMARIES', 'Clicking the Summary tab: 150-word synthesis and key terminology cached in Firestore.', 1520, 160);
  await page.evaluate(() => {
    const subtabs = Array.from(document.querySelectorAll('.cv-desktop-sidebar button'));
    const summaryBtn = subtabs.find(b => b.innerText.includes('Summary'));
    if (summaryBtn) summaryBtn.click();
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(5000);

  await updateHUD('0:54', 'SCENE 3: 99% COST REDUCTION', 'Generated once by Meta AI, cached server-side in Firestore to slash API costs by 99% across thousands of learners.', 1600, 320);
  await page.waitForTimeout(4000);

  // Click Practice Tab
  await updateHUD('1:00', 'SCENE 3: PRE-EXAM PRACTICE ENGINE', 'Clicking Practice: dynamic, structured JSON multiple-choice quizzes generated by Meta AI before taking real exams.', 1450, 160);
  await page.evaluate(() => {
    const subtabs = Array.from(document.querySelectorAll('.cv-desktop-sidebar button'));
    const practiceBtn = subtabs.find(b => b.innerText.includes('Practice'));
    if (practiceBtn) practiceBtn.click();
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(6000);

  // ════════════════════════════════════════════════════════════════════════════
  // 4. THE PEAK: CLOSED-LOOP EXAM TELEMETRY (1:10 - 1:45)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('🎬 Recording Scene 4: Closed-Loop Exam Telemetry...');
  
  // Switch to Weak Areas
  await updateHUD('1:14', 'SCENE 4: CLOSED-LOOP TELEMETRY', 'When a student fails a Module Exam, Cloud Functions record question-level failure telemetry.', 1600, 160);
  await page.evaluate(() => {
    const subtabs = Array.from(document.querySelectorAll('.cv-desktop-sidebar button'));
    const weakBtn = subtabs.find(b => b.innerText.includes('Weak Areas'));
    if (weakBtn) weakBtn.click();
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(5000);

  await updateHUD('1:24', 'SCENE 4: TARGETED WEAK AREAS', 'The AI Sidebar pulls failed topic telemetry directly from quiz_attempts in Firestore.', 1600, 300);
  await page.waitForTimeout(4000);

  // Click Explain Simple chip
  await updateHUD('1:34', 'SCENE 4: REAL-TIME REMEDIATION', 'Clicking "Explain Simple": Muse Spark remediates exact weak areas, turning failed assessments into targeted mastery.', 1480, 230);
  await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('.cv-desktop-sidebar button'));
    const explainChip = chips.find(b => b.innerText.includes('Explain Simple'));
    if (explainChip) explainChip.click();
    window.scrollTo(0, 0);
  });
  // Wait for remediation streaming
  await page.waitForTimeout(8000);

  // ════════════════════════════════════════════════════════════════════════════
  // 5. THE CLOSE: PRODUCTION SCALE (1:45 - 2:00)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('🎬 Recording Scene 5: Production Scale & Close...');
  await updateHUD('1:48', 'SCENE 5: PRODUCTION SCALE', 'This is not a standalone hackathon toy—it is embedded directly into Sofe Node\'s live production stack.', 960, 480);
  await page.waitForTimeout(5000);

  await updateHUD('1:56', 'SCENE 5: PRODUCTION SCALE', 'Immediately upgrading how we validate and deploy native Web3 talent across the African continent.', 960, 480);
  await page.waitForTimeout(5000);

  console.log('💾 Finalizing video file...');
  const recordedVideo = await page.video();
  await context.close();
  await browser.close();

  if (recordedVideo) {
    const originalPath = await recordedVideo.path();
    const finalPath = path.join(videoDir, 'sofe_ai_tutor_demo.webm');
    if (fs.existsSync(originalPath)) {
      fs.copyFileSync(originalPath, finalPath);
      console.log(`✅ Demo video successfully generated at: ${finalPath}`);

      // Copy to artifacts directory
      const artifactVideoPath = path.join(artifactDir, 'sofe_ai_tutor_demo.webm');
      fs.copyFileSync(finalPath, artifactVideoPath);
      console.log(`✅ Copied demo video to artifact directory: ${artifactVideoPath}`);
    }
  }
}

recordDemo().catch(err => {
  console.error('❌ Error during demo video recording:', err);
  process.exit(1);
});
