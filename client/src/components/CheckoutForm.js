// client/src/components/CheckoutForm.js (confirm it matches previous code)
import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';

const CheckoutForm = ({ clearCart }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout-success`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred: " + error.message);
      }
      setIsLoading(false);
      console.error("Stripe confirmPayment error:", error);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage("Payment succeeded!");
      clearCart();
      navigate('/dashboard'); // This navigation should happen after Stripe confirms success
      setIsLoading(false);
    } else {
      setMessage("Payment processing, please wait or check your bank for authentication.");
      // Do NOT set isLoading to false here, as a redirect is expected via return_url
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <button disabled={isLoading || !stripe || !elements} id="submit" className="btn btn-primary mt-4 w-100">
        <span id="button-text">
          {isLoading ? <div className="spinner-border spinner-border-sm text-light" role="status"><span className="visually-hidden">Loading...</span></div> : "Pay now"}
        </span>
      </button>
      {message && <div id="payment-message" className="alert alert-info mt-3">{message}</div>}
    </form>
  );
};

export default CheckoutForm;