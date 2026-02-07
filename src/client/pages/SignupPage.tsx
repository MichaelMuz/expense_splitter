/**
 * Signup page
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Tooltip } from '../components/ui/Tooltip';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { signupMutation } = useAuth();
  const navigate = useNavigate();

  const hoverMessage = (() => {
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    } else if (password.length < 8) {
      return 'Password must be at least 8 characters';
    } else {
      return null;
    }
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({ email, password }, {
      onSuccess: () => navigate('/groups'),
    })
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-16">
        <Card>
          <h1 className="text-3xl font-bold text-center mb-6">Sign Up</h1>

          {signupMutation.isError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {signupMutation.error.message || 'Signup failed'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />

            <Tooltip content={hoverMessage || ''}>
              <Button
                type="submit"
                disabled={!!hoverMessage}
                className="w-full"
                isLoading={signupMutation.isPending}
              >
                Sign Up
              </Button>
            </Tooltip>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Login
            </Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
