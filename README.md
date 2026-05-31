# Campus Event Registration & Login System (EventFlow SQL)

EventFlow SQL is a modern, responsive, full-stack database management project website. It is designed to impress university evaluators with high-end glassmorphic visuals and a built-in interactive SQL terminal playground, while using clean, parameterized **raw SQL queries** (using MySQL) and Node.js to keep database concepts transparent and easily explainable for your viva.

---

## 🚀 Key Highlights

1. **Auto-Initializing Database:** No manual `.sql` file imports are required. Our system automatically connects to your local MySQL server, builds the database, sets up relational schemas, and seeds dummy records on first boot!
2. **Interactive SQL Terminal:** Includes a live terminal shell directly in the student dashboard where you can run predefined or custom `SELECT` statements and view query outputs in a neat database table grid with line-by-line viva explanations.
3. **Double-Role Access Control:** Supports isolated Student (registration management, event enrolling) and System Administrator (analytics stats, CRUD events panel, registrations logs) workflows.
4. **Print-to-PDF Project Report:** Open `report.html` in your browser and click "Export to PDF" to get a clean, academically formatted project report with cover pages, folder maps, schema structures, and full SQL Q&As!

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (curated variables, glassmorphism, fluid animations), Vanilla Javascript.
- **Backend:** Node.js, Express.js.
- **Database:** MySQL.
- **Library Modules:** `mysql2`, `bcryptjs`, `express-session`, `dotenv`.

---

## 📁 Modular Directory Maps

```
campus-event-system/
├── server.js                 # Express master boot entry point
├── package.json              # System dependencies and npm scripts
├── .env                      # Database port credentials
├── config/
│   └── db.js                 # Pool builder & auto-seeder system
├── routes/
│   ├── auth.js               # Sign In / Sign Up endpoints
│   ├── events.js             # Event list & registration actions
│   ├── admin.js              # Stats & search registry logs
│   └── queries.js            # Live SQL console runner
├── controllers/
│   ├── authController.js     # User registration/login logic
│   ├── eventController.js    # Student registration & seat limits logic
│   ├── adminController.js    # Metric compilations
│   └── queryController.js    # Pre-configured queries & sandbox compiler
├── middleware/
│   └── authMiddleware.js     # Route protection guards
├── database/
│   ├── schema.sql            # Table DDL commands
│   └── dummy_data.sql        # Mock database records
└── public/                   # Frontend assets
    ├── index.html            # Core landing portal
    ├── auth.html             # Account login/sign-up forms
    ├── dashboard.html        # Student console workspace
    ├── admin.html            # Administrator stats panel
    ├── report.html           # Print-ready project documentation & viva guide
    ├── css/style.css         # Theme stylesheet
    └── js/
        ├── app.js            # Core session checks & student hooks
        ├── admin.js          # Admin managers
        └── query.js          # Live console playground hook
```

---

## ⚙️ Quick Start Installation

### Step 1: Clone or Copy Files
Ensure all project files are placed in your development folder.

### Step 2: Start MySQL Server
Start your local MySQL database server. Typically, you can do this by launching **XAMPP Control Panel** and clicking **"Start"** next to **MySQL** (or starting WampServer / local MySQL Services).

### Step 3: Install Node Packages
Open your terminal inside the project directory and run:
```bash
npm install
```

### Step 4: Boot the Application
Run the startup command in your terminal:
```bash
npm start
```

### Step 5: Test the System
Open your web browser and navigate to:
```
http://localhost:3000
```

---

## 🔐 Credentials Checklist

To test both portals, you can register new accounts or use our pre-seeded active accounts:

| Access Role | Username (Email) | Password | Purpose |
|---|---|---|---|
| **Student** | `alice@student.edu` | `student123` | Browses active events, logs registrations, runs live SQL terminal codes. |
| **Admin** | `admin@campus.edu` | `admin123` | Adds/Edits/Deletes events, checks statistical metrics, runs triple join search logs. |
