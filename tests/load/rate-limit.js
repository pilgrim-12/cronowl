import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration
const API_KEY = __ENV.API_KEY || 'sk_live_YOUR_KEY_HERE';
const BASE_URL = __ENV.BASE_URL || 'https://cronowl.com';

export const options = {
  scenarios: {
    // Test rate limiting: send requests quickly
    rate_limit_test: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 requests per second
      timeUnit: '1s',
      duration: '10s', // Run for 10 seconds = ~500 requests
      preAllocatedVUs: 20,
      maxVUs: 50,
    },
  },
  thresholds: {
    // We expect some requests to be rate limited (429)
    'http_req_failed': ['rate<0.99'], // Allow up to 99% "failures" (429s are expected)
  },
};

export default function () {
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  const response = http.get(`${BASE_URL}/api/v1/checks`, { headers });

  // Track results
  const isSuccess = response.status === 200;
  const isRateLimited = response.status === 429;

  check(response, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  });

  if (isRateLimited) {
    console.log(`Rate limited! Response: ${response.body}`);
  }

  // Log every 10th request for visibility
  if (__ITER % 10 === 0) {
    console.log(`Request ${__ITER}: ${response.status}`);
  }
}

export function handleSummary(data) {
  const totalRequests = data.metrics.http_reqs.values.count;
  const successCount = data.metrics.http_req_failed.values.passes;
  const failedCount = data.metrics.http_req_failed.values.fails;

  console.log('\n=== Rate Limit Test Summary ===');
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Successful (200): ${successCount}`);
  console.log(`Rate limited (429) or other: ${failedCount}`);
  console.log('================================\n');

  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
