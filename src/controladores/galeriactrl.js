import { conmysql } from '../db.js'; 

export const getGaleria = async (req, res) => {
    const { seguimiento_id } = req.params;
    try {
        const [rows] = await conmysql.query(
            'SELECT * FROM galeria_personal WHERE seguimiento_id = ? ORDER BY fecha_subida DESC',
            [seguimiento_id]
        );
        res.json(rows);
    } catch (error) {
        return res.status(500).json({ message: "Error al cargar la galería" });
    }
};

export const subirFoto = async (req, res) => {
    const { seguimiento_id, imagen_url, descripcion } = req.body;
    try {
        const [result] = await conmysql.query(
            'INSERT INTO galeria_personal (seguimiento_id, imagen_url, descripcion, fecha_subida) VALUES (?, ?, ?, NOW())',
            [seguimiento_id, imagen_url, descripcion]
        );
        res.status(201).json({ 
            id: result.insertId, 
            message: "Foto subida correctamente" 
        });
    } catch (error) {
        return res.status(500).json({ message: "Error al subir la foto" });
    }
};

export const eliminarFoto = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await conmysql.query(
            'DELETE FROM galeria_personal WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Foto no encontrada" });
        }
        res.json({ message: "Foto eliminada correctamente" });
    } catch (error) {
        return res.status(500).json({ message: "Error al eliminar la foto" });
    }
};