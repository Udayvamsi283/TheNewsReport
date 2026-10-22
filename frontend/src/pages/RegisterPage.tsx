import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const { showToast } = useToast();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await register({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      showToast(`Account created successfully! Welcome to The News Report, ${response.user.name}.`, 'success');
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Email may already be in use.';
      showToast(message, 'error', 'Registration Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12">
      <div className="bg-white dark:bg-navy-850 p-6 sm:p-8 rounded border border-slate-200 dark:border-navy-700 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-baseline gap-1 focus:outline-none">
            <span className="text-2xl font-black uppercase tracking-tight text-navy-900 dark:text-white">
              THE NEWS REPORT
            </span>
            <span className="w-2 h-2 rounded-full bg-editorial-red inline-block" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create Reader Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create an account to save articles, participate in discussions, and customize reading preferences.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            leftIcon={<User className="w-4 h-4" />}
            disabled={isSubmitting}
          />

          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            disabled={isSubmitting}
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            leftIcon={<Lock className="w-4 h-4" />}
            helperText="Must contain at least 8 characters."
            disabled={isSubmitting}
          />

          <Button
            type="submit"
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            isLoading={isSubmitting}
          >
            Create Account
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-navy-750 text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-navy-900 dark:text-white font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
