const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const crypto = require("crypto");

dotenv.config();

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "";
const STATE_KEY = "lumenkids-state";

const app = express();
const hasDatabase = Boolean(DATABASE_URL);
const pool = hasDatabase
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : null;

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

const profiles = [
  {
    id: "ana-lopez",
    name: "Ana López",
    username: "ana.lopez",
    role: "Estudiante",
    grade: "7°",
    group: "A",
    courseId: "course-7a",
    focus: "Lógica y patrones",
    avatar: "AL",
  },
  {
    id: "diego-ramos",
    name: "Diego Ramos",
    username: "diego.ramos",
    role: "Estudiante",
    grade: "8°",
    group: "B",
    courseId: "course-8b",
    focus: "Cálculo y estrategia",
    avatar: "DR",
  },
  {
    id: "camila-torres",
    name: "Camila Torres",
    username: "camila.torres",
    role: "Docente",
    grade: "Tutoría",
    group: "B",
    courseId: "course-8b",
    focus: "Seguimiento académico",
    avatar: "CT",
  },
];

const courseSeed = [
  {
    id: "course-7a",
    name: "Grado 7 · Grupo A",
    teacher: "Camila Torres",
    group: "A",
    theme: "Lógica y patrones",
    members: 24,
    activeChallenges: 3,
    avgPoints: 274,
    completion: 68,
    topStudent: "Ana López",
    objective: "Consolidar pensamiento lógico y autonomía.",
  },
  {
    id: "course-8b",
    name: "Grado 8 · Grupo B",
    teacher: "Julián Mora",
    group: "B",
    theme: "Tecnología aplicada",
    members: 22,
    activeChallenges: 4,
    avgPoints: 312,
    completion: 74,
    topStudent: "Diego Ramos",
    objective: "Resolver retos colaborativos con precisión.",
  },
  {
    id: "course-9c",
    name: "Grado 9 · Grupo C",
    teacher: "Laura Pérez",
    group: "C",
    theme: "Matemática avanzada",
    members: 20,
    activeChallenges: 2,
    avgPoints: 331,
    completion: 81,
    topStudent: "Sofía León",
    objective: "Fortalecer razonamiento y análisis de datos.",
  },
];

function createProfileProgress(overrides = {}) {
  const base = {
    points: 120,
    streak: 4,
    completedChallenges: ["pattern-paths"],
    olympiadCorrect: 0,
    olympiadReviewed: false,
    collabSolved: false,
    collaborationScore: 52,
    latestBadge: "Primer impulso",
    selectedRoles: ["Analista"],
    challengeProgress: {
      "pattern-paths": true,
      "math-express": false,
      "tech-map": false,
    },
    roundAnswers: {
      "round-1": null,
      "round-2": null,
      "round-3": null,
    },
    ...overrides,
  };

  base.challengeProgress = {
    "pattern-paths": false,
    "math-express": false,
    "tech-map": false,
    ...(overrides.challengeProgress || {}),
  };

  base.roundAnswers = {
    "round-1": null,
    "round-2": null,
    "round-3": null,
    ...(overrides.roundAnswers || {}),
  };

  return base;
}

function createInitialProfileProgress() {
  return {
    "ana-lopez": createProfileProgress({
      points: 120,
      streak: 4,
      completedChallenges: ["pattern-paths"],
      challengeProgress: {
        "pattern-paths": true,
      },
    }),
    "diego-ramos": createProfileProgress({
      points: 184,
      streak: 6,
      completedChallenges: ["pattern-paths", "tech-map"],
      collaborationScore: 68,
      latestBadge: "Maestro de constancia",
      selectedRoles: ["Estratega", "Verificador"],
      challengeProgress: {
        "pattern-paths": true,
        "tech-map": true,
      },
    }),
    "camila-torres": createProfileProgress({
      points: 96,
      streak: 3,
      completedChallenges: [],
      collaborationScore: 74,
      latestBadge: "Sin desbloqueos aún",
      selectedRoles: ["Analista"],
      challengeProgress: {},
    }),
  };
}

const defaultState = {
  loggedIn: false,
  activeProfileId: profiles[0].id,
  activeCourseId: profiles[0].courseId,
  profiles: cloneValue(profiles),
  courses: cloneValue(courseSeed),
  profileAssignments: Object.fromEntries(profiles.map((profile) => [profile.id, profile.courseId])),
  profileProgress: createInitialProfileProgress(),
};

function normalizeState(source = {}) {
  const parsed = typeof source === "object" && source !== null ? source : {};
  return {
    ...cloneValue(defaultState),
    ...parsed,
    profiles: Array.isArray(parsed.profiles) ? parsed.profiles : cloneValue(defaultState.profiles),
    courses: Array.isArray(parsed.courses) ? parsed.courses : cloneValue(defaultState.courses),
    profileAssignments: parsed.profileAssignments || cloneValue(defaultState.profileAssignments),
    profileProgress: parsed.profileProgress || cloneValue(defaultState.profileProgress),
    loggedIn: parsed.loggedIn ?? defaultState.loggedIn,
    activeProfileId: parsed.activeProfileId || defaultState.activeProfileId,
    activeCourseId: parsed.activeCourseId || defaultState.activeCourseId,
  };
}

function createAvatar(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "U")
    .join("")
    .slice(0, 2) || "U";
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash).split(":");
  if (!salt || !hash) {
    return false;
  }

  const computed = crypto.scryptSync(password, salt, 64).toString("hex");
  const storedBuffer = Buffer.from(hash, "hex");
  const computedBuffer = Buffer.from(computed, "hex");
  if (storedBuffer.length !== computedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, computedBuffer);
}

