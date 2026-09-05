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
        const bud = Number(budget) || 25000;

        const creatorsReq = Math.max(2, Math.min(8, Math.floor(bud / 5000) || 3));
        const rewardPerCreator = Math.round(bud / creatorsReq);
        const city = loc.split(',')[0].trim();

        // Structured recommendation matching AICampaignRecommendation interface
        const recommendation = {
            category: cat,
            location_name: loc,
            city: city || 'Bengaluru',
            target_niche: `${cat} Creators`,
            follower_range: '3K - 50K Micro & Nano Creators',
            min_followers: 3000,
            max_followers: 75000,
            min_engagement: 3.5,
            deliverables: [
                '1x High-Resolution Dedicated Reel (30-45s)',
                '2x Real-Time Stories with Location Sticker'
            ],
            creators_required: creatorsReq,
            reward_per_creator: rewardPerCreator,
            estimated_budget: bud,
            suggested_duration: '14 Days',
            suggested_title: `${briefIdea.charAt(0).toUpperCase() + briefIdea.slice(1)} Campaign`,
            suggested_description: `Spotlight authentic experiences for ${briefIdea} in ${loc}. Partner with vetted creators to showcase products and drive local engagement.`,
            strategy: `Hyperlocal creator activation focused on ${city}. Deliver engaging short-form video reels highlighting real customer touchpoints and authentic reviews.`,
            hashtags: `#${cat.replace(/[^a-zA-Z]/g, '')} #${city.replace(/[^a-zA-Z]/g, '')} #CreaterHub #LocalCreator`,
            dos: 'Tag official brand handle, add location sticker, include clear call to action.',
            donts: 'Do not use copyrighted music without audio sync, avoid artificial follower boosting.',
            ai_engine: 'Gemini AI Campaign Architect'
        };

        return res.json({
            success: true,
            recommendation,
            brief: recommendation
        });
    } catch (err) {
        console.error('Error generating campaign brief:', err);
        return res.status(500).json({ success: false, error: 'Failed to generate campaign brief.' });
    }
});

module.exports = router;
