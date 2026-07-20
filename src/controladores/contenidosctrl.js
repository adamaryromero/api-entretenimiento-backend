import { conmysql } from '../db.js';

export const getContenidos = async (req, res) => {
    try {
        const [result] = await conmysql.query(`
            SELECT 
                c.*, 
                cat.nombre AS categoria_nombre,
                GROUP_CONCAT(g.nombre SEPARATOR ', ') AS generos
            FROM contenidos c
            INNER JOIN categorias cat ON c.categoria_id = cat.id
            LEFT JOIN contenido_generos cg ON c.id = cg.contenido_id
            LEFT JOIN generos g ON cg.genero_id = g.id
            GROUP BY c.id
        `);
        res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al consultar el catálogo" });
    }
};

// === 1. MODIFICAR GET POR ID PARA QUE DEVUELVA LAS TEMPORADAS ===
export const getContenidoById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await conmysql.query(`
            SELECT c.*, GROUP_CONCAT(cg.genero_id) AS generos_ids 
            FROM contenidos c 
            LEFT JOIN contenido_generos cg ON c.id = cg.contenido_id 
            WHERE c.id = ? 
            GROUP BY c.id
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ message: "Contenido no encontrado" });

        const contenido = rows[0];

        // Si es Serie (2) o Anime (3), buscamos sus temporadas
        if (contenido.categoria_id === 2 || contenido.categoria_id === 3) {
            const [temporadas] = await conmysql.query(
                'SELECT numero_temporada, cantidad_capitulos FROM contenido_temporadas WHERE contenido_id = ? ORDER BY numero_temporada ASC',
                [id]
            );
            contenido.temporadas = temporadas; // Adjuntamos el arreglo al JSON de respuesta
        }

        res.json(contenido);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener contenido" });
    }
};

// === 2. MODIFICAR ACTUALIZAR PARA QUE SOBREESCRIBA LAS TEMPORADAS ===
export const actualizarContenido = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, sinopsis, año_lanzamiento, categoria_id, total_unidades, portada_url, generos, temporadas } = req.body;

        let totalCapitulos = total_unidades || 0;

        if ((categoria_id === 2 || categoria_id === 3) && temporadas && temporadas.length > 0) {
            totalCapitulos = temporadas.reduce((acc, curr) => acc + curr.cantidad_capitulos, 0);

            await conmysql.query('DELETE FROM contenido_temporadas WHERE contenido_id = ?', [id]);

            const values = temporadas.map(t => [id, t.numero_temporada, t.cantidad_capitulos]);
            await conmysql.query(
                'INSERT INTO contenido_temporadas (contenido_id, numero_temporada, cantidad_capitulos) VALUES ?',
                [values]
            );
        }

        await conmysql.query(
            'UPDATE contenidos SET titulo = ?, sinopsis = ?, año_lanzamiento = ?, total_unidades = ?, portada_url = ?, categoria_id = ? WHERE id = ?',
            [titulo, sinopsis, año_lanzamiento, totalCapitulos, portada_url, categoria_id, id]
        );

        await conmysql.query('DELETE FROM contenido_generos WHERE contenido_id = ?', [id]);
        if (generos && generos.length > 0) {
            const generoValues = generos.map(gId => [id, gId]);
            await conmysql.query('INSERT INTO contenido_generos (contenido_id, genero_id) VALUES ?', [generoValues]);
        }

        res.json({ message: "¡Obra actualizada correctamente!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar contenido" });
    }
};

export const getContenidosByCategoria = async (req, res) => {
    try {
        const { id_categoria } = req.params;
        const [result] = await conmysql.query(`
            SELECT c.*, cat.nombre AS categoria_nombre 
            FROM contenidos c
            INNER JOIN categorias cat ON c.categoria_id = cat.id
            WHERE c.categoria_id = ?
        `, [id_categoria]);
        
        res.json(result);
    } catch (error) {
        return res.status(500).json({ message: "Error al filtrar los contenidos" });
    }
};

export const crearContenido = async (req, res) => {
    try {
        const { titulo, sinopsis, año_lanzamiento, portada_url, categoria_id, temporadas } = req.body;

        const [result] = await conmysql.query(
            'INSERT INTO contenidos (titulo, sinopsis, año_lanzamiento, portada_url, categoria_id, total_unidades) VALUES (?, ?, ?, ?, ?, ?)',
            [titulo, sinopsis, año_lanzamiento, portada_url, categoria_id, 0]
        );
        const nuevoContenidoId = result.insertId;

        let totalCapitulos = 0;
        
        if (temporadas && temporadas.length > 0) {
            const values = temporadas.map(t => {
                totalCapitulos += t.cantidad_capitulos; 
                return [nuevoContenidoId, t.numero_temporada, t.cantidad_capitulos];
            });

            await conmysql.query(
                'INSERT INTO contenido_temporadas (contenido_id, numero_temporada, cantidad_capitulos) VALUES ?',
                [values]
            );

            await conmysql.query(
                'UPDATE contenidos SET total_unidades = ? WHERE id = ?',
                [totalCapitulos, nuevoContenidoId]
            );
        }

        res.status(201).json({ message: "¡Obra creada exitosamente con sus temporadas!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al crear el contenido" });
    }
};

export const eliminarContenido = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await conmysql.query('DELETE FROM contenidos WHERE id = ?', [id]);
        
        if (result.affectedRows <= 0) {
            return res.status(404).json({ message: "Contenido no encontrado para eliminar" });
        }
        
        res.json({ message: "Contenido eliminado exitosamente del catálogo" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al eliminar el contenido" });
    }
};

export const getGeneros = async (req, res) => {
    try {
        const [result] = await conmysql.query('SELECT * FROM generos ORDER BY nombre ASC');
        res.json(result);
    } catch (error) {
        return res.status(500).json({ message: "Error al consultar la lista de géneros" });
    }
};