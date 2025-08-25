import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const slowRequests = new Rate('slow_requests');
const systemBreakpoint = new Counter('system_breakpoint_reached');
const recoveryTime = new Trend('recovery_time_after_spike');

// Stress test configuration - aggressive load profile
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Warm up
    { duration: '3m', target: 100 },  // Normal load
    { duration: '2m', target: 200 },  // Increase load
    { duration: '3m', target: 300 },  // High load
    { duration: '2m', target: 500 },  // Very high load
    { duration: '5m', target: 800 },  // Stress load - expect system degradation
    { duration: '3m', target: 1000 }, // Maximum stress - system should break
    { duration: '2m', target: 500 },  // Sudden drop
    { duration: '3m', target: 200 },  // Recovery phase
    { duration: '2m', target: 100 },  // Stabilization
    { duration: '2m', target: 0 },    // Cool down
  ],
  thresholds: {
    // More lenient thresholds for stress testing
    http_req_duration: ['p(95)<2000'], // 95% under 2s (degraded performance acceptable)
    http_req_duration: ['p(99)<5000'], // 99% under 5s
    errors: ['rate<0.2'], // Allow up to 20% error rate under stress
    http_req_failed: ['rate<0.1'], // Allow up to 10% HTTP failures
    slow_requests: ['rate<0.5'], // Track requests over 1s
  },
  // Resource limits
  noConnectionReuse: false, // Reuse connections to be more realistic
  userAgent: 'k6-stress-test/1.0',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Stress test scenarios with different load patterns
const SCENARIOS = {
  BURST_AUTHENTICATION: 0.3,  // 30% - Simulate login storms
  HEAVY_CONTACT_OPS: 0.4,     // 40% - Heavy CRUD operations
  SEARCH_BOMBARDMENT: 0.2,    // 20% - Search/filter operations
  MIXED_OPERATIONS: 0.1,      // 10% - Random mixed operations
};

// Test data pools for stress testing
const USER_POOL = [];
const CONTACT_POOL = [];
let poolInitialized = false;

// Aggressive test data generators
function generateBulkUsers(count = 50) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    users.push({
      email: `stress-user-${timestamp}-${randomId}@loadtest.com`,
      username: `stress${timestamp}${randomId}`,
      password: 'StressTest123!',
      firstName: `Stress${randomId}`,
      lastName: `User${i}`,
    });
  }
  return users;
}

function generateBulkContacts(count = 100) {
  const contacts = [];
  const companies = [
    'Stress Test Corp', 'Load Test Ltd', 'Performance Inc', 'Scale Systems',
    'Heavy Load Industries', 'Burst Processing Co', 'Concurrent Solutions',
    'High Throughput Group', 'Peak Load Ventures', 'Max Capacity Systems'
  ];
  const titles = [
    'Stress Test Manager', 'Load Test Director', 'Performance Engineer',
    'Scaling Specialist', 'Throughput Analyst', 'Capacity Planner'
  ];
  
  for (let i = 0; i < count; i++) {
    const timestamp = Date.now() + i;
    const randomId = Math.random().toString(36).substring(2, 8);
    contacts.push({
      firstName: `Contact${randomId}`,
      lastName: `Stress${i}`,
      email: `stress-contact-${timestamp}-${randomId}@loadtest.com`,
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      company: companies[Math.floor(Math.random() * companies.length)],
      jobTitle: titles[Math.floor(Math.random() * titles.length)],
      notes: `Stress test contact generated at ${new Date().toISOString()} - Batch ${Math.floor(i / 10)}`,
      tags: ['stress-test', 'load-test', `batch-${Math.floor(i / 10)}`, `wave-${Math.floor(i / 25)}`],
    });
  }
  return contacts;
}

export function setup() {
  console.log('🔥 STRESS TEST SETUP - Preparing for system breakdown testing');
  
  // Verify service is running
  const healthCheck = http.get(`${BASE_URL}/api/health`, { timeout: '10s' });
  if (healthCheck.status !== 200) {
    throw new Error(`Service not available for stress testing: ${healthCheck.status}`);
  }
  
  console.log('✅ Service available - Beginning aggressive stress test');
  console.log('⚠️  WARNING: This test is designed to break the system and find limits');
  
  return {
    baseUrl: BASE_URL,
    startTime: Date.now(),
    systemHealthy: true,
  };
}

