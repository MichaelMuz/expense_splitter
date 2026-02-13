import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/groups" replace />;
  }

  return (
    <div>
      <h1>Expense Splitter</h1>
      <p>Split expenses with friends, track balances, and settle up easily.</p>
      <nav>
        <Link to="/signup">Get Started</Link>
        {' | '}
        <Link to="/login">Login</Link>
      </nav>
    </div>
  );
}
