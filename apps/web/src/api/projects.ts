import { Project, PaginatedResponse, ProjectVendor, ProjectRab, ProjectExpense, ProjectInvoice, FinancialSummary, ProjectDocument } from '../types/project';
import { api, downloadFile } from './client';

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

  getFinancialSummary: async (projectId: number) => {
    const response = await api.get<FinancialSummary>(`/projects/${projectId}/financial-summary`);
    return response.data;
  },

  togglePayment: async (projectId: number, milestoneId: number, paymentStatus: boolean) => {
    const response = await api.patch<any>(`/projects/${projectId}/payment-toggle`, {
      milestone_id: milestoneId,
      payment_status: paymentStatus,
    });
    return response.data;
  },

  // RAB Endpoints
  getRab: async (projectId: number) => {
    const response = await api.get<ProjectRab[]>(`/projects/${projectId}/rab`);
    return response.data;
  },

  addRab: async (projectId: number, data: Partial<ProjectRab>) => {
    const response = await api.post<ProjectRab>(`/projects/${projectId}/rab`, data);
    return response.data;
  },

  updateRab: async (projectId: number, rabId: number, data: Partial<ProjectRab>) => {
    const response = await api.put<ProjectRab>(`/projects/${projectId}/rab/${rabId}`, data);
    return response.data;
  },

  deleteRab: async (projectId: number, rabId: number) => {
    const response = await api.delete<{ message: string }>(`/projects/${projectId}/rab/${rabId}`);
    return response.data;
  },

  // Expenses Endpoints
  getExpenses: async (projectId: number, params?: { category?: string; project_rab_id?: number; search?: string }) => {
    const response = await api.get<ProjectExpense[]>(`/projects/${projectId}/expenses`, params as Record<string, any>);
    return response.data;
  },

  addExpense: async (projectId: number, form: FormData) => {
    const response = await api.upload<ProjectExpense>(`/projects/${projectId}/expenses`, form);
    return response.data;
  },

  updateExpense: async (projectId: number, expenseId: number, form: FormData) => {
    const response = await api.upload<ProjectExpense>(`/projects/${projectId}/expenses/${expenseId}`, form);
    return response.data;
  },

  deleteExpense: async (projectId: number, expenseId: number) => {
    const response = await api.delete<{ message: string }>(`/projects/${projectId}/expenses/${expenseId}`);
    return response.data;
  },

  // Invoices (Termin) Endpoints
  getInvoices: async (projectId: number, params?: { status?: string }) => {
    const response = await api.get<ProjectInvoice[]>(`/projects/${projectId}/invoices`, params as Record<string, string | undefined>);
    return response.data;
  },

  addInvoice: async (projectId: number, data: Partial<ProjectInvoice>) => {
    const response = await api.post<ProjectInvoice>(`/projects/${projectId}/invoices`, data);
    return response.data;
  },

  updateInvoice: async (projectId: number, invoiceId: number, data: Partial<ProjectInvoice>) => {
    const response = await api.put<ProjectInvoice>(`/projects/${projectId}/invoices/${invoiceId}`, data);
    return response.data;
  },

  markInvoicePaid: async (projectId: number, invoiceId: number, data: { paid_date?: string; payment_reference?: string; notes?: string }) => {
    const response = await api.patch<ProjectInvoice>(`/projects/${projectId}/invoices/${invoiceId}/pay`, data);
    return response.data;
  },

  deleteInvoice: async (projectId: number, invoiceId: number) => {
    const response = await api.delete<{ message: string }>(`/projects/${projectId}/invoices/${invoiceId}`);
    return response.data;
  },

  // Documents
  uploadDocument: async (projectId: number, form: FormData) => {
    const response = await api.upload<ProjectDocument>(`/projects/${projectId}/documents`, form);
    return response.data;
  },

  downloadDocument: async (projectId: number, doc: ProjectDocument) => {
    const blob = await downloadFile('/projects/' + projectId + '/documents/' + doc.id + '/download');
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = doc.title;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  deleteDocument: async (projectId: number, documentId: number) => {
    const response = await api.delete<any>(`/projects/${projectId}/documents/${documentId}`);
    return response.data;
  },

  // Milestones
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

  // Photos
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

  // Reports Engine
  getProgressReport: async (projectId: number) => {
    const response = await api.get<any>(`/projects/${projectId}/reports/progress`);
    return response.data;
  },

  getBastReport: async (projectId: number) => {
    const response = await api.get<any>(`/projects/${projectId}/reports/bast`);
    return response.data;
  },
};

export const vendorApi = {
  getVendors: async (params?: { search?: string; per_page?: number }) => {
    const response = await api.get<PaginatedResponse<ProjectVendor>>(`/vendors`, params as Record<string, string | undefined>);
    return response.data;
  },

  createVendor: async (data: Partial<ProjectVendor>) => {
    const response = await api.post<ProjectVendor>(`/vendors`, data);
    return response.data;
  },

  updateVendor: async (id: number, data: Partial<ProjectVendor>) => {
    const response = await api.put<ProjectVendor>(`/vendors/${id}`, data);
    return response.data;
  },

  deleteVendor: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/vendors/${id}`);
    return response.data;
  },
};
