import { generateTestCases, assertResults } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test 1: Generate test cases from example file
console.log('=== Test 1: Generate Test Cases ===');
try {
  const testCases = generateTestCases(
    path.join(__dirname, '../examples/login_success.http.tspec'),
    { env: { TEST_PASSWORD: 'secret123' } }
  );
  
  console.log('Generated', testCases.length, 'test case(s)');
  console.log('Test Case ID:', testCases[0].id);
  console.log('Protocol:', testCases[0].protocol);
  console.log('Method:', testCases[0].request.method);
  console.log('Path:', testCases[0].request.path);
  console.log('Body username:', testCases[0].request.body.json.username);
  console.log('Assertions count:', testCases[0].assertions.length);
  console.log('✓ Test 1 passed\n');
} catch (e) {
  console.error('✗ Test 1 failed:', e.message);
  process.exit(1);
}

// Test 2: Assert results
console.log('=== Test 2: Assert Results ===');
try {
  const testCases = generateTestCases(
    path.join(__dirname, '../examples/login_success.http.tspec'),
    { env: { TEST_PASSWORD: 'secret123' } }
  );
  
  // Simulate a successful response
  const mockResponse = {
    statusCode: 200,
    body: {
      data: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        user: { id: 'U123456' }
      }
    },
    headers: { 'content-type': 'application/json' },
    responseTime: 150
  };
  
  const result = assertResults(mockResponse, testCases[0]);
  
  console.log('Test Case ID:', result.testCaseId);
  console.log('Passed:', result.passed);
  console.log('Summary:', result.summary);
  console.log('Extracted token exists:', !!result.extracted.token);
  console.log('Extracted user_id:', result.extracted.user_id);
  
  result.assertions.forEach((a, i) => {
    console.log(`  Assertion ${i + 1} [${a.type}]:`, a.passed ? '✓' : '✗', a.message);
  });
  
  if (result.passed) {
    console.log('✓ Test 2 passed\n');
  } else {
    console.log('✗ Test 2 failed (assertions did not pass)\n');
  }
} catch (e) {
  console.error('✗ Test 2 failed:', e.message);
  process.exit(1);
}

// Test 3: Variable replacement
console.log('=== Test 3: Variable Replacement ===');
try {
  const testCases = generateTestCases(
    path.join(__dirname, '../examples/login_success.http.tspec'),
    { 
      params: { username: 'custom_user' },
      env: { TEST_PASSWORD: 'mypassword', API_HOST: 'custom.api.com' }
    }
  );
  
  console.log('Username (from params):', testCases[0].request.body.json.username);
  console.log('Password (from env):', testCases[0].request.body.json.password);
  console.log('Host (from env):', testCases[0].environment.host);
  console.log('Request ID contains uuid:', testCases[0].request.headers['X-Request-ID'].startsWith('req_'));
  console.log('✓ Test 3 passed\n');
} catch (e) {
  console.error('✗ Test 3 failed:', e.message);
  process.exit(1);
}

console.log('=== All tests passed! ===');
