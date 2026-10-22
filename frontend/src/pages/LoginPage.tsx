import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { showToast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return to intended page if protected route redirected here
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await login(email, password);
      showToast(`Welcome back, ${response.user.name}!`, 'success');

      if (response.user.role === 'admin' && from === '/') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials. Please verify your email and password.';
      showToast(message, 'error', 'Sign In Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-16">
      <div className="bg-white dark:bg-navy-850 p-6 sm:p-8 rounded border border-slate-200 dark:border-navy-700 shadow-sm space-y-6">
        {/* Brand & Heading */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-baseline gap-1 focus:outline-none">
            <span className="text-2xl font-black uppercase tracking-tight text-navy-900 dark:text-white">
              THE NEWS REPORT
            </span>
            <span className="w-2 h-2 rounded-full bg-editorial-red inline-block" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign In
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to access your account, saved articles, and preferences.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="reader@thenews.org"
            leftIcon={<Mail className="w-4 h-4" />}
            disabled={isSubmitting}
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-end text-xs">
            <Link
              to="/forgot-password"
              className="text-editorial-red hover:underline font-semibold"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            isLoading={isSubmitting}
          >
            Sign In
          </Button>
        </form>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-100 dark:border-navy-750 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <div>
            Don't have an account?{' '}
            <Link to="/register" className="text-editorial-red hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
