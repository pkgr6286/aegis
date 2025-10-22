/**
 * Brand Configuration Types
 */

export interface BrandConfig {
  id: string;
  tenantId: string;
  name: string;
  config: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandConfigInput {
  name: string;
  config: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
}

export interface UpdateBrandConfigInput {
  name?: string;
  config?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
}
