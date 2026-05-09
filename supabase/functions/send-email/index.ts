import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = 're_a7oZPBsB_HK4BHwLTG87szattNV1182qi'
const FROM_EMAIL = 'noreply@etikoppakatoys.store'
const ADMIN_EMAIL = 'etikoppakawoodentoys@gmail.com'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const { type, to, data } = await req.json()

    console.log('=== Email Request ===')
    console.log('Type:', type)
    console.log('To:', to)
    console.log('Data:', JSON.stringify(data, null, 2))

    if (!to || !type) {
      throw new Error('Missing required fields')
    }

    let subject = ''
    let html = ''

    const colors = {
      primaryRed: '#9E1B1B',
      heritageGreen: '#1F5B3A',
      creamBg: '#F8F2E8',
      offWhite: '#FFF9F1',
      mutedGold: '#D8B36A',
      accentGold: '#C89B3C',
      textDark: '#3E2A1F',
      buttonHover: '#15452B'
    }

    const statusConfig: Record<string, { title: string; icon: string; color: string; message: string }> = {
      'accepted': { 
        title: 'Order Accepted', 
        icon: '✅', 
        color: '#10B981',
        message: 'Great news! Your order has been accepted and is being processed by our team.'
      },
      'shipped': { 
        title: 'Order Shipped', 
        icon: '📦', 
        color: '#3B82F6',
        message: 'Your order has been shipped and is on its way to you!'
      },
      'transit': { 
        title: 'In Transit', 
        icon: '🚚', 
        color: '#8B5CF6',
        message: 'Your order is in transit and will reach you soon.'
      },
      'out_for_delivery': { 
        title: 'Out for Delivery', 
        icon: '🚛', 
        color: '#EC4899',
        message: 'Your order is out for delivery! Get ready to receive your package today.'
      },
      'delivered': { 
        title: 'Order Delivered', 
        icon: '🎁', 
        color: '#059669',
        message: 'Your order has been delivered! We hope you love your traditional handcrafted toys.'
      },
      'cancelled': { 
        title: 'Order Cancelled', 
        icon: '❌', 
        color: '#EF4444',
        message: 'Your order has been cancelled. Please contact us for any questions.'
      }
    }

    const baseStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #F5F5F5; padding: 40px 20px; }
        .email-box { max-width: 560px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, ${colors.heritageGreen}, ${colors.buttonHover}); padding: 28px 24px; text-align: center; }
        .logo { font-size: 44px; margin-bottom: 8px; }
        .brand { font-size: 22px; font-weight: 700; color: white; letter-spacing: 0.5px; }
        .tagline { font-size: 10px; color: ${colors.mutedGold}; letter-spacing: 1.5px; margin-top: 4px; }
        .content { padding: 28px 24px; }
        .badge { display: inline-block; background: ${colors.creamBg}; padding: 5px 12px; border-radius: 50px; font-size: 11px; font-weight: 600; color: ${colors.primaryRed}; margin-bottom: 20px; border: 1px solid ${colors.mutedGold}; }
        .greeting { font-size: 22px; font-weight: 600; color: ${colors.textDark}; margin-bottom: 12px; }
        .greeting span { color: ${colors.primaryRed}; }
        .message { color: #666; line-height: 1.6; font-size: 14px; margin-bottom: 24px; }
        .card { background: ${colors.creamBg}; border-radius: 16px; padding: 20px; margin: 24px 0; border: 1px solid ${colors.mutedGold}; }
        .card-title { font-size: 15px; font-weight: 600; color: ${colors.textDark}; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid ${colors.mutedGold}; display: flex; align-items: center; gap: 8px; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(216,179,106,0.2); }
        .row:last-child { border-bottom: none; }
        .label { color: #888; font-size: 13px; }
        .value { font-weight: 600; color: ${colors.textDark}; font-size: 13px; }
        .item-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(216,179,106,0.15); }
        .item-name { font-size: 13px; color: ${colors.textDark}; flex: 2; }
        .item-qty { font-size: 13px; color: ${colors.accentGold}; flex: 1; text-align: center; }
        .item-price { font-size: 13px; font-weight: 600; color: ${colors.heritageGreen}; flex: 1; text-align: right; }
        .total { background: linear-gradient(135deg, ${colors.offWhite}, ${colors.creamBg}); border-radius: 12px; padding: 16px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; border: 1px solid ${colors.accentGold}40; }
        .total-label { font-size: 15px; font-weight: 600; color: ${colors.textDark}; }
        .total-amount { font-size: 22px; font-weight: 700; color: ${colors.primaryRed}; }
        .status-card { background: ${colors.creamBg}; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; border: 1px solid ${colors.mutedGold}; }
        .status-icon { font-size: 48px; margin-bottom: 12px; }
        .status-title { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
        .status-message { color: #666; font-size: 13px; }
        .handcrafted { text-align: center; margin: 24px 0; padding: 12px; background: ${colors.creamBg}; border-radius: 12px; border: 1px dashed ${colors.accentGold}; }
        .handcrafted-text { font-size: 11px; color: ${colors.accentGold}; letter-spacing: 1px; }
        .button { display: block; background: ${colors.heritageGreen}; color: white; text-align: center; padding: 12px 20px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 24px 0 16px; }
        .button:hover { background: ${colors.buttonHover}; }
        .footer { background: ${colors.textDark}; padding: 24px; text-align: center; }
        .footer-text { color: #B8A88A; font-size: 11px; line-height: 1.6; }
        hr { border: none; border-top: 1px solid rgba(216,179,106,0.15); margin: 16px 0; }
        @media (max-width: 600px) { .content { padding: 20px; } .greeting { font-size: 20px; } .total-amount { font-size: 20px; } }
      </style>
    `

    // BULK ORDER EMAIL - NEW
    if (type === 'bulk_order') {
      subject = `📦 New Bulk Order Inquiry #${data.orderNumber}`
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Bulk Order Inquiry</title>${baseStyles}</head>
        <body>
          <div class="email-box">
            <div class="header"><div class="logo">🏭</div><div class="brand">Etikoppaka Toys</div><div class="tagline">WHOLESALE • BULK • TRADE</div></div>
            <div class="content">
              <div class="badge">📦 BULK ORDER INQUIRY</div>
              <h1 class="greeting">Thank you, <span>${data.customerName}</span>!</h1>
              <p class="message">Your bulk order inquiry has been received. Our wholesale team will review your requirements and get back to you within 24 hours with a custom quote.</p>
              <div class="card">
                <div class="card-title">📋 Inquiry Summary</div>
                <div class="row"><span class="label">Inquiry Number</span><span class="value">#${data.orderNumber}</span></div>
                <div class="row"><span class="label">Date</span><span class="value">${new Date(data.createdAt).toLocaleDateString('en-IN')}</span></div>
                <div class="row"><span class="label">Product Interest</span><span class="value">${data.productInterest}</span></div>
                <div class="row"><span class="label">Quantity</span><span class="value">${data.quantity} ${data.quantityUnit}</span></div>
                ${data.budgetRange ? `<div class="row"><span class="label">Budget Range</span><span class="value">${data.budgetRange}</span></div>` : ''}
                ${data.expectedDeliveryDate ? `<div class="row"><span class="label">Expected Delivery</span><span class="value">${new Date(data.expectedDeliveryDate).toLocaleDateString('en-IN')}</span></div>` : ''}
              </div>
              ${data.additionalRequirements ? `
              <div class="card">
                <div class="card-title">📝 Additional Requirements</div>
                <p class="value" style="padding: 10px 0;">${data.additionalRequirements}</p>
              </div>
              ` : ''}
              <div class="handcrafted"><div class="handcrafted-text">✦ Minimum order quantity: 50 pieces per design ✦</div></div>
              <div class="handcrafted"><div class="handcrafted-text">🎯 Get up to 40% discount on bulk orders</div></div>
              <a href="https://etikoppakatoys.store/bulk-order" class="button">📞 Track Your Inquiry →</a>
            </div>
            <div class="footer"><div class="footer-text"><p>📍 Etikoppaka, Visakhapatnam, AP - 531082</p><p>📧 bulk@etikoppakatoys.com | 📞 +91 98765 43210</p><hr><p>© ${new Date().getFullYear()} Etikoppaka Toys. Preserving Indian Heritage.</p><p>🌿 Supporting local artisans • Eco-friendly • Natural dyes</p></div></div>
          </div>
        </body>
        </html>
      `
      
      // Send to customer
      const customerRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: to, subject: subject, html: emailHtml })
      })
      
      const customerResult = await customerRes.json()
      
      if (!customerRes.ok) {
        console.error('Customer email error:', customerResult)
      } else {
        console.log('Customer bulk order email sent:', customerResult.id)
      }
      
      // Send to admin
      const adminHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>New Bulk Order</title>${baseStyles}</head>
        <body>
          <div class="email-box">
            <div class="header"><div class="logo">🏭</div><div class="brand">Etikoppaka Toys</div><div class="tagline">ADMIN - BULK ORDER ALERT</div></div>
            <div class="content">
              <div class="badge">🆕 NEW BULK ORDER INQUIRY</div>
              <h1 class="greeting">Hello Admin,</h1>
              <p class="message">A new bulk order inquiry has been received. Please review the details below.</p>
              <div class="card">
                <div class="card-title">📋 Customer Details</div>
                <div class="row"><span class="label">Inquiry Number</span><span class="value">#${data.orderNumber}</span></div>
                <div class="row"><span class="label">Name</span><span class="value">${data.customerName}</span></div>
                <div class="row"><span class="label">Email</span><span class="value">${data.customerEmail}</span></div>
                <div class="row"><span class="label">Phone</span><span class="value">${data.customerPhone}</span></div>
                ${data.companyName ? `<div class="row"><span class="label">Company</span><span class="value">${data.companyName}</span></div>` : ''}
                ${data.gstNumber ? `<div class="row"><span class="label">GST Number</span><span class="value">${data.gstNumber}</span></div>` : ''}
              </div>
              <div class="card">
                <div class="card-title">📦 Order Requirements</div>
                <div class="row"><span class="label">Product Interest</span><span class="value">${data.productInterest}</span></div>
                <div class="row"><span class="label">Quantity</span><span class="value">${data.quantity} ${data.quantityUnit}</span></div>
                ${data.budgetRange ? `<div class="row"><span class="label">Budget Range</span><span class="value">${data.budgetRange}</span></div>` : ''}
                ${data.expectedDeliveryDate ? `<div class="row"><span class="label">Expected Delivery</span><span class="value">${new Date(data.expectedDeliveryDate).toLocaleDateString('en-IN')}</span></div>` : ''}
              </div>
              ${data.additionalRequirements ? `
              <div class="card">
                <div class="card-title">📝 Additional Requirements</div>
                <p class="value" style="padding: 10px 0;">${data.additionalRequirements}</p>
              </div>
              ` : ''}
              <a href="https://lvyjklkfmdubtchealte.supabase.co/project" class="button">📋 View in Admin Panel →</a>
            </div>
            <div class="footer"><div class="footer-text"><p>© ${new Date().getFullYear()} Etikoppaka Toys</p></div></div>
          </div>
        </body>
        </html>
      `
      
      const adminRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: ADMIN_EMAIL, subject: `🆕 New Bulk Order #${data.orderNumber}`, html: adminHtml })
      })
      
      const adminResult = await adminRes.json()
      console.log('Admin bulk order email sent:', adminResult.id)
      
      return new Response(JSON.stringify({ success: true, customerId: customerResult.id, adminId: adminResult.id }), {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
      })
    }
    
    // ORDER CONFIRMATION EMAIL (existing)
    else if (type === 'order_confirmation') {
      subject = `✨ Order Confirmed! #${data.orderNumber} ✨`
      
      let itemsHtml = ''
      if (data.items && data.items.length > 0) {
        itemsHtml = data.items.map((item: any) => `
          <div class="item-row">
            <span class="item-name">${item.product_name}</span>
            <span class="item-qty">x${item.quantity}</span>
            <span class="item-price">₹${item.price * item.quantity}</span>
          </div>
        `).join('')
      }
      
      const orderDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Order Confirmed</title>${baseStyles}</head>
        <body>
          <div class="email-box">
            <div class="header"><div class="logo">🎨</div><div class="brand">Etikoppaka Toys</div><div class="tagline">TRADITIONAL • HANDCRAFTED • HERITAGE</div></div>
            <div class="content">
              <div class="badge">✨ ORDER CONFIRMED ✨</div>
              <h1 class="greeting">Namaste, <span>${data.customerName}</span>! 🙏</h1>
              <p class="message">Thank you for choosing our traditional handcrafted toys. Your order has been confirmed and our artisans are preparing your treasures with love and care.</p>
              <div class="card">
                <div class="card-title">📜 Order Summary</div>
                <div class="row"><span class="label">Order Number</span><span class="value">#${data.orderNumber}</span></div>
                <div class="row"><span class="label">Order Date</span><span class="value">${orderDate}</span></div>
                <div class="row"><span class="label">Payment Method</span><span class="value">Cash on Delivery 💰</span></div>
                <div class="row"><span class="label">Shipping Address</span><span class="value">${data.shippingAddress || 'Address provided at checkout'}</span></div>
              </div>
              ${itemsHtml ? `<div class="card"><div class="card-title">📦 Order Items</div>${itemsHtml}</div>` : ''}
              <div class="total"><span class="total-label">Total Amount</span><span class="total-amount">₹${data.totalAmount || 0}</span></div>
              <div class="handcrafted"><div class="handcrafted-text">✦ Each piece is handcrafted with natural colors ✦</div></div>
              <a href="https://etikoppakatoys.store/orders" class="button">📦 Track Your Order →</a>
            </div>
            <div class="footer"><div class="footer-text"><p>📍 Etikoppaka, Visakhapatnam, AP - 531082</p><p>📧 orders@etikoppakatoys.store | 📞 +91 9154884214</p><hr><p>© ${new Date().getFullYear()} Etikoppaka Toys. Preserving Indian Heritage.</p><p>🌿 Supporting local artisans • Eco-friendly • Natural dyes</p></div></div>
          </div>
        </body>
        </html>
      `
      
      const customerRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: to, subject: subject, html: emailHtml })
      })
      
      const customerResult = await customerRes.json()
      
      const adminHtml = `
        <!DOCTYPE html><html><head><meta charset="UTF-8"><title>New Order</title>${baseStyles}</head>
        <body>
          <div class="email-box">
            <div class="header"><div class="logo">🎨</div><div class="brand">Etikoppaka Toys</div><div class="tagline">ADMIN NOTIFICATION</div></div>
            <div class="content">
              <div class="badge">🆕 NEW ORDER RECEIVED</div>
              <h1 class="greeting">Hello Admin,</h1>
              <p class="message">A new order has been placed. Please review and process it.</p>
              <div class="card">
                <div class="card-title">📜 Order Details</div>
                <div class="row"><span class="label">Order Number</span><span class="value">#${data.orderNumber}</span></div>
                <div class="row"><span class="label">Customer</span><span class="value">${data.customerName}</span></div>
                <div class="row"><span class="label">Email</span><span class="value">${to}</span></div>
                <div class="row"><span class="label">Total Amount</span><span class="value" style="color: ${colors.primaryRed};">₹${data.totalAmount || 0}</span></div>
                <div class="row"><span class="label">Shipping Address</span><span class="value">${data.shippingAddress || 'Address provided'}</span></div>
              </div>
              ${data.items && data.items.length > 0 ? `<div class="card"><div class="card-title">📦 Items Ordered</div>${data.items.map((item: any) => `<div class="row"><span>${item.product_name}</span><span>x${item.quantity} - ₹${item.price * item.quantity}</span></div>`).join('')}</div>` : ''}
              <a href="https://lvyjklkfmdubtchealte.supabase.co/project" class="button">📋 View in Admin Panel →</a>
            </div>
            <div class="footer"><div class="footer-text"><p>© ${new Date().getFullYear()} Etikoppaka Toys</p></div></div>
          </div>
        </body>
        </html>
      `
      
      const adminRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: ADMIN_EMAIL, subject: `🆕 New Order #${data.orderNumber}`, html: adminHtml })
      })
      
      const adminResult = await adminRes.json()
      
      return new Response(JSON.stringify({ success: true, customerId: customerResult.id, adminId: adminResult.id }), {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
      })
      
    } 
    // ORDER STATUS UPDATE EMAIL (existing)
    else if (type === 'order_status_update') {
      const config = statusConfig[data.status]
      if (!config) {
        throw new Error(`Unknown status: ${data.status}`)
      }
      
      subject = `📦 Order Update #${data.orderNumber} - ${config.title}`
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Order Update</title>${baseStyles}</head>
        <body>
          <div class="email-box">
            <div class="header"><div class="logo">🎨</div><div class="brand">Etikoppaka Toys</div><div class="tagline">TRADITIONAL • HANDCRAFTED • HERITAGE</div></div>
            <div class="content">
              <div class="badge">📦 ORDER UPDATE</div>
              <h1 class="greeting">Hello, <span>${data.customerName}</span></h1>
              <div class="status-card">
                <div class="status-icon">${config.icon}</div>
                <div class="status-title" style="color: ${config.color}">${config.title}</div>
                <div class="status-message">${config.message}</div>
              </div>
              <div class="card">
                <div class="card-title">📋 Order Details</div>
                <div class="row"><span class="label">Order Number</span><span class="value">#${data.orderNumber}</span></div>
                <div class="row"><span class="label">Total Amount</span><span class="value" style="color: ${colors.primaryRed};">₹${data.totalAmount || 0}</span></div>
                <div class="row"><span class="label">Shipping Address</span><span class="value">${data.shippingAddress || 'Address provided at checkout'}</span></div>
              </div>
              <div class="handcrafted"><div class="handcrafted-text">✦ Handcrafted with natural colors & sustainable wood ✦</div></div>
              <a href="https://etikoppakatoys.store/orders" class="button">📦 Track Your Order →</a>
            </div>
            <div class="footer"><div class="footer-text"><p>📍 Etikoppaka, Visakhapatnam, AP - 531082</p><p>📧 orders@etikoppakatoys.com | 📞 +91 9154884214</p><hr><p>© ${new Date().getFullYear()} Etikoppaka Toys</p></div></div>
          </div>
        </body>
        </html>
      `
      
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: to, subject: subject, html: emailHtml })
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.message)
      }
      
      return new Response(JSON.stringify({ success: true, id: result.id }), {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ error: 'Unknown email type' }), { status: 400 })
    
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    })
  }
})