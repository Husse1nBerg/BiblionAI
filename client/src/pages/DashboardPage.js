// client/src/pages/DashboardPage.js
import React, { useState, useEffect, useContext } from 'react';
import api from '../api.js';
import BookCard from '../components/BookCard';
import SearchBar from '../components/SearchBar';
import AuthContext from '../context/AuthContext';
import BookDetailModal from '../components/BookDetailModal';
import { Link } from 'react-router-dom'; // Keep this for borrowed books section
import './DashboardPage.css'; // Import CSS for dashboard layout

const DashboardPage = () => {
    
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkedOutBooks, setCheckedOutBooks] = useState([]);
  const { user } = useContext(AuthContext);
const getUserDisplayName = () => {
    if (user && user.email) {
      // Example: 'hussein.bayoun@gmail.com' -> 'Hussein Bayoun'
      const emailPrefix = user.email.split('@')[0]; // Gets 'hussein.bayoun'
      const parts = emailPrefix.split('.'); // Splits into ['hussein', 'bayoun']

      // Capitalize first letter of each part and join
      const displayName = parts.map(part =>
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');

      return displayName;
    }
    return 'Guest'; // Fallback if user or email not available
  };
  const [selectedBookForModal, setSelectedBookForModal] = useState(null);

  // NEW: State for AI recommendations
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorAi, setErrorAi] = useState('');
  const [userPreferenceInput, setUserPreferenceInput] = useState(''); // For optional user input

  // NEW: State for category filter
  const [selectedCategory, setSelectedCategory] = useState('');

  // Function to fetch books (now accepts genre for filtering)
 const fetchBooks = async (query = '', genre = '') => { // <-- Ensure genre parameter is here
  setLoading(true);
  setError('');
  try {
    // Pass genre parameter to the backend search API, ensure it's encoded
    const response = await api.get(`/books/search?query=${encodeURIComponent(query)}&genre=${encodeURIComponent(genre)}`);
    setBooks(response.data);
  } catch (err) {
    console.error('Error fetching books:', err);
    setError('Failed to fetch books. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // Function to fetch currently checked out books
  const fetchCheckedOutBooks = async () => {
    try {
      const response = await api.get('/books/user/checked-out');
      setCheckedOutBooks(response.data);
    } catch (err) {
      console.error('Error fetching checked out books:', err);
    }
  };

  // Initial data fetch on component mount or when category changes
  useEffect(() => {
  fetchBooks('popular', selectedCategory); // <-- Ensure selectedCategory is passed here
  fetchCheckedOutBooks();
}, [selectedCategory]);

  // Handler for search bar submission
  const handleSearch = (query) => {
    fetchBooks(query, selectedCategory); // Pass selected category along with search query
  };

  // Handler for category dropdown change
  const handleCategoryChange = (e) => {
  setSelectedCategory(e.target.value);
  // The useEffect above will automatically trigger fetchBooks with the new category
};

  // Define a list of common categories for the dropdown
  const categories = [
    'All Categories', 'Fiction', 'Fantasy', 'Science Fiction', 'Mystery', 'Thriller',
    'Romance', 'Historical Fiction', 'Horror', 'Young Adult', 'Children',
    'Biography', 'History', 'Self-Help', 'Business', 'Cooking', 'Art', 'Science'
  ];

  // Handler for opening the book detail modal
  const handleBookCardClick = (book) => {
    setSelectedBookForModal(book);
  };

  // Handler for closing the book detail modal
  const handleCloseModal = () => {
    setSelectedBookForModal(null);
  };

  // NEW: Handler for getting AI recommendations
  const handleGetRecommendations = async () => {
    setLoadingAi(true);
    setErrorAi('');
    setAiRecommendations(null); // Clear previous recommendations

    try {
      const res = await api.post('/ai/recommend', {
        userPreferences: userPreferenceInput.trim() // Pass user's optional preference input
      });
      setAiRecommendations(res.data.recommendations);
    } catch (err) {
      console.error('Error fetching AI recommendations:', err);
      setErrorAi(err.response?.data?.message || 'Failed to get recommendations.');
    } finally {
      setLoadingAi(false);
    }
  };


  return (
    <div className="dashboard-container"> {/* NEW: Main container for dashboard content */}
      <h2 className="mb-4 text-center">Welcome, {getUserDisplayName()}!</h2> {/* Use display name and center */}

      {/* Your Currently Borrowed Books Section (now encased in a Bootstrap card) */}
      <div className="card p-4 mb-5 shadow-sm"> {/* Bootstrap card for boxing, padding, margin-bottom for spacing */}
        <h3 className="card-title mb-3">Your Currently Borrowed Books</h3>
        {checkedOutBooks.length > 0 ? (
          <div className="row">
            {checkedOutBooks.map(book => (
              <div key={book.google_book_id} className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">{book.title}</h5>
                    <p className="card-text text-muted">{book.author}</p>
                    <p className="card-text"><small>Checked Out: {new Date(book.checkout_date).toLocaleDateString()}</small></p>
                    <Link to={`/books/${book.google_book_id}`} className="btn btn-info btn-sm mt-2">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="card-text">You currently have no books checked out.</p>
        )}
      </div>

      {/* Explore Our Collection Section (now encased in a Bootstrap card) */}
      <div className="card p-4 mb-5 shadow-sm">
        <h3 className="card-title mb-3">Explore Our Collection</h3>
        <SearchBar onSearch={handleSearch} />

        {/* Category Filter Dropdown (inside Explore section) */}
        <div className="mb-4 d-flex justify-content-end">
          <div className="col-md-4">
            <label htmlFor="categoryFilter" className="form-label visually-hidden">Filter by Category</label>
            <select
              id="categoryFilter"
              className="form-select"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              {categories.map((cat, index) => (
                <option key={index} value={cat === 'All Categories' ? '' : cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* End Category Filter */}

        {loading && <div className="text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}
        {error && <div className="alert alert-danger mt-3">{error}</div>}

        <div className="book-shelf-container">
          <div className="row mt-4">
            {books.length > 0 ? (
              books.map((book) => <BookCard key={book.id} book={book} onCardClick={handleBookCardClick} />)
            ) : (
              !loading && <p className="text-center">No books found. Try a different search!</p>
            )}
          </div>
          <div className="shelf-line"></div>
          <div className="shelf-shadow"></div>
        </div>
      </div>

      {/* AI Recommendations Section (now encased in a Bootstrap card) */}
      <div className="card p-4 mb-5 shadow-sm">
        <h3 className="card-title mb-3">AI Book Recommendations</h3>
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Tell us your specific interests (e.g., 'fantasy with strong female leads', 'historical fiction set in Rome')"
            value={userPreferenceInput}
            onChange={(e) => setUserPreferenceInput(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleGetRecommendations} disabled={loadingAi}>
            {loadingAi ? 'Generating...' : 'Get Personalized Recommendations'}
          </button>
        </div>
        {loadingAi && <div className="text-center"><div className="spinner-border spinner-border-sm text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}
        {errorAi && <div className="alert alert-danger mt-2">{errorAi}</div>}
        {aiRecommendations && (
          <div className="card card-body mt-3">
            <h5>Recommendations for you:</h5>
            <div dangerouslySetInnerHTML={{ __html: aiRecommendations.replace(/\n/g, '<br>') }}></div>
          </div>
        )}
      </div>

      {selectedBookForModal && (
        <BookDetailModal book={selectedBookForModal} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default DashboardPage;