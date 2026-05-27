
CREATE DATABASE IF NOT EXISTS switirit_db;
USE switirit_db;

-- =========================================================
-- 1. GEBRUIKERSBEHEER (De Basis voor de Rollen)
-- =========================================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('PASSENGER', 'COMPANY', 'MINISTRY', 'SUPERADMIN') DEFAULT 'PASSENGER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hulptabel voor actieve sessies (tbv de trigger)
CREATE TABLE IF NOT EXISTS app_session (
    session_id INT PRIMARY KEY DEFAULT 1,
    current_action_by_user_id INT NULL
);
INSERT INTO app_session (session_id, current_action_by_user_id) VALUES (1, NULL)
ON DUPLICATE KEY UPDATE current_action_by_user_id = current_action_by_user_id;

-- Notificaties (Voor updates naar gebruikers/bedrijven)
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Password Logs (Beveiligings-audit)
CREATE TABLE password_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) DEFAULT 'Onbekend',
    user_agent VARCHAR(255) DEFAULT 'Onbekend',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =========================================================
-- 2. INFRASTRUCTUUR & VLOOT (Gekoppeld aan 'COMPANY')
-- =========================================================

CREATE TABLE bus_routes (
    route_id INT AUTO_INCREMENT PRIMARY KEY,
    route_name VARCHAR(20) UNIQUE NOT NULL,
    description VARCHAR(100)
);

