/**
 * Vercel Serverless Function for Chat API
 * 
 * This handles chat requests when deployed to Vercel.
 * For local development, use server.js instead.
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Store assistant ID from environment
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// In-memory thread storage (in production, use a database or Redis)
// Key: sessionId, Value: threadId
const threadStore = new Map();

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Body parsing safety check - handle both string and parsed JSON
        const body = typeof req.body === 'string'
            ? JSON.parse(req.body)
            : req.body;

        const { message, sessionId } = body;

        // Validate input
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Message is required and must be a non-empty string' 
            });
        }

        // Check if assistant is configured
        if (!ASSISTANT_ID) {
            console.error('Assistant ID not configured. Please set OPENAI_ASSISTANT_ID environment variable.');
            return res.status(500).json({ 
                error: 'Chatbot is not configured. Please contact the administrator.' 
            });
        }

        // Get or create thread for this session
        let threadId = threadStore.get(sessionId);
        
        if (!threadId) {
            // Create a new thread for this session
            const thread = await openai.beta.threads.create();
            
            // Validate thread was created
            if (!thread || !thread.id) {
                throw new Error('Failed to create thread');
            }
            
            threadId = thread.id;
            threadStore.set(sessionId, threadId);
            console.log(`Created new thread ${threadId} for session ${sessionId}`);
        }
        
        // Validate threadId is defined before proceeding
        if (!threadId) {
            throw new Error('Thread ID is undefined - cannot proceed with chat');
        }

        // Add user message to the thread
        await openai.beta.threads.messages.create(threadId, {
            role: 'user',
            content: message.trim(),
        });

        // Create a run to process the message
        const run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: ASSISTANT_ID,
        });

        // Validate run was created successfully
        if (!run) {
            throw new Error('Failed to create assistant run - run object is null');
        }
        
        const runId = run.id;
        if (!runId) {
            throw new Error('Failed to create assistant run - run.id is undefined');
        }

        // Poll for run completion
        let runStatus = await openai.beta.threads.runs.retrieve(runId, {
            thread_id: threadId
        });
        
        // Wait for the run to complete (with timeout)
        const maxWaitTime = 60000; // 60 seconds
        const startTime = Date.now();
        
        while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
            // Check timeout
            if (Date.now() - startTime > maxWaitTime) {
                throw new Error('Request timeout: Assistant took too long to respond');
            }

            // Wait a bit before checking again
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check run status
            if (!threadId || !runId) {
                throw new Error(`Thread ID or Run ID is undefined. ThreadId: ${threadId}, RunId: ${runId}`);
            }
            
            runStatus = await openai.beta.threads.runs.retrieve(runId, {
                thread_id: threadId
            });
        }

        // Handle different run statuses
        if (runStatus.status === 'completed') {
            // Retrieve the assistant's response
            const messages = await openai.beta.threads.messages.list(threadId, {
                limit: 1,
                order: 'desc',
            });

            const assistantMessage = messages.data[0];
            let responseText = assistantMessage.content[0].text.value;

            // Remove citation markers (e.g., 【10:1†source】)
            // These appear when the assistant uses file-based retrieval
            responseText = responseText.replace(/【\d+:\d+†source】/g, '').trim();

            return res.status(200).json({ 
                response: responseText,
                sessionId: sessionId,
                threadId: threadId
            });
        } else if (runStatus.status === 'failed') {
            console.error('Run failed:', runStatus.last_error);
            throw new Error(runStatus.last_error?.message || 'Assistant run failed');
        } else if (runStatus.status === 'requires_action') {
            throw new Error('Assistant requires action, but no functions are configured');
        } else {
            throw new Error(`Unexpected run status: ${runStatus.status}`);
        }

    } catch (error) {
        console.error('Chat API error:', error);
        
        // Return user-friendly error message
        const errorMessage = error.message || 'An unexpected error occurred';
        return res.status(500).json({ 
            error: errorMessage 
        });
    }
}

