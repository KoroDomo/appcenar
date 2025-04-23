// server.js
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

