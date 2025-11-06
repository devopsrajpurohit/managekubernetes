// Test script to verify canonical URL logic
function getCanonicalUrl() {
  try {
    if (typeof window === 'undefined' || !window.location) {
      return 'https://www.managekubernetes.com';
    }
    const pathname = window.location.pathname || '/';
    const baseUrl = 'https://www.managekubernetes.com';
    return baseUrl + pathname;
  } catch (error) {
    console.warn('Error getting canonical URL:', error);
    return 'https://www.managekubernetes.com';
  }
}

// Simulate different scenarios
const testCases = [
  { origin: 'https://managekubernetes.com', pathname: '/learn/core-components' },
  { origin: 'https://www.managekubernetes.com', pathname: '/learn/core-components' },
  { origin: 'https://managekubernetes.com', pathname: '/blog/troubleshooting-pods-evicted' },
  { origin: 'https://www.managekubernetes.com', pathname: '/blog/troubleshooting-pods-evicted' },
];

console.log('Testing getCanonicalUrl function:');
testCases.forEach((test, i) => {
  global.window = {
    location: {
      origin: test.origin,
      pathname: test.pathname
    }
  };
  const result = getCanonicalUrl();
  const expected = 'https://www.managekubernetes.com' + test.pathname;
  const pass = result === expected;
  console.log(`Test ${i + 1}: ${pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Input: ${test.origin}${test.pathname}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Got: ${result}`);
  console.log('');
});
