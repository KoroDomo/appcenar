const bcrypt = require('bcryptjs');
const { Usuario } = require('../../models');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config(); // solo si usarás .env

const generarToken = () => crypto.randomBytes(20).toString('hex');

const enviarCorreoActivacion = async (correo, token) => {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 587,
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

const enviarCorreoReset = async (correo, token) => {
    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 587,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
      }
    });
  
    const url = `http://localhost:3000/resetear-contrasena?token=${token}`;
  
    await transporter.sendMail({
      from: '"AppCenar" <no-reply@appcenar.com>',
      to: correo,
      subject: 'Recuperación de contraseña',
      html: `<p>Haz clic aquí para cambiar tu contraseña:</p><a href="${url}">${url}</a>`
    });
  };
  

const authController = {
  viewLogin: (req, res) => {
    res.render('auth/login', { message: req.flash('message') });
  },

  viewRegister: (req, res) => {
    res.render('auth/register', { message: req.flash('message') });
  },

  viewResetear: async (req, res) => {
    const { token } = req.query;
  
    const usuario = await Usuario.findOne({ where: { token_reset: token } });
  
    if (!usuario) {
      req.flash('message', 'Token inválido o expirado.');
      return res.redirect('/login');
    }
  
    res.render('auth/resetear', { token, message: req.flash('message') });
  },

  resetearContrasena: async (req, res) => {
    const { token, password, confirmPassword } = req.body;
  
    if (password !== confirmPassword) {
      req.flash('message', 'Las contraseñas no coinciden.');
      return res.redirect(`/resetear-contrasena?token=${token}`);
    }
  
    const usuario = await Usuario.findOne({ where: { token_reset: token } });
  
    if (!usuario) {
      req.flash('message', 'Token inválido o expirado.');
      return res.redirect('/login');
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    usuario.password = hashedPassword;
    usuario.token_reset = null;
    await usuario.save();
  
    req.flash('message', 'Contraseña actualizada. Inicia sesión.');
    res.redirect('/login');
  },
  
  viewRecuperar: (req, res) => {
    res.render('auth/recuperar', { message: req.flash('message') });
  },
  
  enviarTokenReset: async (req, res) => {
    const { identificador } = req.body;
    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { nombre_usuario: identificador },
          { correo: identificador }
        ]
      }
    });
  
    if (!usuario) {
      req.flash('message', 'Usuario no encontrado');
      return res.redirect('/recuperar');
    }
  
    const token = crypto.randomBytes(20).toString('hex');
    usuario.token_reset = token;
    await usuario.save();
  
    await enviarCorreoReset(usuario.correo, token);
  
    req.flash('message', 'Revisa tu correo para continuar.');
    res.redirect('/login');
  },
  

  login: async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await Usuario.findOne({
        where: { nombre_usuario: username }
      });
  
      if (!user) {
        req.flash('message', 'Usuario no encontrado');
        return res.redirect('/login');
      }
  
      const match = await bcrypt.compare(password, user.contrasena);
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
    } catch (error) {
      console.error("Error en login:", error);
      req.flash('message', 'Error inesperado al iniciar sesión');
      res.redirect('/login');
    }
  },

  register: async (req, res) => {
    const { username, password, confirmPassword, correo } = req.body;
  
    try {
      if (password !== confirmPassword) {
        req.flash('message', 'Las contraseñas no coinciden');
        return res.redirect('/register');
      }
  
      const existing = await Usuario.findOne({
        where: { nombre_usuario: username }
      });
  
      if (existing) {
        req.flash('message', 'Este usuario ya existe');
        return res.redirect('/register');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const token = generarToken(); // Función que ya tienes declarada arriba
  
        //log
        console.log("Token generado:", token);
        console.log("Datos del usuario a registrar:", {
            nombre_usuario: username,
            correo,
            contrasena: hashedPassword,
            rol: 'cliente',
            estado: false,
            token_activacion: token
          });

      await Usuario.create({
        nombre_usuario: username,
        correo: correo,
        contrasena: hashedPassword,
        rol: 'cliente',
        estado: false,
        token_activacion: token
      });
  
      await enviarCorreoActivacion(correo, token);
  
      req.flash('message', 'Usuario creado. Revisa tu correo para activarlo.');
      res.redirect('/login');
  
    } catch (error) {
      console.error("Error en register:", error);
      req.flash('message', 'Error inesperado al registrarse.');
      res.redirect('/register');
    }
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
