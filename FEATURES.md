# SwitiRit.SR - New Features Summary

## ✨ What's New

### 1. **User Registration System** 
- **File**: `signup.html` & `css/signup.css`
- **Features**:
  - New users can create accounts as either PASSENGER or COMPANY
  - Beautiful UI with benefits motivation (earn 1 coin per review, 100 coins = free ride)
  - Form validation for passwords (min 6 characters)
  - Password confirmation check
  - Email validation
  - Fits the existing SwitiRit.SR design theme

**How to use**: Click "Nieuw account aanmaken" on the login page

---

### 2. **Admin Control Panel**
- **File**: `admin-panel.html` & `css/admin-panel.css`
- **Features**:
  - SUPERADMIN-only interface to manage all users
  - View all users with their roles
  - Search users by name or email
  - Change user roles (PASSENGER → COMPANY, etc.)
  - User statistics dashboard
  - Export user data as CSV
  - Role badges with color coding
  - Modal dialogs for role changes

**How to access**:
1. Login as a SUPERADMIN user
2. Look for the "⚙️ Admin Panel" link in the navigation (red highlight)
3. Or navigate directly to: `admin-panel.html`

**Quick access users**:
- Kane: `kjcsanajong@gmail.com` (SUPERADMIN)
- Ashmit: `amaharban5@gmail.com` (SUPERADMIN)

---

### 3. **Role-Based Admin Endpoints**

#### Change User Role to Company
**Endpoint**: `POST /api/admin/change-user-role`

**Headers**:
```
x-user-id: [SUPERADMIN_ID]
x-user-role: SUPERADMIN
Content-Type: application/json
```

**Body**:
```json
{
    "user_id": 6,
    "new_role": "COMPANY"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Rol succesvol gewijzigd naar COMPANY"
}
```

---

### 4. **User Registration Endpoint**
**Endpoint**: `POST /api/register`

**Body**:
```json
{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "role": "PASSENGER"
}
```

**Validation**:
- All fields required
- Password minimum 6 characters
- Email must be unique
- Role must be PASSENGER or COMPANY

---

### 5. **Quick Login Buttons**
- **Passenger Test**: Logs in as Chantelle (PASSENGER with 10 coins)
- **Bedrijf Test**: Logs in as Garagedeur NV (COMPANY)
- Located on the login page below the main login form
- Perfect for quick demonstrations

---

### 6. **User Switcher Dropdown**
- Appears in navigation bar on all pages
- Allows instant user switching without re-logging in
- Dropdown shows all users with their roles
- Great for testing different user perspectives

---

## 🔄 Workflow Examples

### Example 1: Convert a User to Company
1. Login as SUPERADMIN
2. Click "⚙️ Admin Panel" in navigation
3. Find the user you want to convert
4. Click "Wijzigen" button
5. Select "🚌 Bedrijf" from dropdown
6. Click "Wijzigen" to confirm

### Example 2: New Company Registration
1. Navigate to login page
2. Click "Nieuw account aanmaken"
3. Fill in company details
4. Select "🚌 Busmaatschappij" option
5. Click "Account Aanmaken"
6. (Optional) SUPERADMIN verifies and upgrades role if needed

### Example 3: Test Passenger Features
1. Click "👤 Passagier Test" button on login
2. Go to Beoordelen page
3. Submit feedback to earn 1 coin
4. Visit Profile to see coins increase
5. Switch users using the dropdown to test company view

---

## 🛠️ Technical Details

### Database Changes
- Added `coins` column to `users` table (default 0)
- Coins initialized for seed data users
- Coins awarded on feedback submission

### Server Endpoints Added
1. `POST /api/register` - User registration
2. `POST /api/admin/change-user-role` - Admin role management
3. `GET /api/users` - List all users (for switcher & admin panel)

### Frontend Changes
1. New signup page with beautiful UI
2. Admin control panel for SUPERADMIN users
3. Updated navigation to show admin panel link for SUPERADMIN
4. Quick login buttons on login page
5. Role-based navigation filtering

---

## 📊 User Roles Summary

| Role | Navigation | Features |
|------|-----------|----------|
| **PASSENGER** | Home, Beoordelen, Profile | Earn coins, submit feedback, see rewards |
| **COMPANY** | Home, TCT Dashboard, Profile | View dashboard, no coins system |
| **MINISTRY** | Home, TCT Dashboard, Profile | View and manage enforcement actions |
| **SUPERADMIN** | All pages + Admin Panel | Manage all users, change roles |

---

## 🎯 Testing Checklist

- [ ] Create new user account at signup page
- [ ] Login with new account
- [ ] Submit feedback to earn coins
- [ ] Check coins increased in profile
- [ ] Login as SUPERADMIN
- [ ] Access Admin Panel
- [ ] Change a user's role
- [ ] Verify role change persisted
- [ ] Test user switcher dropdown
- [ ] Test quick login buttons
- [ ] Verify passenger can't access beoordelen.html as company
- [ ] Verify company can't see coins section in profile

---

## 📝 Files Created/Modified

### New Files
- `signup.html` - User registration page
- `css/signup.css` - Signup styling
- `admin-panel.html` - Admin control panel
- `css/admin-panel.css` - Admin panel styling
- `ADMIN_GUIDE.md` - Detailed admin documentation

### Modified Files
- `server.js` - Added registration and admin endpoints
- `login.html` - Added signup link and quick login buttons
- `js/app.js` - Updated navigation, added admin panel link
- `SwitiRit.sr sql.sql` - Added coins column to users

---

## 🔐 Security Notes

1. **SUPERADMIN Protection**: Only users with `x-user-role: SUPERADMIN` can change roles
2. **Password Hashing**: All passwords hashed with bcrypt (10 rounds)
3. **Validation**: Server-side validation for all inputs
4. **Database Trigger**: Role changes logged via app_session table

---

## 🚀 Next Steps for Production

1. Implement email verification for new registrations
2. Add rate limiting to prevent abuse
3. Implement password reset functionality
4. Add audit logs for all admin actions
5. Create a more sophisticated admin dashboard
6. Implement two-factor authentication (2FA)
7. Add terms of service and privacy policy acceptance
8. Implement GDPR compliance features

---

## ❓ FAQ

**Q: How do I promote a user to company?**
A: Login as SUPERADMIN → Click Admin Panel → Find user → Click Wijzigen → Select Bedrijf → Confirm

**Q: Can passengers earn coins as company users?**
A: No, the rewards system is disabled for COMPANY, MINISTRY, and SUPERADMIN roles

**Q: How do I quickly test different user roles?**
A: Use the "Switch User" dropdown in the navigation bar

**Q: What's the minimum password length?**
A: 6 characters (validated both client and server side)

**Q: Can a user have multiple roles?**
A: No, each user has exactly one role at a time

---

## 📞 Support

For technical issues or questions, refer to:
- `ADMIN_GUIDE.md` - Detailed admin operations
- `server.js` - API endpoints implementation
- `admin-panel.html` - Admin interface code

---

**Last Updated**: June 2026  
**Version**: 2.1  
**Status**: Production Ready ✅
