import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const contactCreationTime = new Trend('contact_creation_duration');
const contactSearchTime = new Trend('contact_search_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 50 }, // Ramp down to 50 users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_duration: ['p(99)<1000'], // 99% of requests must complete below 1s
    http_reqs: ['rate>50'], // Request rate should be above 50 RPS
    errors: ['rate<0.05'], // Error rate should be less than 5%
    http_req_failed: ['rate<0.01'], // HTTP failures should be less than 1%
    contact_creation_duration: ['p(95)<800'], // Contact creation should be under 800ms
    contact_search_duration: ['p(95)<300'], // Contact search should be under 300ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const DURATION = __ENV.DURATION || '5m';
const MAX_USERS = parseInt(__ENV.MAX_USERS || '100');

// Update stages based on environment variables
if (__ENV.DURATION || __ENV.MAX_USERS) {
  export const options = {
    stages: [
      { duration: '1m', target: Math.floor(MAX_USERS * 0.2) },
      { duration: '2m', target: Math.floor(MAX_USERS * 0.5) },
      { duration: '1m', target: MAX_USERS },
      { duration: DURATION, target: MAX_USERS },
      { duration: '2m', target: 0 },
    ],
    thresholds: options.thresholds,
  };
}

// Test data generators
function generateUser() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  return {
    email: `user-${timestamp}-${randomId}@example.com`,
    username: `user${timestamp}${randomId}`,
    password: 'TestPassword123!',
    firstName: `User${randomId}`,
    lastName: `Test${timestamp}`,
  };
}

function generateContact() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const companies = [
    'Tech Corp',
    'Innovation Ltd',
    'Future Systems',
    'Digital Solutions',
    'Smart Industries',
  ];
  const titles = [
    'Manager',
    'Director',
    'Engineer',
    'Analyst',
    'Specialist',
    'Coordinator',
  ];

  return {
    firstName: `Contact${randomId}`,
    lastName: `Test${timestamp}`,
    email: `contact-${timestamp}-${randomId}@example.com`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    company: companies[Math.floor(Math.random() * companies.length)],
    jobTitle: `${titles[Math.floor(Math.random() * titles.length)]}`,
    notes: `Generated contact for load testing - ${new Date().toISOString()}`,
    tags: ['test', 'load-test', `batch-${Math.floor(timestamp / 10000)}`],
  };
}

// Shared state for virtual users
const userData = {};

export function setup() {
  console.log('Load test setup - checking service availability');

  // Verify service is running
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Service not available: ${healthCheck.status}`);
  }

  console.log(`Load test starting with ${MAX_USERS} max users for ${DURATION}`);
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const vuId = __VU;
  const iterationId = __ITER;

  // Initialize user data for this VU if not exists
  if (!userData[vuId]) {
    userData[vuId] = {
      user: generateUser(),
      authToken: '',
      contacts: [],
    };
  }

  const currentUser = userData[vuId];

  // Scenario 1: User Authentication Flow (20% of requests)
  if (Math.random() < 0.2) {
    userAuthenticationFlow(currentUser);
  }

  // Scenario 2: Contact Management (60% of requests)
  else if (Math.random() < 0.8) {
    if (currentUser.authToken) {
      contactManagementFlow(currentUser);
    } else {
      // Authenticate first if no token
      userAuthenticationFlow(currentUser);
    }
  }

  // Scenario 3: Search and Filter Operations (20% of requests)
  else {
    if (currentUser.authToken) {
      searchAndFilterFlow(currentUser);
    } else {
      // Authenticate first if no token
      userAuthenticationFlow(currentUser);
    }
  }

  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

function userAuthenticationFlow(currentUser) {
  let response;

  // Register user if not already registered
  if (!currentUser.registered) {
    response = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify(currentUser.user),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    const registerSuccess = check(response, {
      'register status is 201': (r) => r.status === 201,
      'register response time acceptable': (r) => r.timings.duration < 1500,
    });

    errorRate.add(!registerSuccess);

    if (registerSuccess) {
      currentUser.registered = true;
      try {
        const body = JSON.parse(response.body);
        currentUser.authToken = body.data?.token || '';
      } catch (e) {
        console.error(`VU${__VU}: Failed to parse register response`);
      }
    }

    sleep(0.5);
  }

  // Login user
  const loginPayload = {
    email: currentUser.user.email,
    password: currentUser.user.password,
  };

  response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(loginPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  const loginSuccess = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response time acceptable': (r) => r.timings.duration < 800,
    'login returns token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.token;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!loginSuccess);

  if (loginSuccess) {
    try {
      const body = JSON.parse(response.body);
      currentUser.authToken = body.data?.token || '';
    } catch (e) {
      console.error(`VU${__VU}: Failed to parse login response`);
    }
  }
}

function contactManagementFlow(currentUser) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${currentUser.authToken}`,
  };

  // Randomly choose contact operation
  const operations = ['create', 'read', 'update', 'delete'];
  const weights = [0.3, 0.4, 0.2, 0.1]; // 30% create, 40% read, 20% update, 10% delete

  let operation = 'read'; // default
  const random = Math.random();
  let weightSum = 0;

  for (let i = 0; i < operations.length; i++) {
    weightSum += weights[i];
    if (random <= weightSum) {
      operation = operations[i];
      break;
    }
  }

  switch (operation) {
    case 'create':
      createContact(currentUser, headers);
      break;
    case 'read':
      readContacts(currentUser, headers);
      break;
    case 'update':
      updateContact(currentUser, headers);
      break;
    case 'delete':
      deleteContact(currentUser, headers);
      break;
  }
}

