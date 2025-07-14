require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');

// Routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');


// Models
const User = require('./routes/users'); // ⚠️ Path must point to userSchema file

var app = express();

// ----------------- View Engine -----------------
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ----------------- Middleware -----------------
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// ----------------- Session + Flash -----------------
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboardcat',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// ----------------- Passport Config -----------------
app.use(passport.initialize());
app.use(passport.session());

// Passport Strategy Setup
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ----------------- Flash Messages Middleware -----------------
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error'); // passport-specific error
  res.locals.user = req.user || null;
  next();
});

// ----------------- MongoDB Connection -----------------
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.log('❌ MongoDB connection error:', err));

// ----------------- Routes -----------------
app.use('/', indexRouter);
app.use('/users', usersRouter);

// ----------------- 404 Handler -----------------
app.use(function(req, res, next) {
  next(createError(404));
});

// ----------------- Error Handler -----------------
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
