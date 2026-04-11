/**
 * activate-rive.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this AFTER chester.riv is in assets/animations/chester.riv
 * It flips RIVE_ENABLED = true and uncomments the Rive imports in the
 * two components that gate on the flag.
 *
 * HOW TO RUN:
 *   node scripts/activate-rive.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RIV  = path.join(ROOT, 'assets/animations/chester.riv');

if (!fs.existsSync(RIV)) {
  console.error(`\n❌ chester.riv not found at:\n   ${RIV}\n\nRun the Rive build first: node scripts/build-chester-rive.js`);
  process.exit(1);
}

const SIZE = fs.statSync(RIV).size;
console.log(`✅ chester.riv found (${(SIZE / 1024).toFixed(1)} KB)\n`);

const FILES = [
  path.join(ROOT, 'components/Chester/ChesterAvatar.tsx'),
  path.join(ROOT, 'components/Chester/ChesterDigAnimation.tsx'),
];

for (const file of FILES) {
  let src = fs.readFileSync(file, 'utf8');
  const orig = src;

  // 1. Flip the flag
  src = src.replace('const RIVE_ENABLED = false;', 'const RIVE_ENABLED = true;');

  // 2. Uncomment the Rive import line
  src = src.replace("// import Rive from 'rive-react-native';", "import Rive from 'rive-react-native';");

  // 3. Uncomment the CHESTER_RIV require
  src = src.replace(
    "// const CHESTER_RIV = require('../../assets/animations/chester.riv');",
    "const CHESTER_RIV = require('../../assets/animations/chester.riv');"
  );
  // Also handle the modal-relative path variant
  src = src.replace(
    "// const CHESTER_RIV = require('../assets/animations/chester.riv');",
    "const CHESTER_RIV = require('../assets/animations/chester.riv');"
  );

  // 4. Uncomment the Rive JSX in ChesterAvatar (the <Rive ... /> block)
  src = src.replace(
    /\/\/ (<Rive[\s\S]*?\/>)\n([ \t]*)\/\/ \)/g,
    '$1\n$2)'
  );

  // 5. Uncomment the Rive JSX in ChesterDigAnimation (the {RIVE_ENABLED && (<Rive ... />) block)
  src = src.replace(/\/\* \{RIVE_ENABLED && \(([\s\S]*?)\)\} \*\//g, '{RIVE_ENABLED && ($1)}');

  if (src !== orig) {
    fs.writeFileSync(file, src, 'utf8');
    console.log(`✏️  Updated: ${path.relative(ROOT, file)}`);
  } else {
    console.log(`⏭  No changes needed: ${path.relative(ROOT, file)}`);
  }
}

console.log('\n🎉 Rive activated! Next steps:');
console.log('   1. npx tsc --noEmit  — verify no TypeScript errors');
console.log('   2. npx expo run:ios / npx expo run:android  — build with native Rive module');
console.log('   3. Chester now runs full Rive state machine animations!\n');
