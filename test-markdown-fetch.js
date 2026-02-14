/**
 * Test script for markdown-fetch
 */

const { fetchMarkdown, fetchMarkdownBatch } = require('./markdown-fetch');

async function runTests() {
  console.log('Testing markdown-fetch...\n');
  
  // Test 1: Simple fetch with metadata
  console.log('Test 1: Fetch with metadata');
  try {
    const result = await fetchMarkdown('https://example.com', { includeMetadata: true });
    console.log('✓ Success');
    console.log(`  Method: ${result.method}`);
    console.log(`  Tokens: ${result.tokens || 'N/A'}`);
    console.log(`  Content length: ${result.content.length} chars`);
    console.log(`  Preview: ${result.content.substring(0, 100)}...`);
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Fetch without metadata
  console.log('Test 2: Fetch without metadata (returns string)');
  try {
    const content = await fetchMarkdown('https://github.com/moteboxai');
    console.log('✓ Success');
    console.log(`  Type: ${typeof content}`);
    console.log(`  Length: ${content.length} chars`);
    console.log(`  Preview: ${content.substring(0, 100)}...`);
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Batch fetch
  console.log('Test 3: Batch fetch multiple URLs');
  try {
    const urls = [
      'https://example.com',
      'https://github.com/moteboxai',
      'https://this-will-probably-fail-12345.com'
    ];
    const results = await fetchMarkdownBatch(urls);
    console.log('✓ Batch complete');
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.url}: ${r.error ? '✗ ' + r.error : '✓ Success (' + r.content.length + ' chars)'}`);
    });
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 4: Invalid URL handling
  console.log('Test 4: Invalid URL handling');
  try {
    await fetchMarkdown('not-a-url');
    console.log('✗ Should have thrown error');
  } catch (error) {
    console.log('✓ Correctly threw error:', error.message);
  }
  
  console.log('\nAll tests complete.');
}

runTests().catch(console.error);
