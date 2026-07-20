import { conmysql } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'projectEntretenimiento';

const obtenerUsuarioId = (req) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return null;
    const decodificado = jwt.verify(token, JWT_SECRET);
    return decodificado.id;
};

export const seguirUsuario = async (req, res) => {
    try {
        const seguidorId = obtenerUsuarioId(req);
        const { seguidoId } = req.body;

        if (seguidorId === seguidoId) return res.status(400).json({ message: "No puedes seguirte a ti mismo" });

        await conmysql.query('INSERT INTO seguidores (seguidor_id, seguido_id) VALUES (?, ?)', [seguidorId, seguidoId]);
        res.status(201).json({ message: "Usuario seguido" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Ya sigues a este usuario" });
        res.status(500).json({ message: "Error al seguir" });
    }
};

export const dejarDeSeguir = async (req, res) => {
    try {
        const seguidorId = obtenerUsuarioId(req);
        const { seguidoId } = req.params;

        await conmysql.query('DELETE FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?', [seguidorId, seguidoId]);
        res.json({ message: "Has dejado de seguir a este usuario" });
    } catch (error) {
        res.status(500).json({ message: "Error al dejar de seguir" });
    }
};

export const obtenerSeguidos = async (req, res) => {
    try {
        const usuarioId = obtenerUsuarioId(req);
        const [rows] = await conmysql.query(`
            SELECT u.id, u.nombre, u.avatar_url 
            FROM seguidores s
            JOIN usuarios u ON s.seguido_id = u.id
            WHERE s.seguidor_id = ?
        `, [usuarioId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener seguidos" });
    }
};