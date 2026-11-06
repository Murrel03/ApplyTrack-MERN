import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        Apply<span>Track</span>
      </Link>
      <nav>
        {isAuthenticated ? (
          <>
            <span className="nav-user">Hi, {user?.name?.split(' ')[0] || 'there'}</span>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register" className="btn btn-primary btn-small">
              Get started
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
