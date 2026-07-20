import { Router } from 'express';
import { getMisSeguimientos, addSeguimiento, updateProgreso, deleteSeguimiento, crearResena } from '../controladores/seguimientosctrl.js';
import { getGaleria, subirFoto, eliminarFoto } from '../controladores/galeriactrl.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/mis-seguimientos', verificarToken, getMisSeguimientos);
router.post('/mis-seguimientos', verificarToken, addSeguimiento);
router.put('/mis-seguimientos/:id', verificarToken, updateProgreso);
router.delete('/mis-seguimientos/:id', verificarToken, deleteSeguimiento);
router.post('/comunidad/:id', verificarToken, crearResena);
router.get('/galeria/:seguimiento_id', verificarToken, getGaleria);
router.post('/galeria', verificarToken, subirFoto);
router.delete('/galeria/:id', verificarToken, eliminarFoto);
export default router;