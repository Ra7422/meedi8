import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

// Inner component that uses Stripe hooks
function PaymentForm({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage('Processing payment...');

    // Confirm the PaymentIntent using the Payment Element
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription/success`,
      },
    });

    if (error) {
      // Payment failed
      setMessage(error.message);
      setIsProcessing(false);
      onError(error);
    } else {
      // Payment succeeded (will redirect to return_url)
      setMessage('Payment successful! Redirecting...');
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <PaymentElement
        options={{
          layout: 'tabs',
          defaultValues: {
            billingDetails: {
              email: '',
            }
          }
        }}
      />

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        style={{
          ...styles.submitButton,
          opacity: (isProcessing || !stripe || !elements) ? 0.6 : 1,
          cursor: (isProcessing || !stripe || !elements) ? 'not-allowed' : 'pointer',
        }}
      >
        {isProcessing ? 'Processing...' : 'Subscribe Now'}
      </button>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}
    </form>
  );
}

// Wrapper component that provides Stripe Elements context
export default function PaymentFormWrapper({ clientSecret, onSuccess, onError }) {
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
        <p>Loading payment options...</p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#7DD3C0',  // Your brand teal color
        colorBackground: '#ffffff',
        colorText: '#6750A4',
        borderRadius: '8px',
        fontFamily: "'Nunito', sans-serif",
      },
      rules: {
        '.Label': {
          fontWeight: '600',
          marginBottom: '8px',
        },
        '.Input': {
          padding: '12px',
          fontSize: '16px',
        },
        '.Tab': {
          borderRadius: '8px 8px 0 0',
        },
        '.Tab--selected': {
          borderColor: '#7DD3C0',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

const styles = {
  form: {
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto',
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    marginTop: '24px',
    background: 'linear-gradient(135deg, #7DD3C0 0%, #6AB8A8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontFamily: "'Nunito', sans-serif",
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(125, 211, 192, 0.3)',
    transition: 'all 0.2s',
  },
  message: {
    marginTop: '16px',
    padding: '12px',
    background: '#E8F9F5',
    borderRadius: '8px',
    color: '#1F7A5C',
    textAlign: 'center',
    fontFamily: "'Nunito', sans-serif",
    fontSize: '14px',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
    fontFamily: "'Nunito', sans-serif",
  },
  error: {
    padding: '40px',
    textAlign: 'center',
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    borderRadius: '8px',
    fontFamily: "'Nunito', sans-serif",
  },
};
