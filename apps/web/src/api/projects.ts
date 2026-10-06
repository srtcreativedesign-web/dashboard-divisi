import { Project, PaginatedResponse, ProjectVendor } from '../types/project';
import { api } from './client';

export const projectApi = {
  getProjects: async (params?: { status?: string; search?: string; per_page?: number }) => {
    const response = await api.get<PaginatedResponse<Project>>(`/projects`, params as Record<string, string | undefined>);
    return response.data;
  },

  getProject: async (id: number) => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  createProject: async (data: Partial<Project>) => {
    const response = await api.post<Project>(`/projects`, data);
    return response.data;
  },

  updateProject: async (id: number, data: Partial<Project>) => {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  togglePayment: async (projectId: number, milestoneId: number, paymentStatus: boolean) => {
    const response = await api.patch<any>(`/projects/${projectId}/payment-toggle`, {
      milestone_id: milestoneId,
      payment_status: paymentStatus,
    });
    return response.data;
  },

  addRab: async (projectId: number, data: any) => {
    const response = await api.post<any>(`/projects/${projectId}/rab`, data);
    return response.data;
  },

  uploadDocument: async (projectId: number, form: FormData) => {
    const response = await api.upload<any>(`/projects/${projectId}/documents`, form);
    return response.data;
  },

  deleteDocument: async (projectId: number, documentId: number) => {
    const response = await api.delete<any>(`/projects/${projectId}/documents/${documentId}`);
    return response.data;
  },

  addMilestone: async (projectId: number, data: any) => {
    const response = await api.post<any>(`/projects/${projectId}/milestones`, data);
    return response.data;
  },

  updateMilestone: async (projectId: number, milestoneId: number, data: any) => {
    const response = await api.put<any>(`/projects/${projectId}/milestones/${milestoneId}`, data);
    return response.data;
  },

  deleteMilestone: async (projectId: number, milestoneId: number) => {
    const response = await api.delete<any>(`/projects/${projectId}/milestones/${milestoneId}`);
    return response.data;
  },

  getPhotos: async (projectId: number, params?: { stage?: string; area_name?: string }) => {
    const response = await api.get<any[]>(`/projects/${projectId}/photos`, params as Record<string, string | undefined>);
    return response.data;
  },

  uploadPhoto: async (projectId: number, form: FormData) => {
    const response = await api.upload<any>(`/projects/${projectId}/photos`, form);
    return response.data;
  },

  deletePhoto: async (projectId: number, photoId: number) => {
    const response = await api.delete<any>(`/projects/${projectId}/photos/${photoId}`);
    return response.data;
  },
};

export const vendorApi = {
  getVendors: async (params?: { search?: string; per_page?: number }) => {
    const response = await api.get<PaginatedResponse<ProjectVendor>>(`/vendors`, params as Record<string, string | undefined>);
    return response.data;
  }
};

