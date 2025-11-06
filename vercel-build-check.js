// Script to verify canonical URLs after Vercel build
// This can be added to build process to ensure www is always present
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file === 'index.html') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function checkAndFixCanonical(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    
    if (match) {
      const url = match[1];
      if (!url.includes('://www.')) {
        // Fix it
        const fixedUrl = url.replace(/https?:\/\/(?!www\.)/, (match) => match + 'www.');
        content = content.replace(
          /(<link[^>]*rel=["']canonical["'][^>]*href=["'])([^"']+)(["'])/i,
          `$1${fixedUrl}$3`
        );
        fs.writeFileSync(filePath, content, 'utf8');
        return { fixed: true, old: url, new: fixedUrl };
      }
      return { fixed: false, url };
    }
    return { fixed: false, found: false };
  } catch (e) {
    return { fixed: false, error: e.message };
  }
}

const distDir = path.join(__dirname, 'dist');
const htmlFiles = findHtmlFiles(distDir);

console.log('🔍 Checking and fixing canonical URLs in', htmlFiles.length, 'files...\n');

let fixed = 0;
let alreadyCorrect = 0;

htmlFiles.forEach(file => {
  const result = checkAndFixCanonical(file);
  const relativePath = path.relative(distDir, file);
  
  if (result.fixed) {
    fixed++;
    console.log(`✅ Fixed: ${relativePath}`);
    console.log(`   Old: ${result.old}`);
    console.log(`   New: ${result.new}\n`);
  } else if (result.url && result.url.includes('://www.')) {
    alreadyCorrect++;
  }
});

console.log(`\n📊 Results:`);
console.log(`   Fixed: ${fixed}`);
console.log(`   Already correct: ${alreadyCorrect}`);
console.log(`   Total: ${htmlFiles.length}`);

if (fixed > 0) {
  console.log('\n✅ Fixed canonical URLs!');
} else {
  console.log('\n✅ All canonical URLs are correct!');
}

