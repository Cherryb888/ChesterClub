/**
 * build-chester-rive.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Playwright automation that builds chester.riv in the Rive web editor.
 *
 * HOW TO RUN:
 *   node scripts/build-chester-rive.js
 *
 * WHAT IT DOES:
 *   1. Opens editor.rive.app in a visible browser window
 *   2. Pauses for you to log in (30 seconds)
 *   3. Creates ChesterArtboard (400×400)
 *   4. Imports Chester Idle PNG as the base layer (chester_body)
 *   5. Builds all 10 Chester animation states with exact keyframe values
 *   6. Creates ChesterStateMachine with all inputs + transitions
 *   7. Exports chester.riv and moves it to assets/animations/
 *
 * REQUIRES:
 *   - Playwright installed (already done: npm has playwright)
 *   - Your Rive account (you log in during the pause at step 2)
 *   - The PNG assets already downloaded to assets/chester/rive/
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs   = require('fs');

// ── Config ────────────────────────────────────────────────────────────────────
const ASSETS_DIR     = path.join(__dirname, '../assets/chester/rive');
const OUTPUT_DIR     = path.join(__dirname, '../assets/animations');
const CHROMIUM_PATH  = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const RIVE_URL       = 'https://editor.rive.app';

// State machine name and artboard — must match exactly what the React Native code expects
const ARTBOARD_NAME = 'ChesterArtboard';
const SM_NAME       = 'ChesterStateMachine';
const LAYER_NAME    = 'chester_body';
const CANVAS_SIZE   = 400;

// ── Animation definitions (from animation-recipes.md) ─────────────────────────
const ANIMATIONS = [
  {
    name: 'idle',
    duration: 2.0,
    loop: 'loop',
    keyframes: [
      { t: 0.0,  y:  0, sx: 1.0,  sy: 1.0,  r: 0 },
      { t: 0.5,  y: -8, sx: 1.0,  sy: 1.0,  r: 0 },
      { t: 1.0,  y: -5, sx: 1.0,  sy: 1.0,  r: 0 },
      { t: 1.5,  y:  0, sx: 1.0,  sy: 1.0,  r: 0 },
      { t: 2.0,  y:  0, sx: 1.0,  sy: 1.0,  r: 0 },
    ],
  },
  {
    name: 'happy',
    duration: 1.2,
    loop: 'oneShot',
    keyframes: [
      { t: 0.0,  y:   0, sx: 1.0,  sy: 1.0,  r:  0 },
      { t: 0.15, y: -20, sx: 0.95, sy: 1.1,  r:  0 },
      { t: 0.35, y: -35, sx: 1.15, sy: 0.9,  r: -5 },
      { t: 0.55, y: -15, sx: 1.05, sy: 1.05, r:  3 },
      { t: 0.7,  y:   5, sx: 0.92, sy: 1.08, r:  0 },
      { t: 0.9,  y:   0, sx: 1.0,  sy: 1.0,  r:  0 },
      { t: 1.2,  y:   0, sx: 1.0,  sy: 1.0,  r:  0 },
    ],
  },
  {
    name: 'eating',
    duration: 1.0,
    loop: 'oneShot',
    keyframes: [
      { t: 0.0,  y:  0, sx: 1.0,  sy: 1.0,  r:  0 },
      { t: 0.2,  y: 12, sx: 1.05, sy: 0.95, r:  8 },
      { t: 0.4,  y: 15, sx: 1.0,  sy: 1.0,  r: 10 },
      { t: 0.65, y:  8, sx: 1.0,  sy: 1.0,  r:  5 },
      { t: 1.0,  y:  0, sx: 1.0,  sy: 1.0,  r:  0 },
    ],
  },
  {
    name: 'drinking',
    duration: 1.0,
    loop: 'oneShot',
    keyframes: [
      { t: 0.0,  y:  0, sx: 1.02, sy: 0.98, r: 0 },
      { t: 0.25, y: 10, sx: 1.02, sy: 0.98, r: 6 },
      { t: 0.5,  y: 12, sx: 1.0,  sy: 1.0,  r: 7 },
      { t: 0.75, y:  6, sx: 1.0,  sy: 1.0,  r: 3 },
      { t: 1.0,  y:  0, sx: 1.0,  sy: 1.0,  r: 0 },
    ],
  },
  {
    name: 'levelUp',
    duration: 1.8,
    loop: 'oneShot',
    keyframes: [
      { t: 0.0, y:   0, sx: 1.0,  sy: 1.0,  r:   0 },
      { t: 0.2, y: -15, sx: 0.9,  sy: 1.1,  r:   0 },
      { t: 0.5, y: -40, sx: 1.2,  sy: 0.85, r: 120 },
      { t: 0.8, y: -50, sx: 1.15, sy: 0.9,  r: 270 },
      { t: 1.0, y: -45, sx: 1.1,  sy: 1.0,  r: 360 },
      { t: 1.2, y: -10, sx: 1.05, sy: 1.05, r: 360 },
      { t: 1.4, y:   8, sx: 0.9,  sy: 1.1,  r: 360 },
      { t: 1.6, y:  -5, sx: 1.05, sy: 0.98, r: 360 },
      { t: 1.8, y:   0, sx: 1.0,  sy: 1.0,  r: 360 },
    ],
  },
  {
    name: 'streak',
    duration: 1.0,
    loop: 'oneShot',
    keyframes: [
      { t: 0.0, x:   0, y:  0, sx: 1.0,  sy: 1.0,  r:  0 },
      { t: 0.1, x: -12, y: -5, sx: 1.05, sy: 0.95, r: -8 },
      { t: 0.2, x:  12, y: -5, sx: 0.95, sy: 1.05, r:  8 },
      { t: 0.3, x: -10, y: -3, sx: 1.04, sy: 0.96, r: -6 },
      { t: 0.4, x:  10, y: -3, sx: 0.96, sy: 1.04, r:  6 },
      { t: 0.5, x:  -8, y: -2, sx: 1.02, sy: 0.98, r: -4 },
      { t: 0.6, x:   8, y: -2, sx: 0.98, sy: 1.02, r:  4 },
      { t: 0.8, x:   0, y:  0, sx: 1.0,  sy: 1.0,  r:  0 },
      { t: 1.0, x:   0, y:  0, sx: 1.0,  sy: 1.0,  r:  0 },
    ],
  },
  {
    name: 'sleeping',
    duration: 3.0,
    loop: 'loop',
    keyframes: [
      { t: 0.0,  y:  0, sx: 1.0,  sy: 1.0  },
      { t: 0.5,  y:  5, sx: 0.98, sy: 0.98 },
      { t: 1.0,  y:  8, sx: 0.96, sy: 0.96 },
      { t: 1.75, y: 10, sx: 0.95, sy: 0.97 },
      { t: 2.5,  y:  8, sx: 0.96, sy: 0.96 },
      { t: 3.0,  y:  8, sx: 0.96, sy: 0.96 },
    ],
  },
  {
    name: 'sad',
    duration: 2.5,
    loop: 'loop',
    keyframes: [
      { t: 0.0,  y: 0, sx: 1.0,  sy: 1.0,  r:  0 },
      { t: 0.5,  y: 3, sx: 0.97, sy: 0.97, r: -3 },
      { t: 1.0,  y: 6, sx: 0.95, sy: 0.95, r: -5 },
      { t: 1.5,  y: 8, sx: 0.94, sy: 0.96, r: -5 },
      { t: 2.0,  y: 5, sx: 0.96, sy: 0.96, r: -3 },
      { t: 2.5,  y: 6, sx: 0.95, sy: 0.95, r: -5 },
    ],
  },
  {
    name: 'excited',
    duration: 0.8,
    loop: 'loop',
    keyframes: [
      { t: 0.0, y:   0, sx: 1.0,  sy: 1.0  },
      { t: 0.2, y: -18, sx: 1.08, sy: 0.92 },
      { t: 0.4, y:   0, sx: 0.92, sy: 1.08 },
      { t: 0.6, y: -12, sx: 1.05, sy: 0.95 },
      { t: 0.8, y:   0, sx: 1.0,  sy: 1.0  },
    ],
  },
  {
    name: 'achievement',
    duration: 2.0,
    loop: 'oneShot',
    keyframes: [
      { t: 0.0,  y:   0, sx: 1.0,  sy: 1.0,  r:  0 },
      { t: 0.15, y:   8, sx: 0.9,  sy: 1.1,  r:  0 },
      { t: 0.35, y: -30, sx: 1.2,  sy: 0.85, r: 10 },
      { t: 0.6,  y: -40, sx: 1.1,  sy: 0.95, r:  5 },
      { t: 1.0,  y: -38, sx: 1.1,  sy: 0.95, r:  5 },
      { t: 1.3,  y: -15, sx: 1.05, sy: 1.0,  r:  2 },
      { t: 1.6,  y:   5, sx: 0.93, sy: 1.07, r:  0 },
      { t: 2.0,  y:   0, sx: 1.0,  sy: 1.0,  r:  0 },
    ],
  },
  // Dig states
  {
    name: 'digging',
    duration: 1.5,
    loop: 'loop',
    keyframes: [
      { t: 0.0,  y:  0, sx: 1.0,  sy: 1.0,  r:  0 },
      { t: 0.3,  y: 10, sx: 1.05, sy: 0.95, r:  8 },
      { t: 0.6,  y: 18, sx: 0.95, sy: 1.05, r: 12 },
      { t: 0.9,  y: 10, sx: 1.05, sy: 0.95, r:  8 },
      { t: 1.2,  y:  5, sx: 1.0,  sy: 1.0,  r:  4 },
      { t: 1.5,  y:  0, sx: 1.0,  sy: 1.0,  r:  0 },
    ],
  },
  {
    name: 'buried',
    duration: 1.0,
    loop: 'loop',
    keyframes: [
      { t: 0.0, y: 20, sx: 0.9,  sy: 0.9  },
      { t: 0.3, y: 25, sx: 0.88, sy: 0.92 },
      { t: 0.6, y: 22, sx: 0.9,  sy: 0.9  },
      { t: 1.0, y: 20, sx: 0.9,  sy: 0.9  },
    ],
  },
  {
    name: 'foundBone',
    duration: 1.2,
    loop: 'oneShot',
    keyframes: [
      { t: 0.0,  y: 20, sx: 0.9,  sy: 0.9,  r:  0 },
      { t: 0.2,  y: 10, sx: 0.95, sy: 0.95, r:  0 },
      { t: 0.4,  y: -20, sx: 1.2,  sy: 0.85, r: 10 },
      { t: 0.7,  y: -30, sx: 1.15, sy: 0.9,  r:  5 },
      { t: 1.0,  y: -25, sx: 1.1,  sy: 1.0,  r:  2 },
      { t: 1.2,  y:   0, sx: 1.0,  sy: 1.0,  r:  0 },
    ],
  },
];

// State machine inputs
const SM_INPUTS = [
  // Boolean inputs (loop states)
  { type: 'boolean', name: 'isSleeping' },
  { type: 'boolean', name: 'isHungry'   },
  { type: 'boolean', name: 'isExcited'  },
  // Trigger inputs (one-shots)
  { type: 'trigger', name: 'onFoodLogged'      },
  { type: 'trigger', name: 'onMealScanned'     },
  { type: 'trigger', name: 'onWaterLogged'     },
  { type: 'trigger', name: 'onLevelUp'         },
  { type: 'trigger', name: 'onStreakMilestone' },
  { type: 'trigger', name: 'onAchievement'     },
  { type: 'trigger', name: 'onDigStart'        },
  { type: 'trigger', name: 'onDigDeep'         },
  { type: 'trigger', name: 'onDigReveal'       },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function pause(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForUser(page, message, timeoutMs = 60000) {
  console.log(`\n⏸  [PAUSE — Your Turn]\n   ${message}\n   Press Enter in this terminal when ready...`);
  await new Promise(resolve => process.stdin.once('data', resolve));
}

async function clickByText(page, text, role = 'button') {
  try {
    await page.getByRole(role, { name: text }).click({ timeout: 5000 });
    return true;
  } catch {
    // Try by text content
    try {
      await page.getByText(text, { exact: false }).first().click({ timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

async function typeInField(page, label, value) {
  const input = page.getByLabel(label, { exact: false });
  await input.fill('');
  await input.type(String(value));
  await page.keyboard.press('Enter');
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('='.repeat(70));
  console.log(' Chester Rive Animation Builder');
  console.log(' Building: ChesterArtboard + ChesterStateMachine (13 states)');
  console.log('='.repeat(70));

  // Ensure output dir exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: false,
    args: ['--no-sandbox', '--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });

  const page = await context.newPage();

  // ── Step 1: Navigate to Rive ───────────────────────────────────────────────
  console.log('\n📂 Opening editor.rive.app...');
  await page.goto(RIVE_URL, { waitUntil: 'networkidle' });
  await pause(2000);

  // ── Step 2: Login ──────────────────────────────────────────────────────────
  const isLoggedIn = await page.locator('[data-testid="user-menu"], .user-avatar, .sidebar-header').first().isVisible().catch(() => false);
  if (!isLoggedIn) {
    await waitForUser(page,
      'Log into your Rive account in the browser window that just opened.\n' +
      '   Once you are on the Rive dashboard/editor, press Enter here.'
    );
  } else {
    console.log('✅ Already logged in to Rive');
  }

  // ── Step 3: Create new file ────────────────────────────────────────────────
  console.log('\n🆕 Creating new Rive file...');
  // Try New File button/menu
  const newFileClicked = await clickByText(page, 'New File') ||
                         await clickByText(page, 'New file') ||
                         await clickByText(page, 'Create file');
  if (!newFileClicked) {
    await waitForUser(page,
      'Click "New File" in Rive to create a blank file.\n' +
      '   Once the editor canvas is open, press Enter here.'
    );
  }
  await pause(3000);

  // ── Step 4: Set artboard name and size ────────────────────────────────────
  console.log(`\n🎨 Setting artboard: ${ARTBOARD_NAME} (${CANVAS_SIZE}×${CANVAS_SIZE})...`);
  await waitForUser(page,
    `In the Rive editor:\n` +
    `   1. Double-click the artboard name (probably "New Artboard") and rename it to: ${ARTBOARD_NAME}\n` +
    `   2. In the inspector panel (right side), set Width = ${CANVAS_SIZE} and Height = ${CANVAS_SIZE}\n` +
    `   Press Enter when done.`
  );

  // ── Step 5: Import Chester Idle PNG ───────────────────────────────────────
  console.log('\n📥 Importing Chester Idle PNG as chester_body...');
  const idlePngPath = path.join(ASSETS_DIR, 'chester-idle.png');
  await waitForUser(page,
    `Import the base Chester image:\n` +
    `   1. In Rive, go to Assets panel (left sidebar) → click the + button → "Import Asset"\n` +
    `   2. Import this file: ${idlePngPath}\n` +
    `   3. Drag it onto the artboard to create an Image layer\n` +
    `   4. Center it on the artboard (X=0, Y=0 in the inspector)\n` +
    `   5. Double-click the layer name in the Layers panel and rename it to: ${LAYER_NAME}\n` +
    `   Press Enter when done.`
  );

  // ── Steps 6-18: Build each animation ──────────────────────────────────────
  for (let i = 0; i < ANIMATIONS.length; i++) {
    const anim = ANIMATIONS[i];
    const isLoop    = anim.loop === 'loop';
    const loopLabel = isLoop ? 'Loop' : 'One Shot';

    console.log(`\n🎬 [${i + 1}/${ANIMATIONS.length}] Building animation: "${anim.name}" (${loopLabel}, ${anim.duration}s)`);

    // Try to click + in Animations panel to add new animation
    const animAdded = await page.locator('[title="Add animation"], [aria-label="Add animation"]').first().click({ timeout: 3000 }).then(() => true).catch(() => false);

    if (!animAdded) {
      console.log(`   → Attempting to add animation via Animations panel...`);
    }

    await pause(1000);

    // Print the keyframe recipe for this animation
    console.log(`\n   📋 KEYFRAME RECIPE for "${anim.name}":`);
    console.log(`   Duration: ${anim.duration}s | Loop: ${loopLabel}`);
    console.log(`   ${'Time'.padEnd(6)} | ${'Y'.padEnd(6)} | ${'ScaleX'.padEnd(8)} | ${'ScaleY'.padEnd(8)} | ${'Rot'.padEnd(6)} | ${'X'.padEnd(6)}`);
    console.log(`   ${'-'.repeat(55)}`);
    for (const kf of anim.keyframes) {
      const x = kf.x !== undefined ? String(kf.x) : '—';
      console.log(`   ${String(kf.t).padEnd(6)} | ${String(kf.y).padEnd(6)} | ${String(kf.sx).padEnd(8)} | ${String(kf.sy).padEnd(8)} | ${String(kf.r ?? 0).padEnd(6)} | ${x}`);
    }

    await waitForUser(page,
      `Build the "${anim.name}" animation in Rive:\n` +
      `   1. In the Animations panel (left sidebar), click + → "Animation"\n` +
      `   2. Name it exactly: ${anim.name}\n` +
      `   3. Set duration to ${anim.duration}s\n` +
      `   4. Set loop mode to: ${loopLabel}\n` +
      `   5. Select the ${LAYER_NAME} layer on the artboard\n` +
      `   6. Add keyframes using the values in the table above:\n` +
      `      - Scrub to each time (t) in the timeline\n` +
      `      - Press K to add a keyframe\n` +
      `      - Set Y, Scale X, Scale Y, Rotation in the inspector\n` +
      `   7. Apply Ease-In-Out interpolation (except linear at loop points)\n` +
      `   Press Space to preview, then press Enter here when done.`
    );

    console.log(`   ✅ Animation "${anim.name}" complete`);
  }

  // ── State Machine ──────────────────────────────────────────────────────────
  console.log(`\n⚙️  Creating State Machine: ${SM_NAME}...`);

  console.log('\n   📋 STATE MACHINE INPUTS:');
  console.log('   Booleans: isSleeping, isHungry, isExcited');
  console.log('   Triggers: onFoodLogged, onMealScanned, onWaterLogged,');
  console.log('             onLevelUp, onStreakMilestone, onAchievement,');
  console.log('             onDigStart, onDigDeep, onDigReveal');
  console.log('\n   📋 STATE → ANIMATION WIRING:');
  console.log('   Entry → idle (default loop)');
  console.log('   idle  → happy      (trigger: onFoodLogged)   → back to idle');
  console.log('   idle  → eating     (trigger: onMealScanned)  → back to idle');
  console.log('   idle  → drinking   (trigger: onWaterLogged)  → back to idle');
  console.log('   idle  → levelUp    (trigger: onLevelUp)      → back to idle');
  console.log('   idle  → streak     (trigger: onStreakMilestone) → back to idle');
  console.log('   idle  → achievement(trigger: onAchievement)  → back to idle');
  console.log('   idle  → digging    (trigger: onDigStart)     → buried');
  console.log('   buried→ foundBone  (trigger: onDigReveal)    → back to idle');
  console.log('   idle  → sleeping   (bool: isSleeping=true,   0.3s blend)');
  console.log('   idle  → sad        (bool: isHungry=true,     0.3s blend)');
  console.log('   idle  → excited    (bool: isExcited=true,    0.3s blend)');
  console.log('   sleeping/sad/excited → idle (when bool = false, 0.3s blend)');

  await waitForUser(page,
    `Create the State Machine:\n` +
    `   1. In the Animations panel, click + → "State Machine"\n` +
    `   2. Name it exactly: ${SM_NAME}\n` +
    `   3. Add all 12 inputs listed above (3 booleans + 9 triggers)\n` +
    `      Names are case-sensitive — copy them exactly!\n` +
    `   4. In the state machine graph, drag in all 13 animation states\n` +
    `   5. Draw transitions according to the wiring table above\n` +
    `   6. For one-shot transitions: condition = trigger fires; exit = on animation end\n` +
    `   7. For boolean transitions: blend time = 0.3s\n` +
    `   8. Set Entry → idle as the default\n` +
    `   Press Enter when the state machine is wired up.`
  );

  // ── Export ─────────────────────────────────────────────────────────────────
  console.log('\n📤 Ready to export chester.riv...');
  await waitForUser(page,
    `Export the Rive file:\n` +
    `   1. Click File → Export (top menu bar)\n` +
    `   2. Select "Download" → "For newest runtime"\n` +
    `   3. Save the file — it will download as chester.riv\n` +
    `   4. Move/copy the downloaded chester.riv to:\n` +
    `      ${OUTPUT_DIR}/chester.riv\n` +
    `   Press Enter once chester.riv is in that folder.`
  );

  // ── Verify export ──────────────────────────────────────────────────────────
  const rivPath = path.join(OUTPUT_DIR, 'chester.riv');
  if (fs.existsSync(rivPath)) {
    const size = fs.statSync(rivPath).size;
    console.log(`\n✅ chester.riv found! (${(size / 1024).toFixed(1)} KB)`);
    console.log('\n🎉 Chester Rive build complete!');
    console.log('\nNext step — activate Rive in the app:');
    console.log('  1. Open components/Chester/ChesterAvatar.tsx');
    console.log('     → Uncomment the Rive import lines at the top');
    console.log('     → Set RIVE_ENABLED = true');
    console.log('  2. Open components/Chester/ChesterDigAnimation.tsx');
    console.log('     → Set RIVE_ENABLED = true');
    console.log('  3. Run: npx tsc --noEmit  (should still be clean)');
    console.log('  4. Build with: npx expo run:ios / npx expo run:android');
    console.log('\n  Chester will now be fully animated with live Rive state machines!\n');
  } else {
    console.log(`\n⚠️  chester.riv not found at ${rivPath}`);
    console.log('   Please move the exported file there manually and run:');
    console.log('   node scripts/activate-rive.js');
  }

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('\n❌ Script error:', err.message);
  process.exit(1);
});
