// client/src/components/BookCard.js
import React, { useState, useEffect } from 'react';
import './BookCard.css';
import FavoriteButton from './FavoriteButton'; // <-- NEW: Import FavoriteButton
import api from '../api'; // For checking initial favorite status

const BookCard = ({ book, onCardClick }) => {
  const [isFavoritedInitial, setIsFavoritedInitial] = useState(false); // State for initial fav status

  // Check initial favorite status when component mounts or book changes
  useEffect(() => {
    const checkStatus = async () => {
      if (book.book_id_in_db) {
        try {
          const response = await api.get(`/users/favorites/status/${book.book_id_in_db}`); // API call to check status
          setIsFavoritedInitial(response.data.isFavorited);
        } catch (error) {
          console.error('Error checking favorite status for card:', error);
          setIsFavoritedInitial(false); // Assume not favorited on error
        }
      }
    };
    checkStatus();
  }, [book.book_id_in_db]); // Re-check if book changes

  const handleClick = () => {
    if (onCardClick) {
      onCardClick(book);
    }
  };

  return (
    <div className="col-md-3 mb-4">
      <div className="book-card-container position-relative"> {/* Added position-relative for favorite button */}
        <div className="book-card-clickable" onClick={handleClick}>
          <div className="book-card">
            <img
              src={book.cover_image_url || 'https://via.placeholder.com/128x190?text=No+Cover'}
              className="book-card-img"
              alt={book.title}
            />
            <div className="book-card-info">
              <h5 className="book-card-title">{book.title}</h5>
              <p className="book-card-author">{book.authors ? book.authors.join(', ') : 'Unknown Author'}</p>
            </div>

            {/* Details overlay on hover */}
            <div className="book-card-details-overlay">
                <h5>{book.title}</h5>
                <p>{book.authors ? book.authors.join(', ') : 'Unknown Author'}</p>
                <p className="text-truncate" style={{ maxWidth: '100%', maxHeight: '80px', overflow: 'hidden' }}>
                    {book.description || 'No description available.'}
                </p>
                <small>Click to see full details</small>
            </div>
          </div>
        </div>

        {/* NEW: Favorite Button - Positioned absolutely within .book-card-container */}
        {book.book_id_in_db && ( // Only show if we have a local DB ID for the book
          <div className="book-card-favorite-btn-wrapper">
            <FavoriteButton
              bookIdInDb={book.book_id_in_db}
              isFavoritedInitially={isFavoritedInitial}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;