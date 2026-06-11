const express = require("express");
const mysql = require('mysql2');
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

const app = express();

// ─────────────────────────────────────────────
// CONEXIÓN A BASE DE DATOS
// ─────────────────────────────────────────────

const pool = mysql.createPool({
    host: 'acela.proxy.rlwy.net',
    user: 'root',
    password: 'CUfMwashpeeRltZckCavAYvzQpWPkaPa',
    database: 'railway',
    port: 27816,
    waitForConnections: true,
    connectionLimit: 10
}).promise();

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

// Actualizar perfil
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

        if (!nombre || !usuario) {
            return res.json({ success: false, error: "Nombre y usuario son obligatorios" });
        }

        const [existe] = await pool.query(
            `SELECT id FROM usuarios WHERE usuario = ? AND id <> ?`,
            [usuario, id]
        );

        if (existe.length > 0) {
            return res.json({ success: false, error: "Ese usuario ya existe" });
        }

        const [actual] = await pool.query(
            `SELECT foto_perfil, foto_portada FROM usuarios WHERE id = ?`,
            [id]
        );

        const fotoPerfilFinal  = foto_perfil  || actual[0].foto_perfil;
        const fotoPortadaFinal = foto_portada || actual[0].foto_portada;

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
            [nombre, usuario, fotoPerfilFinal, fotoPortadaFinal, biografia, genero, id]
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

        await pool.query(
            `DELETE FROM respuestas_publicacion WHERE publicacion_id = ?`,
            [id]
        );

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

// ─────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────

app.get("/", (req, res) => {
    console.log("Entro a la ruta /");
    res.sendFile(path.join(__dirname, "public", "Presentacion.html"));
});

console.log(
    fs.existsSync(path.join(__dirname, "public", "Presentacion.html"))
);

// ─────────────────────────────────────────────
// CREAR HISTORIA (desde Modificar_historias)
// ─────────────────────────────────────────────

