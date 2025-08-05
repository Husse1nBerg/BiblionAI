
import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const MyBooksPage = () => {
  const [checkoutHistory, setCheckoutHistory] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [errorHistory, setErrorHistory] = useState('');
  const [errorReviews, setErrorReviews] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      setErrorHistory('');
      try {
        const res = await api.get('/books/user/history');
        setCheckoutHistory(res.data);
      } catch (err) {
        console.error('Failed to fetch checkout history:', err);
        setErrorHistory('Failed to load checkout history.');
      } finally {
        setLoadingHistory(false);
      }
    };

    const fetchReviews = async () => {
      setLoadingReviews(true);
      setErrorReviews('');
      try {
        const res = await api.get('/books/user/reviews');
        setUserReviews(res.data);
      } catch (err) {
        console.error('Failed to fetch user reviews:', err);
        setErrorReviews('Failed to load your reviews.');
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchHistory();
    fetchReviews();
  }, []);

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Library Activity</h2>

      <div className="mb-5">
        <h3>Checkout History</h3>
        {loadingHistory && <div className="text-center text-primary">Loading history...</div>}
        {errorHistory && <div className="alert alert-danger">{errorHistory}</div>}
        {!loadingHistory && checkoutHistory.length === 0 && (
          <p>You have no checkout history yet.</p>
        )}
        {!loadingHistory && checkoutHistory.length > 0 && (
          <ul className="list-group">
            {checkoutHistory.map((item) => (
              <li key={`${item.book_id_in_db}-${item.checkout_date}`} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <Link to={`/books/${item.google_book_id}`}>
                    <strong>{item.title}</strong> by {item.author}
                  </Link>
                  <br />
                  <small className="text-muted">
                    {item.checkout_status === 'checked_out'
                      ? `Checked Out: ${new Date(item.checkout_date).toLocaleDateString()}`
                      : `Checked Out: ${new Date(item.checkout_date).toLocaleDateString()} / Returned: ${new Date(item.return_date).toLocaleDateString()}`}
                  </small>
                </div>
                <span className={`badge ${item.checkout_status === 'checked_out' ? 'bg-primary' : 'bg-secondary'}`}>
                  {item.checkout_status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3>My Reviews</h3>
        {loadingReviews && <div className="text-center text-primary">Loading reviews...</div>}
        {errorReviews && <div className="alert alert-danger">{errorReviews}</div>}
        {!loadingReviews && userReviews.length === 0 && (
          <p>You haven't left any reviews yet.</p>
        )}
        {!loadingReviews && userReviews.length > 0 && (
          <ul className="list-group">
            {userReviews.map((review) => (
              <li key={review.review_id} className="list-group-item">
                <Link to={`/books/${review.google_book_id}`}>
                  <strong>{review.title}</strong> by {review.author}
                </Link>
                <br />
                Rating: {review.rating}/5
                <p className="mb-1">{review.review_text}</p>
                <small className="text-muted">Reviewed on: {new Date(review.created_at).toLocaleDateString()}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyBooksPage;