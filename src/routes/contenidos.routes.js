import { Router } from 'express';
import { getContenidos, getContenidoById, getContenidosByCategoria, crearContenido, eliminarContenido, actualizarContenido, getGeneros } from '../controladores/contenidosctrl.js';
import { upload } from '../middlewares/upload.middleware.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
const router = Router();

router.get('/contenidos', getContenidos); 
router.get('/contenidos/:id', getContenidoById); 
router.get('/contenidos/categoria/:id_categoria', getContenidosByCategoria); 
router.post('/contenidos', verificarToken, crearContenido);
router.delete('/contenidos/:id', verificarToken, eliminarContenido);
router.put('/contenidos/:id', verificarToken, actualizarContenido);
router.get('/generos', verificarToken, getGeneros);

export default router;