app.post("/historias", async (req, res) => {
    try {
        const { usuario_id, titulo, descripcion, portada } = req.body;

        const [result] = await pool.query(
            `INSERT INTO historias (usuario_id, titulo, descripcion, portada)
            VALUES (?, ?, ?, ?)`,
            [usuario_id, titulo || "Nueva Historia", descripcion || "", portada || ""]
        );

        const historiaId = result.insertId;

        // Crear el primer capítulo automáticamente (Prólogo)
        await pool.query(
            `INSERT INTO capitulos (historia_id, titulo, contenido, numero_capitulo)
            VALUES (?, ?, ?, ?)`,
            [historiaId, "Prólogo", "", 1]
        );

        res.json({ success: true, historia_id: historiaId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// ELIMINAR HISTORIA (y sus capítulos)
// ─────────────────────────────────────────────

app.delete("/historias/:id", async (req, res) => {
    try {
        const id = req.params.id;

        await pool.query(`DELETE FROM capitulos WHERE historia_id = ?`, [id]);
        await pool.query(`DELETE FROM historias WHERE id = ?`, [id]);

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// CAPÍTULOS DE UNA HISTORIA
// ─────────────────────────────────────────────

app.get("/capitulos/:historiaId", async (req, res) => {
    try {
        const [capitulos] = await pool.query(
            `SELECT * FROM capitulos
            WHERE historia_id = ?
            ORDER BY numero_capitulo ASC`,
            [req.params.historiaId]
        );

        res.json(capitulos);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener capítulos" });
    }
});

// ─────────────────────────────────────────────
// CREAR CAPÍTULO NUEVO
// ─────────────────────────────────────────────

app.post("/capitulos", async (req, res) => {
    try {
        const { historia_id, titulo, contenido, numero_capitulo } = req.body;

        const [result] = await pool.query(
            `INSERT INTO capitulos (historia_id, titulo, contenido, numero_capitulo)
            VALUES (?, ?, ?, ?)`,
            [historia_id, titulo, contenido || "", numero_capitulo]
        );

        res.json({ success: true, capitulo_id: result.insertId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /historias — Crear historia completa desde el formulario
app.post("/historias", async (req, res) => {
    try {
        const {
            usuario_id,
            titulo,
            descripcion,
            portada,
            idioma,
            categoria,
            derechos,
            audiencia,
            etiquetas,
            contenido_adulto
        } = req.body;

        if (!usuario_id || !titulo) {
            return res.json({ success: false, error: "Faltan datos obligatorios" });
        }

        const [result] = await pool.query(
            `INSERT INTO historias
                (usuario_id, titulo, descripcion, portada,
                idioma, categoria, derechos, audiencia,
                etiquetas, contenido_adulto)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuario_id,
                titulo,
                descripcion  || "",
                portada      || "",
                idioma       || "Español",
                categoria    || "",
                derechos     || "",
                audiencia    || "",
                etiquetas    || "",
                contenido_adulto ? 1 : 0
            ]
        );

        const historiaId = result.insertId;

        // Crear el prólogo automáticamente
        const [capResult] = await pool.query(
            `INSERT INTO capitulos (historia_id, titulo, contenido, numero_capitulo)
            VALUES (?, ?, ?, ?)`,
            [historiaId, "Prólogo", "", 1]
        );

        res.json({
            success:     true,
            historia_id: historiaId,
            capitulo_id: capResult.insertId   // ← necesario para Escritura.html
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// OBTENER UNA HISTORIA POR ID (para el editor)
// ─────────────────────────────────────────────

app.get("/historia/:id", async (req, res) => {
    try {
        const [filas] = await pool.query(
            `SELECT * FROM historias WHERE id = ?`,
            [req.params.id]
        );

        if (filas.length === 0) {
            return res.status(404).json({ error: "Historia no encontrada" });
        }

        res.json(filas[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener la historia" });
    }
});

// ─────────────────────────────────────────────
// OBTENER UN CAPÍTULO POR ID
// ─────────────────────────────────────────────

app.get("/capitulo/:id", async (req, res) => {
    try {
        const [filas] = await pool.query(
            `SELECT * FROM capitulos WHERE id = ?`,
            [req.params.id]
        );

        if (filas.length === 0) {
            return res.status(404).json({ error: "Capítulo no encontrado" });
        }

        res.json(filas[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener el capítulo" });
    }
});

// ─────────────────────────────────────────────
// GUARDAR/ACTUALIZAR CAPÍTULO
// ─────────────────────────────────────────────

app.put("/capitulo/:id", async (req, res) => {
    try {
        const { titulo, contenido } = req.body;

        await pool.query(
            `UPDATE capitulos
            SET titulo = ?, contenido = ?, fecha_creacion = NOW()
            WHERE id = ?`,
            [titulo, contenido, req.params.id]
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// PUBLICAR HISTORIA
// ─────────────────────────────────────────────

app.put("/historia/:id/publicar", async (req, res) => {
    try {
        await pool.query(
            `UPDATE historias SET completa = TRUE WHERE id = ?`,
            [req.params.id]
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// CONTAR VISTAS DE UNA HISTORIA
// ─────────────────────────────────────────────

app.get("/historia/:id/vistas", async (req, res) => {
    try {
        const [filas] = await pool.query(
            `SELECT COUNT(*) AS total FROM vistas WHERE historia_id = ?`,
            [req.params.id]
        );

        res.json({ total: filas[0].total });

    } catch (error) {
        console.error(error);
        res.status(500).json({ total: 0 });
    }
});

// ─────────────────────────────────────────────
// GUARDAR PROGRESO DE LECTURA
// ─────────────────────────────────────────────

app.post("/progreso", async (req, res) => {
    try {
        const { usuario_id, capitulo_id } = req.body;

        // Evitar duplicados: si ya existe ese progreso, actualizarlo
        const [existe] = await pool.query(
            `SELECT id FROM progreso_lectura
            WHERE usuario_id = ? AND capitulo_id = ?`,
            [usuario_id, capitulo_id]
        );

        if (existe.length > 0) {
            await pool.query(
                `UPDATE progreso_lectura SET fecha = NOW()
                WHERE usuario_id = ? AND capitulo_id = ?`,
                [usuario_id, capitulo_id]
            );
        } else {
            await pool.query(
                `INSERT INTO progreso_lectura (usuario_id, capitulo_id)
                VALUES (?, ?)`,
                [usuario_id, capitulo_id]
            );
        }

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// OBTENER BIBLIOTECA DEL USUARIO
// ─────────────────────────────────────────────

app.get("/biblioteca/:usuarioId", async (req, res) => {
    try {
        const [historias] = await pool.query(`
            SELECT
                h.id,
                h.titulo,
                h.portada,
                h.descripcion,
                u.nombre  AS nombre_autor,
                COUNT(c.id) AS total_capitulos
            FROM biblioteca b
            INNER JOIN historias h ON b.historia_id = h.id
            INNER JOIN usuarios  u ON h.usuario_id  = u.id
            LEFT  JOIN capitulos c ON c.historia_id = h.id
            WHERE b.usuario_id = ?
            GROUP BY h.id, h.titulo, h.portada, h.descripcion, u.nombre
            ORDER BY b.id DESC
        `, [req.params.usuarioId]);

        res.json(historias);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener biblioteca" });
    }
});

// ─────────────────────────────────────────────
// AGREGAR HISTORIA A LA BIBLIOTECA
// ─────────────────────────────────────────────

app.post("/biblioteca", async (req, res) => {
    try {
        const { usuario_id, historia_id } = req.body;

        // Evitar duplicados
        const [existe] = await pool.query(
            `SELECT id FROM biblioteca
            WHERE usuario_id = ? AND historia_id = ?`,
            [usuario_id, historia_id]
        );

        if (existe.length > 0) {
            return res.json({ success: true, yaExiste: true });
        }

        await pool.query(
            `INSERT INTO biblioteca (usuario_id, historia_id)
            VALUES (?, ?)`,
            [usuario_id, historia_id]
        );

        res.json({ success: true, yaExiste: false });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// QUITAR HISTORIA DE LA BIBLIOTECA
// ─────────────────────────────────────────────

app.delete("/biblioteca/:usuarioId/:historiaId", async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM biblioteca
            WHERE usuario_id = ? AND historia_id = ?`,
            [req.params.usuarioId, req.params.historiaId]
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// ACTUALIZAR DETALLES DE UNA HISTORIA
// ─────────────────────────────────────────────

app.put("/historia/:id", async (req, res) => {
    try {
        const {
            titulo, descripcion, portada,
            idioma, categoria, derechos,
            audiencia, etiquetas,
            contenido_adulto, completa
        } = req.body;

        await pool.query(
            `UPDATE historias
            SET titulo           = ?,
                descripcion      = ?,
                portada          = ?,
                idioma           = ?,
                categoria        = ?,
                derechos         = ?,
                audiencia        = ?,
                etiquetas        = ?,
                contenido_adulto = ?,
                completa         = ?
             WHERE id = ?`,
            [
                titulo, descripcion, portada || "",
                idioma, categoria, derechos,
                audiencia, etiquetas,
                contenido_adulto ? 1 : 0,
                completa         ? 1 : 0,
                req.params.id
            ]
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// ELIMINAR CAPÍTULO
// ─────────────────────────────────────────────

app.delete("/capitulo/:id", async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM capitulos WHERE id = ?`,
            [req.params.id]
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// REORDENAR CAPÍTULOS (drag and drop)
// ─────────────────────────────────────────────

app.put("/capitulos/reordenar", async (req, res) => {
    try {
        const { orden } = req.body; // [{ id, numero_capitulo }, ...]

        for (const item of orden) {
            await pool.query(
                `UPDATE capitulos SET numero_capitulo = ? WHERE id = ?`,
                [item.numero_capitulo, item.id]
            );
        }

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// BÚSQUEDA GLOBAL (historias y usuarios)
// ─────────────────────────────────────────────

app.get("/buscar", async (req, res) => {
    try {
        const q = `%${req.query.q || ""}%`;

        const [historias] = await pool.query(`
            SELECT
                h.id,
                h.titulo,
                h.descripcion,
                h.portada,
                h.categoria,
                h.completa,
                h.contenido_adulto,
                h.fecha_creacion,
                u.nombre  AS nombre_autor,
                u.usuario AS usuario_autor,
                COUNT(v.id) AS total_vistas
            FROM historias h
            INNER JOIN usuarios u ON h.usuario_id = u.id
            LEFT  JOIN vistas   v ON h.id = v.historia_id
            WHERE h.titulo     LIKE ?
            OR h.descripcion LIKE ?
            OR h.etiquetas   LIKE ?
            OR h.categoria   LIKE ?
            GROUP BY h.id, u.nombre, u.usuario
            ORDER BY h.fecha_creacion DESC
        `, [q, q, q, q]);

        const [usuarios] = await pool.query(`
            SELECT
                id,
                nombre,
                usuario,
                foto_perfil,
                biografia
            FROM usuarios
            WHERE nombre  LIKE ?
            OR usuario LIKE ?
        `, [q, q]);

        res.json({ historias, usuarios });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en la búsqueda" });
    }
});

// ─────────────────────────────────────────────
// INICIAR SERVIDOR
// ─────────────────────────────────────────────

app.listen(3000, () => {
    console.log("Servidor iniciado en http://localhost:3000");
});