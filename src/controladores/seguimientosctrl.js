import { conmysql } from '../db.js';

export const getMisSeguimientos = async (req, res) => {
    try {
        const usuarioId = req.usuario.id; 

        const [result] = await conmysql.query(`
            SELECT s.id AS seguimiento_id, s.contenido_id, s.progreso_actual, s.calificacion_personal, s.notas_personales,
                   s.fecha_inicio, s.fecha_fin, 
                   s.minuto_favorito, s.fecha_visto, s.temporada_actual, s.capitulo_actual, s.formato_lectura,
                   c.titulo, c.portada_url, c.total_unidades, c.duracion_promedio_minutos,
                   e.nombre AS estado_actual, e.id AS estado_id, cat.nombre AS categoria, cat.id AS categoria_id
            FROM seguimientos s
            INNER JOIN contenidos c ON s.contenido_id = c.id
            INNER JOIN estados e ON s.estado_id = e.id
            INNER JOIN categorias cat ON c.categoria_id = cat.id
            WHERE s.usuario_id = ?
        `, [usuarioId]);
        
        res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al consultar tu lista de seguimientos" });
    }
};

export const addSeguimiento = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { contenido_id, estado_id } = req.body;

        const [result] = await conmysql.query(
            'INSERT INTO seguimientos (usuario_id, contenido_id, estado_id, progreso_actual, fecha_inicio) VALUES (?, ?, ?, 0, NOW())',
            [usuarioId, contenido_id, estado_id]
        );

        res.status(201).json({ message: "¡Agregado a tu lista exitosamente!", id: result.insertId });
    } catch (error) {
        if(error.errno === 1062) {
            return res.status(400).json({ message: "Ya tienes este contenido en tu lista." });
        }
        return res.status(500).json({ message: "Error al agregar a la lista" });
    }
};

export const updateProgreso = async (req, res) => {
    try {
        const { id } = req.params; 
        const { progreso_actual, temporada_actual, capitulo_actual, estado_id, calificacion_personal, notas_personales, oculto_perfil } = req.body;

        let query = 'UPDATE seguimientos SET ';
        const values = [];
        
        if (progreso_actual !== undefined) { query += 'progreso_actual = ?, '; values.push(progreso_actual); }
        if (temporada_actual !== undefined) { query += 'temporada_actual = ?, '; values.push(temporada_actual); }
        if (capitulo_actual !== undefined) { query += 'capitulo_actual = ?, '; values.push(capitulo_actual); }
        if (estado_id !== undefined) { query += 'estado_id = ?, '; values.push(estado_id); }
        if (calificacion_personal !== undefined) { query += 'calificacion_personal = ?, '; values.push(calificacion_personal); }
        if (notas_personales !== undefined) { query += 'notas_personales = ?, '; values.push(notas_personales); }
        if (oculto_perfil !== undefined) { query += 'oculto_perfil = ?, '; values.push(oculto_perfil); }

        query += 'fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?';
        values.push(id);

        await conmysql.query(query, values);
        res.json({ message: "Progreso actualizado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar el progreso" });
    }
};

export const deleteSeguimiento = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const seguimientoId = req.params.id;

        const [result] = await conmysql.query(
            'DELETE FROM seguimientos WHERE id = ? AND usuario_id = ?', 
            [seguimientoId, usuarioId]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: "Seguimiento no encontrado." });
        res.json({ message: "Eliminado de tu lista." });
    } catch (error) {
        return res.status(500).json({ message: "Error al eliminar" });
    }
};

export const crearResena = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const contenidoId = req.params.id;
        const { comentario } = req.body;

        await conmysql.query(
            'INSERT INTO reseñas_comunidad (contenido_id, usuario_id, comentario) VALUES (?, ?, ?)',
            [contenidoId, usuarioId, comentario]
        );

        res.status(201).json({ message: "Reseña publicada" });
    } catch (error) {
        return res.status(500).json({ message: "Error al publicar la reseña" });
    }
};