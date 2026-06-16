// src/services/emailService.js

const SUPABASE_URL = 'https://lvyjklkfmdubtchealte.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2eWprbGtmbWR1YnRjaGVhbHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODkyMzMsImV4cCI6MjA5MzY2NTIzM30.Me8R7jjy3hi-IowCbpsMXIsuZMF3dXjWzJfT6HMo8ZI'

const callEmailFunction = async (type, to, data) => {
  try {
    console.log(`📧 Sending ${type} email to:`, to)
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, to, data }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error('Edge function error:', result)
      return false
    }
    
    console.log(`✅ Email sent successfully`)
    return true
  } catch (error) {
    console.error(`❌ Failed to send email:`, error)
    return false
  }
}

export const sendOrderConfirmation = async (orderDetails, customerEmail, customerName, options = {}) => {
  return callEmailFunction('order_confirmation', customerEmail, {
    orderNumber: orderDetails.order_number,
    customerName: customerName,
    totalAmount: orderDetails.total_amount,
    items: orderDetails.items,           // items now include gift_packing, gift_quote, gift_charge
    shippingAddress: orderDetails.shipping_address,
    paymentMethod: options.paymentMethod || 'COD',
    giftCharges: orderDetails.gift_charges || 0,  // total gift packing charge for this order
    deliveryCharge: options.deliveryCharge || 0, 
  })
}

export const sendOrderStatusUpdate = async (
  orderNumber, status, customerEmail, customerName,
  totalAmount, shippingAddress, oldStatus = null, trackingUrl = null
) => {
  return callEmailFunction('order_status_update', customerEmail, {
    orderNumber,
    status,
    customerName,
    totalAmount: totalAmount || 0,
    shippingAddress: shippingAddress || '',
    oldStatus,
    trackingUrl,
  })
}

export const sendAdminNotification = async (orderDetails, customerDetails) => {
  return callEmailFunction('admin_notification', 'etikoppakawoodentoys@gmail.com', {
    orderNumber: orderDetails.order_number,
    customerName: customerDetails.name,
    customerEmail: customerDetails.email,
    customerPhone: customerDetails.mobile,
    totalAmount: orderDetails.total_amount,
    items: orderDetails.items,           // items now include gift_packing, gift_quote, gift_charge
    shippingAddress: orderDetails.shipping_address,
    paymentMethod: customerDetails.paymentMethod || orderDetails.payment_method || 'COD',
    giftCharges: orderDetails.gift_charges || 0,
    deliveryCharge: orderDetails.delivery_charge || 0, 
  })
}

export const sendBulkOrderNotification = async (orderDetails, customerDetails) => {
  return callEmailFunction('bulk_order', customerDetails.email, {
    orderNumber: orderDetails.order_number,
    customerName: customerDetails.name,
    customerEmail: customerDetails.email,
    customerPhone: customerDetails.phone,
    companyName: orderDetails.company_name,
    gstNumber: orderDetails.gst_number,
    productInterest: orderDetails.product_interest,
    quantity: orderDetails.quantity,
    quantityUnit: orderDetails.quantity_unit,
    budgetRange: orderDetails.budget_range,
    expectedDeliveryDate: orderDetails.expected_delivery_date,
    additionalRequirements: orderDetails.additional_requirements,
    createdAt: orderDetails.created_at,
  })
}

export const sendEmailNotification = async (type, to, data) => {
  return callEmailFunction(type, to, data)
}