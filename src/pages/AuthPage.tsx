
import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

type AuthView = 'login' | 'signup' | 'forgot-password';

const AuthPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {currentView === 'login' && (
          <LoginForm
            onSwitchToSignup={() => setCurrentView('signup')}
            onForgotPassword={() => setCurrentView('forgot-password')}
          />
        )}
        {currentView === 'signup' && (
          <SignupForm
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
        {currentView === 'forgot-password' && (
          <ForgotPasswordForm
            onBackToLogin={() => setCurrentView('login')}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