export default function(data) {
  // Initialize pools once per VU
  if (!poolInitialized) {
    USER_POOL.push(...generateBulkUsers(5)); // 5 users per VU
    CONTACT_POOL.push(...generateBulkContacts(20)); // 20 contacts per VU
    poolInitialized = true;
  }
  
  const scenario = Math.random();
  const startTime = Date.now();
  
  try {
    if (scenario < SCENARIOS.BURST_AUTHENTICATION) {
      burstAuthenticationScenario();
    } else if (scenario < SCENARIOS.BURST_AUTHENTICATION + SCENARIOS.HEAVY_CONTACT_OPS) {
      heavyContactOperationsScenario();
    } else if (scenario < SCENARIOS.BURST_AUTHENTICATION + SCENARIOS.HEAVY_CONTACT_OPS + SCENARIOS.SEARCH_BOMBARDMENT) {
      searchBombardmentScenario();
    } else {
      mixedOperationsScenario();
    }
  } catch (error) {
    console.error(`VU${__VU} Error:`, error.message);
    errorRate.add(1);
  }
  
  // Variable sleep based on current load
  const currentStage = getCurrentStageInfo();
  const sleepTime = Math.max(0.1, 2 - (currentStage.target / 500)); // Shorter sleep at higher load
  sleep(sleepTime);
}

function getCurrentStageInfo() {
  // Approximate current stage based on elapsed time
  const elapsed = (Date.now() - (__ENV.START_TIME || Date.now())) / 1000;
  let target = 50; // Default
  
  if (elapsed < 120) target = 50;
  else if (elapsed < 300) target = 100;
  else if (elapsed < 420) target = 200;
  else if (elapsed < 600) target = 300;
  else if (elapsed < 720) target = 500;
  else if (elapsed < 1020) target = 800;
  else if (elapsed < 1200) target = 1000;
  else if (elapsed < 1320) target = 500;
  else if (elapsed < 1500) target = 200;
  else if (elapsed < 1620) target = 100;
  
  return { target, elapsed };
}

function burstAuthenticationScenario() {
  // Rapid-fire authentication attempts
  const user = USER_POOL[Math.floor(Math.random() * USER_POOL.length)];
  const rapidFire = Math.random() < 0.7; // 70% chance of rapid requests
  
  let authToken = '';
  
  // Register burst
  for (let i = 0; i < (rapidFire ? 3 : 1); i++) {
    const uniqueUser = {
      ...user,
      email: `${user.email.split('@')[0]}-${Date.now()}-${i}@loadtest.com`,
      username: `${user.username}${Date.now()}${i}`,
    };
    
    const response = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(uniqueUser), {
      headers: { 'Content-Type': 'application/json' },
      timeout: '5s',
    });
    
    const success = check(response, {
      'burst register status ok': (r) => r.status === 201,
      'burst register not too slow': (r) => r.timings.duration < 3000,
    });
    
    errorRate.add(!success);
    slowRequests.add(response.timings.duration > 1000);
    
    if (success && i === 0) { // Use first registration for login
      try {
        const body = JSON.parse(response.body);
        authToken = body.data?.token || '';
        
        // Immediate login burst
        const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
          email: uniqueUser.email,
          password: uniqueUser.password,
        }), {
          headers: { 'Content-Type': 'application/json' },
          timeout: '5s',
        });
        
        check(loginResponse, {
          'burst login status ok': (r) => r.status === 200,
          'burst login not too slow': (r) => r.timings.duration < 2000,
        });
        
        errorRate.add(loginResponse.status >= 400);
        slowRequests.add(loginResponse.timings.duration > 1000);
      } catch (e) {
        // Ignore parsing errors in stress test
      }
    }
    
    if (rapidFire && i < 2) {
      sleep(0.1); // Very short sleep between rapid requests
    }
  }
}

function heavyContactOperationsScenario() {
  // First ensure we have auth token
  const user = USER_POOL[Math.floor(Math.random() * USER_POOL.length)];
  let authToken = authenticateUser(user);
  
  if (!authToken) return;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
  
  // Perform multiple heavy operations in sequence
  const operationCount = Math.floor(Math.random() * 5) + 3; // 3-7 operations
  
  for (let i = 0; i < operationCount; i++) {
    const operation = Math.random();
    
    if (operation < 0.4) {
      // Bulk contact creation
      createMultipleContacts(headers, Math.floor(Math.random() * 3) + 1);
    } else if (operation < 0.7) {
      // Heavy read operations with complex queries
      performComplexReads(headers);
    } else {
      // Bulk updates
      performBulkUpdates(headers);
    }
    
    sleep(0.05); // Very short sleep between operations
  }
}

