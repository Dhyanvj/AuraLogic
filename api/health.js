/**
 * Vercel Serverless Function for Health Check
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

    return res.status(200).json({ 
        status: 'ok', 
        assistantId: ASSISTANT_ID ? 'configured' : 'not configured',
        timestamp: new Date().toISOString()
    });
}

