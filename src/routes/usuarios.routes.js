import { Router } from 'express';
import { getUsuarios, getUsuarioById, postUsuario, putUsuario, deleteUsuario, buscarUsuarios, getComentariosPerfil, getObrasMaestrasPublicas } from '../controladores/usuariosctrl.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
const router = Router();

router.get('/usuarios', verificarToken, getUsuarios);
router.post('/usuarios', postUsuario);
router.get('/usuarios/buscar', verificarToken, buscarUsuarios);
router.get('/usuarios/:id/obras-maestras', verificarToken, getObrasMaestrasPublicas);
router.get('/usuarios/:id/foro', verificarToken, getComentariosPerfil);
router.get('/usuarios/:id', verificarToken, getUsuarioById);
router.put('/usuarios/:id', verificarToken, putUsuario);
router.delete('/usuarios/:id', verificarToken, deleteUsuario);

export default router;