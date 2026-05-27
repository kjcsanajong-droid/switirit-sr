function validateLogin(req, res, next) {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ message: 'Ongeldig e-mailadres.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: 'Wachtwoord moet minimaal 6 tekens bevatten.' });
    }

    next();
}

function validateFeedback(req, res, next) {
    const { user_id, route_id, bus_plate, driving, comfort, hygiene, airco } = req.body;

    if (!user_id || !route_id || !bus_plate) {
        return res.status(400).json({ message: 'Vereiste velden ontbreken: user_id, route_id of bus_plate.' });
    }

    if (![1, 2, 3, 4, 5].includes(Number(driving))) {
        return res.status(400).json({ message: 'Rijgedrag moet een waarde tussen 1 en 5 zijn.' });
    }

    if (![1, 2, 3, 4, 5].includes(Number(comfort))) {
        return res.status(400).json({ message: 'Comfort moet een waarde tussen 1 en 5 zijn.' });
    }

    if (![1, 2, 3, 4, 5].includes(Number(hygiene))) {
        return res.status(400).json({ message: 'Hygiëne moet een waarde tussen 1 en 5 zijn.' });
    }

    if (!['JA', 'NEE', 'GEEN'].includes(String(airco).toUpperCase())) {
        return res.status(400).json({ message: 'Airco-veld moet JA, NEE of GEEN zijn.' });
    }

    next();
}

function validateEnforcement(req, res, next) {
    const { feedback_id, action_type } = req.body;

    if (!feedback_id || !action_type) {
        return res.status(400).json({ message: 'Vereiste velden ontbreken: feedback_id of action_type.' });
    }

    if (!['WARNING', 'FINE', 'POLICY_UPDATE', 'LICENSE_REVOKED'].includes(action_type)) {
        return res.status(400).json({ message: 'Ongeldig actie-type.' });
    }

    next();
}

module.exports = {
    validateLogin,
    validateFeedback,
    validateEnforcement
};
