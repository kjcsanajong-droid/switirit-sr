/**
 * SwitiRit.SR - Core Client Application Module
 * Dynamic State Handler & Matrix Interface Coordination Logic
 */

// Global Role Configuration Toggle for Live Classroom Demonstrations
const sessionContext = {
    userId: parseInt(sessionStorage.getItem('userId')) || 2,  // Haalt userId op uit sessionStorage, fallback naar 2
    role: sessionStorage.getItem('userRole') || "COMPANY",     // Haalt userRole op uit sessionStorage, fallback naar COMPANY
    displayName: "Decibel Corporate Fleet"
};

// Application Init Engine Hook (Consolidated)
document.addEventListener('DOMContentLoaded', () => {
    evaluateDynamicNavigation();
    
    // Auto-execute matching processes depending on the view layout
    if (document.getElementById('feedbackForm')) initFeedbackPage();
    if (document.getElementById('adminFeedbackContainer')) initTctDashboard();
    if (document.getElementById('busRouteSelect')) loadRoutesIntoDropdown();
    
    // Home Page Dynamic Route Table Trigger
    if (document.getElementById('dynamicRoutesTable')) loadHomeRoutesTable();
});

// Dynamic Layout Navigation Engine Injection
function evaluateDynamicNavigation() {
    const navContainer = document.querySelector('.nav-links');
    if (!navContainer) return;

    // Evaluate credentials and display appropriate admin modules
    if (sessionContext.role === 'SUPERADMIN') {
        navContainer.innerHTML += `<a href="super-panel.html" id="navSuper">Master Control</a>`;
    } else if (sessionContext.role === 'MINISTRY') {
        navContainer.innerHTML += `<a href="dashboard-tct.html" id="navTct">TCT Oversight</a>`;
    } else if (sessionContext.role === 'COMPANY') {
        const existingCompanyLink = navContainer.querySelector('a[href="company-panel.html"], #navCompany');
        if (!existingCompanyLink) {
            navContainer.innerHTML += `<a href="company-panel.html" id="navCompany">Mijn Vloot</a>`;
        }
    }
}

// Dropdown Query Processing Hook
async function loadRoutesIntoDropdown() {
    const dropdown = document.getElementById('busRouteSelect');
    if (!dropdown) return;

    try {
        const res = await fetch('http://localhost:5000/api/routes');
        const data = await res.json();
        dropdown.innerHTML = '<option value="">-- Selecteer Buslijn --</option>';
        data.forEach(item => {
            dropdown.innerHTML += `<option value="${item.route_id}">${item.route_name} - ${item.description}</option>`;
        });
    } catch (err) {
        console.error('System failed parsing active transit routes:', err);
    }
}

