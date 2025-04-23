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

//Recuperar
router.get('/recuperar', authController.viewRecuperar);
router.post('/recuperar', authController.enviarTokenReset);
router.get('/resetear-contrasena', authController.viewResetear);
router.post('/resetear-contrasena', authController.resetearContrasena);

// Dashboard
router.get('/dashboard', (req, res) => {
    if (!req.session.user) {
      req.flash('message', 'Debes iniciar sesión primero');
      return res.redirect('/login');
    }
  
    res.render('auth/dashboard', { user: req.session.user });
  });
  

module.exports = router;