function createMultipleContacts(headers, count) {
  for (let i = 0; i < count; i++) {
    const contact = CONTACT_POOL[Math.floor(Math.random() * CONTACT_POOL.length)];
    const uniqueContact = {
      ...contact,
      email: `${contact.email.split('@')[0]}-${Date.now()}-${i}@loadtest.com`,
      notes: `${contact.notes} - Stress test iteration ${i}`,
    };
    
    const response = http.post(`${BASE_URL}/api/contacts`, JSON.stringify(uniqueContact), {
      headers,
      timeout: '10s',
    });
    
    const success = check(response, {
      'bulk create contact status ok': (r) => r.status === 201,
      'bulk create not extremely slow': (r) => r.timings.duration < 5000,
    });
    
    errorRate.add(!success);
    slowRequests.add(response.timings.duration > 1000);
    
    // Check if system is showing signs of stress
    if (response.timings.duration > 3000) {
      console.warn(`VU${__VU}: Slow response detected: ${response.timings.duration}ms`);
    }
    
    if (response.status >= 500) {
      console.warn(`VU${__VU}: Server error detected: ${response.status}`);
      systemBreakpoint.add(1);
    }
  }
}

function performComplexReads(headers) {
  // Multiple complex read operations
  const queries = [
    'search=stress&limit=50',
    'company=Stress Test Corp&status=active&limit=30',
    'tags=stress-test,load-test&limit=40',
    'search=manager&company=Load Test Ltd&limit=25',
  ];
  
  for (const query of queries) {
    const response = http.get(`${BASE_URL}/api/contacts?${query}`, {
      headers,
      timeout: '8s',
    });
    
    const success = check(response, {
      'complex read status ok': (r) => r.status === 200,
      'complex read not too slow': (r) => r.timings.duration < 3000,
    });
    
    errorRate.add(!success);
    slowRequests.add(response.timings.duration > 1000);
  }
}

function performBulkUpdates(headers) {
  // Simulate bulk update operations
  const updateCount = Math.floor(Math.random() * 5) + 2; // 2-6 updates
  
  for (let i = 0; i < updateCount; i++) {
    // Since we don't track contact IDs in stress test, simulate with random IDs
    const fakeContactId = `stress-${Math.random().toString(36).substring(2, 8)}`;
    const updates = {
      firstName: `StressUpdated${i}`,
      lastName: `Bulk${Date.now()}`,
      jobTitle: `Stress Test Update ${i}`,
      notes: `Updated during stress test - ${new Date().toISOString()}`,
    };
    
    const response = http.put(`${BASE_URL}/api/contacts/${fakeContactId}`, JSON.stringify(updates), {
      headers,
      timeout: '8s',
    });
    
    // Don't fail on 404s for fake IDs in stress test
    const success = check(response, {
      'bulk update response acceptable': (r) => r.status === 200 || r.status === 404,
      'bulk update not extremely slow': (r) => r.timings.duration < 4000,
    });
    
    if (response.status >= 500) {
      errorRate.add(true);
      systemBreakpoint.add(1);
    }
    
    slowRequests.add(response.timings.duration > 1000);
  }
}

function searchBombardmentScenario() {
  const user = USER_POOL[Math.floor(Math.random() * USER_POOL.length)];
  let authToken = authenticateUser(user);
  
  if (!authToken) return;
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
  };
  
  // Rapid search queries
  const searchTerms = [
    'stress', 'load', 'test', 'contact', 'manager', 'director', 'corp', 'systems',
    'performance', 'scale', 'burst', 'heavy', 'concurrent', 'throughput'
  ];
  
  const searchCount = Math.floor(Math.random() * 10) + 5; // 5-14 searches
  
  for (let i = 0; i < searchCount; i++) {
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    const limit = [10, 20, 50, 100][Math.floor(Math.random() * 4)];
    
    const response = http.get(`${BASE_URL}/api/contacts?search=${searchTerm}&limit=${limit}`, {
      headers,
      timeout: '5s',
    });
    
    const success = check(response, {
      'search bombardment status ok': (r) => r.status === 200,
      'search bombardment not too slow': (r) => r.timings.duration < 2000,
    });
    
    errorRate.add(!success);
    slowRequests.add(response.timings.duration > 1000);
    
    // No sleep - bombardment!
  }
}

