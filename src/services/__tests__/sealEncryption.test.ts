import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sealEncryption } from '../sealEncryption';
import { SealSDK, Policy, KMSClient } from '@mysten/seal';

// Mock Seal SDK
jest.mock('@sealprotocol/sdk');

const mockEncrypt = jest.fn();
const mockDecrypt = jest.fn();
const mockInitialize = jest.fn();

(SealSDK as jest.Mock).mockImplementation(() => ({
  initialize: mockInitialize,
  encrypt: mockEncrypt,
  decrypt: mockDecrypt
}));

describe('SealEncryption Service', () => {
  const testData = { test: 'data' };
  const testPolicy = {
    allowedRecipients: ['user1', 'user2'],
    expiryTime: Date.now() + 3600000 // 1 hour from now
  };

  describe('encrypt', () => {
    it('should encrypt data with given policy', async () => {
      const encrypted = await sealEncryption.encrypt(testData, testPolicy);
      
      expect(encrypted).toBeDefined();
      expect(encrypted.data).toBeDefined();
      expect(encrypted.metadata).toBeDefined();
      expect(encrypted.metadata.policy).toEqual(testPolicy);
      expect(encrypted.metadata.algorithm).toBe('AES-256-GCM');
      expect(encrypted.metadata.timestamp).toBeDefined();
    });

    it('should generate different ciphertext for same data', async () => {
      const encrypted1 = await sealEncryption.encrypt(testData, testPolicy);
      const encrypted2 = await sealEncryption.encrypt(testData, testPolicy);
      
      expect(encrypted1.data).not.toEqual(encrypted2.data);
    });

    it('should throw error for invalid policy', async () => {
      const invalidPolicy = {
        allowedRecipients: [],
        expiryTime: Date.now() + 3600000
      };

      await expect(sealEncryption.encrypt(testData, invalidPolicy))
        .rejects.toThrow('Invalid encryption policy');
    });
  });

  describe('decrypt', () => {
    it('should decrypt data for allowed recipient', async () => {
      const encrypted = await sealEncryption.encrypt(testData, testPolicy);
      const decrypted = await sealEncryption.decrypt(encrypted, 'user1');
      
      expect(decrypted).toEqual(testData);
    });

    it('should not decrypt data for unauthorized recipient', async () => {
      const encrypted = await sealEncryption.encrypt(testData, testPolicy);
      
      await expect(sealEncryption.decrypt(encrypted, 'unauthorized'))
        .rejects.toThrow('Access denied');
    });

    it('should not decrypt expired data', async () => {
      const expiredPolicy = {
        allowedRecipients: ['user1'],
        expiryTime: Date.now() - 1000 // Expired 1 second ago
      };
      
      const encrypted = await sealEncryption.encrypt(testData, expiredPolicy);
      
      await expect(sealEncryption.decrypt(encrypted, 'user1'))
        .rejects.toThrow('Encryption policy expired');
    });

    it('should handle large data', async () => {
      const largeData = {
        array: new Array(1000).fill('test data').join(' ')
      };
      
      const encrypted = await sealEncryption.encrypt(largeData, testPolicy);
      const decrypted = await sealEncryption.decrypt(encrypted, 'user1');
      
      expect(decrypted).toEqual(largeData);
    });
  });

  describe('key management', () => {
    it('should generate unique keys for each encryption', async () => {
      const encrypted1 = await sealEncryption.encrypt(testData, testPolicy);
      const encrypted2 = await sealEncryption.encrypt(testData, testPolicy);
      
      expect(encrypted1.metadata.keyId).not.toEqual(encrypted2.metadata.keyId);
    });

    it('should properly derive keys for decryption', async () => {
      const encrypted = await sealEncryption.encrypt(testData, testPolicy);
      const decrypted1 = await sealEncryption.decrypt(encrypted, 'user1');
      const decrypted2 = await sealEncryption.decrypt(encrypted, 'user2');
      
      expect(decrypted1).toEqual(testData);
      expect(decrypted2).toEqual(testData);
    });
  });
});