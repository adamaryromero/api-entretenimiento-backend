import { conmysql } from '../db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';

export const login = async (req, res) => {
    try {
        const { correo, password, fcm_token } = req.body;

        if (!correo || !password) {
            return res.status(400).json({ message: "Por favor, envía correo y contraseña" });
        }

        const [result] = await conmysql.query(
            'SELECT * FROM usuarios WHERE correo = ?', 
            [correo]
        );

        if (result.length === 0) {
            return res.status(401).json({ message: "Credenciales incorrectas" });
        }

        const usuario = result[0];

        const passwordCorrecta = await bcrypt.compare(password, usuario.password);

        if (!passwordCorrecta) {
            return res.status(401).json({ message: "Credenciales incorrectas" });
        }

        if (fcm_token) {
            await conmysql.query(
                'UPDATE usuarios SET fcm_token = ? WHERE id = ?',
                [fcm_token, usuario.id]
            );
        }

        const token = jwt.sign(
            { 
                id: usuario.id, 
                nombre: usuario.nombre, 
                correo: usuario.correo,
                rol: usuario.rol 
            }, 
            JWT_SECRET, 
            { expiresIn: '365d' } 
        );

        res.json({
            message: "Inicio de sesión exitoso",
            token: token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol 
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error en el servidor al iniciar sesión" });
    }
};

export const registrarUsuario = async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;

        if (!nombre || !correo || !password) {
            return res.status(400).json({ message: "Faltan datos obligatorios" });
        }

        const [usuariosExistentes] = await conmysql.query(
            'SELECT correo, nombre FROM usuarios WHERE correo = ? OR nombre = ?',
            [correo, nombre]
        );

        if (usuariosExistentes.length > 0) {
            const conflicto = usuariosExistentes[0];
            if (conflicto.correo === correo) {
                return res.status(400).json({ message: "Este correo ya está registrado en otra cuenta." });
            }
            if (conflicto.nombre === nombre) {
                return res.status(400).json({ message: "El nombre de usuario ya está en uso. ¡Elige otro!" });
            }
        }

        const avatar_url = `https://api.dicebear.com/7.x/bottts/svg?seed=${nombre.replace(/\s+/g, '')}`;

        const passwordHasheada = await bcrypt.hash(password, 10);

        const [result] = await conmysql.query(
            'INSERT INTO usuarios (nombre, correo, password, avatar_url) VALUES (?, ?, ?, ?)',
            [nombre, correo, passwordHasheada, avatar_url]
        );

        res.status(201).json({ message: "Usuario creado exitosamente" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al registrar el usuario" });
    }
};

export const obtenerMiPerfil = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(401).json({ message: "No autorizado" });

        const decodificado = jwt.verify(token, JWT_SECRET);
        const userId = decodificado.id; 

        const [rows] = await conmysql.query(
            'SELECT nombre, correo, avatar_url, biografia FROM usuarios WHERE id = ?', 
            [userId]
        );

        if (rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });

        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener los datos del perfil" });
    }
};