async function ensureTables() {
  if (!pool) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      state_key TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      grade TEXT NOT NULL,
      group_name TEXT NOT NULL,
      course_id TEXT NOT NULL,
      avatar TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function readState() {
  await ensureTables();
  const result = await pool.query("SELECT payload FROM app_state WHERE state_key = $1", [STATE_KEY]);
  return result.rows[0]?.payload ? normalizeState(result.rows[0].payload) : cloneValue(defaultState);
}

async function writeState(payload) {
  await ensureTables();
  await pool.query(
    `
      INSERT INTO app_state (state_key, payload, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (state_key)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `,
    [STATE_KEY, JSON.stringify(normalizeState(payload))],
  );
}

async function listAccounts() {
  await ensureTables();
  const result = await pool.query(
    `
      SELECT id, name, username, role, grade, group_name, course_id, avatar
      FROM app_accounts
      ORDER BY created_at ASC
    `,
  );
  return result.rows;
}

async function buildAccountState(accountRow) {
  const currentState = await readState();
  const profileExists = currentState.profiles.some((profile) => profile.id === accountRow.id);
  if (profileExists) {
    return currentState;
  }

  const profile = {
    id: accountRow.id,
    name: accountRow.name,
    username: accountRow.username,
    role: accountRow.role,
    grade: accountRow.grade,
    group: accountRow.group_name,
    courseId: accountRow.course_id,
    focus: accountRow.role === "Docente" ? "Seguimiento académico" : "Ruta de aprendizaje personal",
    avatar: accountRow.avatar,
  };

  const mergedState = normalizeState({
    ...currentState,
    profiles: [...currentState.profiles, profile],
    profileAssignments: {
      ...currentState.profileAssignments,
      [profile.id]: profile.courseId,
    },
    profileProgress: {
      ...currentState.profileProgress,
      [profile.id]: createProfileProgress(),
    },
  });

  await writeState(mergedState);
  return mergedState;
}

app.get("/api/health", async (_request, response) => {
  response.json({ ok: true, neonConnected: hasDatabase });
});

app.get(["/api/state", "/api/bootstrap"], async (_request, response) => {
  if (!pool) {
    response.json(cloneValue(defaultState));
    return;
  }

  try {
    response.json(await readState());
  } catch (error) {
    response.status(500).json({ error: "Unable to read state.", detail: error.message });
  }
});

app.put(["/api/state", "/api/bootstrap"], async (request, response) => {
  if (!pool) {
    response.status(503).json({ error: "Neon database is not configured." });
    return;
  }

  const payload = request.body;
  if (!payload || typeof payload !== "object") {
    response.status(400).json({ error: "A JSON state object is required." });
    return;
  }

  try {
    await writeState(payload);

    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({ error: "Unable to save state.", detail: error.message });
  }
});

app.post("/api/auth/register", async (request, response) => {
  if (!pool) {
    response.status(503).json({ error: "Neon database is not configured." });
    return;
  }

  const name = String(request.body?.name || "").trim();
  const username = String(request.body?.username || "").trim().toLowerCase();
  const password = String(request.body?.password || "");
  const role = String(request.body?.role || "Estudiante").trim();
  const grade = String(request.body?.grade || "").trim();
  const group = String(request.body?.group || "").trim();
  const courseId = String(request.body?.courseId || "").trim() || profiles[0].courseId;

  if (!name || !username || !password) {
    response.status(400).json({ error: "Name, username and password are required." });
    return;
  }

  try {
    const existing = await pool.query("SELECT id FROM app_accounts WHERE username = $1", [username]);
    if (existing.rowCount > 0) {
      response.status(409).json({ error: "That username already exists." });
      return;
    }

    const id = `user-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const avatar = createAvatar(name);
    const passwordHash = hashPassword(password);

    await ensureTables();
    await pool.query(
      `
        INSERT INTO app_accounts (id, name, username, password_hash, role, grade, group_name, course_id, avatar)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [id, name, username, passwordHash, role, grade || role, group || "A", courseId, avatar],
    );

    const accountRow = {
      id,
      name,
      username,
      role,
      grade: grade || role,
      group_name: group || "A",
      course_id: courseId,
      avatar,
    };

    const state = await buildAccountState(accountRow);
    response.status(201).json({
      account: {
        id,
        name,
        username,
        role,
        grade: grade || role,
        group: group || "A",
        courseId,
        avatar,
      },
      state,
    });
  } catch (error) {
    response.status(500).json({ error: "Unable to create account.", detail: error.message });
  }
});

app.post("/api/auth/login", async (request, response) => {
  if (!pool) {
    response.status(503).json({ error: "Neon database is not configured." });
    return;
  }

  const username = String(request.body?.username || "").trim().toLowerCase();
  const password = String(request.body?.password || "");

  if (!username || !password) {
    response.status(400).json({ error: "Username and password are required." });
    return;
  }

  try {
    await ensureTables();
    const result = await pool.query(
      `
        SELECT id, name, username, password_hash, role, grade, group_name, course_id, avatar
        FROM app_accounts
        WHERE username = $1
        LIMIT 1
      `,
      [username],
    );

    const accountRow = result.rows[0];
    if (!accountRow || !verifyPassword(password, accountRow.password_hash)) {
      response.status(401).json({ error: "Usuario o contraseña incorrectos." });
      return;
    }

    const state = await buildAccountState(accountRow);
    response.json({
      account: {
        id: accountRow.id,
        name: accountRow.name,
        username: accountRow.username,
        role: accountRow.role,
        grade: accountRow.grade,
        group: accountRow.group_name,
        courseId: accountRow.course_id,
        avatar: accountRow.avatar,
      },
      state,
    });
  } catch (error) {
    response.status(500).json({ error: "Unable to authenticate.", detail: error.message });
  }
});

app.get("*", (_request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`LumenKids server listening on http://localhost:${PORT}`);
});
