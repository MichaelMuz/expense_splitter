import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { Button } from '../components/ui/Button';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/groups');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Expense Splitter
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Split expenses with friends, track balances, and settle up easily.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          <Link to="/signup" className="block">
            <Button className="w-full">Get Started</Button>
          </Link>
          <Link to="/login" className="block">
            <Button variant="secondary" className="w-full">Login</Button>
          </Link>
        </div>

        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Frontend:</span>
            <span>React 19 + Vite + Tailwind</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Backend:</span>
            <span>Express + Prisma + PostgreSQL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Runtime:</span>
            <span>Bun</span>
          </div>
        </div>
      </div>
    </div>
  );
}
