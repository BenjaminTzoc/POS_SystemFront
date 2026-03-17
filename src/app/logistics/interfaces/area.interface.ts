export interface Area {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  previousArea?: { id: string, name: string };
  previousAreaId?: string;
  deletedAt?: string;
}
