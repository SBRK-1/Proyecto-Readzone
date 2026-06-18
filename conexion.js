const express = require("express");
const mysql   = require("mysql2");
const bcrypt  = require("bcrypt");
const path    = require("path");
const fs      = require("fs");

const app = express();

// ═══════════════════════════════════════════════════════════════
// CONEXIÓN A BASE DE DATOS
// ═══════════════════════════════════════════════════════════════

const pool = mysql.createPool({
    host:               process.env.DB_HOST     || "acela.proxy.rlwy.net",
    user:               process.env.DB_USER     || "root",
    password:           process.env.DB_PASSWORD || "CUfMwashpeeRltZckCavAYvzQpWPkaPa",
    database:           process.env.DB_NAME     || "railway",
    port:               process.env.DB_PORT     || 27816,
    waitForConnections: true,
    connectionLimit:    30,
    charset:            "utf8mb4" 
}).promise();

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

// CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin",  "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Archivos estáticos
app.use(express.static("public"));

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════

app.get("/", (req, res) => {
    const htmlPath = path.join(__dirname, "public", "Presentacion.html");
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        res.status(404).send("Archivo Presentacion.html no encontrado.");
    }
});

// ═══════════════════════════════════════════════════════════════
// USUARIOS
// ═══════════════════════════════════════════════════════════════

