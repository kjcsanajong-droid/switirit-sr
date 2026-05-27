const express = require('express');
const db = require('../config/db');
const { validateFeedback } = require('../middlewares/validation');
const router = express.Router();

router.post('/', validateFeedback, async (req, res) => {
    const {
        user_id,
        route_id,
        bus_plate,
        driving,
        comfort,
        hygiene,
        airco,
        comment,
        suggestion,
        driver_id
    } = req.body;

    const normalizedAirco = ['JA', 'NEE', 'GEEN'].includes(String(airco).toUpperCase())
        ? String(airco).toUpperCase()
        : 'NEE';

    try {
        const [existingBus] = await db.query('SELECT bus_id FROM buses WHERE plate_number = ?', [bus_plate]);
        let busId;

        if (existingBus.length > 0) {
            busId = existingBus[0].bus_id;
            await db.query('UPDATE buses SET route_id = ? WHERE bus_id = ?', [route_id, busId]);
        } else {
            const [insertResult] = await db.query(
                'INSERT INTO buses (plate_number, route_id, current_status) VALUES (?, ?, ?)',
                [bus_plate, route_id, 'ACTIVE']
            );
            busId = insertResult.insertId;
        }

        await db.query(
            'INSERT INTO feedback_submissions (user_id, bus_id, driver_id, driving_rating, comfort_rating, hygiene_rating, airco_working, comment_text, suggestion_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, busId, driver_id || null, driving, comfort, hygiene, normalizedAirco, comment || null, suggestion || null]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Fout bij opslaan feedback:', error);
        res.status(500).json({ success: false, error: 'Kon feedback niet opslaan' });
    }
});

module.exports = router;
