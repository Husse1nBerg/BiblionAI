// client/src/pages/FavoritesPage.js
import React, { useState, useEffect, useContext } from 'react';
import api from '../api'; // Your configured axios instance
import AuthContext from '../context/AuthContext'; // To check if user is logged in
import BookCard from '../components/BookCard'; // Reuse BookCard for display
import { Link, useNavigate } from 'react-router-dom'; // For navigation
import FavoriteButton from '../components/FavoriteButton';

const FavoritesPage = () => {
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isLoggedIn } = useContext(AuthContext); // Get login status
  const navigate = useNavigate(); // For redirecting if session expires

  const fetchFavorites = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      // Fetch favorite books from the backend using the correct API path
      const response = await api.get('/users/favorites');
      setFavoriteBooks(response.data); // Set the fetched favorite books
    } catch (err) {
      console.error('Error fetching favorite books:', err);
      // Handle authentication errors specifically
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          alert('Your session has expired or you are not authorized. Please log in again.');
          navigate('/login'); // Redirect to login page
      }
      setError('Failed to load your favorite books.'); // Display a user-friendly error message
    } finally {
      setLoading(false); // End loading regardless of success or failure
    }
  };

  // Effect hook to fetch favorites when the component mounts or login status changes
  useEffect(() => {
    if (isLoggedIn) {
      fetchFavorites(); // Only fetch if the user is logged in
    } else {
      // If not logged in, display a message and stop loading
      setError('Please log in to view your favorites.');
      setLoading(false);
      setFavoriteBooks([]); // Clear any previous favorites data
    }
  }, [isLoggedIn]); // Dependency array: re-run this effect when isLoggedIn changes

  // Handler for when a book's favorite status changes from within a FavoriteButton
  // (e.g., if a user unfavorites a book directly from this page)
  const handleFavoriteStatusChange = (bookId, newStatus) => {
    // If a book is unfavorited (newStatus is false), remove it from the displayed list immediately
    if (!newStatus) {
      setFavoriteBooks(prev => prev.filter(book => book.book_id_in_db !== bookId));
    }
    // If a book is favorited (newStatus is true) from elsewhere and this page is active,
    // you might need to refetch all favorites, or add it to the list (more complex if the full book object isn't available).
    // For simplicity, this handler primarily focuses on removing unfavorited items from the display.
  };

  // Conditional rendering based on loading state, errors, and favoriteBooks content
  if (loading) return <div className="text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Favorite Books</h2>
      {favoriteBooks.length === 0 ? (
        // Message if no favorites are found
        <p>You haven't added any books to your favorites yet. Explore the <Link to="/dashboard">Dashboard</Link> to find some!</p>
      ) : (
        // Display favorite books in a grid
        <div className="row">
          {favoriteBooks.map(book => (
                <div key={book.book_id_in_db} className="col-md-3 mb-4">
              <div className="book-card-container position-relative">
                {/* Link to the full book details page when the card is clicked */}
                <Link to={`/books/${book.google_book_id}`} className="book-card-link">
                  <div className="book-card">
                    <img
                      src={book.cover_image_url || 'https://via.placeholder.com/128x190?text=No+Cover'}
                      className="book-card-img"
                      alt={book.title}
                    />
                    <div className="book-card-info">
                      <h5 className="book-card-title">{book.title}</h5>
                      <p className="book-card-author">{book.author}</p>
                    </div>
                  </div>
                </Link>
                {/* Render the FavoriteButton, explicitly setting initial state and providing callback */}
                {book.book_id_in_db && (
                  <div className="book-card-favorite-btn-wrapper">
                    <FavoriteButton
                      bookIdInDb={book.book_id_in_db}
                      isFavoritedInitially={true} // It's on this page, so it must be a favorite
                      onFavoriteStatusChange={handleFavoriteStatusChange}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;