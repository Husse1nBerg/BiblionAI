// client/src/pages/CheckoutPage.js
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import CartContext from '../context/CartContext';
import api from '../api';

// IMPORTANT: Load Stripe using the REACT_APP_ prefix
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutPage = () => {
  const { cart, clearCart } = useContext(CartContext);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart'); // Redirect if cart is empty
      return;
    }

    const createPaymentIntent = async () => {
      setLoading(true);
      setError('');
      try {
        const totalAmount = cart.reduce((sum, item) => sum + (item.price || 500) * item.quantity, 0);

        const response = await api.post('/stripe/create-payment-intent', {
          items: cart.map(item => ({
            book_id: item.book_id,
            quantity: item.quantity,
            price: item.price || 500
          })),
          amount: totalAmount,
          currency: 'usd'
        });
        setClientSecret(response.data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to initiate payment. Please check console for details.');
      } finally {
        setLoading(false);
      }
    };

    // ONLY create payment intent if clientSecret is null (i.e., first load or reset)
    if (!clientSecret) {
      createPaymentIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, navigate]); // clientSecret is in the dependency array to react if it unexpectedly becomes null

  // Use useMemo to memoize options, preventing unnecessary re-renders of Elements
  const options = useMemo(() => ({
    clientSecret,
    appearance: {
      theme: 'stripe',
      labels: 'floating' // Example for a nice UI touch
    },
  }), [clientSecret]); // Only re-create options if clientSecret changes

  if (loading) return <div className="text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!clientSecret) return <div className="alert alert-warning">Payment form not ready. Please try again.</div>; // This should ideally not be hit if loading is false

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <h2 className="mb-4">Complete Your Purchase</h2>
        <p className="lead">Total: ${ (cart.reduce((sum, item) => sum + (item.price || 500) * item.quantity, 0) / 100).toFixed(2) }</p>

        {/* Render Elements ONLY when clientSecret is available and stable */}
        {clientSecret && (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm clearCart={clearCart} />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;