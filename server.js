require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/routes');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route modules
app.use('/api', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

app.get('/api', (req, res) => {
    res.json({ message: 'SwitiRit API is live' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
    res.status(404).json({ message: 'Route niet gevonden' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Interne serverfout' });
});

const PORT = process.env.PORT || 5000;

// Test database connection before server starts
db.query('SELECT 1')
    .then(() => {
        console.log('✅ Succesvol verbonden met de MySQL database (switirit_db).');
        app.listen(PORT, () => {
            console.log(`🚀 SwitiRit Backend draait live op http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Database verbindingsfout:', err);
        process.exit(1);
    });


