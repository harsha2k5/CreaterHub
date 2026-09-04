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
        const payment = queryOne(
            'SELECT * FROM payments WHERE collaboration_id = ? ORDER BY created_at DESC LIMIT 1',
            [collaborationId]
        );

        if (!payment) {
            throw new Error('No escrow payment found for this collaboration.');
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
        const payments = query(
            `SELECT p.*, c.title as campaign_title, b.company_name as brand_name
             FROM payments p
             JOIN collaborations col ON p.collaboration_id = col.id
             JOIN campaigns c ON col.campaign_id = c.id
             JOIN brand_profiles b ON col.brand_id = b.id
             WHERE p.creator_id = ?
             ORDER BY p.created_at DESC`,
            [creatorId]
        );

        let totalEarned = 0;
        let heldInEscrow = 0;

        for (const p of payments) {
            if (p.status === 'RELEASED') totalEarned += p.amount;
            if (p.status === 'HELD_IN_ESCROW') heldInEscrow += p.amount;
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
