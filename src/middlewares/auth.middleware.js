import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).json({ message: "No se proporcionó un token de seguridad" });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: "Formato de token inválido" });
    }

    try {
        const decodificado = jwt.verify(token, JWT_SECRET);
        
        req.usuario = decodificado; 
        
        next(); 
    } catch (error) {
        return res.status(401).json({ message: "Token expirado o incorrecto. Inicia sesión nuevamente." });
    }
};