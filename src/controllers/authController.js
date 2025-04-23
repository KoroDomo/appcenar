const bcrypt = require('bcryptjs');
const { Usuario } = require('../../models');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config(); // solo si usarás .env

const generarToken = () => crypto.randomBytes(20).toString('hex');

const enviarCorreoActivacion = async (correo, token) => {
  const transporter = nodemailer.createTransport({
    service: 'sandbox.smtp.mailtrap.io',
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
    }
  });

  const url = `http://localhost:3000/activar-cuenta?token=${token}`;

  await transporter.sendMail({
    from: '"AppCenar" <no-reply@appcenar.com>',
    to: correo,
    subject: 'Activa tu cuenta',
    html: `<p>Haz clic aquí para activar tu cuenta:</p><a href="${url}">${url}</a>`
  });
};

const authController = {
  viewLogin: (req, res) => {
    res.render('auth/login', { message: req.flash('message') });
  },

  viewRegister: (req, res) => {
    res.render('auth/register', { message: req.flash('message') });
  },

  login: async (req, res) => {
    const { username, password } = req.body;
    const user = await Usuario.findOne({
      where: { nombreUsuario: username }
    });

    if (!user) {
      req.flash('message', 'Usuario no encontrado');
      return res.redirect('/login');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash('message', 'Contraseña incorrecta');
      return res.redirect('/login');
    }

    if (!user.estado) {
      req.flash('message', 'Cuenta inactiva. Revisa tu correo.');
      return res.redirect('/login');
    }

    req.session.user = user;
    res.redirect('/dashboard');
  },

  register: async (req, res) => {
    const { username, password, confirmPassword, correo } = req.body;
  
    if (password !== confirmPassword) {
      req.flash('message', 'Las contraseñas no coinciden');
      return res.redirect('/register');
    }
  
    const existing = await Usuario.findOne({
      where: { nombreUsuario: username }
    });
  
    if (existing) {
      req.flash('message', 'Este usuario ya existe');
      return res.redirect('/register');
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = generarToken(); // usamos tu función ya declarada arriba
  
    await Usuario.create({
      nombreUsuario: username,
      correo: correo,
      password: hashedPassword,
      rol: 'cliente',
      estado: false,
      token_activacion: token
    });
  
    await enviarCorreoActivacion(correo, token);
  
    req.flash('message', 'Usuario creado. Revisa tu correo para activarlo.');
    res.redirect('/login');
  },

  activarCuenta: async (req, res) => {
    const { token } = req.query;
  
    const usuario = await Usuario.findOne({ where: { token_activacion: token } });
  
    if (!usuario) {
      req.flash('message', 'Token inválido o expirado.');
      return res.redirect('/login');
    }
  
    usuario.estado = true;
    usuario.token_activacion = null;
    await usuario.save();
  
    req.flash('message', 'Cuenta activada. Ya puedes iniciar sesión.');
    res.redirect('/login');
  },

  logout: (req, res) => {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  }
  
  
};

module.exports = authController;
