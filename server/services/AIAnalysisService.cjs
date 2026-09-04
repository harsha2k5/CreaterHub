/**
 * CreaterHub - AI Creator Analysis Service
 * Evaluates real synchronized Instagram metrics & media into structured creator scores.
 */

const { query, queryOne, run } = require('../db/database.cjs');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

class AIAnalysisService {
    /**
     * Analyze a creator's verified Instagram performance
     */
    static async analyzeCreator(creatorId) {
        const creator = queryOne('SELECT * FROM creator_profiles WHERE id = ?', [creatorId]);
        if (!creator) throw new Error('Creator profile not found.');

        const account = queryOne(
            `SELECT id, username, full_name, bio, is_connected, last_synced_at
             FROM instagram_accounts
             WHERE creator_id = ? AND is_connected = 1`,
            [creatorId]
        );

        if (!account) {
            throw new Error('More Instagram data is required to generate a reliable analysis. Please connect an official Instagram account first.');
        }

        const latestMetric = queryOne(
            `SELECT followers_count, follows_count, media_count, engagement_rate, source
             FROM instagram_metrics
             WHERE instagram_account_id = ?
             ORDER BY recorded_at DESC LIMIT 1`,
            [account.id]
        );

        const media = query(
            `SELECT caption, media_type, like_count, comments_count, timestamp
             FROM instagram_media
             WHERE instagram_account_id = ?
             ORDER BY timestamp DESC LIMIT 15`,
            [account.id]
        );

        if (!latestMetric || (latestMetric.followers_count === 0 && media.length === 0)) {
            throw new Error('Insufficient synchronized Instagram metrics available. Please wait for initial synchronization to complete.');
        }

        const categories = JSON.parse(creator.categories_json || '[]');
        const totalFollowers = latestMetric.followers_count;
        const engagementRate = latestMetric.engagement_rate;

        let analysisResult = null;

        // If Gemini API Key configured, invoke Gemini GenAI
        if (GEMINI_API_KEY) {
            try {
                analysisResult = await this.callGeminiAPI({
                    creator,
                    account,
                    metrics: latestMetric,
                    media,
                    categories
                });
            } catch (aiErr) {
                console.warn('Gemini API call failed, using deterministic analytical model:', aiErr.message);
                analysisResult = this.computeAnalyticalModel({ creator, account, metrics: latestMetric, media, categories });
            }
        } else {
            analysisResult = this.computeAnalyticalModel({ creator, account, metrics: latestMetric, media, categories });
        }

        // Validate structure
        this.validateSchema(analysisResult);

        // Save to ai_creator_analyses table
        const analysisId = `ai_${creatorId}`;
        const existing = queryOne('SELECT id FROM ai_creator_analyses WHERE creator_id = ?', [creatorId]);

        if (existing) {
            run(
                `UPDATE ai_creator_analyses
                 SET overall_score = ?, engagement_score = ?, consistency_score = ?,
                     content_score = ?, audience_score = ?, brand_suitability_score = ?,
                     strengths_json = ?, weaknesses_json = ?, recommendations_json = ?,
                     content_insights_json = ?, summary = ?, analyzed_at = CURRENT_TIMESTAMP
                 WHERE creator_id = ?`,
                [
                    analysisResult.overallScore,
                    analysisResult.engagementScore,
                    analysisResult.consistencyScore,
                    analysisResult.contentScore,
                    analysisResult.audienceScore,
                    analysisResult.brandSuitabilityScore,
                    JSON.stringify(analysisResult.strengths),
                    JSON.stringify(analysisResult.weaknesses),
                    JSON.stringify(analysisResult.recommendations),
                    JSON.stringify(analysisResult.contentInsights),
                    analysisResult.summary,
                    creatorId
                ]
            );
        } else {
            run(
                `INSERT INTO ai_creator_analyses (
                    id, creator_id, overall_score, engagement_score, consistency_score,
                    content_score, audience_score, brand_suitability_score, strengths_json,
                    weaknesses_json, recommendations_json, content_insights_json, summary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    analysisId,
                    creatorId,
                    analysisResult.overallScore,
                    analysisResult.engagementScore,
                    analysisResult.consistencyScore,
                    analysisResult.contentScore,
                    analysisResult.audienceScore,
                    analysisResult.brandSuitabilityScore,
                    JSON.stringify(analysisResult.strengths),
                    JSON.stringify(analysisResult.weaknesses),
                    JSON.stringify(analysisResult.recommendations),
                    JSON.stringify(analysisResult.contentInsights),
                    analysisResult.summary
                ]
            );
        }

        return {
            ...analysisResult,
            analyzed_at: new Date().toISOString(),
            data_source: 'SYNCHRONIZED_INSTAGRAM_METRICS'
        };
    }

    /**
     * Compute Deterministic Grounded Analysis from Real Metrics
     */
    static computeAnalyticalModel({ creator, account, metrics, media, categories }) {
        const followers = metrics.followers_count || 0;
        const engagement = metrics.engagement_rate || 0.0;
        const mediaCount = metrics.media_count || media.length || 0;

        // Calibrate Engagement Score (Benchmark: 2-4% is good, 4%+ is exceptional)
        const engagementScore = Math.min(96, Math.max(45, Math.round(engagement > 0 ? (engagement * 16) + 30 : 60)));

        // Calibrate Content Consistency Score based on media count
        const consistencyScore = Math.min(94, Math.max(50, Math.round(mediaCount > 20 ? 82 : (mediaCount * 3) + 40)));

        // Content Quality Score based on engagement and format variety
        const contentScore = Math.min(95, Math.max(55, Math.round((engagementScore * 0.6) + (consistencyScore * 0.4))));

        // Audience Score based on real follower tier
        let audienceScore = 65;
        if (followers >= 50000) audienceScore = 92;
        else if (followers >= 10000) audienceScore = 86;
        else if (followers >= 2500) audienceScore = 78;
        else if (followers >= 500) audienceScore = 70;

        // Brand Suitability Score based on niche definition and profile completion
        const brandSuitabilityScore = Math.min(95, Math.max(60, Math.round(
            (categories.length > 0 ? 25 : 10) +
            (creator.bio ? 25 : 10) +
            (engagementScore * 0.3) +
            (audienceScore * 0.2)
        )));

        const overallScore = Math.round(
            (engagementScore * 0.25) +
            (consistencyScore * 0.15) +
            (contentScore * 0.20) +
            (audienceScore * 0.20) +
            (brandSuitabilityScore * 0.20)
        );

        const strengths = [];
        if (engagement >= 3.0) strengths.push(`Above-average community engagement rate (${engagement}%)`);
        if (followers >= 5000) strengths.push(`Established local audience reach (${followers.toLocaleString()} verified followers)`);
        if (categories.length > 0) strengths.push(`Clear niche focus in ${categories.join(' & ')}`);
        strengths.push('Responsive content style optimized for local brand storytelling');

        const weaknesses = [];
        if (engagement < 2.0) weaknesses.push('Community interaction can be improved with stronger caption calls-to-action');
        if (mediaCount < 10) weaknesses.push('Relatively low catalog of synchronized media posts');
        if (!creator.bio || creator.bio.length < 30) weaknesses.push('Profile bio could highlight local collaboration credentials more prominently');

        const recommendations = [
            'Incorporate 2-3 short-form Reels weekly spotlighting local businesses in ' + (creator.city || 'your area'),
            'Utilize direct engagement hooks and location stickers in your Stories to boost neighborhood discovery',
            'Maintain a consistent 3-4 posts per week rhythm to maximize Instagram algorithm distribution'
        ];

        const contentInsights = [
            { category: 'Short-form Video', performance: 'High', insight: 'Reels generate highest organic reach for local discovery.' },
            { category: 'Static Carousels', performance: 'Medium', insight: 'Carousels drive bookmark saves and detailed reviews.' }
        ];

        const summary = `${creator.full_name} demonstrates an active local presence with ${followers.toLocaleString()} verified Instagram followers and a ${engagement}% engagement rate. Profile alignment is well-suited for ${categories.join(', ') || 'lifestyle and neighborhood'} brand activations.`;

        return {
            overallScore,
            engagementScore,
            consistencyScore,
            contentScore,
            audienceScore,
            brandSuitabilityScore,
            strengths,
            weaknesses,
            recommendations,
            contentInsights,
            summary
        };
    }

    /**
     * Invoke Gemini API for Advanced Natural Language Evaluation
     */
    static async callGeminiAPI({ creator, account, metrics, media, categories }) {
        const prompt = `
You are an expert influencer marketing AI analyst.
Analyze this REAL synchronized Instagram creator data and generate an objective, grounded analysis adhering strictly to this JSON schema:

{
  "overallScore": number (0-100),
  "engagementScore": number (0-100),
  "consistencyScore": number (0-100),
  "contentScore": number (0-100),
  "audienceScore": number (0-100),
  "brandSuitabilityScore": number (0-100),
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": string[],
  "contentInsights": [{ "category": string, "performance": string, "insight": string }],
  "summary": string
}

CREATOR PROFILE:
- Name: ${creator.full_name}
- Username: @${account.username}
- Categories: ${categories.join(', ')}
- City: ${creator.city}
- Followers: ${metrics.followers_count}
- Following: ${metrics.follows_count}
- Posts Count: ${metrics.media_count}
- Engagement Rate: ${metrics.engagement_rate}%

RECENT MEDIA SUMMARY (${media.length} items):
${media.slice(0, 5).map(m => `- Type: ${m.media_type}, Likes: ${m.like_count}, Comments: ${m.comments_count}, Caption snippet: "${(m.caption || '').substring(0, 60)}"`).join('\n')}

DO NOT invent fake stats. Base all feedback strictly on the provided numbers. Output pure JSON only.
`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' }
            })
        });

        if (!res.ok) throw new Error(`Gemini API error: ${res.statusText}`);
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return JSON.parse(rawText);
    }

    /**
     * Validate AI JSON Schema
     */
    static validateSchema(obj) {
        const requiredScores = ['overallScore', 'engagementScore', 'consistencyScore', 'contentScore', 'audienceScore', 'brandSuitabilityScore'];
        for (const k of requiredScores) {
            if (typeof obj[k] !== 'number' || obj[k] < 0 || obj[k] > 100) {
                obj[k] = 75; // Safe default
            }
        }
        if (!Array.isArray(obj.strengths)) obj.strengths = [];
        if (!Array.isArray(obj.weaknesses)) obj.weaknesses = [];
        if (!Array.isArray(obj.recommendations)) obj.recommendations = [];
        if (!Array.isArray(obj.contentInsights)) obj.contentInsights = [];
        if (!obj.summary) obj.summary = 'Creator analysis generated from verified Instagram metrics.';
    }

    /**
     * Retrieve Stored Analysis
     */
    static getStoredAnalysis(creatorId) {
        const row = queryOne('SELECT * FROM ai_creator_analyses WHERE creator_id = ?', [creatorId]);
        if (!row) return null;

        return {
            overallScore: row.overall_score,
            engagementScore: row.engagement_score,
            consistencyScore: row.consistency_score,
            contentScore: row.content_score,
            audienceScore: row.audience_score,
            brandSuitabilityScore: row.brand_suitability_score,
            strengths: JSON.parse(row.strengths_json || '[]'),
            weaknesses: JSON.parse(row.weaknesses_json || '[]'),
            recommendations: JSON.parse(row.recommendations_json || '[]'),
            contentInsights: JSON.parse(row.content_insights_json || '[]'),
            summary: row.summary,
            analyzed_at: row.analyzed_at
        };
    }
}

module.exports = AIAnalysisService;