// Home Page Dynamic Table Data Fetcher
async function loadHomeRoutesTable() {
    const tableBody = document.getElementById('dynamicRoutesTable');
    if (!tableBody) return;

    try {
        const response = await fetch('http://localhost:5000/api/routes');
        const routes = await response.json(); // ✅ FIXED: Parse JSON and assign to routes
        
        tableBody.innerHTML = ''; // Clear the "loading..." text
        
        routes.forEach(route => {
            tableBody.innerHTML += `
                <tr>
                    <td><strong>${route.route_name}</strong></td>
                    <td>${route.description}</td>
                    <td><span class="badge active-badge">Operationeel</span></td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Fout bij het laden van home routes:', err);
        tableBody.innerHTML = '<tr><td colspan="3" style="color: red; padding: 15px; text-align: center;">Kon de dienstregeling niet laden uit de database. Zorg ervoor dat de server draait.</td></tr>';
    }
}

// FEEDBACK OPERATIONS LOGIC CHANNEL
function initFeedbackPage() {
    const form = document.getElementById('feedbackForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const feedbackPayload = {
            user_id: sessionContext.userId,
            route_id: document.getElementById('busRouteSelect').value,
            bus_plate: document.getElementById('busPlate').value.trim(),
            driving: document.getElementById('drivingRating').value,
            comfort: document.getElementById('comfortRating').value,
            hygiene: document.getElementById('hygieneRating').value,
            airco: document.getElementById('aircoWorking').value,
            comment: document.getElementById('commentText').value,
            suggestion: document.getElementById('suggestionText').value
        };

        try {
            const res = await fetch('http://localhost:5000/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackPayload)
            });
            const feedbackResult = await res.json();
            if (feedbackResult.success) {
                alert('Feedback succesvol verwerkt! Dank u voor uw bijdrage.');
                form.reset();
            } else {
                alert('Foutmelding: ' + feedbackResult.error);
            }
        } catch (err) {
            console.error('Network transport error:', err);
        }
    });
}

// TCT ADMINISTRATIVE INTERACTION ENGINE
async function initTctDashboard() {
    const feed = document.getElementById('adminFeedbackContainer');
    const enforcementForm = document.getElementById('enforcementForm');

    // Fetch and display active live database streams
    try {
        const res = await fetch('http://localhost:5000/api/admin/feedback', {
            headers: { 'x-user-role': sessionContext.role }
        });
        const items = await res.json();
        
        if(items.error) {
            feed.innerHTML = `<p style="color:red;">${items.error}</p>`;
            return;
        }

        feed.innerHTML = '';
        if (items.length === 0) {
            feed.innerHTML = '<p>Geen openstaande rittenbeoordelingen gevonden.</p>';
        } else {
            items.forEach(data => {
                feed.innerHTML += `
                    <div class="feedback-card" style="border-left: 4px solid var(--sr-red); padding:15px; margin-bottom:10px; background:#fafafa;">
                        <h4>ID: ${data.feedback_id} | Bus: ${data.plate_number} (${data.route_name})</h4>
                        <p><strong>Rijgedrag:</strong> ${data.driving_rating}/5 | <strong>Comfort:</strong> ${data.comfort_rating}/5 | <strong>Hygiëne:</strong> ${data.hygiene_rating}/5</p>
                        <p><strong>Airco:</strong> ${data.airco_working}</p>
                        <p><strong>Opmerking:</strong> ${data.comment_text || 'Geen commentaar'}</p>
                        <p style="color:var(--sr-green);"><strong>Suggestion Bar:</strong> ${data.suggestion_text || 'Geen suggestie'}</p>
                    </div>`;
            });
        }
    } catch (err) {
        feed.innerHTML = '<p>Systeemenpasing verwerkingsfout database.</p>';
    }

    // Submit enforcement actions (Fines/Warnings)
    if(enforcementForm) {
        enforcementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const actionPayload = {
                feedback_id: document.getElementById('targetFeedbackId').value,
                officer_id: sessionContext.userId,
                action_type: document.getElementById('actionType').value,
                fine_amount: document.getElementById('fineAmount').value,
                notes: document.getElementById('officialNotes').value
            };

            try {
                const res = await fetch('http://localhost:5000/api/admin/enforce', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-role': sessionContext.role
                    },
                    body: JSON.stringify(actionPayload)
                });
                const enforcementResult = await res.json();
                if(enforcementResult.success) {
                    alert('Handhavingsmaatregel officieel opgeslagen!');
                    enforcementForm.reset();
                } else {
                    alert('Fout: ' + enforcementResult.error);
                }
            } catch (err) {
                console.error('Failed to post enforcement entry:', err);
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
    // Grab the input field for the Kenteken/ID and the dropdown
            const targetInput = document.getElementById('targetEntity'); 
            const actionSelect = document.getElementById('actionType'); 

                    if (!targetInput || !actionSelect) return;

                    // 1. MOCK DATABASE: Simulating a backend driver record.
                    // -> You can type these license plates into your input field to test the UI!
                        const driverHistoryDB = {
                            "PL-11-11": { warnings: 1, fines: 0, suspensions: 0 }, // Has 1 warning -> Should still show Warning
                            "PL-22-22": { warnings: 3, fines: 0, suspensions: 0 }, // Maxed Warnings -> Should grey out warnings, enable Fine
                            "PL-33-33": { warnings: 3, fines: 2, suspensions: 0 }, // Maxed Fines -> Should enable Suspension
                            "PL-44-44": { warnings: 3, fines: 2, suspensions: 1 }  // Maxed Suspensions -> Forces License Revoke
                     };

            // 2. Listen to the input field. Every time the official types, check the ladder.
            targetInput.addEventListener('input', (e) => {
                const driverId = e.target.value.trim().toUpperCase();
                enforceSanctionLadder(driverId);
            });

            function enforceSanctionLadder(driverId) {
                // Fetch driver history, or default to a clean slate (0 offenses)
                const history = driverHistoryDB[driverId] || { warnings: 0, fines: 0, suspensions: 0 };

                // Target all the specific options
                const optWarning = actionSelect.querySelector('option[value="WARNING"]');
                const optFine = actionSelect.querySelector('option[value="FINE"]');
                const optSuspension = actionSelect.querySelector('option[value="SUSPENSION"]');
                const optRevoke = actionSelect.querySelector('option[value="LICENSE_REVOKED"]');

                // Helper function to dynamically disable (grey-out) and change the text
                const setOptionState = (opt, isDisabled) => {
                    if (!opt) return;
                    opt.disabled = isDisabled;
                    
                    // Clean up old status emojis before adding new ones
                    opt.text = opt.text.replace(/ 🔒| ✅/g, ''); 
                    
                    if (isDisabled) {
                        opt.text += ' 🔒'; // Adds a visual lock to greyed-out items
                    } else {
                        opt.text += ' ✅'; // Highlights the allowed action
                    }
                };

            // Step 1: Lock all sanction options by default
                setOptionState(optWarning, true);
                setOptionState(optFine, true);
                setOptionState(optSuspension, true);
                setOptionState(optRevoke, true);

            // Step 2: Evaluate the logic and unlock ONLY the correct step in the ladder
                if (history.warnings < 3) {
                    setOptionState(optWarning, false);
                    actionSelect.value = "WARNING";     // Auto-select the allowed step
                } 
                else if (history.fines < 2) {
                    setOptionState(optFine, false);
                    actionSelect.value = "FINE";
                } 
                else if (history.suspensions < 1) {
                    setOptionState(optSuspension, false);
                    actionSelect.value = "SUSPENSION";
                } 
                else {
                    // Driver has maxed everything. Only revocation is left.
                    setOptionState(optRevoke, false);
                    actionSelect.value = "LICENSE_REVOKED";
                }
            }
        });
    }
    
}
