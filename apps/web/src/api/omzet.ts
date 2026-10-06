import { api } from './client';

export interface OmzetInput {
  outlet_id: string;
  business_date: string;
  shift: string;
  outlet_amount: string;
  cash_amount: string;
  qris_amount: string;
  edc_amount: string;
  transfer_amount: string;
  other_amount: string;
  requires_ap: boolean;
  source_reference: string;
  notes: string;
}
export type OmzetStatus = 'draft' | 'submitted' | 'correction' | 'pending_approval' | 'validated';
export interface OmzetRecord extends OmzetInput {
  id: string;
  outlet_name: string;
  source_division_code: string;
  status: OmzetStatus;
  version: number;
  ap_amount: string | null;
  received_amount: string;
  payment_difference: string;
  ap_difference: string | null;
  review_notes: string | null;
  decision_notes: string | null;
  submission_window: { opens_at: string; deadline: string; can_submit: boolean; can_request_unlock: boolean; has_permit: boolean };
  events: Array<{ id: number; action: string; actor_role: string; created_at: string; metadata: { reason?: string; status: string; version: number } }>;
  unlock_requests: Array<{ id: string; reason: string; status: string; decision_notes: string | null }>;
}
export interface OmzetOutlet { id: string; code: string; name: string; divisionCode: string }
export interface OmzetList {
  items: OmzetRecord[];
  total: number;
  current_page: number;
  last_page: number;
  summary: { validated_count: number; outlet_amount: string; received_amount: string; ap_difference: string };
}
const base = '/accounting/omzet';
export const omzetApi = {
  annual: (year: number) => api.get<AnnualOmzetReport>(base + '/annual', { year: String(year) }),
  outlets: () => api.get<OmzetOutlet[]>(base + '/outlets'),
  list: (filters: { month: string; status: string; outlet_id: string; page: string }) => api.get<OmzetList>(base, filters),
  detail: (id: string) => api.get<OmzetRecord>(base + '/' + id),
  save: (input: OmzetInput, record?: { id: string; version: number }) => record
    ? api.put<OmzetRecord>(base + '/' + record.id, { ...input, version: record.version })
    : api.post<OmzetRecord>(base, input),
  action: (record: OmzetRecord, action: string, data: { reason?: string; decision?: string; ap_amount?: string; unlock_id?: string } = {}) =>
    api.post<OmzetRecord>(base + '/' + record.id + '/' + action, { version: record.version, ...data }),
};

export interface AnnualOmzetReport {
  year: number; source: string; amount: string | null; validated_count: number; pending_count: number;
  months: Array<{ month: string; amount: string | null; validated_count: number; pending_count: number }>;
  outlets: Array<{ outlet_id: string; outlet_name: string; source_division_code: string; amount: string; validated_count: number; months_with_data: number }>;
}
