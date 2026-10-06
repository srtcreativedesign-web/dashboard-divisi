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

export interface ProjectProgressPhoto {
  id: number;
  project_id: number;
  milestone_id?: number | null;
  stage: 'before' | 'in_progress' | 'after';
  area_name?: string;
  caption?: string;
  photo_path: string;
  taken_at?: string;
  uploaded_by?: number;
  uploader?: { id: number; name: string };
  milestone?: ProjectMilestone;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: number;
  project_id: number;
  title: string;
  weight_percentage: number;
  actual_percentage?: number;
  status: string;
  payment_status: boolean;
  due_date?: string;
  completion_date?: string;
  notes?: string;
  photos?: ProjectProgressPhoto[];
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
  project_code?: string;
  name: string;
  client_name?: string;
  location?: string;
  description?: string;
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
  photos?: ProjectProgressPhoto[];
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
