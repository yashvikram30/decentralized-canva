// Access control service for managing permissions
export interface AccessPolicy {
  owner: string;
  permissions: {
    read: string[];
    write: string[];
    admin: string[];
  };
  encrypted: boolean;
  expiresAt?: number;
}

export class AccessControlService {
  private policies: Map<string, AccessPolicy> = new Map();

  async createPolicy(owner: string, initialPermissions: Partial<AccessPolicy['permissions']> = {}): Promise<AccessPolicy> {
    const policy: AccessPolicy = {
      owner,
      permissions: {
        read: initialPermissions.read || [owner],
        write: initialPermissions.write || [owner],
        admin: initialPermissions.admin || [owner],
        ...initialPermissions
      },
      encrypted: true
    };

    const policyId = this.generatePolicyId();
    this.policies.set(policyId, policy);
    
    console.log('🔐 Access policy created:', policyId);
    return policy;
  }

  async updatePolicy(policyId: string, updates: Partial<AccessPolicy>): Promise<AccessPolicy | null> {
    const existingPolicy = this.policies.get(policyId);
    if (!existingPolicy) return null;

    const updatedPolicy = { ...existingPolicy, ...updates };
    this.policies.set(policyId, updatedPolicy);
    
    console.log('🔑 Access policy updated:', policyId);
    return updatedPolicy;
  }

  async checkPermission(policyId: string, user: string, action: 'read' | 'write' | 'admin'): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) return false;

    // Check if user has the required permission
    const hasPermission = policy.permissions[action].includes(user);
    
    // Check if policy has expired
    if (policy.expiresAt && policy.expiresAt < Date.now()) {
      return false;
    }

    return hasPermission;
  }

  async getPolicy(policyId: string): Promise<AccessPolicy | null> {
    return this.policies.get(policyId) || null;
  }

  async revokeAccess(policyId: string, user: string): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) return false;

    // Remove user from all permission lists
    policy.permissions.read = policy.permissions.read.filter(u => u !== user);
    policy.permissions.write = policy.permissions.write.filter(u => u !== user);
    policy.permissions.admin = policy.permissions.admin.filter(u => u !== user);

    this.policies.set(policyId, policy);
    console.log('🚫 Access revoked for user:', user);
    return true;
  }

  private generatePolicyId(): string {
    return 'policy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const accessControl = new AccessControlService();
