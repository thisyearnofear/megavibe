// Vercel Serverless API route for Neynar proxy

export default async function handler(req, res) {
  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing NEYNAR_API_KEY' });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const response = await fetch('https://api.neynar.com/v1/your-endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to contact Neynar', details: error instanceof Error ? error.message : error });
  }
}
