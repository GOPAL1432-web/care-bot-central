
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import HealthManagement from '../components/admin/HealthManagement';
import HealthInformation from '../components/admin/HealthInformation';
import DoctorManagement from '../components/admin/DoctorManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Heart, Activity, UserCheck, Info } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const stats = [
    {
      title: 'Total Users',
      value: '2,543',
      icon: Users,
      description: 'Active platform users'
    },
    {
      title: 'Health Tips',
      value: '156',
      icon: Heart,
      description: 'Published health content'
    },
    {
      title: 'Active Doctors',
      value: '24',
      icon: UserCheck,
      description: 'Available medical staff'
    },
    {
      title: 'Daily Interactions',
      value: '1,247',
      icon: Activity,
      description: 'AI chatbot conversations'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onProfileClick={() => setIsProfileModalOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your healthcare platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="health-info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="health-info">Health Information</TabsTrigger>
            <TabsTrigger value="health-tips">Health Tips</TabsTrigger>
            <TabsTrigger value="doctors">Doctor Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="health-info">
            <HealthInformation />
          </TabsContent>
          
          <TabsContent value="health-tips">
            <HealthManagement />
          </TabsContent>
          
          <TabsContent value="doctors">
            <DoctorManagement />
          </TabsContent>
        </Tabs>
      </main>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
};

export default AdminDashboard;
