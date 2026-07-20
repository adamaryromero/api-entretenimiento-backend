import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { verificarMatch, enviarMensajePrivado, obtenerConversacion, obtenerMisChats } from '../controladores/chatctrl.js';

const router = Router();

router.get('/chat/match/:otroId', verificarToken, verificarMatch);
router.post('/chat/enviar', verificarToken, enviarMensajePrivado);
router.get('/chat/conversacion/:otroId', verificarToken, obtenerConversacion);
router.get('/chat/lista', verificarToken, obtenerMisChats)

export default router;