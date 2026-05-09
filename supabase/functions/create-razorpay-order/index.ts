import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RAZORPAY_KEY_ID = 'rzp_test_SnBlDP2IEuNUzl';
const RAZORPAY_KEY_SECRET = 'mM0gT8rzv5e1RG0IAKNHlvOY';

serve(async (req: Request) => {
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

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency: currency,
        receipt: receipt,
        payment_capture: 1,
      }),
    });

    const order = await response.json();

    return new Response(JSON.stringify(order), {
      status: response.ok ? 200 : 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
});