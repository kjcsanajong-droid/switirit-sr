const express = require('express');
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { validateEnforcement } = require('../middlewares/validation');

const router = express.Router();

router.get('/feedback', authenticateToken, authorizeRoles('MINISTRY', 'SUPERADMIN'), async (req, res) => {
    try {
        const [items] = await db.query(
            `SELECT fs.feedback_id,
                    fs.driving_rating,
                    fs.comfort_rating,
                    fs.hygiene_rating,
                    fs.airco_working,
                    fs.comment_text,
                    fs.suggestion_text,
                    b.plate_number,
                    br.route_name
             FROM feedback_submissions fs
             LEFT JOIN buses b ON fs.bus_id = b.bus_id
             LEFT JOIN bus_routes br ON b.route_id = br.route_id
             ORDER BY fs.created_at DESC`
        );

        res.json(items);
    } catch (error) {
        console.error('Fout bij ophalen admin feedback:', error);
        res.status(500).json({ error: 'Kon admin feedback niet ophalen' });
    }
});

router.post('/enforce', authenticateToken, authorizeRoles('MINISTRY', 'SUPERADMIN'), validateEnforcement, async (req, res) => {
    const { feedback_id, action_type, fine_amount, notes } = req.body;
    const officer_id = req.user.user_id;

    try {
        await db.query(
            'INSERT INTO enforcement_actions (feedback_id, officer_id, action_type, fine_amount, official_notes) VALUES (?, ?, ?, ?, ?)',
            [feedback_id, officer_id, action_type, fine_amount || 0, notes || null]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Fout bij opslaan handhavingsactie:', error);
        res.status(500).json({ success: false, error: 'Kon handhavingsactie niet opslaan' });
    }
});

module.exports = router;
