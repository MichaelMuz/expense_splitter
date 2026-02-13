import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header>
      <nav>
        <Link to="/"><strong>Expense Splitter</strong></Link>
        {isAuthenticated ? (
          <>
            {' | '}<Link to="/groups">Groups</Link>
            {' | '}<span>{user?.email}</span>
            {' | '}<button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            {' | '}<Link to="/login">Login</Link>
            {' | '}<Link to="/signup">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
