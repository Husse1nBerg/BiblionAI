// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BookDetailsPage from './pages/BookDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import MyBooksPage from './pages/MyBooksPage';
import Navbar from './components/Navbar';
import AuthContext from './context/AuthContext';
import CartContext from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext'; 
import FavoritesPage from './pages/FavoritesPage'; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  // Robust AuthContext logic: Checks localStorage on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setIsLoggedIn(true);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        // Clear invalid user data to prevent infinite loops or errors
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUser(null);
      }
    } else {
        // Ensure state is false if no token or user data found
        setIsLoggedIn(false);
        setUser(null);
    }
  }, []); // Empty dependency array means this runs once on mount

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setCart([]);
  };

  // Cart manipulation functions (addToCart, removeFromCart, updateCartQuantity, clearCart)
  const addToCart = (book) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.book_id === book.book_id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.book_id === book.book_id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...book, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (bookId) => {
    setCart((prevCart) => prevCart.filter((item) => item.book_id !== bookId));
  };

  const updateCartQuantity = (bookId, quantity) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.book_id === bookId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <Router>
      <ThemeProvider> {/* Wrap entire app with ThemeProvider to give access to theme context */}
        <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
          <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateCartQuantity, clearCart }}>
            <Navbar />
            {/* NEW: Big Title Container - Placed outside the main container for full width */}
            <div className="main-title-container">
              <div className="main-title-box">
                <h1>Biblion AI</h1>
              </div>
            </div>
            {/* End NEW Title */}
            <div className="container mt-4"> {/* Main content container */}
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/dashboard"
                  element={isLoggedIn ? <DashboardPage /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/books/:id"
                  element={isLoggedIn ? <BookDetailsPage /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/cart"
                  element={isLoggedIn ? <CartPage /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/checkout"
                  element={isLoggedIn ? <CheckoutPage /> : <Navigate to="/login" replace />}
                />
                <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
                <Route
                  path="/my-books"
                  element={isLoggedIn ? <MyBooksPage /> : <Navigate to="/login" replace />}
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} /> {/* Fallback for unmatched routes */}
                <Route path="/favorites" element={isLoggedIn ? <FavoritesPage /> : <Navigate to="/login" replace />}
                    />  
              </Routes>
            </div>
          </CartContext.Provider>
        </AuthContext.Provider>
      </ThemeProvider>
    </Router>
  );
}

export default App;