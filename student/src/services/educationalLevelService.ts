import api from './api';

export interface EducationalLevel {
  _id: string;
  name: string;
  nameAr: string;
  level: 'primary' | 'prep';
  year: number;
  isActive: boolean;
  order: number;
}

export const getEducationalLevels = async (): Promise<{ data: EducationalLevel[] }> => {
  const response = await api.get<{ data: EducationalLevel[] }>('/educational-levels?isActive=true');
  return response.data;
};

export const getEducationalLevelById = async (id: string): Promise<{ data: EducationalLevel }> => {
  const response = await api.get<{ data: EducationalLevel }>(`/educational-levels/${id}`);
  return response.data;
};