-- Bussen: Gekoppeld aan een user met de rol 'COMPANY'
CREATE TABLE buses (
    bus_id INT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    route_id INT,
    company_id INT, -- Verwijst naar users(user_id) waar role = 'COMPANY'
    current_status ENUM('ACTIVE', 'MAINTENANCE', 'SUSPENDED') DEFAULT 'ACTIVE',
    FOREIGN KEY (route_id) REFERENCES bus_routes(route_id) ON DELETE SET NULL,
    FOREIGN KEY (company_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Buschauffeurs: In dienst bij een 'COMPANY'
CREATE TABLE bus_drivers (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT, -- Welk busbedrijf is de baas?
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(30) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    FOREIGN KEY (company_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =========================================================
-- 3. FEEDBACK & HANDHAVING (Gekoppeld aan 'PASSENGER' & 'MINISTRY')
-- =========================================================

-- Feedback: Nu gekoppeld aan Bus ÉN Chauffeur voor het bedrijfspanel!
CREATE TABLE feedback_submissions (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,        -- De PASSENGER die de feedback geeft
    bus_id INT,         -- De bus waarin het gebeurde
    driver_id INT,      -- NIEUW: Welke chauffeur reed er? (Belangrijk voor het bedrijf/TCT!)
    driving_rating INT CHECK (driving_rating BETWEEN 1 AND 5),
    comfort_rating INT CHECK (comfort_rating BETWEEN 1 AND 5),
    hygiene_rating INT CHECK (hygiene_rating BETWEEN 1 AND 5),
    airco_working ENUM('JA', 'NEE', 'GEEN') NOT NULL, 
    comment_text TEXT,
    suggestion_text TEXT,
    image_url VARCHAR(255) DEFAULT NULL, -- Foto-upload pad
    video_url VARCHAR(255) DEFAULT NULL, -- Video-upload pad
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES bus_drivers(driver_id) ON DELETE SET NULL
);

-- Handhavingsacties: Uitgevoerd door een 'MINISTRY' inspecteur
CREATE TABLE enforcement_actions (
    action_id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_id INT,
    officer_id INT, -- Verwijst naar users(user_id) waar role = 'MINISTRY'
    action_type ENUM('WARNING', 'FINE', 'POLICY_UPDATE', 'LICENSE_REVOKED') NOT NULL,
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    official_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback_submissions(feedback_id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- =========================================================
-- 4. TRIGGERS (Voor Rol-beveiliging en Wachtwoord logs)
-- =========================================================

DELIMITER $$

CREATE TRIGGER before_user_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    DECLARE v_executor_role VARCHAR(50);
    DECLARE v_executor_id INT;

    SELECT current_action_by_user_id INTO v_executor_id FROM app_session WHERE session_id = 1;

    -- Controleer rol-wijziging (Alleen SUPERADMIN)
    IF OLD.role <> NEW.role THEN
        SELECT role INTO v_executor_role FROM users WHERE user_id = v_executor_id;
        IF v_executor_role IS NULL OR v_executor_role <> 'SUPERADMIN' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Toegang Geweigerd: Alleen een SUPERADMIN mag gebruikersrollen wijzigen.';
        END IF;
    END IF;

    -- Log wachtwoord wijziging + notificatie
    IF OLD.password_hash <> NEW.password_hash THEN
        INSERT INTO password_logs (user_id, ip_address, user_agent)
        VALUES (OLD.user_id, '127.0.0.1', 'SwitiRit Web-Platform');

        INSERT INTO notifications (user_id, title, message)
        VALUES (
            OLD.user_id,
            '⚠️ Wachtwoord Gewijzigd!',
            CONCAT('Je wachtwoord is succesvol bijgewerkt op ', DATE_FORMAT(NOW(), '%d-%m-%Y om %H:%i:%s'), ' (IP: 127.0.0.1).')
        );
    END IF;
END$$

DELIMITER ;

-- =========================================================
-- 5. SEED DATA (Jouw team & de 24 lijnen)
-- =========================================================

INSERT INTO users (user_id, first_name, last_name, email, password_hash, role) VALUES  
(1, 'Kane', 'SystemAdmin', 'kjcsanajong@gmail.com', '$2b$10$M9bV8c7X6z5Y4w3V2u1tO6xG5qYjXzEw7M8k9C9d9E9f9G9h9i2b', 'SUPERADMIN'),
(2, 'Ashmit', 'Developer', 'amaharban5@gmail.com', '$2b$10$Rz7vO6Y8W9/eB7P8k7T1uO6XG5qYjXzEw7M8k9C9d9E9f9G9h9i1a', 'SUPERADMIN'),
(3, 'Teersa', 'Developer', 'teersamorgenstond07@gmail.com', '$2b$10$P1o2I3u4Y5t6R7e8W9q0O6xG5qYjXzEw7M8k9C9d9E9f9G9h9i3c', 'MINISTRY'),
(4, 'Chantelle', 'Developer', 'chanierelyveld@gmail.com', '$2b$10$Z1x2C3v4B5n6M7a8S9d0O6xG5qYjXzEw7M8k9C9d9E9f9G9h9i4d', 'PASSENGER'),
(5, 'Ferrence', 'SystemAdmin', 'itzzferr171@gmail.com', '$2b$10$V3w6X9z2B5e8H1k4M7q0O6xG5qYjXzEw7M8k9C9d9E9f9G9h9i5e', 'SUPERADMIN'),
(6, 'Garagedeur NV', 'Company', 'bedrijf@bus.sr', 'hashed_pass', 'COMPANY');

INSERT INTO bus_routes (route_id, route_name, description) VALUES  
(1, 'Lijn 1', 'CHM building - Hermitageweg'), 
(2, 'Lijn 2', 'Parking Place - Hernutterstr'), 
(3, 'Lijn 3', 'Vreedzaam Markt - Gompertstr'),
(4, 'Lijn 4', 'Platte Brug - Leonsberg'), 
(5, 'Lijn 5', 'Vreedzaam Markt - Guarinstr'), 
(6, 'Lijn 6', 'Maagdenstr - Reyneweg'),
(7, 'Lijn 7', 'CHM - Latourweg'), 
(8, 'Lijn 8', 'PCHM - ADEK University'), 
(9, 'Lijn 9', 'CHM - Mothonshooplaan'),
(10, 'Lijn 10', 'Heiligenweg - Rubestr'),
(11, 'PBRP', 'Paramaribo - Paranam - Billiton'), 
(12, 'PDP', 'Paramaribo - Domburg - Paranam'),
(13, 'PBO', 'Paramaribo - Billiton - Onverwacht'), 
(14, 'PL', 'Paramaribo - Lelydorp'), 
(15, 'TAMKAS', 'Tamenga - Kasabaholo'),
(16, 'PK', 'Paramaribo - Kwatta'), 
(17, 'PKs', 'Paramaribo - Kwatta Sophias Lust'), 
(18, 'PKo', 'Paramaribo - Kwatta - 5e Rijweg'),
(19, 'POND', 'Paramaribo - Pontbuiten'), 
(20, 'PE', 'Paramaribo - Ephraimszegen'), 
(21, 'PLH', 'Paramaribo - Luchthaven'),
(22, 'POZ', 'Paramaribo - Onverwacht - Zanderij'), 
(23, 'PSB', 'Paramaribo - Santo Boma'), 
(24, 'PNA', 'Paramaribo - Nieuw Amsterdam');

INSERT INTO buses (bus_id, plate_number, route_id, company_id, current_status) VALUES 
(1, 'PA 88-88', 1, 6, 'ACTIVE');

INSERT INTO bus_drivers (driver_id, company_id, first_name, last_name, license_number, phone_number) VALUES 
(1, 6, 'Sergino', 'Pinas', 'SUR-123456', '+597 888-8888');

INSERT INTO feedback_submissions (feedback_id, user_id, bus_id, driver_id, driving_rating, comfort_rating, hygiene_rating, airco_working, comment_text, suggestion_text) 
VALUES 
(1, 4, 1, 1, 4, 5, 3, 'JA', 'De chauffeur (Sergino) reed erg rustig over de drempels.', 'Meer bussen.');