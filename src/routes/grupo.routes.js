import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { rechazarSolicitud, abandonarGrupo, obtenerMisSolicitudes, aceptarSolicitud, enviarSolicitud, crearGrupo, obtenerMisGrupos, invitarMiembro, obtenerContenidosGrupo, agregarContenidoGrupo, actualizarProgresoGrupo, actualizarGrupo, obtenerMensajesGrupo, enviarMensajeGrupo } from '../controladores/grupoctrl.js';

const router = Router();

router.post('/grupos', verificarToken, crearGrupo);
router.get('/grupos/mis-grupos', verificarToken, obtenerMisGrupos);
router.post('/grupos/invitar', verificarToken, invitarMiembro);
router.get('/grupos/:grupoId/contenidos', verificarToken, obtenerContenidosGrupo);
router.post('/grupos/contenidos', verificarToken, agregarContenidoGrupo);
router.put('/grupos/progreso', verificarToken, actualizarProgresoGrupo);
router.put('/grupos', verificarToken, actualizarGrupo);
router.get('/grupos/:grupoId/chat', verificarToken, obtenerMensajesGrupo);
router.post('/grupos/chat', verificarToken, enviarMensajeGrupo);
router.post('/grupos/solicitud', verificarToken, enviarSolicitud);
router.post('/solicitud/aceptar/:solicitudId', aceptarSolicitud);
router.put('/grupos/solicitud/:solicitudId/aceptar', verificarToken, aceptarSolicitud);
router.get('/grupos/solicitudes', verificarToken, obtenerMisSolicitudes);
router.delete('/grupos/:grupoId/salir', verificarToken, abandonarGrupo);
router.delete('/solicitud/:solicitudId', rechazarSolicitud);

export default router;