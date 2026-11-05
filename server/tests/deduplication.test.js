import assert from 'assert';
import { normalizeQuery, checkRequestDeduplication } from '../src/services/switchService.js';

console.log('--- Running Deduplication & Workflow Unit Tests ---');

// Test 1: Query normalization handles casing, hyphens, and whitespace
console.log('Test 1: Query normalization handles casing, hyphens, and punctuation');
assert.strictEqual(
  normalizeQuery('AI internships for second-year CSE students'),
  'ai internships for second year cse students'
);
assert.strictEqual(
  normalizeQuery('AI internships for second year CSE students'),
  'ai internships for second year cse students'
);
assert.strictEqual(
  normalizeQuery('  ai   internships   for   second-year  cse  students.  '),
  'ai internships for second year cse students'
);
assert.strictEqual(normalizeQuery(''), '');
assert.strictEqual(normalizeQuery(null), '');
console.log('✓ Test 1 passed');

// Test 2: Identical repeated queries are flagged as duplicates for Piyush
console.log('Test 2: Known covered query for Piyush is detected as duplicate');
const profile = {
  name: 'Piyush ',
  degree: 'B.Tech',
  branch: 'CSE',
  year_of_study: 2
};

const duplicateCheck1 = checkRequestDeduplication(profile, {
  query: 'AI internships for second-year CSE students'
});
assert.strictEqual(duplicateCheck1.isDuplicate, true);
assert.strictEqual(duplicateCheck1.shortlist, 'piyush-all-shortlist.json');

const duplicateCheck2 = checkRequestDeduplication(profile, {
  query: 'AI internships for second year CSE students'
});
assert.strictEqual(duplicateCheck2.isDuplicate, true);
assert.strictEqual(duplicateCheck2.shortlist, 'piyush-all-shortlist.json');
console.log('✓ Test 2 passed');

// Test 3: Genuinely new search query is NOT marked as duplicate
console.log('Test 3: Genuinely new search query triggers fresh run');
const newQueryCheck = checkRequestDeduplication(profile, {
  query: 'Cybersecurity and ethical hacking internships for CSE students'
});
assert.strictEqual(newQueryCheck.isDuplicate, false);
assert.strictEqual(newQueryCheck.normalizedQuery, 'cybersecurity and ethical hacking internships for cse students');
console.log('✓ Test 3 passed');

// Test 4: Another genuinely new search query
console.log('Test 4: Cloud computing & DevOps is recognized as genuinely new');
const cloudQueryCheck = checkRequestDeduplication(profile, {
  query: 'Cloud DevOps and backend infrastructure fellowships'
});
assert.strictEqual(cloudQueryCheck.isDuplicate, false);
assert.strictEqual(cloudQueryCheck.normalizedQuery, 'cloud devops and backend infrastructure fellowships');
console.log('✓ Test 4 passed');

console.log('--- All Deduplication Unit Tests Passed! ---');
