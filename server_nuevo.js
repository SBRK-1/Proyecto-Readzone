const express = require("express");
const pool = require("./conexion");
const bcrypt = require("bcrypt");

const app = express();

// Permitir recibir JSON con límite aumentado para fotos en base64
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir archivos estáticos
app.use(express.static("public"));

// ─────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────

// Obtener todos los usuarios
app.get("/usuarios", async (req, res) => {
    try {
        const [filas] = await pool.query("SELECT * FROM usuarios");
        res.json(filas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// Registrar usuario
app.post("/registro", async (req, res) => {
    try {
        const { nombre, usuario, correo, contraseña } = req.body;

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(contraseña, saltRounds);

        await pool.query(
            `INSERT INTO usuarios (nombre, usuario, correo, contraseña)
            VALUES (?, ?, ?, ?)`,
            [nombre, usuario, correo, passwordHash]
        );

        const [usuarioCreado] = await pool.query(
            "SELECT id, nombre, usuario, correo, foto_perfil FROM usuarios WHERE correo = ?",
            [correo]
        );

        res.json({
            success: true,
            usuario: usuarioCreado[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { correo, contraseña } = req.body;

        const [usuarios] = await pool.query(
            `SELECT * FROM usuarios WHERE correo = ?`,
            [correo]
        );

        if (usuarios.length === 0) {
            return res.json({ success: false });
        }

        const usuario = usuarios[0];

        const passwordMatch = await bcrypt.compare(contraseña, usuario.contraseña);

        if (!passwordMatch) {
            return res.json({ success: false });
        }

        res.json({
            success: true,
            usuario: {
                id:          usuario.id,
                nombre:      usuario.nombre,
                usuario:     usuario.usuario,
                correo:      usuario.correo,
                foto_perfil: usuario.foto_perfil
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// PERFIL DE USUARIO
// ─────────────────────────────────────────────

// Obtener perfil
app.get("/usuario/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const [datos] = await pool.query(
            `SELECT
                id, nombre, usuario, correo,
                foto_perfil, foto_portada,
                biografia, genero, fecha_registro
            FROM usuarios
            WHERE id = ?`,
            [id]
        );

        if (datos.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(datos[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener el perfil" });
    }
});

// Actualizar perfil — CORREGIDO: solo actualiza las fotos si vienen en el body
app.put("/usuario/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const {
            nombre,
            usuario,
            foto_perfil,
            foto_portada,
            biografia,
            genero
        } = req.body;

        // Validar campos obligatorios
        if (!nombre || !usuario) {
            return res.json({ success: false, error: "Nombre y usuario son obligatorios" });
        }

        // Verificar que el nombre de usuario no esté tomado por otro
        const [existe] = await pool.query(
            `SELECT id FROM usuarios WHERE usuario = ? AND id <> ?`,
            [usuario, id]
        );

        if (existe.length > 0) {
            return res.json({ success: false, error: "Ese usuario ya existe" });
        }

        // Obtener los datos actuales para no sobreescribir fotos si no se enviaron
        const [actual] = await pool.query(
            `SELECT foto_perfil, foto_portada FROM usuarios WHERE id = ?`,
            [id]
        );

        const fotoPerfilFinal   = foto_perfil  || actual[0].foto_perfil;
        const fotoPortadaFinal  = foto_portada || actual[0].foto_portada;

        await pool.query(
            `UPDATE usuarios
            SET
                nombre       = ?,
                usuario      = ?,
                foto_perfil  = ?,
                foto_portada = ?,
                biografia    = ?,
                genero       = ?
            WHERE id = ?`,
            [
                nombre,
                usuario,
                fotoPerfilFinal,
                fotoPortadaFinal,
                biografia,
                genero,
                id
            ]
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Error al actualizar perfil" });
    }
});

// ─────────────────────────────────────────────
// HISTORIAS
// ─────────────────────────────────────────────

// Historias populares y recientes (página principal)
app.get("/historias", async (req, res) => {
    try {
        const [populares] = await pool.query(`
            SELECT h.*, COUNT(v.id) AS total_vistas
            FROM historias h
            LEFT JOIN vistas v ON h.id = v.historia_id
            GROUP BY h.id
            ORDER BY total_vistas DESC
            LIMIT 4
        `);

        const [recientes] = await pool.query(`
            SELECT h.*, COUNT(v.id) AS total_vistas
            FROM historias h
            LEFT JOIN vistas v ON h.id = v.historia_id
            GROUP BY h.id
            ORDER BY h.fecha_creacion DESC
            LIMIT 4
        `);

        res.json({ populares, recientes });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener historias" });
    }
});

// Historias de un usuario específico
app.get("/historias/:usuarioId", async (req, res) => {
    try {
        const [historias] = await pool.query(
            `SELECT * FROM historias
            WHERE usuario_id = ?
            ORDER BY fecha_creacion DESC`,
            [req.params.usuarioId]
        );

        res.json(historias);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener historias del usuario" });
    }
});

// Registrar vista
app.post("/vista", async (req, res) => {
    try {
        const { usuario_id, historia_id } = req.body;

        await pool.query(
            `INSERT INTO vistas (usuario_id, historia_id) VALUES (?, ?)`,
            [usuario_id, historia_id]
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// ─────────────────────────────────────────────
// PUBLICACIONES
// ─────────────────────────────────────────────

// Obtener publicaciones con sus respuestas
app.get("/publicaciones", async (req, res) => {
    try {
        const [publicaciones] = await pool.query(`
            SELECT
                publicaciones.*,
                usuarios.nombre,
                usuarios.usuario,
                usuarios.foto_perfil
            FROM publicaciones
            INNER JOIN usuarios ON publicaciones.usuario_id = usuarios.id
            ORDER BY publicaciones.fecha DESC
        `);

        for (let publicacion of publicaciones) {
            const [respuestas] = await pool.query(`
                SELECT
                    respuestas_publicacion.*,
                    usuarios.nombre,
                    usuarios.foto_perfil
                FROM respuestas_publicacion
                INNER JOIN usuarios ON respuestas_publicacion.usuario_id = usuarios.id
                WHERE publicacion_id = ?
                ORDER BY respuestas_publicacion.fecha ASC
            `, [publicacion.id]);

            publicacion.respuestas = respuestas;
        }

        res.json(publicaciones);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener publicaciones" });
    }
});

// Crear publicación
app.post("/publicaciones", async (req, res) => {
    try {
        const { usuario_id, texto } = req.body;

        if (!usuario_id || !texto) {
            return res.json({ success: false, error: "Datos incompletos" });
        }

        await pool.query(
            `INSERT INTO publicaciones (usuario_id, texto) VALUES (?, ?)`,
            [usuario_id, texto]
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.json({ success: false, error: error.message });
    }
});

// Responder publicación
app.post("/respuesta", async (req, res) => {
    try {
        const { publicacion_id, usuario_id, texto } = req.body;

        await pool.query(
            `INSERT INTO respuestas_publicacion (publicacion_id, usuario_id, texto)
            VALUES (?, ?, ?)`,
            [publicacion_id, usuario_id, texto]
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.json({ success: false, error: error.message });
    }
});

// Eliminar publicación (y sus respuestas primero)
app.delete("/publicaciones/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Eliminar respuestas relacionadas primero (integridad referencial)
        await pool.query(
            `DELETE FROM respuestas_publicacion WHERE publicacion_id = ?`,
            [id]
        );

        // Eliminar la publicación
        await pool.query(
            `DELETE FROM publicaciones WHERE id = ?`,
            [id]
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.json({ success: false, error: error.message });
    }
});

const path = require("path");

app.get("/", (req, res) => {
    console.log("Entro a la ruta /")
    res.sendFile(path.join(__dirname, "public", "Presentacion.html"));
});

const fs = require("fs");

console.log(
    fs.existsSync(path.join(__dirname, "public", "Presentacion.html"))
);

// ─────────────────────────────────────────────
// INICIAR SERVIDOR
// ─────────────────────────────────────────────
app.listen(3000, () => {
    console.log("Servidor iniciado en http://localhost:3000");
});