function mixedOperationsScenario() {
  // Chaotic mixed operations - simulate real user doing many things rapidly
  const user = USER_POOL[Math.floor(Math.random() * USER_POOL.length)];
  let authToken = authenticateUser(user);
  
  if (!authToken) return;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
  
  const operations = [
    () => http.get(`${BASE_URL}/api/contacts?limit=20`, { headers, timeout: '5s' }),
    () => http.post(`${BASE_URL}/api/contacts`, JSON.stringify(CONTACT_POOL[0]), { headers, timeout: '8s' }),
    () => http.get(`${BASE_URL}/api/contacts?search=test&limit=10`, { headers, timeout: '5s' }),
    () => http.get(`${BASE_URL}/api/health`, { timeout: '3s' }),
    () => http.get(`${BASE_URL}/api/contacts?company=Test&limit=15`, { headers, timeout: '5s' }),
  ];
  
  // Perform 3-8 random operations rapidly
  const opCount = Math.floor(Math.random() * 6) + 3;
  for (let i = 0; i < opCount; i++) {
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const response = operation();
    
    errorRate.add(response.status >= 400);
    slowRequests.add(response.timings.duration > 1000);
    
    if (response.status >= 500) {
      systemBreakpoint.add(1);
    }
  }
}

function authenticateUser(user) {
  // Quick auth - don't register, just attempt login or use cached token
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '3s',
  });
  
  if (loginResponse.status === 200) {
    try {
      const body = JSON.parse(loginResponse.body);
      return body.data?.token || '';
    } catch (e) {
      return '';
    }
  }
  
  // If login failed, try quick registration
  const registerResponse = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    ...user,
    email: `${user.email.split('@')[0]}-${Date.now()}@loadtest.com`,
    username: `${user.username}${Date.now()}`,
  }), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '5s',
  });
  
  if (registerResponse.status === 201) {
    try {
      const body = JSON.parse(registerResponse.body);
      return body.data?.token || '';
    } catch (e) {
      return '';
    }
  }
  
  return '';
}

export function teardown(data) {
  const duration = Date.now() - data.startTime;
  console.log(`🔥 STRESS TEST COMPLETE - Duration: ${Math.floor(duration / 1000)}s`);
  console.log('💥 System stress testing finished - Check for breaking points and recovery patterns');
}

export function handleSummary(data) {
  const breakpoints = data.metrics.system_breakpoint_reached ? data.metrics.system_breakpoint_reached.values.count : 0;
  const totalRequests = data.metrics.http_reqs.values.count;
  const errorRate = data.metrics.errors ? data.metrics.errors.values.rate * 100 : 0;
  const slowRate = data.metrics.slow_requests ? data.metrics.slow_requests.values.rate * 100 : 0;
  
  return {
    'stress-test-report.html': htmlStressReport(data),
    stdout: `
🔥 STRESS TEST RESULTS 🔥
========================
Duration: ${Math.floor(data.state.testRunDurationMs / 1000)}s
Total Requests: ${totalRequests}
Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(1)}/s
Error Rate: ${errorRate.toFixed(2)}% (Target: <20%)
Slow Requests (>1s): ${slowRate.toFixed(2)}%
System Breakpoints: ${breakpoints}

Performance Under Stress:
- Average Response: ${data.metrics.http_req_duration.values.avg.toFixed(0)}ms
- 95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms  
- 99th Percentile: ${data.metrics.http_req_duration.values['p(99)'].toFixed(0)}ms
- Max Response: ${data.metrics.http_req_duration.values.max.toFixed(0)}ms

${errorRate < 20 ? '✅ System survived stress test!' : '⚠️  High error rate - system stressed'}
${slowRate < 50 ? '✅ Response times acceptable under stress' : '⚠️  Many slow responses detected'}
${breakpoints === 0 ? '✅ No complete system failures' : `⚠️  ${breakpoints} system breakpoint events`}

Recommendations:
${errorRate > 10 ? '• Consider implementing circuit breakers\n' : ''}${slowRate > 30 ? '• Review response time optimization\n' : ''}${breakpoints > 0 ? '• Investigate system breaking points\n' : ''}${errorRate < 5 && slowRate < 20 ? '• System shows good stress resilience\n' : ''}
`,
  };
}

