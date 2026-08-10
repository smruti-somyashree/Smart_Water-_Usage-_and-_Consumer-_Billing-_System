import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Load & Stress Testing Configuration for SmartWater Billing System
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up to 20 virtual users
    { duration: '1m',  target: 50 },  // Sustain load at 50 virtual users (stress phase)
    { duration: '30s', target: 100 }, // Peak stress spike to 100 concurrent users
    { duration: '30s', target: 0 },   // Cool-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must complete in under 300ms
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8082';

export default function () {
  // 1. Authenticate & Obtain JWT Token for Resident Account
  const loginPayload = JSON.stringify({
    email: 'user1@apartment.com',
    password: 'Password@123',
  });

  const loginParams = {
    headers: { 'Content-Type': 'application/json' },
  };

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, loginParams);

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'jwt token present': (r) => r.json('token') !== undefined,
  });

  const token = loginRes.json('token');
  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  sleep(1);

  // 2. Fetch Household Peer Benchmark Data
  const benchmarkRes = http.get(`${BASE_URL}/api/households/1/benchmark`, authHeaders);
  check(benchmarkRes, {
    'benchmark status is 200': (r) => r.status === 200,
    'percentile rank calculated': (r) => r.json('percentileRank') !== undefined,
  });

  // 3. Fetch Invoices History
  const invoicesRes = http.get(`${BASE_URL}/api/billing-cycles/invoices`, authHeaders);
  check(invoicesRes, {
    'invoices status is 200': (r) => r.status === 200,
  });

  // 4. Download PDF Invoice (Heavy I/O & PDFBox rendering test)
  const pdfRes = http.get(`${BASE_URL}/api/invoices/1/pdf`, {
    headers: { 'Authorization': `Bearer ${token}` },
    responseType: 'binary',
  });

  check(pdfRes, {
    'pdf status is 200': (r) => r.status === 200,
    'pdf content type is application/pdf': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('pdf'),
    'pdf payload > 1KB': (r) => r.body.byteLength > 1000,
  });

  // 5. Fetch Meter Readings Log
  const usageRes = http.get(`${BASE_URL}/api/households/usage`, authHeaders);
  check(usageRes, {
    'usage logs status is 200': (r) => r.status === 200,
  });

  sleep(2);
}
