
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthPage />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  return <Dashboard />;
};

export default Index;
