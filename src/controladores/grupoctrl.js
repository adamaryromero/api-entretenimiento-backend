import { conmysql } from '../db.js'; 
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'projectEntretenimiento';

const obtenerUsuarioId = (req) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return null;
    const decodificado = jwt.verify(token, JWT_SECRET);
    return decodificado.id;
};

export const crearGrupo = async (req, res) => {
    try {
        const creadorId = obtenerUsuarioId(req);
        if (!creadorId) return res.status(401).json({ message: "No autorizado" });

        const { nombre, descripcion } = req.body;
        if (!nombre) return res.status(400).json({ message: "El nombre del grupo es obligatorio" });

        const [result] = await conmysql.query(
            'INSERT INTO grupos (nombre, descripcion, creador_id) VALUES (?, ?, ?)',
            [nombre, descripcion, creadorId]
        );
        const grupoId = result.insertId;

        await conmysql.query(
            'INSERT INTO grupo_miembros (grupo_id, usuario_id) VALUES (?, ?)',
            [grupoId, creadorId]
        );

        res.status(201).json({ message: "¡Grupo creado con éxito!", grupoId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al crear el grupo" });
    }
};

export const obtenerMisGrupos = async (req, res) => {
    try {
        const usuarioId = obtenerUsuarioId(req);
        if (!usuarioId) return res.status(401).json({ message: "No autorizado" });

        const [rows] = await conmysql.query(`
            SELECT g.id, g.nombre, g.descripcion, g.creador_id,
                   (SELECT COUNT(*) FROM grupo_miembros WHERE grupo_id = g.id) AS total_miembros
            FROM grupos g
            JOIN grupo_miembros gm ON g.id = gm.grupo_id
            WHERE gm.usuario_id = ?
        `, [usuarioId]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener tus grupos" });
    }
};

export const invitarMiembro = async (req, res) => {
    try {
        const { grupoId, correo } = req.body;

        const [miembros] = await conmysql.query('SELECT COUNT(*) as total FROM grupo_miembros WHERE grupo_id = ?', [grupoId]);
        if (miembros[0].total >= 10) {
            return res.status(400).json({ message: "La sala ha alcanzado el límite máximo de 10 miembros." });
        }
        
        const [user] = await conmysql.query('SELECT id, nombre FROM usuarios WHERE correo = ?', [correo]);
        if (user.length === 0) {
            return res.status(404).json({ message: "No encontramos ningún usuario con ese correo" });
        }
        const usuarioId = user[0].id;

        const [miembro] = await conmysql.query(
            'SELECT * FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?',
            [grupoId, usuarioId]
        );
        if (miembro.length > 0) {
            return res.status(400).json({ message: "Este usuario ya pertenece al grupo" });
        }

        await conmysql.query(
            'INSERT INTO grupo_miembros (grupo_id, usuario_id) VALUES (?, ?)',
            [grupoId, usuarioId]
        );

        res.json({ message: `¡${user[0].nombre} ha sido agregado al grupo!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al agregar miembro" });
    }
};

export const obtenerContenidosGrupo = async (req, res) => {
    try {
        const { grupoId } = req.params;
        const [rows] = await conmysql.query(`
            SELECT gc.id, gc.progreso_actual, gc.estado_id, e.nombre AS estado_nombre,
                   gc.fecha_inicio, gc.fecha_fin, gc.comentarios, 
                   c.id AS contenido_id, c.titulo, c.portada_url, c.total_unidades, cat.nombre AS categoria
            FROM grupo_contenidos gc
            JOIN contenidos c ON gc.contenido_id = c.id
            JOIN categorias cat ON c.categoria_id = cat.id
            JOIN estados e ON gc.estado_id = e.id
            WHERE gc.grupo_id = ?
        `, [grupoId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener la lista compartida" });
    }
};

export const agregarContenidoGrupo = async (req, res) => {
    try {
        const { grupoId, contenidoId } = req.body;

        await conmysql.query(
            'INSERT INTO grupo_contenidos (grupo_id, contenido_id) VALUES (?, ?)',
            [grupoId, contenidoId]
        );

        res.status(201).json({ message: "Obra agregada a la lista compartida del grupo" });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Esta obra ya está en la lista del grupo" });
        }
        res.status(500).json({ message: "Error al agregar obra" });
    }
};

export const actualizarProgresoGrupo = async (req, res) => {
    try {
        const { grupoId, contenidoId, progreso_actual, estado_id, fecha_inicio, fecha_fin, comentarios } = req.body;

        await conmysql.query(`
            UPDATE grupo_contenidos 
            SET progreso_actual = ?, estado_id = ?, fecha_inicio = ?, fecha_fin = ?, comentarios = ?
            WHERE grupo_id = ? AND contenido_id = ?
        `, [
            progreso_actual, estado_id, 
            fecha_inicio || null, fecha_fin || null, comentarios || '', 
            grupoId, contenidoId
        ]);

        res.json({ message: "¡Detalles del grupo actualizados!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar progreso" });
    }
};

export const actualizarGrupo = async (req, res) => {
    try {
        const usuarioId = obtenerUsuarioId(req);
        if (!usuarioId) return res.status(401).json({ message: "No autorizado" });

        const { grupoId, nombre, descripcion } = req.body;
        if (!grupoId || !nombre) {
            return res.status(400).json({ message: "El nombre de la sala es obligatorio" });
        }

        const [grupo] = await conmysql.query('SELECT creador_id FROM grupos WHERE id = ?', [grupoId]);
        if (grupo.length === 0) {
            return res.status(404).json({ message: "Grupo no encontrado" });
        }
        if (grupo[0].creador_id !== usuarioId) {
            return res.status(403).json({ message: "Solo el creador del grupo puede editar sus datos" });
        }

        await conmysql.query(
            'UPDATE grupos SET nombre = ?, descripcion = ? WHERE id = ?',
            [nombre, descripcion || '', grupoId]
        );

        res.json({ message: "¡Grupo actualizado correctamente!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar los datos del grupo" });
    }
};

export const obtenerMensajesGrupo = async (req, res) => {
    try {
        const { grupoId } = req.params;
        const [rows] = await conmysql.query(`
            SELECT m.id, m.mensaje, m.fecha_envio, m.usuario_id, 
                   u.nombre AS autor_nombre, u.avatar_url AS autor_avatar
            FROM grupo_mensajes m
            JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.grupo_id = ?
            ORDER BY m.fecha_envio ASC
        `, [grupoId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener mensajes" });
    }
};

export const enviarMensajeGrupo = async (req, res) => {
    try {
        const usuarioId = obtenerUsuarioId(req);
        if (!usuarioId) return res.status(401).json({ message: "No autorizado" });

        const { grupoId, mensaje } = req.body;
        if (!mensaje || !mensaje.trim()) return res.status(400).json({ message: "Mensaje vacío" });

        await conmysql.query(
            'INSERT INTO grupo_mensajes (grupo_id, usuario_id, mensaje) VALUES (?, ?, ?)',
            [grupoId, usuarioId, mensaje]
        );
        res.status(201).json({ message: "Enviado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al enviar mensaje" });
    }
};

export const enviarSolicitud = async (req, res) => {
    try {
        const { grupoId, correo: receptorId } = req.body; 
        const emisorId = obtenerUsuarioId(req);

        const [existe] = await conmysql.query('SELECT * FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?', [grupoId, receptorId]);
        if (existe.length > 0) return res.status(400).json({ message: "Este amigo ya pertenece a la sala" });

        const [solicitudPrevia] = await conmysql.query('SELECT * FROM grupo_solicitudes WHERE grupo_id = ? AND usuario_id_receptor = ? AND estado = "pendiente"', [grupoId, receptorId]);
        if (solicitudPrevia.length > 0) return res.status(400).json({ message: "Ya le enviaste una solicitud que está pendiente" });

        await conmysql.query(
            'INSERT INTO grupo_solicitudes (grupo_id, usuario_id_receptor, estado) VALUES (?, ?, "pendiente")',
            [grupoId, receptorId]
        );

        res.json({ message: "Solicitud enviada. Pendiente de aceptación." });
    } catch (error) {
        console.error("Error al enviar solicitud:", error);
        res.status(500).json({ message: "Error al enviar solicitud" });
    }
};

export const aceptarSolicitud = async (req, res) => {
    try {
        const { solicitudId } = req.params;
        const usuarioId = obtenerUsuarioId(req);

        const [solicitud] = await conmysql.query('SELECT * FROM grupo_solicitudes WHERE id = ? AND usuario_id_receptor = ?', [solicitudId, usuarioId]);
        
        if (solicitud.length === 0) return res.status(404).json({ message: "Solicitud no encontrada" });

        await conmysql.query('DELETE FROM grupo_solicitudes WHERE id = ?', [solicitudId]);

        res.json({ message: "¡Ahora eres miembro del grupo!" });
    } catch (error) {
        res.status(500).json({ message: "Error al aceptar solicitud" });
    }
};

export const obtenerMisSolicitudes = async (req, res) => {
    try {
        const usuarioId = obtenerUsuarioId(req);
        if (!usuarioId) return res.status(401).json({ message: "No autorizado" });

        const [rows] = await conmysql.query(`
            SELECT s.id AS solicitud_id, s.estado, s.fecha_solicitud,
                   g.id AS grupo_id, g.nombre AS grupo_nombre, g.descripcion
            FROM grupo_solicitudes s
            JOIN grupos g ON s.grupo_id = g.id
            WHERE s.usuario_id_receptor = ? AND s.estado = 'pendiente'
        `, [usuarioId]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener solicitudes" });
    }
};

export const abandonarGrupo = async (req, res) => {
    try {
        const usuarioId = obtenerUsuarioId(req);
        const { grupoId } = req.params;

        const [grupo] = await conmysql.query('SELECT creador_id FROM grupos WHERE id = ?', [grupoId]);
        
        if (grupo.length === 0) return res.status(404).json({ message: "Grupo no encontrado" });

        if (grupo[0].creador_id === usuarioId) {
            await conmysql.query('DELETE FROM grupos WHERE id = ?', [grupoId]);
            res.json({ message: "Grupo eliminado permanentemente (eras el creador)." });
        } else {
            await conmysql.query('DELETE FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?', [grupoId, usuarioId]);
            res.json({ message: "Has abandonado el grupo." });
        }
    } catch (error) {
        res.status(500).json({ message: "Error al intentar salir del grupo" });
    }
};