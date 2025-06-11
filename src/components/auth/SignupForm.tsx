
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

const ALLOWED_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.ca',
  'yahoo.fr',
  'yahoo.de',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'proton.me',
  'pm.me',
  'zoho.com',
  'zohomail.com',
  'aol.com',
  'gmx.com',
  'gmx.net',
  'yandex.com',
  'yandex.ru',
  'ya.ru',
  'mail.com'
];

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();

  const validateEmailProvider = (email: string): boolean => {
    const emailDomain = email.toLowerCase().split('@')[1];
    return ALLOWED_EMAIL_PROVIDERS.includes(emailDomain);
  };

  const getProviderName = (email: string): string => {
    const domain = email.toLowerCase().split('@')[1];
    const providerMap: { [key: string]: string } = {
      'gmail.com': 'Gmail',
      'yahoo.com': 'Yahoo Mail',
      'yahoo.co.uk': 'Yahoo Mail',
      'yahoo.ca': 'Yahoo Mail',
      'yahoo.fr': 'Yahoo Mail',
      'yahoo.de': 'Yahoo Mail',
      'outlook.com': 'Outlook.com',
      'hotmail.com': 'Outlook.com',
      'live.com': 'Outlook.com',
      'icloud.com': 'iCloud Mail',
      'me.com': 'iCloud Mail',
      'mac.com': 'iCloud Mail',
      'protonmail.com': 'Proton Mail',
      'proton.me': 'Proton Mail',
      'pm.me': 'Proton Mail',
      'zoho.com': 'Zoho Mail',
      'zohomail.com': 'Zoho Mail',
      'aol.com': 'AOL Mail',
      'gmx.com': 'GMX Mail',
      'gmx.net': 'GMX Mail',
      'yandex.com': 'Yandex Mail',
      'yandex.ru': 'Yandex Mail',
      'ya.ru': 'Yandex Mail',
      'mail.com': 'Mail.com'
    };
    return providerMap[domain] || domain;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!validateEmailProvider(email)) {
      setError('Please use an email from one of the supported providers: Gmail, Yahoo Mail, Outlook.com, iCloud Mail, Proton Mail, Zoho Mail, AOL Mail, GMX Mail, Yandex Mail, or Mail.com');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting signup with:', email);
      const success = await signup(name, email, password);
      if (success) {
        toast({
          title: "Account created successfully",
          description: "Welcome to HealthCare AI!",
        });
      }
    } catch (err: any) {
      console.error('Signup error in form:', err);
      
      // Check for specific error messages
      if (err.message && err.message.includes('User already registered')) {
        setError('An account with this email address already exists. Please use the login form instead or try a different email address.');
      } else if (err.message && err.message.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError('An error occurred during signup. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create account</CardTitle>
        <CardDescription className="text-center">
          Enter your information to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="text-xs text-gray-600">
              Supported providers: Gmail, Yahoo Mail, Outlook.com, iCloud Mail, Proton Mail, Zoho Mail, AOL Mail, GMX Mail, Yandex Mail, Mail.com
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>

          <div className="text-center">
            <div className="text-sm">
              Already have an account?{' '}
              <Button
                type="button"
                variant="link"
                onClick={onSwitchToLogin}
                className="p-0"
              >
                Sign in
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
