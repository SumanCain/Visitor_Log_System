const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const Admin = require('./models/Admin');
const Visitor = require('./models/Visitor');


dotenv.config();
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session Middleware (important to keep this above routes)
app.use(session({
  secret: 'visitorlog_secret123',
  resave: false,
  saveUninitialized: false
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected ✅');
  })
  .catch((err) => {
    console.error('MongoDB connection error ❌:', err);
  });

// Admin middleware
function isAdmin(req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.get('/dashboard', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
  
    const totalVisitors = await Visitor.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const todayVisitors = await Visitor.countDocuments({
      date: { $gte: today }
    });
  
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 6);
  
    const last7DaysVisitors = await Visitor.countDocuments({
      date: { $gte: last7Days }
    });
  
    res.render('dashboard', {
      totalVisitors,
      todayVisitors,
      last7DaysVisitors
    });
  });
  

// Routes
const visitorRoutes = require('./routes/visitors');
app.use('/', visitorRoutes);

// Admin Login Routes
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username, password });

  if (admin) {
    req.session.admin = true;
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});

app.get('/reset', (req, res) => {
    res.render('reset', { error: null, success: null });
  });
  
  app.post('/reset', async (req, res) => {
    const { username, newPassword } = req.body;
    const admin = await Admin.findOne({ username });
  
    if (admin) {
      admin.password = newPassword;
      await admin.save();
      res.render('reset', { success: 'Password updated successfully ✅', error: null });
    } else {
      res.render('reset', { error: 'Admin not found ❌', success: null });
    }
  });
  

app.get('/register', (req, res) => {
    res.render('register');
  });
  
  app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const existingAdmin = await Admin.findOne({ username });
  
    if (existingAdmin) {
      res.send('❌ Admin already exists!');
    } else {
      const newAdmin = new Admin({ username, password });
      await newAdmin.save();
      res.redirect('/login');
    }
  });
  

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  });
  