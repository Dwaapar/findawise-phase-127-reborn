/**
 * Session Dashboard Admin Page - Real-Time Session Management Interface
 * Billion-Dollar Grade Enterprise Session Analytics Dashboard
 */

import React from 'react';
import SessionDashboard from '@/components/admin/SessionDashboard';

export default function SessionDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <SessionDashboard />
    </div>
  );
}