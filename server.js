const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors'); // 🛠️ NIEUW
const db = require('./db');
const app = express();

app.use(cors()); // 🛠️ NIEUW: Staat verzoeken van andere poorten (zoals 5500) toe!
app.use(express.json());


// EXTRA: Test direct bij het opstarten of de databaseverbinding écht werkt!
db.query('SELECT 1')
    .then(() => console.log('✅ Succesvol verbonden met de MySQL database (switirit_db).'))
    .catch(err => console.error('❌ Database verbindingsfout:', err));

// DE INLOG ROUTE
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body; //

    try {
        // 1. Zoek de gebruiker op via e-mail in switirit_db
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]); //
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Onjuist e-mailadres of wachtwoord.' }); //
        }

        const user = users[0]; //

        // 2. Vergelijk het ingevoerde wachtwoord met de BCrypt-hash uit de database
        const match = await bcrypt.compare(password, user.password_hash); //

        if (!match) {
            return res.status(401).json({ message: 'Onjuist e-mailadres of wachtwoord.' }); //
        }

        // 3. OPTIONEEL VOOR DE TRIGGER: Zet de actieve sessie direct in de database
        await db.query('UPDATE app_session SET current_action_by_user_id = ? WHERE session_id = 1', [user.user_id]); //

        // 4. Succes! Stuur de gebruikersgegevens (behalve het wachtwoord) terug naar de website
        res.json({ //
            message: 'Inloggen succesvol', //
            user: { //
                user_id: user.user_id, //
                first_name: user.first_name, //
                role: user.role //
            } //
        }); //

    } catch (error) {
        console.error(error); //
        res.status(500).json({ message: 'Interne serverfout' }); //
    }
});

// Route voor buslijnen
app.get('/api/routes', async (req, res) => {
    try {
        const [routes] = await db.query('SELECT route_id, route_name, description FROM bus_routes ORDER BY route_name');
        res.json(routes);
    } catch (error) {
        console.error('Fout bij ophalen routes:', error);
        res.status(500).json({ message: 'Kon buslijnen niet ophalen' });
    }
});

// Route voor feedbackinschrijving
app.post('/api/feedback', async (req, res) => {
    const { user_id, route_id, bus_plate, driving, comfort, hygiene, airco, comment, suggestion } = req.body;

    if (!user_id || !route_id || !bus_plate) {
        return res.status(400).json({ success: false, error: 'Vereiste velden ontbreken' });
    }

    const normalizedAirco = ['JA', 'NEE', 'GEEN'].includes(airco)
        ? airco
        : airco && airco.toString().toUpperCase().startsWith('J') ? 'JA' : 'NEE';

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
            'INSERT INTO feedback_submissions (user_id, bus_id, driving_rating, comfort_rating, hygiene_rating, airco_working, comment_text, suggestion_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, busId, driving, comfort, hygiene, normalizedAirco, comment, suggestion]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Fout bij opslaan feedback:', error);
        res.status(500).json({ success: false, error: 'Kon feedback niet opslaan' });
    }
});

// Route voor admin dashboard feedback
app.get('/api/admin/feedback', async (req, res) => {
    const userRole = req.header('x-user-role');
    if (!['MINISTRY', 'SUPERADMIN'].includes(userRole)) {
        return res.status(403).json({ error: 'Toegang geweigerd' });
    }

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

// Route voor handhavingsacties
app.post('/api/admin/enforce', async (req, res) => {
    const userRole = req.header('x-user-role');
    if (!['MINISTRY', 'SUPERADMIN'].includes(userRole)) {
        return res.status(403).json({ success: false, error: 'Toegang geweigerd' });
    }

    const { feedback_id, officer_id, action_type, fine_amount, notes } = req.body;
    if (!feedback_id || !officer_id || !action_type) {
        return res.status(400).json({ success: false, error: 'Vereiste velden ontbreken' });
    }

    try {
        await db.query(
            'INSERT INTO enforcement_actions (feedback_id, officer_id, action_type, fine_amount, official_notes) VALUES (?, ?, ?, ?, ?)',
            [feedback_id, officer_id, action_type, fine_amount || 0, notes]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Fout bij opslaan handhavingsactie:', error);
        res.status(500).json({ success: false, error: 'Kon handhavingsactie niet opslaan' });
    }
});

// Route voor gebruikersprofiel
app.get('/api/user/profile', async (req, res) => {
    const userId = req.header('x-user-id');
    
    // TIJDELIJK: Als x-user-id header niet aanwezig is, fallback naar ID 1
    const actualUserId = userId || 1;

    try {
        const [user] = await db.query(
            'SELECT user_id, first_name, last_name, email, role, created_at FROM users WHERE user_id = ?',
            [actualUserId]
        );

        if (user.length === 0) {
            return res.status(404).json({ error: 'Gebruiker niet gevonden' });
        }

        res.json(user[0]);
    } catch (error) {
        console.error('Fout bij ophalen profiel:', error);
        res.status(500).json({ error: 'Kon profiel niet ophalen' });
    }
});

// 🛠️ NIEUW EN CRUCIAAL: Laat de server daadwerkelijk luisteren op poort 3000!
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 SwitiRit Backend draait live op http://localhost:${PORT}`);
});


