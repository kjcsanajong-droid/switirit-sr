const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [userRows] = await db.query(
            'SELECT user_id, first_name, last_name, email, role, created_at FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ error: 'Gebruiker niet gevonden' });
        }

        res.json(userRows[0]);
    } catch (error) {
        console.error('Fout bij ophalen profiel:', error);
        res.status(500).json({ error: 'Kon profiel niet ophalen' });
    }
});

module.exports = router;
