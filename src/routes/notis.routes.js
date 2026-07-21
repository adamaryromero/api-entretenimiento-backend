import { Router } from 'express';
import { enviarNotificacionApi, notificarNuevoContenidoATodos } from '../controladores/notisctrl.js';

const router = Router();

router.post('/enviar-notificacion', enviarNotificacionApi);
router.post('/enviar-notificacion-masiva', notificarNuevoContenidoATodos);

export default router;