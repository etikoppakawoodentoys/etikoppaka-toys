import { supabase } from './supabase';

export const savePaymentDetails = async (orderId, paymentResponse) => {
  const { error } = await supabase
    .from('orders')
    .update({
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      payment_status: 'paid',
    })
    .eq('id', orderId);
  
  if (error) throw error;
  return { success: true };
};