import { api } from './client';

export interface Division { id: string; code: string; name: string; isActive: boolean; sortOrder: number }
export interface Outlet { id: string; code: string; name: string; divisionId: string; isActive: boolean }
export interface Assignment { id: string; division_id: string; outlet_id: string; employee_id: string; effective_from: string; effective_to: string | null; division?: { code: string }; outlet?: { code: string }; employee?: { code: string } }
export interface UserContext {
  user: { id: string; email: string; role: string; divisionCode: string | null };
  divisions: { code: string; name: string }[];
  outlets: { code: string; name: string; divisionCode: string }[];
  assignments: unknown[];
  scope: string;
}

export const orgApi = {
  divisions: () => api.get<Division[]>('/org/divisions'),
  outlets: (divisionCode?: string) => api.get<Outlet[]>('/org/outlets', { divisionCode }),
  assignments: () => api.get<Assignment[]>('/org/assignments'),
  context: () => api.get<UserContext>('/org/me/context'),
};
