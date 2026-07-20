import { conmysql } from '../db.js';

export const getMisSeguimientos = async (req, res) => {
    try {
        const usuarioId = req.usuario.id; 

        const [result] = await conmysql.query(`
            SELECT s.id AS seguimiento_id, s.contenido_id, s.progreso_actual, s.calificacion_personal, s.notas_personales,
                   s.fecha_inicio, s.fecha_fin, 
                   s.minuto_favorito, s.fecha_visto, s.temporada_actual, s.capitulo_actual, s.formato_lectura,
                   c.titulo, c.portada_url, c.total_unidades, c.duracion_promedio_minutos,
                   e.nombre AS estado_actual, 
                   e.nombre AS estado_nombre,
                   e.id AS estado_id, cat.nombre AS categoria, cat.id AS categoria_id,
                   (SELECT GROUP_CONCAT(g.nombre SEPARATOR ', ') 
                    FROM contenido_generos cg 
                    INNER JOIN generos g ON cg.genero_id = g.id 
                    WHERE cg.contenido_id = c.id) AS generos
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
        const { 
            progreso_actual, temporada_actual, capitulo_actual, estado_id, 
            calificacion_personal, notas_personales, oculto_perfil,
            fecha_inicio, fecha_fin, fecha_visto, formato_lectura, minuto_favorito 
        } = req.body;

        let query = 'UPDATE seguimientos SET ';
        const values = [];
        const addField = (field, value) => {
            if (value !== undefined) {
                query += `${field} = ?, `;
                values.push(value);
            }
        };

        addField('progreso_actual', progreso_actual);
        addField('temporada_actual', temporada_actual);
        addField('capitulo_actual', capitulo_actual);
        addField('estado_id', estado_id);
        addField('calificacion_personal', calificacion_personal);
        addField('notas_personales', notas_personales);
        addField('oculto_perfil', oculto_perfil);
        addField('fecha_inicio', fecha_inicio);
        addField('fecha_fin', fecha_fin);
        addField('fecha_visto', fecha_visto);
        addField('formato_lectura', formato_lectura);
        addField('minuto_favorito', minuto_favorito);

        query = query.slice(0, -2);

        query += ' WHERE id = ?';
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