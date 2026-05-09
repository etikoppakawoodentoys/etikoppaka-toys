// src/services/razorpayService.js

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const createRazorpayOrder = async (amount, orderId) => {
  const SUPABASE_URL = 'https://lvyjklkfmdubtchealte.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2eWprbGtmbWR1YnRjaGVhbHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODkyMzMsImV4cCI6MjA5MzY2NTIzM30.Me8R7jjy3hi-IowCbpsMXIsuZMF3dXjWzJfT6HMo8ZI';
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: orderId,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to create order');
  return data;
};

// ADD THIS FUNCTION - It was missing!
export const openRazorpayCheckout = (options) => {
  if (!window.Razorpay) {
    console.error('Razorpay SDK not loaded');
    throw new Error('Razorpay SDK not loaded. Please refresh the page.');
  }
  
  const rzp = new window.Razorpay(options);
  
  rzp.on('payment.failed', (response) => {
    console.error('Payment failed:', response.error);
    if (options.modal?.ondismiss) {
      options.modal.ondismiss();
    }
  });
  
  rzp.open();
  
  return rzp;
};