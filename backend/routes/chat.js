const express = require('express');
const { chatWithAssistant } = require('../services/aiService');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Valid messages array is required' });
        }

        const reply = await chatWithAssistant(messages);
        res.json({ reply });
    } catch (error) {
        console.error('Chat route error:', error);
        res.status(500).json({ error: 'Failed to process chat' });
    }
});

module.exports = router;
