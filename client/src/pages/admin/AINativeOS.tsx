import { AINativeDashboard } from '../../../components/admin/AINativeDashboard';
import AdminSidebar from '../../components/AdminSidebar';

export default function AINativeOS() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AdminSidebar />
      <div className="ml-64 p-6">
        <AINativeDashboard />
      </div>
    </div>
  );
}