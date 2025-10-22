/**
 * Drug Program Types
 */

export interface DrugProgram {
  id: string;
  tenantId: string;
  brandConfigId?: string;
  name: string;
  brandName?: string;
  slug?: string;
  status: 'draft' | 'active' | 'archived';
  activeScreenerVersionId?: string;
  createdAt: string;
  updatedAt: string;
  // Optional joined data
  brandConfig?: {
    id: string;
    name: string;
    config: {
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
  };
  activeScreenerVersion?: {
    id: string;
    version: number;
    status: string;
  };
}

export interface CreateDrugProgramInput {
  name: string;
  brandName?: string;
  brandConfigId?: string;
  status?: 'draft' | 'active' | 'archived';
}

export interface UpdateDrugProgramInput {
  name?: string;
  brandName?: string;
  brandConfigId?: string;
  status?: 'draft' | 'active' | 'archived';
}

export interface ScreenerVersion {
  id: string;
  drugProgramId: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  screenerJson: any;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScreenerVersionInput {
  screenerJson: any;
}
