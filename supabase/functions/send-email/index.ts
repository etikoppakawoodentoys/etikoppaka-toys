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

    if (!to || !type) throw new Error('Missing required fields')

    const sendEmail = async (emailTo: string, emailSubject: string, emailHtml: string) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: emailTo,
          subject: emailSubject,
          html: emailHtml,
        }),
      })
      return await response.json()
    }

    const getProfessionalTemplate = (title: string, content: string, statusColor: string = '#1F5B3A') => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Etikoppaka Toys</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #F8F2E8; margin: 0; padding: 20px; line-height: 1.5; }
          .email-container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
          .email-header { background: linear-gradient(135deg, #1F5B3A 0%, #15452B 100%); padding: 24px; text-align: center; }
          .brand { font-size: 22px; font-weight: 700; color: white; letter-spacing: 0.5px; }
          .tagline { font-size: 11px; color: #D9B382; margin-top: 6px; letter-spacing: 0.5px; }
          .status-banner { background: ${statusColor}; color: white; text-align: center; padding: 12px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
          .email-body { padding: 28px 24px; }
          .greeting { font-size: 20px; font-weight: 600; color: #3E2A1F; margin-bottom: 12px; }
          .greeting span { color: #9E1B1B; }
          .message-text { color: #5C4B3A; line-height: 1.6; margin-bottom: 24px; font-size: 14px; }
          .info-card { background: #F8F2E8; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #E8DCC8; }
          .info-title { font-size: 14px; font-weight: 600; color: #3E2A1F; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #D9B382; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E8DCC8; font-size: 13px; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #7A6B5A; }
          .info-value { font-weight: 600; color: #3E2A1F; }
          .free-delivery { color: #10B981; font-weight: 600; }
          .paid-delivery { color: #D97706; font-weight: 600; }
          .update-detail { background: #FFF9F1; border-left: 4px solid #D9B382; padding: 12px; margin: 12px 0; border-radius: 6px; }
          .update-detail p { margin: 6px 0; font-size: 13px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          .items-table th { text-align: left; padding: 10px 0; color: #7A6B5A; font-weight: 500; font-size: 12px; border-bottom: 1px solid #E8DCC8; }
          .items-table td { padding: 10px 0; border-bottom: 1px solid #E8DCC8; font-size: 13px; vertical-align: top; }
          .gift-row { background: #FFFDF0; }
          .gift-badge { display: inline-block; background: #FEF3C7; color: #C89B3C; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: 4px; }
          .gift-message { font-size: 11px; color: #7A6B5A; font-style: italic; margin-top: 3px; }
          .gift-box { background: #FFFDF0; border: 1.5px dashed #C89B3C; border-radius: 8px; padding: 12px 16px; margin: 12px 0; }
          .gift-box-title { font-size: 13px; font-weight: 700; color: #C89B3C; margin-bottom: 8px; }
          .gift-box-item { font-size: 12px; padding: 4px 0; border-bottom: 1px solid #F5E6B8; color: #5C4B3A; }
          .gift-box-item:last-child { border-bottom: none; }
          .total-row { display: flex; justify-content: space-between; padding: 16px 0 8px; border-top: 2px solid #E8DCC8; margin-top: 8px; font-weight: 700; font-size: 16px; }
          .total-amount { color: #9E1B1B; }
          .action-button { display: inline-block; background: #1F5B3A; color: white; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: 600; font-size: 14px; margin: 16px 0 8px; }
          .handcrafted-note { text-align: center; margin: 24px 0 16px; padding: 12px; background: #F8F2E8; border-radius: 10px; font-size: 11px; color: #C89B3C; border: 1px dashed #D9B382; }
          .email-footer { background: #3E2A1F; padding: 20px; text-align: center; }
          .footer-text { color: #B8A88A; font-size: 11px; line-height: 1.5; }
          .footer-text p { margin: 4px 0; }
          hr { border: none; border-top: 1px solid rgba(216,179,106,0.2); margin: 12px 0; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <div class="brand">Etikoppaka Toys</div>
            <div class="tagline">TRADITIONAL • HANDCRAFTED • HERITAGE</div>
          </div>
          <div class="status-banner">${title}</div>
          <div class="email-body">
            ${content}
            <div class="handcrafted-note">
              ✨ Each piece is handcrafted with natural colors and sustainable wood ✨
            </div>
          </div>
          <div class="email-footer">
            <div class="footer-text">
              <p>📍 Etikoppaka, Visakhapatnam, Andhra Pradesh - 531082</p>
              <p>📞 +91 9154884214 | 📧 orders@etikoppakatoys.store</p>
              <hr>
              <p>© ${new Date().getFullYear()} Etikoppaka Toys. Preserving Indian Heritage.</p>
              <p>🌿 Eco-friendly • Non-toxic dyes • GI Tagged</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // ── Helper: build items table HTML (shared by order_confirmation & admin_notification) ──
    const buildItemsTable = (items: any[]) => {
      if (!items || items.length === 0) return ''

      let rows = ''
      let subtotal = 0

      items.forEach((item: any) => {
        const baseTotal = item.price * item.quantity
        const giftCharge = item.gift_packing ? (item.gift_charge || 50) : 0
        const lineTotal = baseTotal + giftCharge
        subtotal += lineTotal

        rows += `
          <tr class="${item.gift_packing ? 'gift-row' : ''}">
            <td>
              <strong>${item.product_name}</strong>
              ${item.gift_packing ? '<span class="gift-badge">🎁 Gift</span>' : ''}
              ${item.item_type === 'hamper' ? '<span class="gift-badge">🎁 Hamper</span>' : ''}
              ${item.gift_packing && item.gift_quote
                ? `<div class="gift-message">"${item.gift_quote}"</div>`
                : item.gift_packing
                  ? '<div class="gift-message"><em>No gift message</em></div>'
                  : ''
              }
            </td>
            <td>x${item.quantity}</td>
            <td>₹${item.price}${item.gift_packing ? `<br><small style="color:#C89B3C;">+₹${giftCharge} gift</small>` : ''}</td>
            <td style="font-weight:600;">₹${lineTotal}</td>
          </tr>
        `
      })

      return `
        <table class="items-table">
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `
    }

    // ── Helper: build gift messages summary box ──────────────────────────────
    const buildGiftBox = (items: any[]) => {
      if (!items) return ''
      const giftItems = items.filter(i => i.gift_packing && i.item_type !== 'hamper')
      if (giftItems.length === 0) return ''

      const rows = giftItems.map(i => `
        <div class="gift-box-item">
          <strong>${i.product_name}</strong> —
          ${i.gift_quote ? `"${i.gift_quote}"` : '<em>No gift message</em>'}
          <span style="float:right;color:#1F5B3A;font-weight:600;">+₹${i.gift_charge || 50}</span>
        </div>
      `).join('')

      return `
        <div class="gift-box">
          <div class="gift-box-title">🎁 Gift Packing Details</div>
          ${rows}
        </div>
      `
    }

    // ── ORDER CONFIRMATION ───────────────────────────────────────────────────
    if (type === 'order_confirmation') {
      const statusColor = '#10B981'
      const title = '✅ ORDER CONFIRMED'
      const subject = `✨ Order Confirmed! #${data.orderNumber} ✨`

      const paymentMethod = data.paymentMethod || 'COD'
      const isPrepaid = paymentMethod === 'RAZORPAY' || paymentMethod === 'PREPAID'
      const giftCharges = data.giftCharges || 0
      const deliveryCharge = data.deliveryCharge || 0
      const subtotal = (data.totalAmount || 0) - giftCharges - deliveryCharge

      const paymentHtml = isPrepaid ? `
        <div class="update-detail" style="border-left-color: #10B981;">
          <p><strong>💳 Payment Status:</strong> PAID via Razorpay</p>
          <p>Your payment has been successfully processed. Order confirmed and will be processed immediately.</p>
        </div>
      ` : `
        <div class="update-detail" style="border-left-color: #F59E0B;">
          <p><strong>💰 Payment Method:</strong> Cash on Delivery</p>
          <p><strong>Payment Terms:</strong> 50% advance required to confirm order. Our team will call you within 24 hours to share payment details.</p>
          <p><strong>Balance 50%:</strong> Payable at the time of delivery (cash/card/UPI)</p>
        </div>
      `

      const itemsHtml = buildItemsTable(data.items)
      const giftBoxHtml = buildGiftBox(data.items)
      const totalAmount = data.totalAmount || 0

      const content = `
        <div class="greeting">Namaste, <span>${data.customerName}</span>! 🙏</div>
        <p class="message-text">Thank you for choosing our traditional handcrafted toys. Your order has been confirmed successfully.</p>

        <div class="info-card">
          <div class="info-title">📋 ORDER SUMMARY</div>
          <div class="info-row"><span class="info-label">Order Number</span><span class="info-value">#${data.orderNumber}</span></div>
          <div class="info-row"><span class="info-label">Order Date</span><span class="info-value">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
          <div class="info-row"><span class="info-label">Payment Method</span><span class="info-value">${isPrepaid ? '💳 Online Payment (Prepaid)' : '💰 Cash on Delivery'}</span></div>
          <div class="info-row"><span class="info-label">Subtotal</span><span class="info-value">₹${subtotal}</span></div>
          ${giftCharges > 0 ? `<div class="info-row"><span class="info-label">🎁 Gift Packing</span><span class="info-value" style="color:#C89B3C;">+₹${giftCharges}</span></div>` : ''}
          <div class="info-row"><span class="info-label">🚚 Delivery Fee</span><span class="info-value ${deliveryCharge === 0 ? 'free-delivery' : 'paid-delivery'}">${deliveryCharge === 0 ? 'FREE' : `+₹${deliveryCharge}`}</span></div>
          <div class="info-row"><span class="info-label">Total Amount</span><span class="info-value" style="color:#9E1B1B;">₹${totalAmount}</span></div>
          <div class="info-row"><span class="info-label">Shipping Address</span><span class="info-value">${data.shippingAddress || 'Address provided at checkout'}</span></div>
        </div>

        ${paymentHtml}

        ${itemsHtml ? `<div class="info-card"><div class="info-title">📦 ORDER ITEMS</div>${itemsHtml}</div>` : ''}

        ${giftBoxHtml}

        <div class="total-row">
          <span>Total Amount</span>
          <span class="total-amount">₹${totalAmount}</span>
        </div>

        ${deliveryCharge > 0 && totalAmount >= 499 ? `
        <div class="update-detail" style="border-left-color: #10B981; margin-top: 16px;">
          <p><strong>🎉 Free Delivery Unlocked!</strong></p>
          <p>Your order qualified for free delivery. No delivery charges applied.</p>
        </div>
        ` : deliveryCharge > 0 ? `
        <div class="update-detail" style="border-left-color: #F59E0B; margin-top: 16px;">
          <p><strong>🚚 Delivery Information</strong></p>
          <p>Delivery charge of ₹${deliveryCharge} applies. Add ₹${499 - (totalAmount - deliveryCharge - giftCharges)} more for free delivery on your next order.</p>
        </div>
        ` : ''}

        <div style="text-align: center;">
          <a href="https://etikoppakatoys.store/orders" class="action-button">📦 Track Your Order →</a>
        </div>
      `

      await sendEmail(to, subject, getProfessionalTemplate(title, content, statusColor))

      // Admin copy
      const adminContent = `
        <div class="greeting">Hello Admin,</div>
        <p class="message-text">A new order has been placed. Please review and process it.</p>

        <div class="info-card">
          <div class="info-title">📋 ORDER DETAILS</div>
          <div class="info-row"><span class="info-label">Order Number</span><span class="info-value">#${data.orderNumber}</span></div>
          <div class="info-row"><span class="info-label">Customer</span><span class="info-value">${data.customerName}</span></div>
          <div class="info-row"><span class="info-label">Email</span><span class="info-value">${to}</span></div>
          <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${data.customerPhone || 'Not provided'}</span></div>
          <div class="info-row"><span class="info-label">Payment Method</span><span class="info-value">${isPrepaid ? '💳 Prepaid (Razorpay)' : '💰 Cash on Delivery'}</span></div>
          <div class="info-row"><span class="info-label">Subtotal</span><span class="info-value">₹${subtotal}</span></div>
          ${giftCharges > 0 ? `<div class="info-row"><span class="info-label">🎁 Gift Packing</span><span class="info-value" style="color:#C89B3C;">+₹${giftCharges}</span></div>` : ''}
          <div class="info-row"><span class="info-label">🚚 Delivery Fee</span><span class="info-value ${deliveryCharge === 0 ? 'free-delivery' : 'paid-delivery'}">${deliveryCharge === 0 ? 'FREE' : `+₹${deliveryCharge}`}</span></div>
          <div class="info-row"><span class="info-label">Total Amount</span><span class="info-value" style="color:#9E1B1B;">₹${totalAmount}</span></div>
          <div class="info-row"><span class="info-label">Shipping Address</span><span class="info-value">${data.shippingAddress || 'Address provided'}</span></div>
        </div>

        ${itemsHtml ? `<div class="info-card"><div class="info-title">📦 ORDER ITEMS</div>${itemsHtml}</div>` : ''}
        ${giftBoxHtml}

        <div style="text-align: center;">
          <a href="https://etikoppakatoys.store/admin" class="action-button">📋 View in Admin Panel →</a>
        </div>
      `

      await sendEmail(ADMIN_EMAIL, `🆕 New Order #${data.orderNumber}`, getProfessionalTemplate('🆕 NEW ORDER RECEIVED', adminContent, '#EC4899'))

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    // ── ORDER STATUS UPDATE ──────────────────────────────────────────────────
    if (type === 'order_status_update') {
      const statusMap: Record<string, { title: string; message: string; icon: string; color: string; nextSteps: string }> = {
        'accepted': {
          title: 'ORDER ACCEPTED', message: 'Your order has been accepted by our team and is now being processed.',
          icon: '✅', color: '#10B981', nextSteps: 'Our artisans will begin crafting your traditional toys. Production will take 2-3 days.'
        },
        'shipped': {
          title: 'ORDER SHIPPED', message: 'Great news! Your order has been shipped and is on its way to you.',
          icon: '📦', color: '#3B82F6', nextSteps: 'You can track your shipment using the tracking link below. Delivery expected in 3-7 business days.'
        },
        'transit': {
          title: 'IN TRANSIT', message: 'Your order is currently in transit and moving through our logistics network.',
          icon: '🚚', color: '#8B5CF6', nextSteps: 'Your package is on schedule. Check tracking for real-time location updates.'
        },
        'out_for_delivery': {
          title: 'OUT FOR DELIVERY', message: 'Your order is out for delivery! Get ready to receive your package today.',
          icon: '🚛', color: '#EC4899', nextSteps: 'Please keep your phone handy. The delivery agent will call before arriving.'
        },
        'delivered': {
          title: 'ORDER DELIVERED', message: 'Your order has been successfully delivered. We hope you love your traditional handcrafted toys!',
          icon: '🎁', color: '#059669', nextSteps: 'Enjoy your Etikoppaka toys! Share your experience with a review.'
        },
        'cancelled': {
          title: 'ORDER CANCELLED', message: 'Your order has been cancelled as requested. If you have paid online, refund will be processed within 5-7 business days.',
          icon: '❌', color: '#EF4444', nextSteps: 'If you have any questions, please contact our support team.'
        }
      }

      const statusInfo = statusMap[data.status] || {
        title: 'ORDER UPDATED', message: 'Your order status has been updated.',
        icon: '📋', color: '#1F5B3A', nextSteps: 'Check your order details below for more information.'
      }

      const statusTitle = `${statusInfo.icon} ${statusInfo.title}`
      const subject = `📦 Order Update #${data.orderNumber} - ${statusInfo.title.replace(/_/g, ' ')}`

      const statusChangedHtml = data.oldStatus ? `
        <div class="update-detail" style="border-left-color: ${statusInfo.color};">
          <p><strong>📊 Status Changed:</strong></p>
          <p>From: <span style="color:#7A6B5A;">${data.oldStatus.toUpperCase().replace(/_/g, ' ')}</span> → To: <strong style="color:${statusInfo.color};">${statusInfo.title}</strong></p>
        </div>
      ` : ''

      const content = `
        <div class="greeting">Hello, <span>${data.customerName}</span></div>
        <p class="message-text">${statusInfo.message}</p>

        ${statusChangedHtml}

        <div class="update-detail" style="border-left-color: ${statusInfo.color};">
          <p><strong>📋 What This Means:</strong></p>
          <p>${statusInfo.nextSteps}</p>
        </div>

        <div class="info-card">
          <div class="info-title">📦 ORDER DETAILS</div>
          <div class="info-row"><span class="info-label">Order Number</span><span class="info-value">#${data.orderNumber}</span></div>
          <div class="info-row"><span class="info-label">Current Status</span><span class="info-value" style="color:${statusInfo.color};">${statusInfo.title}</span></div>
          <div class="info-row"><span class="info-label">Total Amount</span><span class="info-value">₹${data.totalAmount || 0}</span></div>
          <div class="info-row"><span class="info-label">Shipping Address</span><span class="info-value">${data.shippingAddress || 'Address provided at checkout'}</span></div>
        </div>

        ${data.trackingUrl ? `
        <div class="update-detail" style="border-left-color: #3B82F6;">
          <p><strong>🔗 Track Your Shipment:</strong></p>
          <p><a href="${data.trackingUrl}" style="color:#1F5B3A;">${data.trackingUrl}</a></p>
        </div>
        ` : ''}

        <div style="text-align: center;">
          <a href="https://etikoppakatoys.store/orders" class="action-button">📦 Track Your Order →</a>
        </div>
      `

      await sendEmail(to, subject, getProfessionalTemplate(statusTitle, content, statusInfo.color))

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    // ── ADMIN NOTIFICATION ───────────────────────────────────────────────────
    if (type === 'admin_notification') {
      const isPrepaid = data.paymentMethod === 'RAZORPAY' || data.paymentMethod === 'PREPAID'
      const giftCharges = data.giftCharges || 0
      const deliveryCharge = data.deliveryCharge || 0
      const subtotal = (data.totalAmount || 0) - giftCharges - deliveryCharge

      const itemsHtml = buildItemsTable(data.items)
      const giftBoxHtml = buildGiftBox(data.items)

      const content = `
        <div class="greeting">Hello Admin,</div>
        <p class="message-text">A new order has been placed.</p>

        <div class="info-card">
          <div class="info-title">📋 ORDER DETAILS</div>
          <div class="info-row"><span class="info-label">Order Number</span><span class="info-value">#${data.orderNumber}</span></div>
          <div class="info-row"><span class="info-label">Customer</span><span class="info-value">${data.customerName}</span></div>
          <div class="info-row"><span class="info-label">Email</span><span class="info-value">${data.customerEmail}</span></div>
          <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${data.customerPhone || 'Not provided'}</span></div>
          <div class="info-row"><span class="info-label">Payment Method</span><span class="info-value">${isPrepaid ? '💳 Prepaid (Razorpay)' : '💰 Cash on Delivery'}</span></div>
          <div class="info-row"><span class="info-label">Subtotal</span><span class="info-value">₹${subtotal}</span></div>
          ${giftCharges > 0 ? `<div class="info-row"><span class="info-label">🎁 Gift Packing</span><span class="info-value" style="color:#C89B3C;">+₹${giftCharges}</span></div>` : ''}
          <div class="info-row"><span class="info-label">🚚 Delivery Fee</span><span class="info-value ${deliveryCharge === 0 ? 'free-delivery' : 'paid-delivery'}">${deliveryCharge === 0 ? 'FREE' : `+₹${deliveryCharge}`}</span></div>
          <div class="info-row"><span class="info-label">Total Amount</span><span class="info-value" style="color:#9E1B1B;">₹${data.totalAmount}</span></div>
          <div class="info-row"><span class="info-label">Shipping Address</span><span class="info-value">${data.shippingAddress}</span></div>
        </div>

        ${itemsHtml ? `<div class="info-card"><div class="info-title">📦 ORDER ITEMS</div>${itemsHtml}</div>` : ''}
        ${giftBoxHtml}

        <div style="text-align: center;">
          <a href="https://etikoppakatoys.store/admin" class="action-button">📋 View in Admin Panel →</a>
        </div>
      `

      await sendEmail(ADMIN_EMAIL, `🆕 New Order #${data.orderNumber}`, getProfessionalTemplate('🆕 NEW ORDER RECEIVED', content, '#EC4899'))

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    // ── BULK ORDER ───────────────────────────────────────────────────────────
    if (type === 'bulk_order') {
      const statusColor = '#8B5CF6'
      const title = '📦 BULK ORDER INQUIRY'
      const subject = `📦 Bulk Order Inquiry #${data.orderNumber}`

      const content = `
        <div class="greeting">Thank you, <span>${data.customerName}</span>!</div>
        <p class="message-text">Your bulk order inquiry has been received. Our wholesale team will review your requirements and get back to you within 24 hours with a custom quote.</p>

        <div class="info-card">
          <div class="info-title">📋 INQUIRY SUMMARY</div>
          <div class="info-row"><span class="info-label">Inquiry Number</span><span class="info-value">#${data.orderNumber}</span></div>
          <div class="info-row"><span class="info-label">Date</span><span class="info-value">${new Date(data.createdAt).toLocaleDateString('en-IN')}</span></div>
          <div class="info-row"><span class="info-label">Product Interest</span><span class="info-value">${data.productInterest}</span></div>
          <div class="info-row"><span class="info-label">Quantity</span><span class="info-value">${data.quantity} ${data.quantityUnit}</span></div>
          ${data.budgetRange ? `<div class="info-row"><span class="info-label">Budget Range</span><span class="info-value">${data.budgetRange}</span></div>` : ''}
          ${data.expectedDeliveryDate ? `<div class="info-row"><span class="info-label">Expected Delivery</span><span class="info-value">${new Date(data.expectedDeliveryDate).toLocaleDateString('en-IN')}</span></div>` : ''}
        </div>

        ${data.additionalRequirements ? `
        <div class="info-card">
          <div class="info-title">📝 ADDITIONAL REQUIREMENTS</div>
          <div class="info-row">${data.additionalRequirements}</div>
        </div>
        ` : ''}

        <div class="update-detail" style="border-left-color: #8B5CF6;">
          <p><strong>🎯 Next Steps:</strong></p>
          <p>• Minimum order quantity: 50 pieces per design</p>
          <p>• Custom quote will be shared within 24 hours</p>
          <p>• Get up to 40% discount on bulk orders</p>
        </div>

        <div style="text-align: center;">
          <a href="https://etikoppakatoys.store/bulk-order" class="action-button">📞 Track Your Inquiry →</a>
        </div>
      `

      await sendEmail(to, subject, getProfessionalTemplate(title, content, statusColor))

      const adminContent = `
        <div class="greeting">Hello Admin,</div>
        <p class="message-text">A new bulk order inquiry has been received.</p>

        <div class="info-card">
          <div class="info-title">📋 CUSTOMER DETAILS</div>
          <div class="info-row"><span class="info-label">Inquiry Number</span><span class="info-value">#${data.orderNumber}</span></div>
          <div class="info-row"><span class="info-label">Name</span><span class="info-value">${data.customerName}</span></div>
          <div class="info-row"><span class="info-label">Email</span><span class="info-value">${data.customerEmail}</span></div>
          <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${data.customerPhone}</span></div>
          ${data.companyName ? `<div class="info-row"><span class="info-label">Company</span><span class="info-value">${data.companyName}</span></div>` : ''}
        </div>

        <div class="info-card">
          <div class="info-title">📦 ORDER REQUIREMENTS</div>
          <div class="info-row"><span class="info-label">Product Interest</span><span class="info-value">${data.productInterest}</span></div>
          <div class="info-row"><span class="info-label">Quantity</span><span class="info-value">${data.quantity} ${data.quantityUnit}</span></div>
          ${data.budgetRange ? `<div class="info-row"><span class="info-label">Budget</span><span class="info-value">${data.budgetRange}</span></div>` : ''}
        </div>

        <div style="text-align: center;">
          <a href="https://etikoppakatoys.store/admin" class="action-button">📋 View in Admin Panel →</a>
        </div>
      `

      await sendEmail(ADMIN_EMAIL, `🆕 New Bulk Order #${data.orderNumber}`, getProfessionalTemplate('🆕 NEW BULK ORDER INQUIRY', adminContent, '#EC4899'))

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown email type' }), { status: 400 })

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }
})
