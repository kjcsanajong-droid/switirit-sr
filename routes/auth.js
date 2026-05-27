const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { validateLogin } = require('../middlewares/validation');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

router.post('/login', validateLogin, async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Onjuist e-mailadres of wachtwoord.' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ message: 'Onjuist e-mailadres of wachtwoord.' });
        }

        await db.query('UPDATE app_session SET current_action_by_user_id = ? WHERE session_id = 1', [user.user_id]);

        const tokenPayload = {
            user_id: user.user_id,
            email: user.email,
            role: user.role,
            first_name: user.first_name
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.json({
            message: 'Inloggen succesvol',
            user: tokenPayload,
            accessToken: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Interne serverfout' });
    }
});

module.exports = router;
