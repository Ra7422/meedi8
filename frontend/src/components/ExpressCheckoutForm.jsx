import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

// Inner component that uses Stripe hooks
function ExpressCheckoutForm({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async (event) => {
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage('Processing payment...');

    // Confirm the PaymentIntent using details collected by Express Checkout
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

  const handleReady = (event) => {
    // Check which payment methods are available
    if (event.availablePaymentMethods) {
      console.log('Available payment methods:', event.availablePaymentMethods);
    }
  };

  const handleClick = (event) => {
    // User clicked Express Checkout button
    console.log('Express checkout clicked:', event.expressPaymentType);

    // CRITICAL: Must call resolve() within 1 second or Stripe times out
    event.resolve();
  };

  return (
    <div style={styles.container}>
      <ExpressCheckoutElement
        onConfirm={handleConfirm}
        onReady={handleReady}
        onClick={handleClick}
        options={{
          buttonType: {
            applePay: 'subscribe',    // Shows "Subscribe with Apple Pay"
            googlePay: 'subscribe',   // Shows "Subscribe with Google Pay"
          },
          layout: {
            maxColumns: 1,
            maxRows: 3,
            overflow: 'auto',
          },
        }}
      />

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      {isProcessing && (
        <div style={styles.processing}>
          <div style={styles.spinner} />
        </div>
      )}
    </div>
  );
}

// Wrapper component that provides Stripe Elements context
export default function ExpressCheckoutFormWrapper({ clientSecret, onSuccess, onError }) {
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
        borderRadius: '12px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <ExpressCheckoutForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    position: 'relative',
  },
  message: {
    marginTop: '20px',
    padding: '12px',
    background: '#E8F9F5',
    borderRadius: '8px',
    color: '#1F7A5C',
    textAlign: 'center',
    fontFamily: "'Nunito', sans-serif",
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
  processing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #7DD3C0',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};
