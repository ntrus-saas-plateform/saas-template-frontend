export type PlatformServiceRecord = {
  id: string;
  serviceCode: string;
  serviceSlug: string;
  displayName: string;
  description: string | null;
  category: string;
  serviceType: string;
  lifecycleStatus: string;
  observationStatus: string;
  businessCriticality: string;
  technicalCriticality: string;
  environment: string;
  region: string | null;
  operationalTeam: string | null;
  serviceOwnerId: string | null;
  technicalOwnerId: string | null;
  healthCheckRef: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type ServiceDependencyRecord = {
  id: string;
  serviceId: string;
  dependsOnServiceId: string;
  dependencyType: string;
  criticality: string;
  description: string | null;
};

export type PlatformServiceDetail = {
  service: PlatformServiceRecord;
  dependencies: ServiceDependencyRecord[];
  dependents: ServiceDependencyRecord[];
};

export type ServiceCatalogListPage = {
  items: PlatformServiceRecord[];
  total: number;
};

export type OperationsOverview = {
  availability: string;
  note: string;
  catalog: { totalServices: number; observation: string };
  activeIncidents: { availability: string; integration: string };
  activeAlerts: { availability: string; integration: string };
  computedAt: string;
};

export type RegisterPlatformServiceBody = {
  serviceCode: string;
  displayName: string;
  description?: string | null;
  category?: string;
  environment?: string;
  region?: string | null;
  operationalTeam?: string | null;
  observationStatus?: string;
};
