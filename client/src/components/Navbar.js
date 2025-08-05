// client/src/components/Navbar.js

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';
import ThemeContext from '../context/ThemeContext';

const Navbar = () => {
  const { isLoggedIn, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0"> {/* LEFT-ALIGNED ITEMS */}
            {isLoggedIn ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/my-books">My Books</Link>
                </li>
                {/* MOVED: Favorites Link is now here */}
                <li className="nav-item">
                  <Link className="nav-link" to="/favorites">Favorites</Link> {/* <-- MOVED HERE */}
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/cart">
                    Cart ({cart.length})
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
          {/* RIGHT-ALIGNED ITEMS (Dark Mode Toggle, Logout) */}
          <ul className="navbar-nav">
            {/* Dark Mode Toggle Button remains here */}
            <li className="nav-item me-2">
              <button
                className={`btn btn-sm ${isDarkMode ? 'btn-light' : 'btn-dark'}`}
                onClick={toggleTheme}
                style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </li>
            {isLoggedIn && (
              <li className="nav-item">
                <button className="btn btn-outline-light" onClick={logout}>Logout</button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;