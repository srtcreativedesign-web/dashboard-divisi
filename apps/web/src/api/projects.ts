import { Project, PaginatedResponse, ProjectVendor, ProjectMilestone, ProjectRab, ProjectDocument } from '../types/project';
import { api, downloadFile } from './client';

export const projectApi = {
  getProjects: async (params?: { status?: string; search?: string; per_page?: number; page?: number }) => {
    const response = await api.get<PaginatedResponse<Project>>(`/projects`, params ? Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])) : undefined);
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
    const response = await api.patch<ProjectMilestone>(`/projects/${projectId}/payment-toggle`, {
      milestone_id: milestoneId,
      payment_status: paymentStatus,
    });
    return response.data;
  },

  addRab: async (projectId: number, data: Partial<ProjectRab>) => {
    const response = await api.post<ProjectRab>(`/projects/${projectId}/rab`, data);
    return response.data;
  },

  uploadDocument: async (projectId: number, form: FormData) => {
    const response = await api.upload<ProjectDocument>(`/projects/${projectId}/documents`, form);
    return response.data;
  },

  downloadDocument: async (projectId: number, document: ProjectDocument) => {
    const blob = await downloadFile('/projects/' + projectId + '/documents/' + document.id + '/download');
    const url = URL.createObjectURL(blob);
    const link = documentForDownload(document.title, url);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  deleteDocument: async (projectId: number, documentId: number) => {
    const response = await api.delete<void>(`/projects/${projectId}/documents/${documentId}`);
    return response.data;
  },

  addMilestone: async (projectId: number, data: Partial<ProjectMilestone>) => {
    const response = await api.post<ProjectMilestone>(`/projects/${projectId}/milestones`, data);
    return response.data;
  },
};

export const vendorApi = {
  createVendor: async (data: Partial<ProjectVendor>) => (await api.post<ProjectVendor>('/vendors', data)).data,
  updateVendor: async (id: number, data: Partial<ProjectVendor>) => (await api.put<ProjectVendor>(`/vendors/${id}`, data)).data,
  getVendors: async (params?: { search?: string; per_page?: number; page?: number }) => {
    const response = await api.get<PaginatedResponse<ProjectVendor>>(`/vendors`, params ? Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])) : undefined);
    return response.data;
  }
};


function documentForDownload(title: string, url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = title;
  document.body.appendChild(link);
  return link;
}
