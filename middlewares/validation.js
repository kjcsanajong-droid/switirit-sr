const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const validateLogin = [
    body('email')
        .exists({ checkFalsy: true }).withMessage('E-mailadres is verplicht.')
        .isString().withMessage('E-mailadres moet tekst zijn.')
        .isEmail().withMessage('Ongeldig e-mailadres formaat.'),
    body('password')
        .exists({ checkFalsy: true }).withMessage('Wachtwoord is verplicht.')
        .isString().withMessage('Wachtwoord moet tekst zijn.')
        .isLength({ min: 6 }).withMessage('Wachtwoord moet minimaal 6 tekens bevatten.'),
    validateRequest
];

const validateFeedback = [
    body('user_id')
        .exists().withMessage('user_id is verplicht.')
        .isInt({ min: 1 }).withMessage('user_id moet een positief geheel getal zijn.'),
    body('route_id')
        .exists().withMessage('route_id is verplicht.')
        .isInt({ min: 1 }).withMessage('route_id moet een positief geheel getal zijn.'),
    body('bus_plate')
        .exists({ checkFalsy: true }).withMessage('bus_plate is verplicht.')
        .isString().withMessage('bus_plate moet tekst zijn.'),
    body('driving')
        .exists().withMessage('driving is verplicht.')
        .isInt({ min: 1, max: 5 }).withMessage('driving moet tussen 1 en 5 zijn.'),
    body('comfort')
        .exists().withMessage('comfort is verplicht.')
        .isInt({ min: 1, max: 5 }).withMessage('comfort moet tussen 1 en 5 zijn.'),
    body('hygiene')
        .exists().withMessage('hygiene is verplicht.')
        .isInt({ min: 1, max: 5 }).withMessage('hygiene moet tussen 1 en 5 zijn.'),
    body('airco')
        .exists({ checkFalsy: true }).withMessage('airco is verplicht.')
        .isString().withMessage('airco moet tekst zijn.')
        .custom((value) => ['JA', 'NEE', 'GEEN'].includes(String(value).toUpperCase()))
        .withMessage('airco moet JA, NEE of GEEN zijn.'),
    validateRequest
];

const validateEnforcement = [
    body('feedback_id')
        .exists().withMessage('feedback_id is verplicht.')
        .isInt({ min: 1 }).withMessage('feedback_id moet een positief geheel getal zijn.'),
    body('action_type')
        .exists({ checkFalsy: true }).withMessage('action_type is verplicht.')
        .isIn(['WARNING', 'FINE', 'POLICY_UPDATE', 'LICENSE_REVOKED'])
        .withMessage('Ongeldig actie-type.'),
    validateRequest
];

module.exports = {
    validateLogin,
    validateFeedback,
    validateEnforcement
};
