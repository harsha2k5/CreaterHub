/**
 * CreaterHub - Instagram Public Profile Fetcher
 * Safely resolves live public OpenGraph metadata for linked Instagram creator profiles
 * (followers count, following count, media count, verified name, and profile picture).
 */

function decodeHTMLEntities(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
            try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return ''; }
        })
        .replace(/&#([0-9]+);/g, (_, dec) => {
            try { return String.fromCodePoint(parseInt(dec, 10)); } catch { return ''; }
        })
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function parseCount(str) {
    if (!str || typeof str !== 'string') return null;
    const clean = str.replace(/,/g, '').trim().toUpperCase();
    if (clean.endsWith('K')) {
        return Math.round(parseFloat(clean.slice(0, -1)) * 1000);
    }
    if (clean.endsWith('M')) {
        return Math.round(parseFloat(clean.slice(0, -1)) * 1000000);
    }
    const num = parseInt(clean, 10);
    return isNaN(num) ? null : num;
}

/**
 * Fetch live public profile data from Instagram
 * @param {string} username - Instagram handle (e.g. '_harsha.2k5')
 */
async function fetchPublicInstagramProfile(username) {
    if (!username) return null;
    const cleanUsername = username.replace(/^@/, '').trim();
    if (!cleanUsername) return null;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`https://www.instagram.com/${encodeURIComponent(cleanUsername)}/`, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            console.warn(`[PublicIG] HTTP ${res.status} when fetching @${cleanUsername}`);
            return null;
        }

        const text = await res.text();

        // 1. Parse og:description for followers, following, posts
        // Format example: "791 Followers, 769 Following, 2 Posts - See Instagram photos and videos from H&#x1d00;&#x280;s&#x29c;&#x1d00; (&#064;_harsha.2k5)"
        const descMatch = text.match(/content="([^"]*followers[^"]*)"/i)
                       || text.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i)
                       || text.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"/i);

        let followers = null;
        let following = null;
        let mediaCount = null;

        if (descMatch && descMatch[1]) {
            const raw = descMatch[1];
            const folM = raw.match(/([\d,.]+[KMkm]?)\s+Followers/i);
            const folwM = raw.match(/([\d,.]+[KMkm]?)\s+Following/i);
            const postM = raw.match(/([\d,.]+[KMkm]?)\s+Posts/i);

            if (folM) followers = parseCount(folM[1]);
            if (folwM) following = parseCount(folwM[1]);
            if (postM) mediaCount = parseCount(postM[1]);
        }

        // 2. Parse og:title for Display / Full Name
        // Format example: "H&#x1d00;&#x280;s&#x29c;&#x1d00; (&#064;_harsha.2k5) &#x2022; Instagram photos and videos"
        const titleMatch = text.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i)
                        || text.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/i);
        let fullName = null;
        if (titleMatch && titleMatch[1]) {
            const rawTitle = titleMatch[1];
            const nameMatch = rawTitle.match(/^([^(•\u2022]+?)(?:\s*\([@&#064;]|\s*[•\u2022])/);
            if (nameMatch && nameMatch[1].trim()) {
                fullName = decodeHTMLEntities(nameMatch[1].trim());
            }
        }

        // 3. Parse og:image for Profile Picture
        const imgMatch = text.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i)
                      || text.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"/i);
        let avatarUrl = null;
        if (imgMatch && imgMatch[1]) {
            avatarUrl = imgMatch[1].replace(/&amp;/g, '&');
        }

        console.log(`[PublicIG] Successfully resolved @${cleanUsername}:`, {
            followers,
            following,
            mediaCount,
            fullName,
            hasAvatar: Boolean(avatarUrl)
        });

        return {
            username: cleanUsername,
            followers_count: followers,
            following_count: following,
            media_count: mediaCount,
            full_name: fullName || cleanUsername,
            avatar_url: avatarUrl,
            profile_url: `https://instagram.com/${cleanUsername}`
        };
    } catch (err) {
        console.warn(`[PublicIG] Could not fetch public profile for @${cleanUsername}:`, err.message);
        return null;
    }
}

module.exports = {
    fetchPublicInstagramProfile,
    decodeHTMLEntities,
    parseCount
};
