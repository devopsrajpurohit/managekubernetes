// Comprehensive script to check canonical URLs in ALL pre-rendered HTML files
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

function checkCanonical(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    if (match) {
      const url = match[1];
      const hasWww = url.includes('://www.');
      return { url, hasWww, file: filePath, found: true };
    }
    return { url: null, hasWww: false, file: filePath, found: false };
  } catch (e) {
    return { url: null, hasWww: false, file: filePath, found: false, error: e.message };
  }
}

// Find all HTML files in dist directory
const distDir = path.join(__dirname, 'dist');
const htmlFiles = findHtmlFiles(distDir).sort();

console.log(`\n🔍 Checking canonical URLs in ${htmlFiles.length} HTML files...\n`);

const results = {
  total: htmlFiles.length,
  withWww: 0,
  withoutWww: 0,
  missing: 0,
  errors: 0,
  issues: [],
  pages: []
};

htmlFiles.forEach(file => {
  const result = checkCanonical(file);
  const relativePath = path.relative(distDir, file).replace('/index.html', '') || '/';
  
  results.pages.push({
    path: relativePath,
    url: result.url,
    hasWww: result.hasWww,
    found: result.found
  });
  
  if (result.error) {
    results.errors++;
    results.issues.push({ file: relativePath, issue: 'Error reading file', error: result.error });
  } else if (!result.found) {
    results.missing++;
    results.issues.push({ file: relativePath, issue: 'No canonical tag found' });
  } else if (result.hasWww) {
    results.withWww++;
  } else {
    results.withoutWww++;
    results.issues.push({ 
      file: relativePath, 
      issue: 'Missing www', 
      url: result.url,
      expected: result.url.replace('://', '://www.') 
    });
  }
});

// Print detailed list
console.log('📄 ALL PAGES CHECKED:\n');
results.pages.forEach((page, i) => {
  const status = page.found && page.hasWww ? '✅' : page.found ? '❌' : '⚠️';
  console.log(`${i + 1}. ${status} ${page.path || '/'}`);
  if (page.url) {
    console.log(`   Canonical: ${page.url}`);
  } else {
    console.log(`   Canonical: Not found`);
  }
});

// Print summary
console.log('\n📊 SUMMARY:');
console.log(`   Total files: ${results.total}`);
console.log(`   ✅ With www: ${results.withWww}`);
console.log(`   ❌ Without www: ${results.withoutWww}`);
console.log(`   ⚠️  Missing canonical: ${results.missing}`);
console.log(`   🔴 Errors: ${results.errors}`);

if (results.issues.length > 0) {
  console.log('\n❌ ISSUES FOUND:\n');
  results.issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue.file}`);
    console.log(`   Issue: ${issue.issue}`);
    if (issue.url) {
      console.log(`   Current: ${issue.url}`);
      console.log(`   Expected: ${issue.expected}`);
    }
    if (issue.error) {
      console.log(`   Error: ${issue.error}`);
    }
    console.log('');
  });
} else {
  console.log('\n✅ All canonical URLs are correct with www!\n');
}

// Exit with error code if issues found
if (results.withoutWww > 0 || results.missing > 0 || results.errors > 0) {
  process.exit(1);
}
