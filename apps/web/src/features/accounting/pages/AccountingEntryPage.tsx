import AccountingDashboardPage from './AccountingDashboardPage';
import AccountingWorkPage from './AccountingWorkPage';
import { useAuth } from '../../../session/AuthContext';

export default function AccountingEntryPage() {
  const { user } = useAuth();
  return user?.divisionCode === 'ACC' && ['ADMIN', 'ACCOUNTING'].includes(user.role) ? <AccountingWorkPage /> : <AccountingDashboardPage />;
}
