const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Vistas
router.get('/login', authController.viewLogin);
router.get('/register', authController.viewRegister);
router.get('/logout', authController.logout);
router.get('/activar-cuenta', authController.activarCuenta);
router.get('/', (req, res) => {
    res.redirect('/login');
  });
  


// Acciones
router.post('/login', authController.login);
router.post('/register', authController.register);

module.exports = router;
