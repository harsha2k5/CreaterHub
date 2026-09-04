const express = require('express');
const router = express.Router();
const { queryOne } = require('../db/database.cjs');
const { authenticateToken, requireCreator, requireBrand } = require('../middleware/auth.cjs');
const AIAnalysisService = require('../services/AIAnalysisService.cjs');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// POST /api/ai/analyze-creator - Creator triggers analysis
router.post('/analyze-creator', authenticateToken, requireCreator, async (req, res) => {
    try {
        const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

        const analysis = await AIAnalysisService.analyzeCreator(creator.id);
        return res.json({
            success: true,
            message: 'AI Creator Analysis generated successfully.',
            analysis
        });
    } catch (err) {
        console.error('AI Analysis generation error:', err);
        return res.status(400).json({ success: false, error: err.message });
    }
});

// GET /api/ai/creator-analysis/:creatorId - Public / Brand view of creator analysis
router.get('/creator-analysis/:creatorId', async (req, res) => {
    try {
        const { creatorId } = req.params;
        const analysis = AIAnalysisService.getStoredAnalysis(creatorId);
        if (!analysis) {
            return res.status(404).json({
                success: false,
                error: 'No AI analysis found for this creator. Requires verified Instagram synchronization.'
            });
        }
        return res.json({ success: true, analysis });
    } catch (err) {
        console.error('Error fetching creator analysis:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve analysis.' });
    }
});

// POST /api/ai/generate-campaign-brief - AI Assistant for Brand Briefs
router.post('/generate-campaign-brief', authenticateToken, requireBrand, async (req, res) => {
    try {
        const { prompt, category, location, budget } = req.body;
        if (!prompt) {
            return res.status(400).json({ success: false, error: 'Campaign prompt or idea is required.' });
        }

        const briefIdea = prompt.trim();
        const cat = category || 'Food & Beverage';
        const loc = location || 'Bengaluru';
        const bud = Number(budget) || 15000;

        // Structured recommendation
        const brief = {
            title: `${briefIdea.charAt(0).toUpperCase() + briefIdea.slice(1)} Campaign`,
            description: `Exciting local collaboration opportunity for creators in ${loc}. Join us to spotlight authentic local experiences, craft engaging short-form video reels, and reach nearby customers.`,
            category: cat,
            location_name: loc,
            creators_required: Math.max(2, Math.min(8, Math.floor(bud / 5000))),
            reward_per_creator: Math.round(bud / Math.max(2, Math.min(8, Math.floor(bud / 5000)))),
            deliverables: [
                { type: 'Reel', count: 1, requirement: '1x 30-45s Creative Video Reel with brand tag and music sync' },
                { type: 'Story', count: 2, requirement: '2x Real-time stories with outlet location sticker' }
            ],
            min_followers: 1000,
            req_engagement: 2.5
        };

        return res.json({
            success: true,
            brief
        });
    } catch (err) {
        console.error('Error generating campaign brief:', err);
        return res.status(500).json({ success: false, error: 'Failed to generate campaign brief.' });
    }
});

module.exports = router;
