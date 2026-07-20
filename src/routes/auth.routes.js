import { Router } from 'express';
import { login, registrarUsuario, obtenerMiPerfil, obtenerComunidadPorObra, actualizarMiPerfil, recuperarPassword, cambiarPassword, obtenerComentariosPerfil, agregarComentarioPerfil } from '../controladores/authctrl.js';
import { upload } from '../middlewares/upload.middleware.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/registro', registrarUsuario);
router.get('/perfil', obtenerMiPerfil);
router.get('/comunidad/:id', obtenerComunidadPorObra);
router.put('/perfil', verificarToken, upload.single('avatar'), actualizarMiPerfil);
router.post('/recuperar-password', recuperarPassword);
router.put('/cambiar-password', cambiarPassword);
router.get('/perfil/comentarios/:perfilId', verificarToken, obtenerComentariosPerfil);
router.post('/perfil/comentarios', verificarToken, agregarComentarioPerfil);

export default router;