// client/src/pages/FavoritesPage.js
import React, { useState, useEffect, useContext, useCallback } from 'react'; // <-- ADD useCallback
import api from '../api';
import AuthContext from '../context/AuthContext';
import BookCard from '../components/BookCard'; // <-- Ensure BookCard is imported
import { Link, useNavigate } from 'react-router-dom';

const FavoritesPage = () => {
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  // Use useCallback to memoize the fetchFavorites function
  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users/favorites');
      setFavoriteBooks(response.data);
    } catch (err) {
      console.error('Error fetching favorite books:', err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          alert('Your session has expired. Please log in again.');
          navigate('/login');
      }
      setError('Failed to load your favorite books.');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, navigate]); // This function depends on isLoggedIn and navigate

  useEffect(() => {
    if (isLoggedIn) {
      fetchFavorites();
    } else {
      setError('Please log in to view your favorites.');
      setLoading(false);
      setFavoriteBooks([]);
    }
  }, [isLoggedIn, fetchFavorites]); // <-- ADD fetchFavorites to the dependency array

  // ... (rest of the handleFavoriteStatusChange function) ...

  if (loading) return <div className="text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Favorite Books</h2>
      {favoriteBooks.length === 0 ? (
        <p>You haven't added any books to your favorites yet. Explore the <Link to="/dashboard">Dashboard</Link> to find some!</p>
      ) : (
        <div className="row">
          {favoriteBooks.map(book => (
            // CORRECTED: Use BookCard component here for consistent display
            <BookCard
              key={book.book_id_in_db}
              book={book}
              // This is an example, you would need to implement onCardClick logic here
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;