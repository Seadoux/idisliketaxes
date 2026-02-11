// api/submit-merchant.js
// Deploy this to Vercel as a serverless function

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { merchant, category, userEmail, timestamp } = req.body;

    // Validate input
    if (!merchant || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Log to console (in production, save to database)
    console.log('New merchant suggestion:', {
      merchant,
      category,
      userEmail,
      timestamp,
      receivedAt: new Date().toISOString()
    });

    // TODO: In production, save to database
    // Example with Supabase (free tier):
    /*
    const { data, error } = await supabase
      .from('merchant_suggestions')
      .insert([
        { merchant, category, user_email: userEmail, created_at: timestamp }
      ]);
    */

    // For now, you could use Google Sheets API (free):
    /*
    await appendToGoogleSheet({
      spreadsheetId: 'YOUR_SHEET_ID',
      range: 'Suggestions!A:D',
      values: [[merchant, category, userEmail, timestamp]]
    });
    */

    return res.status(200).json({ 
      success: true,
      message: 'Thank you! This merchant will help other creators.' 
    });

  } catch (error) {
    console.error('Error submitting merchant:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
