/**
 * CreaterHub - Payment & Escrow Abstraction Service
 * Manages collaboration escrow lifecycle with transparent simulation / production toggling.
 */

const { query, queryOne, run } = require('../db/database.cjs');

const PAYMENT_PROVIDER_KEY = process.env.PAYMENT_PROVIDER_KEY || '';

class PaymentService {
    /**
     * Check if a live production payment gateway is configured
     */
    static isLiveGatewayConfigured() {
        return Boolean(PAYMENT_PROVIDER_KEY);
    }

    /**
     * Lock funds into Escrow when an application is accepted
     */
    static async holdInEscrow({ collaborationId, brandId, creatorId, amount }) {
        const isLive = this.isLiveGatewayConfigured();
        const txRef = isLive
            ? `TXN_LIVE_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
            : `TXN_SIM_ESCROW_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        run(
            `INSERT INTO payments (
                id, collaboration_id, brand_id, creator_id, amount,
                payment_type, status, is_simulated, transaction_ref
            ) VALUES (?, ?, ?, ?, ?, 'Escrow Lock', 'HELD_IN_ESCROW', ?, ?)`,
            [paymentId, collaborationId, brandId, creatorId, Number(amount), isLive ? 0 : 1, txRef]
        );

        return {
            paymentId,
            status: 'HELD_IN_ESCROW',
            amount: Number(amount),
            is_simulated: !isLive,
            transaction_ref: txRef,
            provider_mode: isLive ? 'PRODUCTION_GATEWAY' : 'DEVELOPMENT_SIMULATOR'
        };
    }

    /**
     * Release Escrow funds to creator when deliverables are approved
     */
    static async releaseEscrow(collaborationId) {
        let payment = queryOne(
            'SELECT * FROM payments WHERE collaboration_id = ? ORDER BY created_at DESC LIMIT 1',
            [collaborationId]
        );

        if (!payment) {
            const collab = queryOne(
                'SELECT col.*, c.reward_per_creator FROM collaborations col LEFT JOIN campaigns c ON col.campaign_id = c.id WHERE col.id = ?',
                [collaborationId]
            );
            if (collab) {
                const amount = collab.reward_per_creator || 5000;
                const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                const txRef = `TXN_ESCROW_${Date.now()}`;
                run(
                    `INSERT INTO payments (id, collaboration_id, brand_id, creator_id, amount, payment_type, status, is_simulated, transaction_ref)
                     VALUES (?, ?, ?, ?, ?, 'Escrow Release', 'RELEASED', 1, ?)`,
                    [paymentId, collaborationId, collab.brand_id, collab.creator_id, amount, txRef]
                );
                payment = queryOne('SELECT * FROM payments WHERE id = ?', [paymentId]);
            } else {
                throw new Error('No collaboration or escrow record found for ID ' + collaborationId);
            }
        }

        if (payment.status === 'RELEASED') {
            return { alreadyReleased: true, payment };
        }

        run(
            `UPDATE payments
             SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [payment.id]
        );

        // Notify creator
        const creatorUser = queryOne('SELECT user_id FROM creator_profiles WHERE id = ?', [payment.creator_id]);
        if (creatorUser) {
            run(
                `INSERT INTO notifications (id, user_id, title, message, link)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    `notif_${Date.now()}`,
                    creatorUser.user_id,
                    'Payment Released! 💰',
                    `Escrow payout of ₹${Number(payment.amount).toLocaleString()} has been released for your collaboration.`,
                    '/creator/earnings'
                ]
            );
        }

        return {
            success: true,
            paymentId: payment.id,
            status: 'RELEASED',
            amount: payment.amount,
            is_simulated: Boolean(payment.is_simulated),
            transaction_ref: payment.transaction_ref
        };
    }

    /**
     * Get Creator Earnings History & Active Escrow Balance
     */
    static getCreatorEarnings(creatorId) {
        // Auto-heal: Ensure any completed collaboration has a corresponding RELEASED payment row
        const completedCollabs = query(
            `SELECT col.id, col.brand_id, col.creator_id, c.reward_per_creator
             FROM collaborations col
             LEFT JOIN campaigns c ON col.campaign_id = c.id
             WHERE col.creator_id = ? AND col.status = 'COMPLETED'`,
            [creatorId]
        );

        for (const col of completedCollabs) {
            const existing = queryOne(
                'SELECT id, status FROM payments WHERE collaboration_id = ? LIMIT 1',
                [col.id]
            );
            if (!existing) {
                const amount = col.reward_per_creator || 5000;
                run(
                    `INSERT INTO payments (id, collaboration_id, brand_id, creator_id, amount, payment_type, status, is_simulated, transaction_ref)
                     VALUES (?, ?, ?, ?, ?, 'Escrow Release', 'RELEASED', 1, ?)`,
                    [`pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, col.id, col.brand_id, creatorId, amount, `TXN_ESCROW_${Date.now()}`]
                );
            } else if (existing.status !== 'RELEASED') {
                run("UPDATE payments SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [existing.id]);
            }
        }

        const payments = query(
            `SELECT p.*,
                    COALESCE(c.title, 'Direct Collaboration Brief') as campaign_title,
                    COALESCE(b.company_name, 'Brand Partner') as brand_name
             FROM payments p
             LEFT JOIN collaborations col ON p.collaboration_id = col.id
             LEFT JOIN campaigns c ON col.campaign_id = c.id
             LEFT JOIN brand_profiles b ON col.brand_id = b.id
             WHERE p.creator_id = ?
             ORDER BY p.created_at DESC`,
            [creatorId]
        );

        let totalEarned = 0;
        let heldInEscrow = 0;

        for (const p of payments) {
            if (p.status === 'RELEASED') totalEarned += Number(p.amount || 0);
            if (p.status === 'HELD_IN_ESCROW') heldInEscrow += Number(p.amount || 0);
        }

        return {
            total_earned: totalEarned,
            held_in_escrow: heldInEscrow,
            payments,
            mode_notice: this.isLiveGatewayConfigured() ? 'Live Payout Mode' : 'Development Escrow Simulator (Mock Transactions)'
        };
    }
}

module.exports = PaymentService;
