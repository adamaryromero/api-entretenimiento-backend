import { conmysql } from '../db.js';

export const getUsuarios = async (req, res) => {
    try {
        const [result] = await conmysql.query('SELECT * FROM usuarios');
        res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al consultar los usuarios" });
    }
};

export const getUsuarioById = async (req, res) => {
    try {
        const [result] = await conmysql.query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
        
        if (result.length <= 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.json(result[0]); 
    } catch (error) {
        return res.status(500).json({ message: "Error al consultar el usuario" });
    }
};

export const postUsuario = async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;
        
        if(!nombre || !correo || !password) {
            return res.status(400).json({ message: "Faltan datos obligatorios (nombre, correo, password)" });
        }

        const [result] = await conmysql.query(
            'INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)', 
            [nombre, correo, password]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            nombre, 
            correo 
        });
    } catch (error) {
        return res.status(500).json({ message: "Error al crear el usuario" });
    }
};

export const putUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, correo, password } = req.body;

        const [result] = await conmysql.query(
            'UPDATE usuarios SET nombre = IFNULL(?, nombre), correo = IFNULL(?, correo), password = IFNULL(?, password) WHERE id = ?', 
            [nombre, correo, password, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuario no encontrado para actualizar" });
        }

        const [rows] = await conmysql.query('SELECT * FROM usuarios WHERE id = ?', [id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: "Error al actualizar el usuario" });
    }
};

export const deleteUsuario = async (req, res) => {
    try {
        const [result] = await conmysql.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows <= 0) {
            return res.status(404).json({ message: "Usuario no encontrado para eliminar" });
        }
        res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error) {
        return res.status(500).json({ message: "Error al eliminar el usuario" });
    }
};

//interacción social
export const buscarUsuarios = async (req, res) => {
    try {
        const { q } = req.query;
        const currentUserId = req.usuario.id; 

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [usuarios] = await conmysql.query(
            "SELECT id, nombre, avatar_url FROM usuarios WHERE nombre LIKE ? AND id != ? LIMIT ? OFFSET ?", 
            [`%${q}%`, currentUserId, limit, offset]
        );
        
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: "Error al buscar" });
    }
};

//obtener comentarios del muro de un perfil
export const getComentariosPerfil = async (req, res) => {
    try {
        const { id } = req.params; // ID del perfil que estamos visitando
        const [comentarios] = await conmysql.query(`
            SELECT c.*, u.nombre as autor_nombre, u.avatar_url as autor_avatar 
            FROM comentarios_perfil c
            JOIN usuarios u ON c.autor_id = u.id
            WHERE c.perfil_id = ?
            ORDER BY c.fecha_publicacion DESC
        `, [id]);
        res.json(comentarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener el foro del perfil" });
    }
};

export const getObrasMaestrasPublicas = async (req, res) => {
    try {
        const { id } = req.params;
        const [obras] = await conmysql.query(`
            SELECT s.id as seguimiento_id, s.calificacion_personal, 
                   c.titulo, c.portada_url, cat.nombre as categoria
            FROM seguimientos s
            JOIN contenidos c ON s.contenido_id = c.id
            JOIN categorias cat ON c.categoria_id = cat.id
            WHERE s.usuario_id = ? AND s.calificacion_personal = 5 AND s.oculto_perfil = 0
        `, [id]);
        res.json(obras);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener las obras maestras" });
    }
};