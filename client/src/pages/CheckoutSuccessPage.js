// client/src/pages/CheckoutSuccessPage.js
import React, { useState, useEffect, useContext } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { useLocation, useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';
import api from '../api'; // <-- ENSURE THIS IS IMPORTED

const CheckoutSuccessPage = () => {
  const stripe = useStripe();
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);

  const [message, setMessage] = useState('Verifying payment...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      setMessage('Payment verification failed: No client secret found.');
      setLoading(false);
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(async ({ paymentIntent }) => { // Make this async
      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('Payment Succeeded! Your books are ready. An email confirmation has been sent.');
          clearCart(); // Clear cart only on success

          // NEW: Call backend to confirm purchase and send email
          if (paymentIntent.metadata && paymentIntent.metadata.items) {
              try {
                  // Metadata comes as a string, parse it
                  const purchasedItems = JSON.parse(paymentIntent.metadata.items);
                  // This assumes your createPaymentIntent added relevant book data to metadata
                  // e.g., in stripeController.js, when creating PaymentIntent, add:
                  // metadata: { items: JSON.stringify(cart.map(item => ({ id: item.book_id, title: item.title, author: item.author })))}
                  // You'll need to adapt this based on what's truly in your metadata
                  const firstItem = purchasedItems[0]; // For simplicity, assume single book or iterate if multiple
                  await api.post('/books/purchase-confirm', {
                      paymentIntentId: paymentIntent.id,
                      book_id_in_db: firstItem.id, // Assuming 'id' in metadata corresponds to book_id_in_db
                      title: firstItem.title,
                      author: firstItem.author || 'Unknown Author' // Ensure author is passed
                  });
                  console.log("Purchase confirmed with backend and email triggered.");
              } catch (backendError) {
                  console.error("Error confirming purchase with backend or sending email:", backendError);
                  setMessage(prev => prev + " (But there was an error updating your library and sending email.)");
              }
          }
          break;
        case 'processing':
          setMessage('Your payment is processing.');
          break;
        case 'requires_payment_method':
          setMessage('Your payment was not successful, please try again.');
          break;
        default:
          setMessage('Something went wrong.');
          break;
      }
      setLoading(false);
    }).catch(error => {
        console.error("Error retrieving payment intent:", error);
        setMessage('Error verifying payment. Please contact support if problem persists.');
        setLoading(false);
    });
  }, [stripe, location, clearCart]); 

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container mt-5">
      <div className="card p-4 shadow-sm text-center">
        <h2 className="card-title mb-3">Payment Status</h2>
        {loading ? (
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        ) : (
          <>
            <p className="lead">{message}</p>
            <button className="btn btn-primary mt-3" onClick={handleGoToDashboard}>
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;