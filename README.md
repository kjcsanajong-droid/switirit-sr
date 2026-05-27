# SwitiRit.SR Feedback Portal

## Project Title
SwitiRit.SR - Bus Feedback Portal

## Description
Een webapplicatie voor passagiers en buschauffeurs om feedback te geven over busritten. De backend verwerkt login, routes en feedback via een MySQL-database.

## Technologies Used
- Node.js
- Express
- MySQL (mysql2)
- JSON Web Tokens (`jsonwebtoken`)
- bcrypt
- CORS
- dotenv
- Vanilla HTML/CSS/JavaScript

## Project structure
- `server.js` - Backend entry point
- `routes/` - API route modules
- `middlewares/` - Authentication and validation logic
- `config/db.js` - Database connection pool configuration
- `sql/schema.sql` - Database creation and seed data
- `public/` - Frontend assets and HTML pages

## Requirements
- Node.js 18+ of hoger
- MySQL-server

## Installation
1. Clone de repository.
2. Kopieer `.env.example` naar `.env`:
   ```bash
   copy .env.example .env
   ```
3. Vul de databasegegevens in `.env` in.
4. Installeer dependencies:
   ```bash
   npm install
   ```
5. Start de server:
   ```bash
   npm start
   ```

## Setting up the database
1. Maak een database genaamd `switirit_db` in MySQL.
2. Importeer het SQL-schema in `sql/schema.sql`:
   ```bash
   mysql -u root -p switirit_db < "sql/schema.sql"
   ```
3. Pas eventueel de `DB_PASSWORD` en andere instellingen in `.env` aan.

## Usage
- Gebruik `npm start` om de server te starten.
- Open de applicatie in een browser op `http://localhost:5000`.
- De frontend-pagina's en assets worden geladen vanuit de `public/` map.

## Notes
- Zorg ervoor dat de folder `node_modules` NIET wordt opgenomen in de inzending.
- Het bestand `.env` bevat gevoelige gegevens en moet worden genegeerd door Git.
