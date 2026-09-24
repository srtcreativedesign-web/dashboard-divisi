export interface ProjectVendor {
  id: number;
  name: string;
  category?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  bank_details?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: number;
  project_id: number;
  title: string;
  weight_percentage: number;
  status: string;
  payment_status: boolean;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectRab {
  id: number;
  project_id: number;
  item_name: string;
  category: string;
  volume: number;
  unit?: string;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectDocument {
  id: number;
  project_id: number;
  title: string;
  file_path: string;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  division_code: string;
  name: string;
  client_name?: string;
  contract_value: number;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  milestones?: ProjectMilestone[];
  rabs?: ProjectRab[];
  documents?: ProjectDocument[];
  vendors?: ProjectVendor[];
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}
