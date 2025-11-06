// Quick script to check canonical URLs in pre-rendered HTML files
import fs from 'fs';
import path from 'path';

function checkCanonical(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    if (match) {
      const url = match[1];
      const hasWww = url.includes('://www.');
      return { url, hasWww, file: filePath };
    }
    return { url: null, hasWww: false, file: filePath };
  } catch (e) {
    return { url: null, hasWww: false, file: filePath, error: e.message };
  }
}

// Check key files
const filesToCheck = [
  'dist/learn/core-components/index.html',
  'dist/blog/troubleshooting-pods-evicted/index.html',
  'dist/blog/debugging-kubernetes-applications/index.html',
  'dist/index.html'
];

console.log('Checking canonical URLs in pre-rendered files:\n');
let allGood = true;
filesToCheck.forEach(file => {
  const result = checkCanonical(file);
  if (result.url) {
    const status = result.hasWww ? '✅' : '❌';
    if (!result.hasWww) allGood = false;
    console.log(`${status} ${file}`);
    console.log(`   URL: ${result.url}`);
  } else {
    console.log(`⚠️  ${file} - No canonical found`);
    allGood = false;
  }
  console.log('');
});

if (allGood) {
  console.log('✅ All canonical URLs have www!');
} else {
  console.log('❌ Some canonical URLs are missing www');
  process.exit(1);
}
