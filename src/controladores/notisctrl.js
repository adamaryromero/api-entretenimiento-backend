import admin from 'firebase-admin';
import { conmysql } from '../db.js';

export const enviarPushAUser = async (usuarioId, titulo, mensaje) => {
    try {
        const [rows] = await conmysql.query(
            'SELECT fcm_token FROM usuarios WHERE id = ?', 
            [usuarioId]
        );

        if (rows.length === 0 || !rows[0].fcm_token) {
            console.log(`El usuario con ID ${usuarioId} no tiene un fcm_token registrado.`);
            return false;
        }

        const tokenDestino = rows[0].fcm_token;

        const payload = {
            token: tokenDestino,
            notification: {
                title: titulo,
                body: mensaje
            }
        };

        const respuesta = await admin.messaging().send(payload);
        console.log(`¡Notificación push enviada con éxito al usuario ${usuarioId}! ID:`, respuesta);
        return true;

    } catch (error) {
        console.error(`Error al enviar notificación push al usuario ${usuarioId}:`, error);
        return false;
    }
};

export const enviarNotificacionApi = async (req, res) => {
    try {
        const { usuario_id, titulo, mensaje } = req.body;

        if (!usuario_id || !titulo || !mensaje) {
            return res.status(400).json({ message: "Faltan datos obligatorios (usuario_id, titulo, mensaje)" });
        }

        const enviado = await enviarPushAUser(usuario_id, titulo, mensaje);

        if (!enviado) {
            return res.status(404).json({ message: "No se pudo enviar la notificación. El usuario no tiene un token activo o no existe." });
        }

        res.json({ message: "Notificación push enviada correctamente" });

    } catch (error) {
        console.error("Error en el servidor al enviar la notificación:", error);
        res.status(500).json({ message: "Error en el servidor al procesar la notificación" });
    }
};