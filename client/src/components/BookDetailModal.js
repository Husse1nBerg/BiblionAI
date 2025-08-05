// client/src/components/BookDetailModal.js
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import './BookDetailModal.css';

const BookDetailModal = ({ book, onClose }) => {
  const [modalContent, setModalContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavoritedInitial, setIsFavoritedInitial] = useState(false); // State for initial favorite status

  useEffect(() => {
    const fetchFullDetailsAndStatus = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = { 'x-auth-token': token };

        // Fetch full book details
        const response = await fetch(`/api/books/${book.id}`, { headers });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.error("Authentication failed for fetching modal details.");
                setError('Authentication failed. Please try logging in again.');
            }
            throw new Error('Failed to fetch full book details from API');
        }
        const data = await response.json();
        setModalContent(data);

        // Check favorite status if book_id_in_db is available
        if (data.book_id_in_db) {
            const favStatusRes = await fetch(`/api/users/favorites/status/${data.book_id_in_db}`, { headers });
            const favStatusData = await favStatusRes.json();
            setIsFavoritedInitial(favStatusData.isFavorited);
        }

      } catch (err) {
        console.error('Error fetching full book details or favorite status for modal:', err);
        setError('Failed to load full book details or favorite status.');
      } finally {
        setLoading(false);
      }
    };

    if (book && book.id) {
      fetchFullDetailsAndStatus();
    }
  }, [book]);

  const handleFavoriteStatusChange = (bookId, newStatus) => {
    setIsFavoritedInitial(newStatus);
  };

  if (!book) return null;

  return ReactDOM.createPortal(
    // Clicking the backdrop closes the modal
    <div className="modal-backdrop" onClick={onClose}>
      {/* Clicks inside the modal content will not close it due to e.stopPropagation() */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* The Bootstrap close button, which now has a clear onClick handler */}
        <button type="button" className="btn-close modal-close-button" aria-label="Close" onClick={onClose}></button>
        
        {loading ? (
          <div className="text-center p-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
        ) : error ? (
          <div className="alert alert-danger p-5">{error}</div>
        ) : modalContent ? (
          <div className="row">
            <div className="col-md-4 text-center position-relative">
  <img
    src={modalContent.cover_image_url || 'https://via.placeholder.com/200x300?text=No+Cover'}
    alt={modalContent.title}
    className="img-fluid rounded shadow-sm mb-3"
  />
  {/* CHANGED: Use d-block and mt-3 for spacing */}
  <Link to={`/books/${modalContent.id}`} className="btn btn-primary btn-sm d-block mt-3" onClick={onClose}>
    Go to Full Page
  </Link>
              {modalContent.book_id_in_db && (
                <div className="modal-favorite-btn-wrapper">
                  <FavoriteButton
                    bookIdInDb={modalContent.book_id_in_db}
                    isFavoritedInitially={isFavoritedInitial}
                    onFavoriteStatusChange={handleFavoriteStatusChange}
                  />
                </div>
              )}
            </div>
            <div className="col-md-8">
              <h2>{modalContent.title}</h2>
              <p className="text-muted">{modalContent.authors ? modalContent.authors.join(', ') : 'Unknown Author'}</p>
              <p><strong>Published:</strong> {modalContent.published_date}</p>
              <p><strong>Pages:</strong> {modalContent.pageCount}</p>
              <p><strong>Categories:</strong> {modalContent.categories ? modalContent.categories.join(', ') : 'N/A'}</p>
              <hr />
              <p dangerouslySetInnerHTML={{ __html: modalContent.description }}></p>
            </div>
          </div>
        ) : (
            <div className="alert alert-warning p-5">No book data available.</div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default BookDetailModal;