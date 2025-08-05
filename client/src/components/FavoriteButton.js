// client/src/components/FavoriteButton.js
import React, { useState, useEffect, useContext } from 'react';
import api from '../api'; // Your configured axios instance
import AuthContext from '../context/AuthContext'; // To check if user is logged in
import './FavoriteButton.css'; // New CSS file for this button
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons'; // Filled heart
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'; // Outline heart (needs free-regular-svg-icons for outline)

// bookIdInDb is crucial: this is your local PostgreSQL book ID
const FavoriteButton = ({ bookIdInDb, isFavoritedInitially = false, onFavoriteStatusChange }) => {
  const { isLoggedIn } = useContext(AuthContext);
  const [isFavorited, setIsFavorited] = useState(isFavoritedInitially);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync internal state with prop if it changes (e.g., if parent fetches status)
  useEffect(() => {
    setIsFavorited(isFavoritedInitially);
  }, [isFavoritedInitially]);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation(); // Prevent parent card/modal from handling click
    if (!isLoggedIn) {
      alert('Please log in to manage your favorites.');
      return;
    }
    if (!bookIdInDb) {
      setError("Cannot favorite: Book ID not available.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (isFavorited) {
        // REMOVE FROM FAVORITES: API call to /api/users/favorites/:book_id
        await api.delete(`/users/favorites/${bookIdInDb}`);
        setIsFavorited(false);
        alert('Removed from favorites!');
      } else {
        // ADD TO FAVORITES: API call to /api/users/favorites
        await api.post('/users/favorites', { book_id: bookIdInDb });
        setIsFavorited(true);
        alert('Added to favorites!');
      }
      // Notify parent component of the change if a callback is provided
      if (onFavoriteStatusChange) {
        onFavoriteStatusChange(bookIdInDb, !isFavorited);
      }
    } catch (err) {
      console.error('Failed to toggle favorite status:', err);
      // Check for 409 Conflict (already favorited) or other errors
      setError(err.response?.data?.message || 'Failed to update favorites.');
      alert(err.response?.data?.message || 'Failed to update favorites!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
      onClick={handleToggleFavorite}
      disabled={loading} // Disable button while API call is in progress
      title={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
    >
      {loading ? (
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      ) : (
        <FontAwesomeIcon icon={isFavorited ? faHeartSolid : faHeartRegular} />
      )}
      {error && <span className="text-danger ms-2">{error}</span>}
    </button>
  );
};

export default FavoriteButton;