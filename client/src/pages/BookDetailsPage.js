// client/src/pages/BookDetailsPage.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api.js';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';

const BookDetailsPage = () => {
    const { id } = useParams(); // This is the Google Books API ID from the URL
    const [book, setBook] = useState(null); // State for the current book's details
    const [reviews, setReviews] = useState([]); // State for reviews of this book
    const [newReviewText, setNewReviewText] = useState('');
    const [newReviewRating, setNewReviewRating] = useState(5);
    const [loading, setLoading] = useState(true); // Loading state for initial book/review fetch
    const [error, setError] = useState(''); // Error state for initial fetch
    const { user } = useContext(AuthContext); // Get current user from AuthContext
    const { addToCart } = useContext(CartContext); // Function to add item to cart from CartContext

    // Effect hook to fetch book details and reviews when component mounts or ID changes
    useEffect(() => {
        const fetchBookDetails = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch book details from backend using the URL ID
                const response = await api.get(`/books/${id}`);
                setBook(response.data); // Set fetched book data

                // If backend returned a valid book with availability status (implying local DB presence)
                if (response.data && response.data.book_id_in_db) {
                    fetchReviews(response.data.book_id_in_db); // Fetch reviews using the local DB ID
                } else {
                    console.log("No local DB ID to fetch reviews.");
                    setReviews([]);
                }
            } catch (err) {
                console.error('Error fetching book details:', err);
                setError('Failed to load book details.');
            } finally {
                setLoading(false); // End loading
            }
        };

        const fetchReviews = async (localBookId) => {
            if (!localBookId) return;
            try {
                const res = await api.get(`/reviews/${localBookId}`);
                setReviews(res.data);
            } catch (err) {
                console.error('Error fetching reviews:', err);
            }
        };

        if (id) {
            fetchBookDetails(); // Initiate fetching book details if ID is available
        }
    }, [id]); // Dependency array: re-run this effect if the URL 'id' changes

    const handleCheckout = async () => {
        if (!book) return;
        try {
            const res = await api.post('/books/checkout', {
                google_book_id: book.id,
                title: book.title,
                author: book.authors ? book.authors.join(', ') : 'Unknown',
                cover_image_url: book.cover_image_url,
            });
            alert(res.data.message);
            setBook(prevBook => ({ ...prevBook, availability_status: 'checked_out', dueDate: res.data.dueDate }));
        } catch (err) {
            console.error('Checkout failed:', err.response?.data || err.message);
            alert(err.response?.data?.message || 'Failed to check out book.');
        }
    };

    const handleCheckin = async () => {
    if (!book) return;

    try {
        const localBookId = book.book_id_in_db; // Get the local DB ID from the book state

        if (!localBookId) {
            alert("Cannot check in: local book ID not found. Please try refreshing.");
            return;
        }

        // Validate that localBookId is a number before sending
        const bookIdToSend = parseInt(localBookId, 10);
        if (isNaN(bookIdToSend)) {
            alert("Invalid book ID for check-in. Please try refreshing.");
            return;
        }

        const res = await api.post('/books/checkin', { book_id: bookIdToSend }); // Use the validated ID

        alert(res.data.message);
        setBook(prevBook => ({ ...prevBook, availability_status: 'available', dueDate: null }));
    } catch (err) {
        console.error('Checkin failed:', err.response?.data || err.message);
        alert(err.response?.data?.message || 'Failed to check in book.');
    }
};

    const handleAddToCart = async () => {
        if (!book) return;
        try {
            let localBookId = book.book_id_in_db;
            if (!localBookId) {
                const registerRes = await api.post('/books/register-in-db', {
                    google_book_id: book.id,
                    title: book.title,
                    author: book.authors ? book.authors.join(', ') : 'Unknown',
                    cover_image_url: book.cover_image_url
                });
                localBookId = registerRes.data.book_id_in_db;
                setBook(prevBook => ({ ...prevBook, book_id_in_db: localBookId }));
            }
            if (!localBookId) {
                alert("Failed to get a valid book ID for purchase. Please try again.");
                return;
            }
            const bookToAdd = {
                book_id: localBookId,
                title: book.title,
                price: 500
            };
            addToCart(bookToAdd);
            alert(`${book.title} added to cart!`);
        } catch (err) {
            console.error('Error adding to cart or registering book for purchase:', err.response?.data || err.message);
            alert(err.response?.data?.message || 'Failed to add book to cart. Please try again.');
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!newReviewText.trim() || newReviewRating < 1 || newReviewRating > 5) {
            alert('Review text cannot be empty and rating must be between 1 and 5.');
            return;
        }
        try {
            let localBookIdForReview = book.book_id_in_db;
            if (!localBookIdForReview) {
                alert("Cannot add review: local book ID not found. Please try refreshing.");
                return;
            }
            const res = await api.post('/reviews', {
                book_id: localBookIdForReview,
                rating: newReviewRating,
                review_text: newReviewText,
            });
            setReviews([...reviews, { ...res.data, user_email: user.email }]);
            setNewReviewText('');
            setNewReviewRating(5);
            alert('Review submitted successfully!');
        } catch (err) {
            console.error('Error submitting review:', err.response?.data || err.message);
            alert(err.response?.data?.message || 'Failed to submit review.');
        }
    };

    const handleReadBook = () => {
        if (book.webReaderLink) {
            window.open(book.webReaderLink, '_blank');
        } else {
            alert("Sorry, a digital reader link is not available for this book.");
        }
    };

    if (loading) return <div className="text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!book) return <div className="alert alert-warning">Book not found.</div>;

    return (
        <div className="row">
            <div className="col-md-4">
                <img
                    src={book.cover_image_url || 'https://via.placeholder.com/200x300?text=No+Cover'}
                    alt={book.title}
                    className="img-fluid rounded shadow-sm"
                />
            </div>
            <div className="col-md-8">
                <h2>{book.title}</h2>
                <p className="text-muted">{book.authors ? book.authors.join(', ') : 'Unknown Author'}</p>
                <p><strong>Published:</strong> {book.published_date}</p>
                <p><strong>Pages:</strong> {book.pageCount}</p>
                <p><strong>Categories:</strong> {book.categories ? book.categories.join(', ') : 'N/A'}</p>
                <hr />
                <p dangerouslySetInnerHTML={{ __html: book.description }}></p>

                <div className="d-flex gap-2 mb-4">
                    {book.availability_status === 'available' ? (
                        <button className="btn btn-success" onClick={handleCheckout}>Check Out Book</button>
                    ) : (
                        <button className="btn btn-warning" onClick={handleCheckin}>Check In Book</button>
                    )}
                    <button className="btn btn-info" onClick={handleAddToCart}>Add to Cart (Purchase)</button>
                    {book.webReaderLink && (
                        <button className="btn btn-secondary" onClick={handleReadBook}>Read Book</button>
                    )}
                    {book.availability_status === 'checked_out' && book.dueDate && (
                        <p className="text-danger">
                            <strong>Due Date:</strong> {new Date(book.dueDate).toLocaleDateString()}
                        </p>
                    )}
                </div>

                <h3>Reviews</h3>
                {reviews.length > 0 ? (
                    <ul className="list-group mb-4">
                        {reviews.map((review) => (
                            <li key={review.id} className="list-group-item">
                                <strong>{review.user_email}</strong> (Rating: {review.rating}/5)
                                <p>{review.review_text}</p>
                                <small className="text-muted">{new Date(review.created_at).toLocaleDateString()}</small>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No reviews yet. Be the first to review this book!</p>
                )}

                <h4>Leave a Review</h4>
                <form onSubmit={handleReviewSubmit} className="mb-4">
                    <div className="mb-3">
                        <label htmlFor="reviewRating" className="form-label">Rating:</label>
                        <select
                            id="reviewRating"
                            className="form-select"
                            value={newReviewRating}
                            onChange={(e) => setNewReviewRating(parseInt(e.target.value))}
                        >
                            {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num} Star</option>)}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="reviewText" className="form-label">Your Review:</label>
                        <textarea
                            id="reviewText"
                            className="form-control"
                            rows="4"
                            value={newReviewText}
                            onChange={(e) => setNewReviewText(e.target.value)}
                            required
                        ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary">Submit Review</button>
                </form>
            </div>
        </div>
    );
};

export default BookDetailsPage;