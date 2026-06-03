const http = require('http');

async function runTests() {
  const BASE_URL = 'http://localhost:3000';
  let passed = 0;
  
  console.log('--- TEST 1: Brute force lockout ---');
  let test1Passed = false;
  let test1Msg = '';
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email=test%40example.com&password=wrongpassword&csrfToken=',
        redirect: 'manual'
      });
      // The API guard for rate limit might return 429
      if (res.status === 429) {
        test1Passed = true;
        const text = await res.text();
        test1Msg = `Status 429, Body: ${text}`;
        break;
      } else {
        test1Msg = `Attempt ${i+1}: Status ${res.status}`;
      }
    } catch(e) {
      test1Msg = e.message;
    }
  }
  console.log(test1Passed ? 'Test 1 Pass ✅' : 'Test 1 Fail ❌', '-', test1Msg);
  
  console.log('\n--- TEST 2: Security headers ---');
  try {
    const res = await fetch(BASE_URL);
    const headers = res.headers;
    const required = {
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    };
    let test2Passed = true;
    let test2Msg = [];
    for (const [key, val] of Object.entries(required)) {
      const actual = headers.get(key);
      if (actual !== val) {
        test2Passed = false;
        test2Msg.push(`Missing or mismatched ${key}: expected '${val}', got '${actual}'`);
      } else {
        test2Msg.push(`Header ${key} is correct.`);
      }
    }
    const csp = headers.get('content-security-policy');
    if (!csp || !csp.includes("default-src 'self'")) {
       test2Passed = false;
       test2Msg.push(`Missing or incorrect CSP: ${csp}`);
    } else {
       test2Msg.push(`Header content-security-policy is correct.`);
    }
    console.log(test2Passed ? 'Test 2 Pass ✅' : 'Test 2 Fail ❌');
    console.log(test2Msg.join('\n'));
  } catch (e) {
    console.log('Test 2 Fail ❌', e.message);
  }
  
  console.log('\n--- TEST 3: Role isolation ---');
  try {
    // Assuming unauthenticated, /admin should redirect to /login
    const res = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
    if (res.status === 307 || res.status === 302 || res.status === 308) {
      const location = res.headers.get('location');
      if (location.includes('/login') || location.includes('/student')) {
        console.log('Test 3 Pass ✅', `Redirected to ${location}`);
      } else {
        console.log('Test 3 Fail ❌', `Redirected to ${location}`);
      }
    } else if (res.status === 401 || res.status === 403) {
      console.log('Test 3 Pass ✅', `Status ${res.status}`);
    } else {
      console.log('Test 3 Fail ❌', `Status ${res.status}`);
    }
  } catch(e) {
    console.log('Test 3 Fail ❌', e.message);
  }

  console.log('\n--- TEST 4: Unauthenticated API access ---');
  try {
    const res = await fetch(`${BASE_URL}/api/attendance/today`);
    const data = await res.text();
    if (res.status === 401 && data.includes('Unauthorized')) {
       console.log('Test 4 Pass ✅', `Status 401, Body: ${data}`);
    } else {
       console.log('Test 4 Fail ❌', `Status ${res.status}, Body: ${data}`);
    }
  } catch(e) {
    console.log('Test 4 Fail ❌', e.message);
  }
  
  console.log('\n--- TEST 5: SQL injection via Zod validation ---');
  try {
    const res = await fetch(`${BASE_URL}/api/attendance/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: "'; DROP TABLE students; --", date: "invalid", records: "not_an_array", headCount: -999 })
    });
    const data = await res.text();
    if (res.status === 400 && data.includes('Validation failed')) {
       console.log('Test 5 Pass ✅', `Status 400, Body: ${data}`);
    } else {
       console.log('Test 5 Fail ❌', `Status ${res.status}, Body: ${data}`);
    }
  } catch(e) {
    console.log('Test 5 Fail ❌', e.message);
  }

  console.log('\n--- TEST 6: Cron route protection ---');
  try {
    const res = await fetch(`${BASE_URL}/api/cron/lift-suspensions`);
    const data = await res.text();
    if (res.status === 401 && data.includes('Unauthorized')) {
       console.log('Test 6 Pass ✅', `Status 401, Body: ${data}`);
    } else {
       console.log('Test 6 Fail ❌', `Status ${res.status}, Body: ${data}`);
    }
  } catch(e) {
    console.log('Test 6 Fail ❌', e.message);
  }
}

runTests().then(() => {
  console.log('\nTests completed.');
});
