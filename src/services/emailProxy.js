// This will be your backend endpoint (we'll set this up next)
const sendEmailViaBackend = async (to, subject, html) => {
  const response = await fetch('https://lvyjklkfmdubtchealte.supabase.co/functions/v1/send-email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, subject, html })
  })
  return response.ok
}