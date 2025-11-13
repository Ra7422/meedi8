import React, { useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout as StripeEmbeddedCheckout,
} from '@stripe/react-stripe-js';

// Initialize Stripe with publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

export default function EmbeddedCheckout({ clientSecret, onComplete }) {
  const options = {
    clientSecret,
    onComplete,
  };

  if (!stripePromise) {
    return (
      <div style={styles.error}>
        <h3>Stripe is not configured</h3>
        <p>Please add VITE_STRIPE_PUBLISHABLE_KEY to your environment variables.</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div style={styles.loading}>
        <p>Initializing checkout...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <StripeEmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
  },
  error: {
    padding: '40px',
    textAlign: 'center',
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    borderRadius: '8px',
  },
};
