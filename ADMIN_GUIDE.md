# SwitiRit.SR - Admin Guide for Superadmin Role Management

## Overview
This guide explains how a SUPERADMIN can change user roles from PASSENGER to COMPANY (or any other role).

## Method 1: Using API Endpoint (Programmatic)

### Endpoint: Change User Role
```
POST /api/admin/change-user-role
```

### Headers Required:
```
x-user-id: [SUPERADMIN_USER_ID]
x-user-role: SUPERADMIN
Content-Type: application/json
```

### Request Body:
```json
{
    "user_id": 6,
    "new_role": "COMPANY"
}
```

### Example using cURL:
```bash
curl -X POST http://localhost:5000/api/admin/change-user-role \
  -H "x-user-id: 1" \
  -H "x-user-role: SUPERADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 6,
    "new_role": "COMPANY"
  }'
```

### Example using JavaScript/Fetch:
```javascript
async function changeUserRole(userId, newRole) {
    const response = await fetch('http://localhost:5000/api/admin/change-user-role', {
        method: 'POST',
        headers: {
            'x-user-id': '1', // Your superadmin ID
            'x-user-role': 'SUPERADMIN',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: userId,
            new_role: newRole
        })
    });

    const data = await response.json();
    if (data.success) {
        console.log('Role changed successfully:', data.message);
    } else {
        console.error('Error:', data.error);
    }
}

// Usage
changeUserRole(6, 'COMPANY');
```

---

## Method 2: Direct Database Update (SQL)

If you have direct database access, you can also update roles directly:

```sql
-- Change user with ID 6 to COMPANY role
UPDATE users SET role = 'COMPANY' WHERE user_id = 6;

-- Verify the change
SELECT user_id, first_name, last_name, email, role FROM users WHERE user_id = 6;
```

---

## Available Roles

| Role | Description | Features |
|------|-------------|----------|
| `PASSENGER` | Regular user | Can submit feedback, earn coins, see profile |
| `COMPANY` | Bus company owner | Can view TCT dashboard, manage fleet |
| `MINISTRY` | Transport ministry | Can view TCT dashboard, enforcement actions |
| `SUPERADMIN` | System administrator | Full access to all features and admin functions |

---

## Current Test Users

```
ID  | Name              | Email                      | Role       | Coins
----|-------------------|----------------------------|------------|--------
1   | Kane SystemAdmin  | kjcsanajong@gmail.com     | SUPERADMIN | 0
2   | Ashmit Developer  | amaharban5@gmail.com      | SUPERADMIN | 5
3   | Teersa Developer  | teersamorgenstond07@gmail | MINISTRY   | 0
4   | Chantelle         | chanierelyveld@gmail.com  | PASSENGER  | 10
5   | Ferrence          | itzzferr171@gmail.com     | SUPERADMIN | 0
6   | Garagedeur NV     | bedrijf@bus.sr            | COMPANY    | 0
```

---

## Security Notes

1. **Only SUPERADMIN can change roles**: The endpoint checks that the request header contains `x-user-role: SUPERADMIN`
2. **Role changes are logged**: The database trigger logs who made the change via `app_session`
3. **Validation**: The endpoint validates that the new role is one of: `PASSENGER`, `COMPANY`, `MINISTRY`, `SUPERADMIN`

---

## Troubleshooting

### Error: "Alleen SUPERADMIN mag gebruikersrollen wijzigen"
- Make sure you're sending the correct headers: `x-user-role: SUPERADMIN`
- Verify you're logged in as a SUPERADMIN account

### Error: "user_id en new_role zijn verplicht"
- Check that both `user_id` and `new_role` are included in the request body
- Ensure they are not empty or null

### Error: "Ongeldig rol type"
- The role you specified is not valid
- Use one of: `PASSENGER`, `COMPANY`, `MINISTRY`, `SUPERADMIN`

---

## Testing the Admin Functions

### Quick Test (Browser Console)
When logged in as SUPERADMIN on any page:

```javascript
// Change user 4 (Chantelle) from PASSENGER to COMPANY
changeUserRole(4, 'COMPANY');

// Change user 6 back to PASSENGER
changeUserRole(6, 'PASSENGER');
```

Where `changeUserRole` is defined as shown in Method 1 above.

---

## Registration Flow for New Bus Companies

1. Company representative creates an account at `signup.html`
   - Select "🚌 Busmaatschappij" (Bus Company) option
   - Fill in company details

2. SUPERADMIN verifies the account in database:
   ```sql
   SELECT * FROM users WHERE role = 'COMPANY' AND email LIKE '%@bus.sr%';
   ```

3. If needed, SUPERADMIN can upgrade any user to COMPANY using the change-user-role endpoint

4. Company user can now access:
   - Home page
   - TCT Dashboard
   - Profile (without rewards system)

---

## Next Steps

For a future production environment, consider:
- Building an admin dashboard UI for role management
- Implementing email verification for new registrations
- Adding audit logs for all role changes
- Implementing rate limiting on API endpoints
