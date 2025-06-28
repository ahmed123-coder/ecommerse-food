import React from 'react';
import DashboardInStore from '../conponment/dashboardstore.jsx';
import DashboardNotInStore from '../conponment/dashboard.jsx';
import Admin from './admin';

function Dashboard() {
  return (
    <div>
      <Admin />
      <DashboardInStore />
      <DashboardNotInStore />
    </div>
  );
}

export default Dashboard;