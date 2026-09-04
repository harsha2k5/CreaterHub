/**
 * CreaterHub - Production Token Encryption Service
 * 
 * Provides AES-256-GCM authenticated encryption for sensitive third-party OAuth credentials.
 * Tokens are never stored in plaintext, never logged, and never sent to the client.
 */

const crypto = require('crypto');

const SECRET = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || 'createrhub_secure_token_encryption_key_2026';
const KEY = crypto.createHash('sha256').update(SECRET).digest(); // 32 bytes for aes-256
const ALGORITHM = 'aes-256-gcm';

class TokenEncryptionService {
    /**
     * Encrypt sensitive token
     * @param {string} plainText 
     * @returns {string} iv:authTag:cipherText
     */
    static encrypt(plainText) {
        if (!plainText || typeof plainText !== 'string') return '';
        const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
        const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
        
        let encrypted = cipher.update(plainText, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    /**
     * Decrypt encrypted token
     * @param {string} cipherTextString 
     * @returns {string|null} plainText
     */
    static decrypt(cipherTextString) {
        if (!cipherTextString || typeof cipherTextString !== 'string') return null;
        
        const parts = cipherTextString.split(':');
        // If not matching iv:authTag:cipher format (e.g. legacy or test token), return null
        if (parts.length !== 3) {
            return null;
        }

        try {
            const [ivHex, authTagHex, encryptedHex] = parts;
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            
            const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (err) {
            console.error('[TokenEncryptionService] Failed to decrypt token securely.');
            return null;
        }
    }
}

module.exports = TokenEncryptionService;
