import { GET, POST } from '../src/app/api/clients/route';
import { requireRole } from '../src/lib/auth';

// Mock requireRole
jest.mock('../src/lib/auth', () => ({
  requireRole: jest.fn().mockResolvedValue({
    id: "109896ce-3692-42f9-9232-7be9d6c626ae", // Owner ID or sales ID
    activeRole: "SALES"
  })
}));

async function testGet() {
  const res = await GET();
  console.log("GET STATUS:", res.status);
  console.log("GET JSON:", await res.json());
}
testGet().catch(console.error);
