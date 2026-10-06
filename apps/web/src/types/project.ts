export interface ProjectVendor {
  id: number;
  name: string;
  category?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  bank_name?: string;
  bank_account?: string;
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
  invoices?: ProjectInvoice[];
  progress_logs?: { log_date: string; actual_percentage: number }[];
  created_at: string;
  updated_at: string;
}

export interface ProjectExpense {
  id: number;
  project_id: number;
  project_rab_id?: number | null;
  project_vendor_id?: number | null;
  item_name: string;
  category: string;
  amount: number;
  expense_date: string;
  receipt_path?: string | null;
  notes?: string | null;
  created_by?: string | null;
  rab?: ProjectRab;
  vendor?: ProjectVendor;
  creator?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface ProjectInvoice {
  id: number;
  project_id: number;
  project_milestone_id?: number | null;
  invoice_number: string;
  term_name: string;
  amount: number;
  status: 'draft' | 'invoiced' | 'paid' | 'overdue' | 'cancelled';
  due_date?: string | null;
  paid_date?: string | null;
  payment_reference?: string | null;
  notes?: string | null;
  created_by?: string | null;
  milestone?: ProjectMilestone;
  creator?: { id: string; name: string };
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
  expenses_sum_amount?: number;
  expenses?: ProjectExpense[];
  created_at: string;
  updated_at: string;
}

export interface FinancialCategoryBreakdown {
  category: string;
  budget: number;
  actual: number;
  variance: number;
  absorption_percentage: number;
  is_over_budget: boolean;
}

export interface OverBudgetItem {
  id: number;
  item_name: string;
  category: string;
  budget: number;
  actual: number;
  overrun: number;
}

export interface FinancialSummary {
  contract_value: number;
  total_rab_budget: number;
  total_actual_expense: number;
  budget_variance: number;
  budget_absorption_percentage: number;
  realized_gross_profit: number;
  realized_margin_percentage: number;
  invoiced_amount: number;
  paid_amount: number;
  outstanding_receivable: number;
  category_breakdown: FinancialCategoryBreakdown[];
  over_budget_items: OverBudgetItem[];
}

export interface ProjectDocument {
  id: number;
  project_id: number;
  title: string;
  file_path: string;
  document_type?: string;
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
  expenses?: ProjectExpense[];
  invoices?: ProjectInvoice[];
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
