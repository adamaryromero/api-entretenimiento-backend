import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { seguirUsuario, dejarDeSeguir, obtenerSeguidos } from '../controladores/seguidoresctrl.js';

const router = Router();

router.post('/seguir', verificarToken, seguirUsuario);
router.delete('/dejar-de-seguir/:seguidoId', verificarToken, dejarDeSeguir);
router.get('/seguidos', verificarToken, obtenerSeguidos);

export default router;