export const obtenerComunidadPorObra = async (req, res) => {
    try {
        const contenidoId = req.params.id;
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [rows] = await conmysql.query(`
            SELECT 
                u.nombre, 
                u.avatar_url AS avatar, 
                u.biografia, 
                s.calificacion_personal AS calificacion, 
                r.comentario 
            FROM reseñas_comunidad r
            JOIN usuarios u ON r.usuario_id = u.id
            LEFT JOIN seguimientos s ON s.usuario_id = r.usuario_id AND s.contenido_id = r.contenido_id
            WHERE r.contenido_id = ?
            LIMIT ? OFFSET ?
        `, [contenidoId, limit, offset]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al cargar la comunidad" });
    }
};

export const actualizarMiPerfil = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(401).json({ message: "No autorizado" });
        
        const decodificado = jwt.verify(token, JWT_SECRET);
        const userId = decodificado.id; 

        const { nombre, biografia } = req.body;

        const [usuariosExistentes] = await conmysql.query(
            'SELECT id FROM usuarios WHERE nombre = ? AND id != ?', 
            [nombre, userId]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(400).json({ message: "Ese nombre de usuario ya está en uso. ¡Elige otro!" });
        }
        
        const avatar_url = req.file ? req.file.path : null;

        if (avatar_url) {
            await conmysql.query(
                'UPDATE usuarios SET nombre = ?, biografia = ?, avatar_url = ? WHERE id = ?',
                [nombre, biografia, avatar_url, userId]
            );
        } else {
            await conmysql.query(
                'UPDATE usuarios SET nombre = ?, biografia = ? WHERE id = ?',
                [nombre, biografia, userId]
            );
        }

        res.json({ message: "Perfil actualizado con éxito" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar el perfil" });
    }
};

export const recuperarPassword = async (req, res) => {
    try {
        const { correo } = req.body;

        const [user] = await conmysql.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        if (user.length === 0) {
            return res.status(404).json({ message: "No encontramos ninguna cuenta con ese correo" });
        }

        const nuevaPassword = Math.random().toString(36).slice(-8);

        const passwordHasheada = await bcrypt.hash(nuevaPassword, 10);
        await conmysql.query('UPDATE usuarios SET password = ? WHERE correo = ?', [passwordHasheada, correo]);

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, 
            auth: {
                user: 'soporte.mediatracker@gmail.com', 
                pass: 'wwblofbaryrhkpdq' 
            }
        });

        await transporter.sendMail({
            from: 'soporte.mediatracker@gmail.com',
            to: correo,
            subject: 'Recuperación de Acceso - MediaTracker',
            html: `
                <h2>Recuperación de contraseña</h2>
                <p>Hola ${user[0].nombre},</p>
                <p>Tu nueva contraseña temporal es: <b>${nuevaPassword}</b></p>
                <p>Por favor, inicia sesión con esta clave y cámbiala en la sección de "Perfil".</p>
            `
        });

        res.json({ message: "Te hemos enviado un correo con tu nueva contraseña temporal." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al intentar recuperar la contraseña" });
    }
};

export const cambiarPassword = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(401).json({ message: "No autorizado" });

        const decodificado = jwt.verify(token, JWT_SECRET);
        const userId = decodificado.id;

        const { passwordActual, nuevaPassword } = req.body;

        const [user] = await conmysql.query('SELECT password FROM usuarios WHERE id = ?', [userId]);

        if (user[0].password !== passwordActual) {
            return res.status(400).json({ message: "La contraseña actual es incorrecta" });
        }

        await conmysql.query('UPDATE usuarios SET password = ? WHERE id = ?', [nuevaPassword, userId]);

        res.json({ message: "Tu contraseña ha sido actualizada con éxito 🔒" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al intentar cambiar la contraseña" });
    }
};

export const obtenerComentariosPerfil = async (req, res) => {
    try {
        const { perfilId } = req.params;

        const [rows] = await conmysql.query(`
            SELECT 
                c.id,
                c.comentario,
                c.fecha_publicacion,
                u.nombre AS autor_nombre,
                u.avatar_url AS autor_avatar
            FROM comentarios_perfil c
            JOIN usuarios u ON c.autor_id = u.id
            WHERE c.perfil_id = ?
            ORDER BY c.fecha_publicacion DESC
        `, [perfilId]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener los comentarios del perfil" });
    }
};

export const agregarComentarioPerfil = async (req, res) => {
    try {
        const { perfilId, comentario } = req.body;

        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(401).json({ message: "No autorizado" });
        const decodificado = jwt.verify(token, JWT_SECRET);
        const autorId = decodificado.id;

        if (!comentario || !perfilId) {
            return res.status(400).json({ message: "El comentario no puede estar vacío" });
        }

        await conmysql.query(
            'INSERT INTO comentarios_perfil (perfil_id, autor_id, comentario) VALUES (?, ?, ?)',
            [perfilId, autorId, comentario]
        );

        res.status(201).json({ message: "Comentario publicado en el perfil" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al publicar el comentario" });
    }
};