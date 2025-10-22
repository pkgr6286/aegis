/**
 * Partner Management Types
 */

export interface Partner {
  id: string;
  tenantId: string;
  name: string;
  type: 'ecommerce' | 'retail_pos';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  // Optional joined data
  apiKeys?: PartnerApiKey[];
}

export interface PartnerApiKey {
  id: string;
  partnerId: string;
  tenantId: string;
  hashedKey: string;
  description?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  revokedAt?: string;
}

export interface CreatePartnerInput {
  name: string;
  type: 'ecommerce' | 'retail_pos';
  status?: 'active' | 'inactive';
}

export interface GenerateApiKeyInput {
  expiresInDays?: number;
  description?: string;
}

export interface GenerateApiKeyResponse {
  apiKey: PartnerApiKey;
  rawKey: string; // Only shown once!
}
