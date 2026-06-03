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

// REGISTRATION ROUTE
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ message: 'Alle velden zijn verplicht' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Wachtwoord moet minimaal 6 karakters lang zijn' });
    }

    if (!['PASSENGER', 'COMPANY'].includes(role)) {
        return res.status(400).json({ message: 'Ongeldig account type' });
    }

    try {
        // Check if email already exists
        const [existingUsers] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Dit e-mailadres is al geregistreerd' });
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new user
        const [insertResult] = await db.query(
            'INSERT INTO users (first_name, last_name, email, password_hash, role, coins) VALUES (?, ?, ?, ?, ?, ?)',
            [firstName, lastName, email, passwordHash, role, 0]
        );

        res.status(201).json({
            message: 'Account succesvol aangemaakt',
            user: {
                user_id: insertResult.insertId,
                first_name: firstName,
                last_name: lastName,
                email: email,
                role: role
            }
        });
    } catch (error) {
        console.error('Fout bij registratie:', error);
        res.status(500).json({ message: 'Interne serverfout bij registratie' });
    }
});

// ADMIN: Change User Role to COMPANY
app.post('/api/admin/change-user-role', async (req, res) => {
    const adminId = req.header('x-user-id');
    const userRole = req.header('x-user-role');
    const { user_id, new_role } = req.body;

    // Check if requester is SUPERADMIN
    if (userRole !== 'SUPERADMIN') {
        return res.status(403).json({ error: 'Alleen SUPERADMIN mag gebruikersrollen wijzigen' });
    }

    if (!user_id || !new_role) {
        return res.status(400).json({ error: 'user_id en new_role zijn verplicht' });
    }

    if (!['PASSENGER', 'COMPANY', 'MINISTRY', 'SUPERADMIN'].includes(new_role)) {
        return res.status(400).json({ error: 'Ongeldig rol type' });
    }

    try {
        // Update the app_session to track who made the change
        await db.query('UPDATE app_session SET current_action_by_user_id = ? WHERE session_id = 1', [adminId]);

        // Update user role
        await db.query('UPDATE users SET role = ? WHERE user_id = ?', [new_role, user_id]);

        res.json({ 
            success: true,
            message: `Rol succesvol gewijzigd naar ${new_role}` 
        });
    } catch (error) {
        console.error('Fout bij wijzigen gebruikersrol:', error);
        res.status(500).json({ error: 'Kon gebruikersrol niet wijzigen' });
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

        // Award 1 coin for submitting feedback
        await db.query('UPDATE users SET coins = coins + 1 WHERE user_id = ?', [user_id]);

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

    console.log(`📋 Profiel aangevraagd voor user_id: ${actualUserId}`);

    try {
        const [rows] = await db.query(
            'SELECT user_id, first_name, last_name, email, role, coins, created_at FROM users WHERE user_id = ?',
            [actualUserId]
        );

        console.log(`✅ Query resultaat:`, rows);

        if (!rows || rows.length === 0) {
            console.log(`❌ Gebruiker ${actualUserId} niet gevonden in database`);
            return res.status(404).json({ error: 'Gebruiker niet gevonden' });
        }

        console.log(`✅ Gebruiker gevonden, sturen response:`, rows[0]);
        res.json(rows[0]);
    } catch (error) {
        console.error('❌ Fout bij ophalen profiel:', error);
        res.status(500).json({ error: 'Kon profiel niet ophalen: ' + error.message });
    }
});

// Route om alle gebruikers op te halen (voor user switching in testing)
app.get('/api/users', async (req, res) => {
    try {
        const [users] = await db.query('SELECT user_id, first_name, last_name, email, role FROM users ORDER BY user_id');
        res.json(users);
    } catch (error) {
        console.error('Fout bij ophalen gebruikers:', error);
        res.status(500).json({ error: 'Kon gebruikers niet ophalen' });
    }
});

// 🛠️ NIEUW: Route voor openstaande boetes van bedrijfsvloot
app.get('/api/company/fees/:companyId', async (req, res) => {
    const companyId = req.params.companyId;

    try {
        // Get all buses for this company with their route info
        const [buses] = await db.query(
            `SELECT b.bus_id,
                    b.plate_number,
                    b.current_status,
                    br.route_name,
                    b.route_id
             FROM buses b
             LEFT JOIN bus_routes br ON b.route_id = br.route_id
             WHERE b.company_id = ?
             ORDER BY b.plate_number`,
            [companyId]
        );

        if (buses.length === 0) {
            return res.json({ buses: [] });
        }

        // Get fines for each bus
        const busesWithFees = await Promise.all(
            buses.map(async (bus) => {
                // Get all fines (enforcement actions) for this bus through its feedback submissions
                const [fines] = await db.query(
                    `SELECT ea.fine_amount, ea.action_type
                     FROM enforcement_actions ea
                     INNER JOIN feedback_submissions fs ON ea.feedback_id = fs.feedback_id
                     WHERE fs.bus_id = ? AND ea.action_type IN ('FINE', 'WARNING')`,
                    [bus.bus_id]
                );

                // Calculate total outstanding fee
                const totalFee = fines
                    .filter(f => f.action_type === 'FINE')
                    .reduce((sum, f) => sum + parseFloat(f.fine_amount || 0), 0);

                // Count warnings
                const warningCount = fines.filter(f => f.action_type === 'WARNING').length;

                return {
                    ...bus,
                    outstanding_fee: totalFee,
                    warning_count: warningCount,
                    total_enforcement_actions: fines.length
                };
            })
        );

        res.json({ buses: busesWithFees });
    } catch (error) {
        console.error('Fout bij ophalen openstaande boetes:', error);
        res.status(500).json({ error: 'Kon openstaande boetes niet ophalen' });
    }
});

// 🛠️ NIEUW EN CRUCIAAL: Laat de server daadwerkelijk luisteren op poort 3000!
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 SwitiRit Backend draait live op http://localhost:${PORT}`);
});


