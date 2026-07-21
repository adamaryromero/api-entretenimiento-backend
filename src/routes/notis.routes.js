import { Router } from 'express';
import { enviarNotificacionApi } from '../controladores/notisctrl.js';

const router = Router();

router.post('/enviar-notificacion', enviarNotificacionApi);

export default router;