// Obtener todos los usuarios
app.get("/usuarios", async (req, res) => {
    try {
        const [filas] = await pool.query(
            "SELECT id, nombre, usuario, correo, foto_perfil FROM usuarios"
        );
        res.json(filas);
    } catch (error) {
        console.error("GET /usuarios →", error.message);
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// ── Registro ─────────────────────────────────────────────────────
app.post("/registro", async (req, res) => {
    try {
        const { nombre, usuario, correo, contraseña } = req.body;

        if (!nombre || !usuario || !correo || !contraseña) {
            return res.status(400).json({ success: false, error: "Todos los campos son obligatorios" });
        }

        const [yaExiste] = await pool.query(
            "SELECT id FROM usuarios WHERE correo = ? OR usuario = ?",
            [correo, usuario]
        );
        if (yaExiste.length > 0) {
            return res.json({ success: false, error: "El correo o usuario ya está registrado" });
        }

        const hash = await bcrypt.hash(contraseña, 10);

        const [result] = await pool.query(
            `INSERT INTO usuarios (nombre, usuario, correo, contraseña)
            VALUES (?, ?, ?, ?)`,
            [nombre, usuario, correo, hash]
        );

        const [nuevo] = await pool.query(
            "SELECT id, nombre, usuario, correo, foto_perfil FROM usuarios WHERE id = ?",
            [result.insertId]
        );

        res.json({ success: true, usuario: nuevo[0] });

    } catch (error) {
        console.error("POST /registro →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Login ────────────────────────────────────────────────────────
app.post("/login", async (req, res) => {
    try {
        const { correo, contraseña } = req.body;

        if (!correo || !contraseña) {
            return res.json({ success: false, error: "Faltan datos" });
        }

        const [usuarios] = await pool.query(
            "SELECT * FROM usuarios WHERE correo = ?",
            [correo]
        );

        if (usuarios.length === 0) {
            return res.json({ success: false, error: "Credenciales incorrectas" });
        }

        const u        = usuarios[0];
        const coincide = await bcrypt.compare(contraseña, u.contraseña);

        if (!coincide) {
            return res.json({ success: false, error: "Credenciales incorrectas" });
        }

        res.json({
            success: true,
            usuario: {
                id:          u.id,
                nombre:      u.nombre,
                usuario:     u.usuario,
                correo:      u.correo,
                foto_perfil: u.foto_perfil
            }
        });

    } catch (error) {
        console.error("POST /login →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// PERFIL DE USUARIO
// ═══════════════════════════════════════════════════════════════

// Obtener perfil por ID
app.get("/usuario/:id", async (req, res) => {
    try {
        const [datos] = await pool.query(
            `SELECT id, nombre, usuario, correo,
                    foto_perfil, foto_portada,
                    biografia, genero, fecha_registro
            FROM usuarios
            WHERE id = ?`,
            [req.params.id]
        );

        if (datos.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(datos[0]);

    } catch (error) {
        console.error("GET /usuario/:id →", error.message);
        res.status(500).json({ error: "Error al obtener el perfil" });
    }
});

// Actualizar perfil
app.put("/usuario/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, usuario, foto_perfil, foto_portada, biografia, genero } = req.body;

        if (!nombre || !usuario) {
            return res.json({ success: false, error: "Nombre y usuario son obligatorios" });
        }

        const [existe] = await pool.query(
            "SELECT id FROM usuarios WHERE usuario = ? AND id <> ?",
            [usuario, id]
        );
        if (existe.length > 0) {
            return res.json({ success: false, error: "Ese nombre de usuario ya está en uso" });
        }

        const [actual] = await pool.query(
            "SELECT foto_perfil, foto_portada FROM usuarios WHERE id = ?",
            [id]
        );

        if (actual.length === 0) {
            return res.status(404).json({ success: false, error: "Usuario no encontrado" });
        }

        const fotoPerfilFinal  = foto_perfil  || actual[0].foto_perfil;
        const fotoPortadaFinal = foto_portada || actual[0].foto_portada;

        await pool.query(
            `UPDATE usuarios
            SET nombre       = ?,
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
                biografia || "",
                genero    || "No especificado",
                id
            ]
        );

        res.json({ success: true });

    } catch (error) {
        console.error("PUT /usuario/:id →", error.message);
        res.status(500).json({ success: false, error: "Error al actualizar perfil" });
    }
});

// ═══════════════════════════════════════════════════════════════
// HISTORIAS
// ═══════════════════════════════════════════════════════════════

// Historias populares y recientes (página principal)
// ARREGLADO: se quitó el GROUP BY conflictivo (u.nombre no es agregado
// ni funcionalmente dependiente de h.id para MySQL) y se reemplazó
// total_vistas por una subconsulta, evitando el error ONLY_FULL_GROUP_BY.
app.get("/historias", async (req, res) => {
    try {
        const [populares] = await pool.query(`
            SELECT h.*, u.nombre AS nombre_autor,
                    (SELECT COUNT(*) FROM vistas v WHERE v.historia_id = h.id) AS total_vistas
            FROM historias h
            INNER JOIN usuarios u ON h.usuario_id = u.id
            ORDER BY total_vistas DESC
            LIMIT 4
        `);

        const [recientes] = await pool.query(`
            SELECT h.*, u.nombre AS nombre_autor,
                    (SELECT COUNT(*) FROM vistas v WHERE v.historia_id = h.id) AS total_vistas
            FROM historias h
            INNER JOIN usuarios u ON h.usuario_id = u.id
            ORDER BY h.fecha_creacion DESC
            LIMIT 4
        `);

        res.json({ populares, recientes });

    } catch (error) {
        console.error("GET /historias →", error.message);
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
        console.error("GET /historias/:usuarioId →", error.message);
        res.status(500).json({ error: "Error al obtener historias del usuario" });
    }
});

// Crear historia
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

        if (!usuario_id) {
            return res.status(400).json({ success: false, error: "Falta usuario_id" });
        }

        // Verificar que el usuario existe
        const [usuarioExiste] = await pool.query(
            "SELECT id FROM usuarios WHERE id = ?",
            [usuario_id]
        );
        if (usuarioExiste.length === 0) {
            return res.status(400).json({ success: false, error: "Usuario no encontrado" });
        }

        const [result] = await pool.query(
            `INSERT INTO historias
                (usuario_id, titulo, descripcion, portada,
                    idioma, categoria, derechos, audiencia,
                    etiquetas, contenido_adulto)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuario_id,
                titulo           || "Nueva Historia",
                descripcion      || "",
                portada          || "",
                idioma           || "Español",
                categoria        || "",
                derechos         || "",
                audiencia        || "",
                etiquetas        || "",
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
            capitulo_id: capResult.insertId
        });

    } catch (error) {
        console.error("POST /historias →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Eliminar historia (y todo lo que dependa de ella)
app.delete("/historias/:id", async (req, res) => {
    try {
        const id = req.params.id;

        await pool.query(
            `DELETE FROM progreso_lectura
            WHERE capitulo_id IN (SELECT id FROM capitulos WHERE historia_id = ?)`,
            [id]
        );
        await pool.query("DELETE FROM capitulos            WHERE historia_id = ?", [id]);
        await pool.query("DELETE FROM biblioteca            WHERE historia_id = ?", [id]);
        await pool.query("DELETE FROM vistas                WHERE historia_id = ?", [id]);
        await pool.query("DELETE FROM historias_guardadas   WHERE historia_id = ?", [id]);
        await pool.query("DELETE FROM historial_lectura     WHERE historia_id = ?", [id]);
        await pool.query("DELETE FROM historias_destacadas  WHERE historia_id = ?", [id]);
        await pool.query("DELETE FROM historias             WHERE id = ?",          [id]);

        res.json({ success: true });

    } catch (error) {
        console.error("DELETE /historias/:id →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener una historia por ID
app.get("/historia/:id", async (req, res) => {
    try {
        const [filas] = await pool.query(
            "SELECT * FROM historias WHERE id = ?",
            [req.params.id]
        );

        if (filas.length === 0) {
            return res.status(404).json({ error: "Historia no encontrada" });
        }

        res.json(filas[0]);

    } catch (error) {
        console.error("GET /historia/:id →", error.message);
        res.status(500).json({ error: "Error al obtener la historia" });
    }
});

// Actualizar detalles de una historia
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
                idioma, categoria,   derechos,
                audiencia, etiquetas,
                contenido_adulto ? 1 : 0,
                completa         ? 1 : 0,
                req.params.id
            ]
        );

        res.json({ success: true });

    } catch (error) {
        console.error("PUT /historia/:id →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Publicar historia (marcar como completa)
app.put("/historia/:id/publicar", async (req, res) => {
    try {
        await pool.query(
            "UPDATE historias SET completa = TRUE WHERE id = ?",
            [req.params.id]
        );

        res.json({ success: true });

    } catch (error) {
        console.error("PUT /historia/:id/publicar →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Vistas de una historia
app.get("/historia/:id/vistas", async (req, res) => {
    try {
        const [filas] = await pool.query(
            "SELECT COUNT(*) AS total FROM vistas WHERE historia_id = ?",
            [req.params.id]
        );

        res.json({ total: filas[0].total });

    } catch (error) {
        console.error("GET /historia/:id/vistas →", error.message);
        res.status(500).json({ total: 0 });
    }
});

// Registrar vista
app.post("/vista", async (req, res) => {
    try {
        const { usuario_id, historia_id } = req.body;

        if (!usuario_id || !historia_id) {
            return res.status(400).json({ success: false, error: "Faltan datos" });
        }

        await pool.query(
            "INSERT INTO vistas (usuario_id, historia_id) VALUES (?, ?)",
            [usuario_id, historia_id]
        );

        res.json({ success: true });

    } catch (error) {
        console.error("POST /vista →", error.message);
        res.status(500).json({ success: false });
    }
});

// ═══════════════════════════════════════════════════════════════
// CAPÍTULOS
// ═══════════════════════════════════════════════════════════════

app.put("/capitulos/reordenar", async (req, res) => {
    try {
        const { orden } = req.body; // [{ id, numero_capitulo }, ...]

        if (!Array.isArray(orden) || orden.length === 0) {
            return res.status(400).json({ success: false, error: "Formato inválido" });
        }

        for (const item of orden) {
            await pool.query(
                "UPDATE capitulos SET numero_capitulo = ? WHERE id = ?",
                [item.numero_capitulo, item.id]
            );
        }

        res.json({ success: true });

    } catch (error) {
        console.error("PUT /capitulos/reordenar →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Capítulos de una historia
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
        console.error("GET /capitulos/:historiaId →", error.message);
        res.status(500).json({ error: "Error al obtener capítulos" });
    }
});

// Crear capítulo
app.post("/capitulos", async (req, res) => {
    try {
        const { historia_id, titulo, contenido, numero_capitulo } = req.body;

        if (!historia_id || !titulo) {
            return res.status(400).json({ success: false, error: "Faltan datos obligatorios" });
        }

        const [result] = await pool.query(
            `INSERT INTO capitulos (historia_id, titulo, contenido, numero_capitulo)
            VALUES (?, ?, ?, ?)`,
            [historia_id, titulo, contenido || "", numero_capitulo || 1]
        );

        res.json({ success: true, capitulo_id: result.insertId });

    } catch (error) {
        console.error("POST /capitulos →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener capítulo por ID
app.get("/capitulo/:id", async (req, res) => {
    try {
        const [filas] = await pool.query(
            "SELECT * FROM capitulos WHERE id = ?",
            [req.params.id]
        );

        if (filas.length === 0) {
            return res.status(404).json({ error: "Capítulo no encontrado" });
        }

        res.json(filas[0]);

    } catch (error) {
        console.error("GET /capitulo/:id →", error.message);
        res.status(500).json({ error: "Error al obtener el capítulo" });
    }
});

// Guardar / actualizar capítulo
app.put("/capitulo/:id", async (req, res) => {
    try {
        const { titulo, contenido } = req.body;

        if (!titulo) {
            return res.status(400).json({ success: false, error: "El título es obligatorio" });
        }

        await pool.query(
            `UPDATE capitulos
            SET titulo = ?, contenido = ?, fecha_creacion = NOW()
            WHERE id = ?`,
            [titulo, contenido || "", req.params.id]
        );

        res.json({ success: true });

    } catch (error) {
        console.error("PUT /capitulo/:id →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Eliminar capítulo
app.delete("/capitulo/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM progreso_lectura WHERE capitulo_id = ?", [req.params.id]);
        await pool.query("DELETE FROM capitulos         WHERE id = ?",          [req.params.id]);
        res.json({ success: true });

    } catch (error) {
        console.error("DELETE /capitulo/:id →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// PUBLICACIONES
// ═══════════════════════════════════════════════════════════════

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

        for (const pub of publicaciones) {
            const [respuestas] = await pool.query(`
                SELECT
                    respuestas_publicacion.*,
                    usuarios.nombre,
                    usuarios.foto_perfil
                FROM respuestas_publicacion
                INNER JOIN usuarios ON respuestas_publicacion.usuario_id = usuarios.id
                WHERE publicacion_id = ?
                ORDER BY respuestas_publicacion.fecha ASC
            `, [pub.id]);

            pub.respuestas = respuestas;
        }

        res.json(publicaciones);

    } catch (error) {
        console.error("GET /publicaciones →", error.message);
        res.status(500).json({ error: "Error al obtener publicaciones" });
    }
});

// Crear publicación
app.post("/publicaciones", async (req, res) => {
    try {
        const { usuario_id, texto } = req.body;

        if (!usuario_id || !texto) {
            return res.status(400).json({ success: false, error: "Datos incompletos" });
        }

        await pool.query(
            "INSERT INTO publicaciones (usuario_id, texto) VALUES (?, ?)",
            [usuario_id, texto]
        );

        res.json({ success: true });

    } catch (error) {
        console.error("POST /publicaciones →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Responder publicación
app.post("/respuesta", async (req, res) => {
    try {
        const { publicacion_id, usuario_id, texto } = req.body;

        if (!publicacion_id || !usuario_id || !texto) {
            return res.status(400).json({ success: false, error: "Datos incompletos" });
        }

        await pool.query(
            `INSERT INTO respuestas_publicacion (publicacion_id, usuario_id, texto)
                VALUES (?, ?, ?)`,
            [publicacion_id, usuario_id, texto]
        );

        res.json({ success: true });

    } catch (error) {
        console.error("POST /respuesta →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Eliminar publicación (y sus respuestas)
app.delete("/publicaciones/:id", async (req, res) => {
    try {
        const id = req.params.id;

        await pool.query("DELETE FROM respuestas_publicacion WHERE publicacion_id = ?", [id]);
        await pool.query("DELETE FROM publicaciones WHERE id = ?",                      [id]);

        res.json({ success: true });

    } catch (error) {
        console.error("DELETE /publicaciones/:id →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// PROGRESO DE LECTURA
// ═══════════════════════════════════════════════════════════════

app.post("/progreso", async (req, res) => {
    try {
        const { usuario_id, capitulo_id } = req.body;

        if (!usuario_id || !capitulo_id) {
            return res.status(400).json({ success: false, error: "Faltan datos" });
        }

        const [existe] = await pool.query(
            "SELECT id FROM progreso_lectura WHERE usuario_id = ? AND capitulo_id = ?",
            [usuario_id, capitulo_id]
        );

        if (existe.length > 0) {
            await pool.query(
                "UPDATE progreso_lectura SET fecha = NOW() WHERE usuario_id = ? AND capitulo_id = ?",
                [usuario_id, capitulo_id]
            );
        } else {
            await pool.query(
                "INSERT INTO progreso_lectura (usuario_id, capitulo_id) VALUES (?, ?)",
                [usuario_id, capitulo_id]
            );
        }

        res.json({ success: true });

    } catch (error) {
        console.error("POST /progreso →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// BIBLIOTECA
// ═══════════════════════════════════════════════════════════════

app.get("/biblioteca/:usuarioId", async (req, res) => {
    try {
        const [historias] = await pool.query(`
            SELECT
                h.id,
                h.titulo,
                h.portada,
                h.descripcion,
                u.nombre AS nombre_autor,
                (SELECT COUNT(*) FROM capitulos c WHERE c.historia_id = h.id) AS total_capitulos
            FROM biblioteca b
            INNER JOIN historias h ON b.historia_id = h.id
            INNER JOIN usuarios  u ON h.usuario_id  = u.id
            WHERE b.usuario_id = ?
            ORDER BY b.id DESC
        `, [req.params.usuarioId]);

        res.json(historias);

    } catch (error) {
        console.error("GET /biblioteca/:usuarioId →", error.message);
        res.status(500).json({ error: "Error al obtener biblioteca" });
    }
});

// Saber si una historia puntual ya está en la biblioteca de un
// usuario (usado por Mostrar_historia.js para pintar el botón al cargar).
app.get("/biblioteca/:usuarioId/:historiaId/estado", async (req, res) => {
    try {
        const { usuarioId, historiaId } = req.params;

        const [existe] = await pool.query(
            "SELECT id FROM biblioteca WHERE usuario_id = ? AND historia_id = ?",
            [usuarioId, historiaId]
        );

        res.json({ guardada: existe.length > 0 });

    } catch (error) {
        console.error("GET /biblioteca/:usuarioId/:historiaId/estado →", error.message);
        res.status(500).json({ guardada: false, error: error.message });
    }
});

// Agregar historia a la biblioteca del usuario
app.post("/biblioteca", async (req, res) => {
    try {
        const { usuario_id, historia_id } = req.body;

        if (!usuario_id || !historia_id) {
            return res.status(400).json({ success: false, error: "Faltan datos" });
        }

        const [existe] = await pool.query(
            "SELECT id FROM biblioteca WHERE usuario_id = ? AND historia_id = ?",
            [usuario_id, historia_id]
        );

        if (existe.length > 0) {
            return res.json({ success: true, yaExiste: true });
        }

        await pool.query(
            "INSERT INTO biblioteca (usuario_id, historia_id) VALUES (?, ?)",
            [usuario_id, historia_id]
        );

        res.json({ success: true, yaExiste: false });

    } catch (error) {
        console.error("POST /biblioteca →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Quitar historia de la biblioteca del usuario
app.delete("/biblioteca/:usuarioId/:historiaId", async (req, res) => {
    try {
        await pool.query(
            "DELETE FROM biblioteca WHERE usuario_id = ? AND historia_id = ?",
            [req.params.usuarioId, req.params.historiaId]
        );

        res.json({ success: true });

    } catch (error) {
        console.error("DELETE /biblioteca/:usuarioId/:historiaId →", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// BÚSQUEDA GLOBAL
// ═══════════════════════════════════════════════════════════════

app.get("/buscar", async (req, res) => {
    try {
        const q = `%${req.query.q || ""}%`;

        const [historias] = await pool.query(`
            SELECT
                h.id, h.titulo, h.descripcion, h.portada,
                h.categoria, h.completa, h.contenido_adulto,
                h.fecha_creacion,
                u.nombre  AS nombre_autor,
                u.usuario AS usuario_autor,
                (SELECT COUNT(*) FROM vistas v WHERE v.historia_id = h.id) AS total_vistas
            FROM historias h
            INNER JOIN usuarios u ON h.usuario_id = u.id
            WHERE h.titulo      LIKE ?
                OR h.descripcion LIKE ?
                OR h.etiquetas   LIKE ?
                OR h.categoria   LIKE ?
            ORDER BY h.fecha_creacion DESC
        `, [q, q, q, q]);

        const [usuarios] = await pool.query(`
            SELECT id, nombre, usuario, foto_perfil, biografia
            FROM usuarios
            WHERE nombre  LIKE ?
                OR usuario LIKE ?
        `, [q, q]);

        res.json({ historias, usuarios });

    } catch (error) {
        console.error("GET /buscar →", error.message);
        res.status(500).json({ error: "Error en la búsqueda" });
    }
});

// ═══════════════════════════════════════════════════════════════
// INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Servidor iniciado en http://localhost:${PORT}`);
});