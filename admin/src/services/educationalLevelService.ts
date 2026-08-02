import api from './api';

export interface EducationalLevel { _id: string; name: string; nameAr: string; level: 'primary' | 'prep'; year: number; isActive: boolean; order: number; createdAt: string; updatedAt: string; }
export const getEducationalLevels = async (): Promise<{ data: EducationalLevel[] }> => { const response = await api.get<{ data: EducationalLevel[] }>('/educational-levels?isActive=true'); return response.data; };
