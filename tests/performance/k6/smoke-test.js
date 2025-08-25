import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  vus: 1, // 1 virtual user
  duration: '1m', // Run for 1 minute
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.1'], // Error rate should be less than 10%
    http_req_failed: ['rate<0.01'], // HTTP failures should be less than 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  const responses = {};

  // Test 1: Health check
  responses.health = http.get(`${BASE_URL}/api/health`);
  check(responses.health, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
    'health check has correct content-type': (r) =>
      r.headers['Content-Type'].includes('application/json'),
  });
  errorRate.add(responses.health.status >= 400);

  sleep(1);

  // Test 2: Register user (POST)
  const registerPayload = {
    email: `test-${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  };

  responses.register = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(registerPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  check(responses.register, {
    'register status is 201': (r) => r.status === 201,
    'register response time < 1000ms': (r) => r.timings.duration < 1000,
    'register response has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.token;
      } catch (e) {
        return false;
      }
    },
  });
  errorRate.add(responses.register.status >= 400);

  let authToken = '';
  try {
    const registerBody = JSON.parse(responses.register.body);
    authToken = registerBody.data?.token || '';
  } catch (e) {
    console.error('Failed to parse register response');
  }

  sleep(1);

  // Test 3: Login (POST)
  const loginPayload = {
    email: registerPayload.email,
    password: registerPayload.password,
  };

  responses.login = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(loginPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  check(responses.login, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
    'login response has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.token;
      } catch (e) {
        return false;
      }
    },
  });
  errorRate.add(responses.login.status >= 400);

  // Update auth token from login if successful
  if (responses.login.status === 200) {
    try {
      const loginBody = JSON.parse(responses.login.body);
      authToken = loginBody.data?.token || authToken;
    } catch (e) {
      console.error('Failed to parse login response');
    }
  }

  sleep(1);

  // Test 4: Get contacts (authenticated)
  if (authToken) {
    responses.contacts = http.get(`${BASE_URL}/api/contacts`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    check(responses.contacts, {
      'contacts status is 200': (r) => r.status === 200,
      'contacts response time < 300ms': (r) => r.timings.duration < 300,
      'contacts response is array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && Array.isArray(body.data.contacts);
        } catch (e) {
          return false;
        }
      },
    });
    errorRate.add(responses.contacts.status >= 400);

    sleep(1);

    // Test 5: Create contact (POST authenticated)
    const contactPayload = {
      firstName: 'John',
      lastName: 'Doe',
      email: `john.doe.${Date.now()}@example.com`,
      phone: '+1234567890',
      company: 'Test Company',
      jobTitle: 'Test Manager',
    };

    responses.createContact = http.post(
      `${BASE_URL}/api/contacts`,
      JSON.stringify(contactPayload),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    check(responses.createContact, {
      'create contact status is 201': (r) => r.status === 201,
      'create contact response time < 500ms': (r) => r.timings.duration < 500,
      'create contact response has id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.contact && body.data.contact.id;
        } catch (e) {
          return false;
        }
      },
    });
    errorRate.add(responses.createContact.status >= 400);

    let contactId = '';
    try {
      const createBody = JSON.parse(responses.createContact.body);
      contactId = createBody.data?.contact?.id || '';
    } catch (e) {
      console.error('Failed to parse create contact response');
    }

    sleep(1);

    // Test 6: Get single contact (GET authenticated)
    if (contactId) {
      responses.getContact = http.get(`${BASE_URL}/api/contacts/${contactId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      check(responses.getContact, {
        'get contact status is 200': (r) => r.status === 200,
        'get contact response time < 200ms': (r) => r.timings.duration < 200,
        'get contact has correct email': (r) => {
          try {
            const body = JSON.parse(r.body);
            return (
              body.data &&
              body.data.contact &&
              body.data.contact.email === contactPayload.email
            );
          } catch (e) {
            return false;
          }
        },
      });
      errorRate.add(responses.getContact.status >= 400);

      sleep(1);

      // Test 7: Update contact (PUT authenticated)
      const updatePayload = {
        firstName: 'Jane',
        lastName: 'Smith',
        jobTitle: 'Senior Manager',
      };

      responses.updateContact = http.put(
        `${BASE_URL}/api/contacts/${contactId}`,
        JSON.stringify(updatePayload),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      check(responses.updateContact, {
        'update contact status is 200': (r) => r.status === 200,
        'update contact response time < 400ms': (r) => r.timings.duration < 400,
        'update contact reflects changes': (r) => {
          try {
            const body = JSON.parse(r.body);
            return (
              body.data &&
              body.data.contact &&
              body.data.contact.firstName === 'Jane'
            );
          } catch (e) {
            return false;
          }
        },
      });
      errorRate.add(responses.updateContact.status >= 400);

      sleep(1);

      // Test 8: Delete contact (DELETE authenticated)
      responses.deleteContact = http.del(
        `${BASE_URL}/api/contacts/${contactId}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      check(responses.deleteContact, {
        'delete contact status is 204': (r) => r.status === 204,
        'delete contact response time < 300ms': (r) => r.timings.duration < 300,
      });
      errorRate.add(responses.deleteContact.status >= 400);
    }
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'smoke-test-summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>k6 Smoke Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-radius: 4px; }
        .passed { color: green; }
        .failed { color: red; }
        .threshold { font-weight: bold; }
    </style>
</head>
<body>
    <h1>k6 Smoke Test Report</h1>
    <h2>Test Summary</h2>
    <div class="metric">
        <strong>Duration:</strong> ${data.state.testRunDurationMs}ms
    </div>
    <div class="metric">
        <strong>Requests:</strong> ${data.metrics.http_reqs.values.count}
    </div>
    <div class="metric">
        <strong>Failed Requests:</strong> ${data.metrics.http_req_failed.values.passes || 0}
    </div>
    <div class="metric">
        <strong>Average Response Time:</strong> ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    </div>
    <div class="metric">
        <strong>95th Percentile:</strong> ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    </div>
    
    <h2>Threshold Results</h2>
    ${Object.entries(data.thresholds || {})
      .map(
        ([name, threshold]) => `
        <div class="metric ${threshold.ok ? 'passed' : 'failed'}">
            <span class="threshold">${name}:</span> ${threshold.ok ? '✓ PASSED' : '✗ FAILED'}
        </div>
    `,
      )
      .join('')}
    
    <h2>Checks</h2>
    ${Object.entries(data.checks || {})
      .map(
        ([name, check]) => `
        <div class="metric ${check.fails === 0 ? 'passed' : 'failed'}">
            <strong>${name}:</strong> ${check.passes}/${check.passes + check.fails} passed
        </div>
    `,
      )
      .join('')}
</body>
</html>`;
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const colors = options.enableColors !== false;

  let summary = `${indent}k6 Smoke Test Summary:\n`;
  summary += `${indent}  Duration: ${data.state.testRunDurationMs}ms\n`;
  summary += `${indent}  Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Failed: ${data.metrics.http_req_failed.values.passes || 0}\n`;
  summary += `${indent}  Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;

  return summary;
}