function htmlStressReport(data) {
  const breakpoints = data.metrics.system_breakpoint_reached ? data.metrics.system_breakpoint_reached.values.count : 0;
  const errorRate = data.metrics.errors ? data.metrics.errors.values.rate * 100 : 0;
  const slowRate = data.metrics.slow_requests ? data.metrics.slow_requests.values.rate * 100 : 0;
  
  return `<!DOCTYPE html>
<html>
<head>
    <title>🔥 k6 Stress Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }
        .container { max-width: 1200px; margin: 0 auto; background: #2d2d2d; padding: 30px; border-radius: 12px; }
        h1, h2 { color: #ff6b6b; }
        .warning { background: #ff6b6b; color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success { background: #51cf66; color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric-card { background: #404040; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #ff6b6b; }
        .metric-good { color: #51cf66 !important; }
        .metric-warn { color: #ffd43b !important; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #555; }
        th { background-color: #404040; }
        .stress-indicator { font-size: 3em; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 k6 Stress Test Report</h1>
        <div class="stress-indicator">💥 SYSTEM STRESS ANALYSIS 💥</div>
        
        ${errorRate > 20 || breakpoints > 100 ? 
          `<div class="warning"><strong>⚠️ HIGH STRESS DETECTED!</strong><br>System showed significant stress patterns. Error rate: ${errorRate.toFixed(1)}%, Breakpoints: ${breakpoints}</div>` :
          `<div class="success"><strong>✅ STRESS RESILIENCE GOOD</strong><br>System handled stress well. Error rate: ${errorRate.toFixed(1)}%, Breakpoints: ${breakpoints}</div>`
        }
        
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value ${data.metrics.http_reqs.values.count > 10000 ? 'metric-good' : 'metric-warn'}">${data.metrics.http_reqs.values.count}</div>
                <div>Total Requests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${errorRate < 10 ? 'metric-good' : 'metric-warn'}">${errorRate.toFixed(1)}%</div>
                <div>Error Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${slowRate < 30 ? 'metric-good' : 'metric-warn'}">${slowRate.toFixed(1)}%</div>
                <div>Slow Requests (>1s)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${breakpoints === 0 ? 'metric-good' : 'metric-warn'}">${breakpoints}</div>
                <div>System Breakpoints</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.metrics.http_req_duration.values['p(99)'].toFixed(0)}ms</div>
                <div>99th Percentile</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.metrics.http_req_duration.values.max.toFixed(0)}ms</div>
                <div>Maximum Response</div>
            </div>
        </div>

        <h2>📊 Stress Performance Breakdown</h2>
        <table>
            <tr><th>Metric</th><th>Value</th><th>Assessment</th></tr>
            <tr><td>Request Rate</td><td>${data.metrics.http_reqs.values.rate.toFixed(1)}/s</td><td>${data.metrics.http_reqs.values.rate > 100 ? '🟢 High throughput' : '🟡 Moderate load'}</td></tr>
            <tr><td>Avg Response Time</td><td>${data.metrics.http_req_duration.values.avg.toFixed(0)}ms</td><td>${data.metrics.http_req_duration.values.avg < 500 ? '🟢 Fast' : data.metrics.http_req_duration.values.avg < 1500 ? '🟡 Acceptable' : '🔴 Slow'}</td></tr>
            <tr><td>95th Percentile</td><td>${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms</td><td>${data.metrics.http_req_duration.values['p(95)'] < 2000 ? '🟢 Good' : '🟡 Degraded'}</td></tr>
            <tr><td>Error Rate</td><td>${errorRate.toFixed(2)}%</td><td>${errorRate < 5 ? '🟢 Excellent' : errorRate < 15 ? '🟡 Acceptable' : '🔴 High'}</td></tr>
        </table>

        <h2>🎯 Stress Test Scenarios</h2>
        <ul>
            <li><strong>Burst Authentication (30%):</strong> Rapid login/registration attempts</li>
            <li><strong>Heavy Contact Operations (40%):</strong> Intensive CRUD operations</li>
            <li><strong>Search Bombardment (20%):</strong> Rapid search queries</li>
            <li><strong>Mixed Chaos (10%):</strong> Random mixed operations</li>
        </ul>

        <h2>🔍 System Breaking Points</h2>
        <p>This stress test was designed to find your system's limits. The load profile ramped up to 1000+ concurrent users to identify:</p>
        <ul>
            <li>Maximum sustainable load</li>
            <li>Performance degradation patterns</li>
            <li>Error rate under extreme stress</li>
            <li>Recovery behavior after load spikes</li>
        </ul>
        
        <div style="margin-top: 40px; padding: 20px; background: #404040; border-radius: 8px;">
            <h3>💡 Stress Test Insights</h3>
            ${errorRate < 5 ? '<p>✅ <strong>Excellent resilience:</strong> System maintained low error rates under extreme load.</p>' : ''}
            ${slowRate < 20 ? '<p>✅ <strong>Good response times:</strong> Majority of requests remained fast even under stress.</p>' : ''}
            ${breakpoints === 0 ? '<p>✅ <strong>No catastrophic failures:</strong> System degraded gracefully without complete breakdowns.</p>' : ''}
            ${data.metrics.http_reqs.values.rate > 200 ? '<p>🚀 <strong>High throughput:</strong> System processed requests at high rate during stress.</p>' : ''}
        </div>
    </div>
</body>
</html>`;
}