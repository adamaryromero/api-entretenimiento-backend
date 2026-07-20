import { conmysql } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'projectEntretenimiento';

const obtenerUsuarioId = (req) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return null;
    const decodificado = jwt.verify(token, JWT_SECRET);
    return decodificado.id;
};

export const verificarMatch = async (req, res) => {
    try {
        const miId = obtenerUsuarioId(req);
        const { otroId } = req.params;

        const [rows] = await conmysql.query(`
            SELECT 
                (SELECT COUNT(*) FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?) as sigoA,
                (SELECT COUNT(*) FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?) as meSigueA
        `, [miId, otroId, otroId, miId]);
        
        const esMatch = rows[0].sigoA > 0 && rows[0].meSigueA > 0;
        res.json({ esMatch });
    } catch (error) {
        res.status(500).json({ message: "Error al verificar" });
    }
};

export const enviarMensajePrivado = async (req, res) => {
    try {
        const remitente_id = obtenerUsuarioId(req);
        const { destinatario_id, mensaje } = req.body;
        
        await conmysql.query(
            'INSERT INTO mensajes_privados (remitente_id, destinatario_id, mensaje) VALUES (?, ?, ?)', 
            [remitente_id, destinatario_id, mensaje]
        );
        res.status(201).json({ message: "Mensaje enviado" });
    } catch (error) {
        res.status(500).json({ message: "Error al enviar mensaje" });
    }
};

export const obtenerConversacion = async (req, res) => {
    try {
        const miId = obtenerUsuarioId(req);
        const { otroId } = req.params;
        
        const [mensajes] = await conmysql.query(`
            SELECT m.*, u.nombre as autor_nombre 
            FROM mensajes_privados m
            JOIN usuarios u ON m.remitente_id = u.id
            WHERE (m.remitente_id = ? AND m.destinatario_id = ?) 
            OR (m.remitente_id = ? AND destinatario_id = ?)
            ORDER BY fecha_envio ASC
        `, [miId, otroId, otroId, miId]);
        
        res.json(mensajes);
    } catch (error) {
        res.status(500).json({ message: "Error al cargar mensajes" });
    }
};

export const obtenerMisChats = async (req, res) => {
    try {
        const miId = obtenerUsuarioId(req);
        
        const [chats] = await conmysql.query(`
            SELECT DISTINCT u.id, u.nombre, u.avatar_url,
            (SELECT mensaje FROM mensajes_privados 
             WHERE (remitente_id = u.id AND destinatario_id = ?) 
                OR (remitente_id = ? AND destinatario_id = u.id)
             ORDER BY fecha_envio DESC LIMIT 1) as ultimo_mensaje
            FROM usuarios u
            JOIN mensajes_privados m ON (m.remitente_id = u.id OR m.destinatario_id = u.id)
            WHERE (m.remitente_id = ? OR m.destinatario_id = ?)
            AND u.id != ?
        `, [miId, miId, miId, miId, miId]);
        
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: "Error al cargar chats" });
    }
};