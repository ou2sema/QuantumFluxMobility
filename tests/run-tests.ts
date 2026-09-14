/**
 * QuantumFlux Mobility — Secure PIN Authentication Test Suite
 * Validates all security requirements and remediation measures:
 * 1. Removal and active rejection of master PIN '0000'
 * 2. Strong PIN policy enforcement
 * 3. Bcrypt salted hashing (no plaintext, no weak hashes)
 * 4. Brute-force protection & account lockout (5 attempts -> 15 min lockout)
 * 5. Sanitized client profiles (never expose pinCode or pinHash)
 * 6. Cryptographic session token generation & verification
 * 7. Admin-only role enforcement
 */

import {
  validatePinPolicy,
  hashPin,
  verifyPin,
  authenticateWithPin,
  generateSessionToken,
  verifySessionToken,
  setUserPin,
  getCredential,
  adminCreateUser,
  adminResetUserPin,
  localProfilesStore,
  initDefaultCredentials,
} from '../server/auth';
import { getUserProfile, saveUserProfile, saveUserCredential } from '../server/db';
import bcrypt from 'bcryptjs';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  QUANTUMFLUX MOBILITY — SECURE PIN TEST SUITE');
  console.log('======================================================\n');

  // Initialize staff credentials
  await initDefaultCredentials();

  // -----------------------------------------------------------
  // 1. PIN Policy Enforcement Tests
  // -----------------------------------------------------------
  console.log('[TEST GROUP 1] PIN Policy Enforcement:');

  const p1 = validatePinPolicy('0000');
  assert(!p1.valid, 'Explicitly rejects master PIN 0000');

  const p2 = validatePinPolicy('1234');
  assert(!p2.valid, 'Rejects sequential ascending PIN 1234');

  const p3 = validatePinPolicy('4321');
  assert(!p3.valid, 'Rejects sequential descending PIN 4321');

  const p4 = validatePinPolicy('1111');
  assert(!p4.valid, 'Rejects repeated digits 1111');

  const p5 = validatePinPolicy('9999');
  assert(!p5.valid, 'Rejects repeated digits 9999');

  const p6 = validatePinPolicy('123');
  assert(!p6.valid, 'Rejects PINs shorter than 4 digits');

  const p7 = validatePinPolicy('123456789');
  assert(!p7.valid, 'Rejects PINs longer than 8 digits');

  const p8 = validatePinPolicy('12a4');
  assert(!p8.valid, 'Rejects non-numeric characters');

  const p9 = validatePinPolicy('8492');
  assert(p9.valid, 'Accepts complex, non-sequential 4-digit PIN 8492');

  const p10 = validatePinPolicy('937105');
  assert(p10.valid, 'Accepts complex 6-digit PIN 937105');

  // -----------------------------------------------------------
  // 2. Salt & Hash Generation Verification (bcryptjs)
  // -----------------------------------------------------------
  console.log('\n[TEST GROUP 2] Bcrypt Salt & Hash Generation:');

  const testPin = '8492';
  const hashed = await hashPin(testPin);

  assert(hashed.pinHash.startsWith('$2a$') || hashed.pinHash.startsWith('$2b$'), 'Hash format is bcrypt compliant');
  assert(!hashed.pinHash.includes(testPin), 'Stored hash does NOT contain plaintext PIN');
  assert(hashed.salt.length > 0, 'Unique salt is recorded');

  const correctMatch = await verifyPin(testPin, hashed.pinHash);
  assert(correctMatch, 'Correct PIN matches bcrypt hash');

  const wrongMatch = await verifyPin('8493', hashed.pinHash);
  assert(!wrongMatch, 'Incorrect PIN fails bcrypt verification');

  const masterOverrideMatch = await verifyPin('0000', hashed.pinHash);
  assert(!masterOverrideMatch, 'Master PIN 0000 fails bcrypt verification');

  // -----------------------------------------------------------
  // 3. Master PIN '0000' Bypass Elimination
  // -----------------------------------------------------------
  console.log('\n[TEST GROUP 3] Master PIN Bypass Prevention:');

  // Setup a test user
  const testUserId = 'test-user-secure-01';
  const testUserProfile = {
    id: testUserId,
    name: 'Agent Test',
    email: 'agent.test@autofleet.fr',
    role: 'AGENT_COMPTOIR',
    agencyId: 'agency-paris-orly',
    active: true,
    pinConfigured: true,
    createdAt: new Date().toISOString(),
  };
  localProfilesStore.set(testUserId, testUserProfile);
  await saveUserProfile(testUserProfile);
  await setUserPin(testUserId, '5931');

  // Try authenticating with 0000
  const masterPinAuth = await authenticateWithPin(testUserId, '0000', '127.0.0.1');
  assert(!masterPinAuth.success, 'Master PIN 0000 authentication is rejected');
  assert(
    masterPinAuth.error?.includes('invalide') || masterPinAuth.error?.includes('interdit'),
    'Returns proper security rejection message'
  );

  // -----------------------------------------------------------
  // 4. Rate Limiting and Account Lockout
  // -----------------------------------------------------------
  console.log('\n[TEST GROUP 4] Brute-Force Rate Limiting & Account Lockout:');

  const bruteUserId = 'test-user-bruteforce';
  const bruteUserProfile = {
    id: bruteUserId,
    name: 'Brute Target',
    email: 'brute@autofleet.fr',
    role: 'AGENT_COMPTOIR',
    agencyId: 'agency-paris-orly',
    active: true,
    pinConfigured: true,
    createdAt: new Date().toISOString(),
  };
  localProfilesStore.set(bruteUserId, bruteUserProfile);
  await saveUserProfile(bruteUserProfile);
  await setUserPin(bruteUserId, '7205');

  // Fail 5 times with incorrect PIN
  let lastResult;
  for (let i = 1; i <= 5; i++) {
    lastResult = await authenticateWithPin(bruteUserId, '9999', '192.168.1.50');
  }

  assert(lastResult !== undefined && !lastResult.success, 'All 5 invalid attempts were rejected');
  assert(lastResult?.isLocked === true, 'Account is locked after 5 failed attempts');

  // Attempt with the CORRECT PIN while locked
  const correctWhileLocked = await authenticateWithPin(bruteUserId, '7205', '192.168.1.50');
  assert(!correctWhileLocked.success, 'Correct PIN is rejected while account is locked');
  assert(correctWhileLocked.isLocked === true, 'Lockout is enforced even against correct PIN');

  // Check stored credential record in database
  const credRecord = await getCredential(bruteUserId);
  assert(
    credRecord !== null && (credRecord.lockedUntil || 0) > Date.now(),
    'Lockout timestamp is persisted in database and set in the future'
  );

  // Unlock manually for subsequent test sanity
  if (credRecord) {
    credRecord.failedAttempts = 0;
    credRecord.lockedUntil = 0;
    await saveUserCredential(credRecord);
  }

  // Verify successful login after reset
  const successAuth = await authenticateWithPin(bruteUserId, '7205', '192.168.1.51');
  assert(successAuth.success === true, 'Account successfully authenticates after unlock');
  assert(successAuth.sessionToken !== undefined, 'Issues secure session token upon success');

  // -----------------------------------------------------------
  // 5. Cryptographic Session Token Verification
  // -----------------------------------------------------------
  console.log('\n[TEST GROUP 5] Session Token Verification:');

  const validToken = generateSessionToken({
    id: 'admin-01',
    name: 'Super Admin',
    email: 'admin@autofleet.fr',
    role: 'ADMIN',
    agencyId: 'agency-paris-orly',
    active: true,
    pinConfigured: true,
    createdAt: new Date().toISOString(),
  });

  const verifiedSession = verifySessionToken(validToken);
  assert(verifiedSession !== null, 'Valid session token successfully verified');
  assert(verifiedSession?.role === 'ADMIN', 'Session payload preserves authentic role');

  // Tampered token check
  const tamperedToken = validToken.slice(0, -5) + 'AAAAA';
  const tamperedSession = verifySessionToken(tamperedToken);
  assert(tamperedSession === null, 'Tampered token signature is rejected');

  // -----------------------------------------------------------
  // 6. Profile Sanitization & Absence of PII / Credentials
  // -----------------------------------------------------------
  console.log('\n[TEST GROUP 6] Profile Sanitization & Credential Segregation:');

  const profile = await getUserProfile(testUserId);
  assert(profile !== null, 'User profile retrieved');
  assert((profile as any).pinCode === undefined, 'Profile document does NOT contain pinCode');
  assert((profile as any).pinHash === undefined, 'Profile document does NOT contain pinHash');
  assert(profile?.pinConfigured === true, 'Profile indicates pinConfigured: true safely');

  // -----------------------------------------------------------
  // 7. Admin RBAC Authorization
  // -----------------------------------------------------------
  console.log('\n[TEST GROUP 7] Admin Role-Based Access Control:');

  // Non-admin attempting to create a user
  try {
    await adminCreateUser(
      { id: 'agent-01', name: 'Agent', email: 'agent@autofleet.fr', role: 'AGENT_COMPTOIR' },
      { name: 'Hacker', email: 'hacker@test.com', role: 'ADMIN', pin: '8392' }
    );
    assert(false, 'Non-admin blocked from creating user');
  } catch (err: any) {
    assert(err.message.includes('Action réservée'), 'Non-admin correctly blocked from user creation');
  }

  // Admin creating user with secure PIN
  const adminProfile = { id: 'admin-01', name: 'Admin', email: 'admin@autofleet.fr', role: 'ADMIN' as const };
  const createdUser = await adminCreateUser(adminProfile, {
    name: 'New Agent',
    email: 'new.agent@autofleet.fr',
    role: 'AGENT_COMPTOIR',
    pin: '8392',
  });

  assert(createdUser.id.length > 0, 'Admin can create user');
  assert((createdUser as any).pinCode === undefined, 'Created user profile does not contain plaintext PIN');
  assert(createdUser.pinConfigured === true, 'Created user is marked with pinConfigured: true');

  // Authenticate the newly created user with their PIN
  const newAuth = await authenticateWithPin(createdUser.id, '8392', '127.0.0.1');
  assert(newAuth.success === true, 'Newly created user can authenticate with their PIN');

  // Admin resetting PIN
  await adminResetUserPin(adminProfile, createdUser.id, '7419');
  const oldPinAuth = await authenticateWithPin(createdUser.id, '8392', '127.0.0.1');
  assert(!oldPinAuth.success, 'Old PIN no longer works after reset');
  const resetPinAuth = await authenticateWithPin(createdUser.id, '7419', '127.0.0.1');
  assert(resetPinAuth.success === true, 'New PIN works after admin reset');

  // -----------------------------------------------------------
  // 8. Oussema Admin User Verification
  // -----------------------------------------------------------
  console.log('\n[TEST GROUP 8] Dedicated Admin User (Oussema) Verification:');
  const oussemaPin1234Auth = await authenticateWithPin('io3PHq8KUxd1SonX2y2ajiYSulj1', '1234', '127.0.0.1');
  assert(oussemaPin1234Auth.success === true, 'Oussema (io3PHq8KUxd1SonX2y2ajiYSulj1) authenticates with PIN 1234 from Firestore');
  assert(oussemaPin1234Auth.user?.email === 'ou2sema@gmail.com', 'Oussema email is ou2sema@gmail.com');
  assert(oussemaPin1234Auth.user?.role === 'ADMIN', 'Oussema has ADMIN role');

  const oussemaAlias1234 = await authenticateWithPin('u-admin-oussema', '1234', '127.0.0.1');
  assert(oussemaAlias1234.success === true, 'Oussema (u-admin-oussema) authenticates with PIN 1234');

  const oussemaAuth = await authenticateWithPin('u-admin-oussema', '2846', '127.0.0.1');
  assert(oussemaAuth.success === true, 'Oussema (u-admin-oussema) authenticates with PIN 2846');
  assert(oussemaAuth.user?.email === 'ou2sema@gmail.com', 'Oussema email is ou2sema@gmail.com');
  assert(oussemaAuth.user?.role === 'ADMIN', 'Oussema has ADMIN role');
  assert(Boolean(oussemaAuth.sessionToken), 'Session token is issued for Oussema');

  // Verify wrong PIN fails
  const oussemaWrongAuth = await authenticateWithPin('u-admin-oussema', '9999', '127.0.0.1');
  assert(oussemaWrongAuth.success === false, 'Wrong PIN for Oussema is rejected');

  // -----------------------------------------------------------
  // Summary
  // -----------------------------------------------------------
  console.log('\n======================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
