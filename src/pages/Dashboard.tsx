
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import ChatBot from '../components/ChatBot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onProfileClick={() => setIsProfileModalOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            How can I help you with your health today?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <ChatBot />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Health Tips</CardTitle>
                <CardDescription>Daily wellness reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Stay Hydrated</h4>
                  <p className="text-sm text-blue-700">Drink at least 8 glasses of water today.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900">Take a Walk</h4>
                  <p className="text-sm text-green-700">30 minutes of walking can boost your mood.</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900">Deep Breathing</h4>
                  <p className="text-sm text-purple-700">Take 5 deep breaths to reduce stress.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
                <CardDescription>Important numbers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Emergency</span>
                  <Button variant="outline" size="sm">911</Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Poison Control</span>
                  <Button variant="outline" size="sm">1-800-222-1222</Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Mental Health</span>
                  <Button variant="outline" size="sm">988</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;