function createContact(currentUser, headers) {
  const contact = generateContact();
  const startTime = Date.now();

  const response = http.post(
    `${BASE_URL}/api/contacts`,
    JSON.stringify(contact),
    { headers },
  );

  const duration = Date.now() - startTime;
  contactCreationTime.add(duration);

  const success = check(response, {
    'create contact status is 201': (r) => r.status === 201,
    'create contact response time acceptable': (r) => r.timings.duration < 1000,
    'create contact returns id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.contact && body.data.contact.id;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!success);

  if (success) {
    try {
      const body = JSON.parse(response.body);
      const createdContact = body.data?.contact;
      if (createdContact && createdContact.id) {
        currentUser.contacts.push(createdContact.id);
        // Keep only last 50 contacts to avoid memory issues
        if (currentUser.contacts.length > 50) {
          currentUser.contacts = currentUser.contacts.slice(-50);
        }
      }
    } catch (e) {
      console.error(`VU${__VU}: Failed to parse create contact response`);
    }
  }
}

function readContacts(currentUser, headers) {
  // Random pagination parameters
  const page = Math.floor(Math.random() * 5) + 1;
  const limit = [10, 20, 50][Math.floor(Math.random() * 3)];

  const response = http.get(
    `${BASE_URL}/api/contacts?page=${page}&limit=${limit}`,
    { headers },
  );

  const success = check(response, {
    'read contacts status is 200': (r) => r.status === 200,
    'read contacts response time acceptable': (r) => r.timings.duration < 500,
    'read contacts returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data.contacts);
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

function updateContact(currentUser, headers) {
  if (currentUser.contacts.length === 0) {
    // Create a contact first
    createContact(currentUser, headers);
    return;
  }

  const contactId =
    currentUser.contacts[
      Math.floor(Math.random() * currentUser.contacts.length)
    ];
  const updates = {
    firstName: `Updated${Math.random().toString(36).substring(7)}`,
    jobTitle: `Updated Title ${Date.now()}`,
    notes: `Updated via load test at ${new Date().toISOString()}`,
  };

  const response = http.put(
    `${BASE_URL}/api/contacts/${contactId}`,
    JSON.stringify(updates),
    { headers },
  );

  const success = check(response, {
    'update contact status is 200': (r) => r.status === 200,
    'update contact response time acceptable': (r) => r.timings.duration < 600,
  });

  errorRate.add(!success);
}

function deleteContact(currentUser, headers) {
  if (currentUser.contacts.length === 0) {
    return; // Nothing to delete
  }

  const contactIndex = Math.floor(Math.random() * currentUser.contacts.length);
  const contactId = currentUser.contacts[contactIndex];

  const response = http.del(`${BASE_URL}/api/contacts/${contactId}`, null, {
    headers,
  });

  const success = check(response, {
    'delete contact status is 204': (r) => r.status === 204,
    'delete contact response time acceptable': (r) => r.timings.duration < 400,
  });

  errorRate.add(!success);

  if (success) {
    // Remove from tracking array
    currentUser.contacts.splice(contactIndex, 1);
  }
}

function searchAndFilterFlow(currentUser) {
  const headers = {
    Authorization: `Bearer ${currentUser.authToken}`,
  };

  const searchTerms = [
    'test',
    'user',
    'contact',
    'manager',
    'tech',
    'corp',
    'john',
    'jane',
  ];
  const searchTerm =
    searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const startTime = Date.now();

  // Search contacts
  let response = http.get(
    `${BASE_URL}/api/contacts?search=${searchTerm}&limit=20`,
    { headers },
  );

  const duration = Date.now() - startTime;
  contactSearchTime.add(duration);

  let success = check(response, {
    'search contacts status is 200': (r) => r.status === 200,
    'search contacts response time acceptable': (r) => r.timings.duration < 400,
  });

  errorRate.add(!success);
  sleep(0.5);

  // Filter by company
  const companies = ['Tech Corp', 'Innovation Ltd', 'Future Systems'];
  const company = companies[Math.floor(Math.random() * companies.length)];

  response = http.get(
    `${BASE_URL}/api/contacts?company=${encodeURIComponent(company)}&limit=20`,
    { headers },
  );

  success = check(response, {
    'filter by company status is 200': (r) => r.status === 200,
    'filter by company response time acceptable': (r) =>
      r.timings.duration < 400,
  });

  errorRate.add(!success);
  sleep(0.5);

  // Filter by status and favorite
  response = http.get(
    `${BASE_URL}/api/contacts?status=active&isFavorite=true&limit=10`,
    { headers },
  );

  success = check(response, {
    'filter by status status is 200': (r) => r.status === 200,
    'filter by status response time acceptable': (r) =>
      r.timings.duration < 400,
  });

  errorRate.add(!success);
}

export function teardown(data) {
  console.log('Load test teardown - cleaning up test data');
  // In a real scenario, you might want to clean up test users and contacts
}

export function handleSummary(data) {
  const passedThresholds = Object.values(data.thresholds || {}).filter(
    (t) => t.ok,
  ).length;
  const totalThresholds = Object.keys(data.thresholds || {}).length;

  return {
    'load-test-summary.html': htmlReport(data),
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
Load Test Summary:
==================
Duration: ${(data.state.testRunDurationMs / 1000).toFixed(0)}s
Total Requests: ${data.metrics.http_reqs.values.count}
Failed Requests: ${data.metrics.http_req_failed ? data.metrics.http_req_failed.values.passes : 0}
Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s
Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
99th Percentile: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms

Thresholds: ${passedThresholds}/${totalThresholds} passed
${passedThresholds === totalThresholds ? '✅ All thresholds PASSED' : '❌ Some thresholds FAILED'}

Custom Metrics:
- Contact Creation (95th): ${data.metrics.contact_creation_duration ? data.metrics.contact_creation_duration.values['p(95)'].toFixed(2) + 'ms' : 'N/A'}
- Contact Search (95th): ${data.metrics.contact_search_duration ? data.metrics.contact_search_duration.values['p(95)'].toFixed(2) + 'ms' : 'N/A'}
- Error Rate: ${data.metrics.errors ? (data.metrics.errors.values.rate * 100).toFixed(2) + '%' : 'N/A'}
`,
  };
}

function htmlReport(data) {
  const thresholdResults = Object.entries(data.thresholds || {})
    .map(
      ([name, threshold]) =>
        `<tr class="${threshold.ok ? 'passed' : 'failed'}">
      <td>${name}</td>
      <td>${threshold.ok ? '✓ PASSED' : '✗ FAILED'}</td>
    </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
    <title>k6 Load Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2 { color: #333; margin-top: 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .chart-placeholder { background: #e9ecef; height: 200px; margin: 20px 0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 k6 Load Test Report</h1>
        <p><strong>Test Duration:</strong> ${(data.state.testRunDurationMs / 1000).toFixed(0)} seconds</p>
        
        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">${data.metrics.http_reqs.values.count}</div>
                <div class="metric-label">Total Requests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.metrics.http_reqs.values.rate.toFixed(1)}</div>
                <div class="metric-label">Requests/sec</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.metrics.http_req_duration.values.avg.toFixed(0)}ms</div>
                <div class="metric-label">Avg Response Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms</div>
                <div class="metric-label">95th Percentile</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${((data.metrics.http_req_failed ? data.metrics.http_req_failed.values.rate : 0) * 100).toFixed(2)}%</div>
                <div class="metric-label">Error Rate</div>
            </div>
        </div>

        <h2>📊 Performance Metrics</h2>
        <table>
            <thead>
                <tr><th>Metric</th><th>Average</th><th>Min</th><th>Max</th><th>90th %ile</th><th>95th %ile</th><th>99th %ile</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td>Response Time</td>
                    <td>${data.metrics.http_req_duration.values.avg.toFixed(2)}ms</td>
                    <td>${data.metrics.http_req_duration.values.min.toFixed(2)}ms</td>
                    <td>${data.metrics.http_req_duration.values.max.toFixed(2)}ms</td>
                    <td>${data.metrics.http_req_duration.values['p(90)'].toFixed(2)}ms</td>
                    <td>${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms</td>
                    <td>${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms</td>
                </tr>
                ${
                  data.metrics.contact_creation_duration
                    ? `
                <tr>
                    <td>Contact Creation</td>
                    <td>${data.metrics.contact_creation_duration.values.avg.toFixed(2)}ms</td>
                    <td>${data.metrics.contact_creation_duration.values.min.toFixed(2)}ms</td>
                    <td>${data.metrics.contact_creation_duration.values.max.toFixed(2)}ms</td>
                    <td>${data.metrics.contact_creation_duration.values['p(90)'].toFixed(2)}ms</td>
                    <td>${data.metrics.contact_creation_duration.values['p(95)'].toFixed(2)}ms</td>
                    <td>${data.metrics.contact_creation_duration.values['p(99)'].toFixed(2)}ms</td>
                </tr>`
                    : ''
                }
                ${
                  data.metrics.contact_search_duration
                    ? `
                <tr>
                    <td>Contact Search</td>
                    <td>${data.metrics.contact_search_duration.values.avg.toFixed(2)}ms</td>
                    <td>${data.metrics.contact_search_duration.values.min.toFixed(2)}ms</td>
                    <td>${data.metrics.contact_search_duration.values.max.toFixed(2)}ms</td>
                    <td>${data.metrics.contact_search_duration.values['p(90)'].toFixed(2)}ms</td>
                    <td>${data.metrics.contact_search_duration.values['p(95)'].toFixed(2)}ms</td>
                    <td>${data.metrics.contact_search_duration.values['p(99)'].toFixed(2)}ms</td>
                </tr>`
                    : ''
                }
            </tbody>
        </table>

        <h2>✅ Threshold Results</h2>
        <table>
            <thead>
                <tr><th>Threshold</th><th>Result</th></tr>
            </thead>
            <tbody>
                ${thresholdResults}
            </tbody>
        </table>
        
        <div class="chart-placeholder">
            📈 Response Time Chart (would be implemented with actual charting library)
        </div>
        
        <h2>🔍 Test Details</h2>
        <ul>
            <li><strong>Virtual Users:</strong> Variable load profile</li>
            <li><strong>Test Scenarios:</strong> Authentication (20%), Contact Management (60%), Search/Filter (20%)</li>
            <li><strong>Operations:</strong> Create, Read, Update, Delete contacts with realistic data</li>
            <li><strong>Geographic Distribution:</strong> Single region (can be extended)</li>
        </ul>
    </div>
</body>
</html>`;
}
