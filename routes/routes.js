const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [routes] = await db.query('SELECT route_id, route_name, description FROM bus_routes ORDER BY route_name');
        res.json(routes);
    } catch (error) {
        console.error('Fout bij ophalen routes:', error);
        res.status(500).json({ message: 'Kon buslijnen niet ophalen' });
    }
});

module.exports = router;
