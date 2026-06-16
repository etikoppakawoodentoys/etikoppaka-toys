import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// LIVE MODE - Real payment processing
const RAZORPAY_KEY_ID = 'rzp_live_SnFBYmQC6vompt';
const RAZORPAY_KEY_SECRET = 'RVlGe2C3LGMasmEyJAgqGoPa';

serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { amount, currency, receipt } = await req.json();

    console.log('Creating LIVE Razorpay order:', { amount, currency, receipt });

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        receipt: receipt,
        payment_capture: 1,
        notes: {
          merchant_order_id: receipt,
          environment: 'production'
        },
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      console.error('Razorpay API error:', order);
      return new Response(JSON.stringify({ error: order.error?.description || 'Failed to create order' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    console.log('LIVE order created successfully:', order.id);

    return new Response(JSON.stringify(order), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Edge function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
});