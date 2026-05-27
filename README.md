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
- Vanilla HTML/CSS/JavaScript

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
2. Importeer de SQL-schema in `SwitiRit.sr sql.sql`:
   ```bash
   mysql -u root -p switirit_db < "SwitiRit.sr sql.sql"
   ```
3. Pas eventueel de `DB_PASSWORD` en andere instellingen in `.env` aan.

## Usage
- Open de front-end bestanden in een browser of gebruik een statische server.
- De backend API draait op `http://localhost:5000`.
- De front-end kan `index.html`, `login.html`, `profile.html` en andere pagina's gebruiken.

## Notes
- Zorg ervoor dat de folder `node_modules` NIET wordt opgenomen in de inzending.
- Het bestand `.env` bevat gevoelige gegevens en moet worden genegeerd door Git.
