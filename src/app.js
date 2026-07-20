import express from 'express';
import cors from 'cors';
import usuariosRoutes from './routes/usuarios.routes.js';
import contenidosRoutes from './routes/contenidos.routes.js';
import authRoutes from './routes/auth.routes.js';
import seguimientosRoutes from './routes/seguimientos.routes.js';
import grupoRoutes from './routes/grupo.routes.js';
import seguidoresRoutes from './routes/seguidores.routes.js';
import chatRoutes from './routes/chat.routes.js';
const app=express();
app.use(cors());
app.use(express.json()); //para que interprete los objetos json
//rutas
app.use('/api', authRoutes);
app.use('/api', usuariosRoutes);
app.use('/api', contenidosRoutes);
app.use('/api', seguimientosRoutes);
app.use('/api', grupoRoutes);
app.use('/api', seguidoresRoutes);
app.use('/api', chatRoutes);

app.use((req, res, next) => {
    res.status(400).json({
        message: 'Endpoint not found'
    })
});
export default app;