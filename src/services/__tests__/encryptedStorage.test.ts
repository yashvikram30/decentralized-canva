import { describe, it, expect, vi, beforeEach } from 'vitest';

// We'll import the service under test
import { encryptedStorage } from '../encryptedStorage';

// Mock dependencies
vi.mock('../walrusClient', async () => {
  return {
    walrusClient: {
      retrieve: vi.fn(async (blobId: string) => ({ blobId, data: JSON.stringify({ hello: 'world' }) })),
      store: vi.fn(async (data: any) => ({ blobId: 'public_blob_123', size: JSON.stringify(data).length, stored: true })),
    }
  };
});

vi.mock('../sealEncryption', async () => ({
  sealEncryption: {
    encrypt: vi.fn(async (data: any, policy: any) => ({ encrypted: true, payload: JSON.stringify(data) })),
    decrypt: vi.fn(async (data: any, user: string) => ({ decrypted: true, original: JSON.parse(data) })),
  }
}));

vi.mock('../accessControl', async () => ({
  accessControl: {
    createPolicy: vi.fn(async (owner: string, perms: any) => ({ owner, permissions: perms })),
    checkPermission: vi.fn(async (policyId: string, user: string, perm: string) => true),
  }
}));

describe('encryptedStorage.publishDesign', () => {
  it('should decrypt and store a public copy, returning public blob id', async () => {
    // Arrange: create a design via saveDesign first
    const design = await encryptedStorage.saveDesign('test', { a: 1 }, 'owner_address', {} as any);

    // Act: publish
    const res = await encryptedStorage.publishDesign(design.id, 'owner_address', {} as any);

    // Assert
    expect(res).toHaveProperty('publicBlobId');
    expect(typeof res.publicBlobId).toBe('string');
  });
});
