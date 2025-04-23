// src/app.js
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const exphbs = require('express-handlebars');

const app = express();

// Middlewares globales
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret: 'appcenar_secret',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());

// Public folder y motor de vistas
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configurar Handlebars
app.engine('hbs', exphbs.engine({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Rutas
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);


// app.use('/', require('./routes/homeRoutes'));

module.exports = app;
