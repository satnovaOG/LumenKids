const apiBase = "/api";

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

const badges = [
  {
    id: "first-step",
    title: "Primer impulso",
    description: "Se activa al completar el primer reto semanal.",
    icon: "⚡",
    unlocked: (state) => state.completedChallenges.length >= 1,
  },
  {
    id: "logic-builder",
    title: "Constructor lógico",
    description: "Reconoce el dominio de al menos dos retos semanales.",
    icon: "🧠",
    unlocked: (state) => state.completedChallenges.length >= 2,
  },
  {
    id: "olympiad-champion",
    title: "Campeón de olimpiada",
    description: "Premia un desempeño perfecto en la olimpiada matemática.",
    icon: "🏅",
    unlocked: (state) => state.olympiadCorrect === 3,
  },
  {
    id: "team-synergy",
    title: "Sinergia de equipo",
    description: "Se obtiene al resolver correctamente el reto colaborativo.",
    icon: "🤝",
    unlocked: (state) => state.collabSolved,
  },
  {
    id: "streak-master",
    title: "Maestro de constancia",
    description: "Recompensa una racha de 5 días o más.",
    icon: "🔥",
    unlocked: (state) => state.streak >= 5,
  },
  {
    id: "knowledge-architect",
    title: "Arquitecto del conocimiento",
    description: "Se concede al superar los 400 puntos.",
    icon: "🧩",
    unlocked: (state) => state.points >= 400,
  },
];

const weeklyChallenges = [
  {
    id: "pattern-paths",
    title: "Patrones que avanzan",
    category: "Lógica",
    points: 40,
    description: "Descubre la regla que completa una secuencia visual y justifica tu elección.",
    action: "Completar secuencia",
  },
  {
    id: "math-express",
    title: "Expreso matemático",
    category: "Cálculo",
    points: 55,
    description: "Resuelve una serie de operaciones mixtas con precisión y explica el procedimiento.",
    action: "Resolver ejercicios",
  },
  {
    id: "tech-map",
    title: "Mapa tecnológico",
    category: "Tecnología",
    points: 45,
    description: "Diseña un flujo simple para automatizar una tarea escolar en equipo.",
    action: "Diseñar flujo",
  },
];

const olympiadRounds = [
  {
    id: "round-1",
    title: "Ronda 1",
    question: "Si 3x + 5 = 20, ¿cuánto vale x?",
    options: [
      { label: "3", correct: true },
      { label: "5", correct: false },
      { label: "7", correct: false },
    ],
  },
  {
    id: "round-2",
    title: "Ronda 2",
    question: "¿Cuál es el siguiente número en la serie 2, 6, 12, 20, ?",
    options: [
      { label: "28", correct: false },
      { label: "30", correct: true },
      { label: "32", correct: false },
    ],
  },
  {
    id: "round-3",
    title: "Ronda 3",
    question: "Un rectángulo mide 8 cm por 5 cm. ¿Cuál es su área?",
    options: [
      { label: "13 cm²", correct: false },
      { label: "40 cm²", correct: true },
      { label: "26 cm²", correct: false },
    ],
  },
];

const defaultState = {
  loggedIn: false,
  activeProfileId: profiles[0].id,
  activeCourseId: profiles[0].courseId,
  profiles: structuredClone(profiles),
  courses: structuredClone(courseSeed),
  profileAssignments: Object.fromEntries(profiles.map((profile) => [profile.id, profile.courseId])),
  profileProgress: createInitialProfileProgress(),
};

let state = structuredClone(defaultState);

const loginScreen = document.getElementById("loginScreen");
const appShell = document.getElementById("appShell");
const loginForm = document.getElementById("loginForm");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const registerForm = document.getElementById("registerForm");
const registerName = document.getElementById("registerName");
const registerUsername = document.getElementById("registerUsername");
const registerPassword = document.getElementById("registerPassword");
const registerRole = document.getElementById("registerRole");
const registerGrade = document.getElementById("registerGrade");
const registerCourseSelect = document.getElementById("registerCourseSelect");
const registerGroupSelect = document.getElementById("registerGroupSelect");
const profileGallery = document.getElementById("profileGallery");
const courseBoard = document.getElementById("courseBoard");
const teacherPanel = document.getElementById("teacherPanel");
const teacherForm = document.getElementById("teacherForm");
const teacherCourseSelect = document.getElementById("teacherCourseSelect");
const teacherCourseName = document.getElementById("teacherCourseName");
const teacherCourseGroup = document.getElementById("teacherCourseGroup");
const teacherCourseTeacher = document.getElementById("teacherCourseTeacher");
const teacherCourseTheme = document.getElementById("teacherCourseTheme");
const teacherCourseObjective = document.getElementById("teacherCourseObjective");
const teacherProfileAssign = document.getElementById("teacherProfileAssign");
const teacherCourseSummary = document.getElementById("teacherCourseSummary");
const teacherCourseMeta = document.getElementById("teacherCourseMeta");
const teacherRanking = document.getElementById("teacherRanking");
const activeUserName = document.getElementById("activeUserName");
const activeUserMeta = document.getElementById("activeUserMeta");
const activeGroupChip = document.getElementById("activeGroupChip");

const pointsValue = document.getElementById("pointsValue");
const streakValue = document.getElementById("streakValue");
const levelValue = document.getElementById("levelValue");
const collabValue = document.getElementById("collabValue");
const levelProgressBar = document.getElementById("levelProgressBar");
const levelProgressText = document.getElementById("levelProgressText");
const badgeCount = document.getElementById("badgeCount");
const statusLine = document.getElementById("statusLine");
const weeklyChallengesContainer = document.getElementById("weeklyChallenges");
const olympiadRoundsContainer = document.getElementById("olympiadRounds");
const olympiadScore = document.getElementById("olympiadScore");
const olympiadHint = document.getElementById("olympiadHint");
const badgeGallery = document.getElementById("badgeGallery");
const activeRoles = document.getElementById("activeRoles");
const latestBadge = document.getElementById("latestBadge");
const collabAnswer = document.getElementById("collabAnswer");

const challengeTemplate = document.getElementById("challengeTemplate");
const roundTemplate = document.getElementById("roundTemplate");
const badgeTemplate = document.getElementById("badgeTemplate");

const logoutButton = document.getElementById("logoutButton");

document.getElementById("completeFocusChallenge").addEventListener("click", () => completeChallenge("pattern-paths"));
document.getElementById("openOlympiad").addEventListener("click", () => {
  document.getElementById("olympiadSection").scrollIntoView({ behavior: "smooth", block: "start" });
});
document.getElementById("submitOlympiad").addEventListener("click", reviewOlympiad);
document.getElementById("submitCollab").addEventListener("click", submitCollaborativeAnswer);

document.querySelectorAll("[data-role]").forEach((button) => {
  button.addEventListener("click", () => toggleRole(button));
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  login();
});

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  registerAccount();
});

registerCourseSelect.addEventListener("change", () => {
  syncRegisterGroupOptions(registerCourseSelect.value);
});

logoutButton.addEventListener("click", () => {
  state.loggedIn = false;
  saveState();
  renderAll();
});

teacherCourseSelect?.addEventListener("change", () => {
  populateTeacherForm(teacherCourseSelect.value);
});

teacherForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  saveTeacherCourseEdits();
});

function syncRoleButtons() {
  const profileProgress = getActiveProfileProgress();
  document.querySelectorAll("[data-role]").forEach((button) => {
    button.classList.toggle("active", profileProgress.selectedRoles.includes(button.dataset.role));
  });
}

function getProfiles() {
  return state.profiles || structuredClone(profiles);
}

function getCourses() {
  return state.courses || courseSeed;
}

function getProfileById(profileId) {
  const availableProfiles = getProfiles();
  const baseProfile = availableProfiles.find((profile) => profile.id === profileId) || availableProfiles[0];
  return {
    ...baseProfile,
    courseId: state.profileAssignments?.[baseProfile.id] || baseProfile.courseId,
  };
}

function getCourseById(courseId) {
  return getCourses().find((course) => course.id === courseId) || getCourses()[0];
}

function getProfileProgress(profileId = state.activeProfileId) {
  if (!state.profileProgress[profileId]) {
    state.profileProgress[profileId] = createProfileProgress();
  }

  return state.profileProgress[profileId];
}

function getActiveProfileProgress() {
  return getProfileProgress(state.activeProfileId);
}

function getCourseMembers(courseId) {
  return getProfiles().filter((profile) => (state.profileAssignments?.[profile.id] || profile.courseId) === courseId);
}

function getCourseRanking(courseId) {
  return getCourseMembers(courseId)
    .map((profile) => ({ profile, progress: getProfileProgress(profile.id) }))
    .sort((left, right) => right.progress.points - left.progress.points);
}

function populateAuthControls() {
  registerCourseSelect.innerHTML = getCourses()
    .map((course) => `<option value="${course.id}">${course.name}</option>`)
    .join("");

  syncRegisterGroupOptions(registerCourseSelect.value || getCourses()[0].id);

  if (teacherCourseSelect) {
    teacherCourseSelect.innerHTML = getCourses()
      .map((course) => `<option value="${course.id}">${course.name}</option>`)
      .join("");
  }

  if (teacherProfileAssign) {
    teacherProfileAssign.innerHTML = getProfiles()
      .map((profile) => `<option value="${profile.id}">${profile.name} · ${profile.role}</option>`)
      .join("");
  }
}

function syncRegisterGroupOptions(courseId) {
  const course = getCourseById(courseId);
  const uniqueGroups = Array.from(new Set(getCourses().map((item) => item.group)));
  registerGroupSelect.innerHTML = uniqueGroups
    .map((group) => `<option value="${group}" ${group === course.group ? "selected" : ""}>Grupo ${group}</option>`)
    .join("");
}

function login() {
  const username = loginUsername.value.trim().toLowerCase();
  const password = loginPassword.value;

      profileGallery.innerHTML = getProfiles()
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error((await response.json()).error || "Usuario o contraseña incorrectos.");
      }

      return response.json();
    })
    .then((payload) => {
      state = normalizeState(payload.state);
      state.activeProfileId = payload.account.id;
      state.activeCourseId = payload.account.courseId;
      state.loggedIn = true;
      loginPassword.value = "";
      renderAll();
    })
    .catch((error) => {
      statusLine.textContent = error.message || "No fue posible iniciar sesión.";
    });
}

function registerAccount() {
  const fullName = registerName.value.trim();
  const username = registerUsername.value.trim().toLowerCase();
  const password = registerPassword.value;
  const role = registerRole.value;
  const grade = registerGrade.value.trim() || (role === "Docente" ? "Tutoría" : "7°");
  const courseId = registerCourseSelect.value || getCourses()[0].id;
  const course = getCourseById(courseId);
  const group = registerGroupSelect.value || course.group;

  if (!fullName || !username || !password) {
    statusLine.textContent = "Completa nombre, usuario y contraseña para crear la cuenta.";
    return;
  }

  fetch(`${apiBase}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: fullName,
      username,
      password,
      role,
      grade,
      courseId,
      group,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error((await response.json()).error || "No fue posible crear la cuenta.");
      }

      return response.json();
    })
    .then((payload) => {
      state = normalizeState(payload.state);
      state.activeProfileId = payload.account.id;
      state.activeCourseId = payload.account.courseId;
      state.loggedIn = true;
      registerForm.reset();
      registerRole.value = "Estudiante";
      registerGrade.value = "";
      renderAll();
    })
    .catch((error) => {
      statusLine.textContent = error.message || "No fue posible crear la cuenta.";
    });
}

function populateTeacherForm(courseId = state.activeCourseId) {
  const course = getCourseById(courseId);
  if (!course || !teacherCourseName) {
    return;
  }

  teacherCourseSelect.value = course.id;
  teacherCourseName.value = course.name;
  teacherCourseGroup.value = course.group;
  teacherCourseTeacher.value = course.teacher;
  teacherCourseTheme.value = course.theme;
  teacherCourseObjective.value = course.objective;
  teacherProfileAssign.value = getCourseMembers(course.id)[0]?.id || getProfiles()[0].id;
}

function saveTeacherCourseEdits() {
  const courseIndex = getCourses().findIndex((course) => course.id === teacherCourseSelect.value);
  if (courseIndex < 0) {
    return;
  }

  const updatedCourse = {
    ...getCourses()[courseIndex],
    name: teacherCourseName.value.trim() || getCourses()[courseIndex].name,
    group: teacherCourseGroup.value.trim().toUpperCase() || getCourses()[courseIndex].group,
    teacher: teacherCourseTeacher.value.trim() || getCourses()[courseIndex].teacher,
    theme: teacherCourseTheme.value.trim() || getCourses()[courseIndex].theme,
    objective: teacherCourseObjective.value.trim() || getCourses()[courseIndex].objective,
  };

  const courses = [...getCourses()];
  courses[courseIndex] = updatedCourse;
  state.courses = courses;

  const selectedProfile = getProfiles().find((profile) => profile.id === teacherProfileAssign.value);
  if (selectedProfile) {
    state.profileAssignments[selectedProfile.id] = updatedCourse.id;
  }

  state.activeCourseId = updatedCourse.id;
  populateAuthControls();
  saveState();
  renderAll();
}

function normalizeState(source = {}) {
  const parsed = typeof source === "object" && source !== null ? source : {};
  const mergedProfiles = Array.isArray(parsed.profiles) ? parsed.profiles : structuredClone(profiles);
  const mergedCourses = Array.isArray(parsed.courses) ? parsed.courses : structuredClone(courseSeed);
  const mergedAssignments = {
    ...Object.fromEntries(mergedProfiles.map((profile) => [profile.id, profile.courseId])),
    ...(parsed.profileAssignments || {}),
  };
  const mergedProgress = { ...createInitialProfileProgress(), ...(parsed.profileProgress || {}) };

  if (!parsed.profileProgress) {
    mergedProgress[defaultState.activeProfileId] = {
      ...mergedProgress[defaultState.activeProfileId],
      points: parsed.points ?? mergedProgress[defaultState.activeProfileId].points,
      streak: parsed.streak ?? mergedProgress[defaultState.activeProfileId].streak,
      completedChallenges: parsed.completedChallenges || mergedProgress[defaultState.activeProfileId].completedChallenges,
      olympiadCorrect: parsed.olympiadCorrect ?? mergedProgress[defaultState.activeProfileId].olympiadCorrect,
      olympiadReviewed: parsed.olympiadReviewed ?? mergedProgress[defaultState.activeProfileId].olympiadReviewed,
      collabSolved: parsed.collabSolved ?? mergedProgress[defaultState.activeProfileId].collabSolved,
      collaborationScore: parsed.collaborationScore ?? mergedProgress[defaultState.activeProfileId].collaborationScore,
      latestBadge: parsed.latestBadge || mergedProgress[defaultState.activeProfileId].latestBadge,
      selectedRoles: parsed.selectedRoles || mergedProgress[defaultState.activeProfileId].selectedRoles,
      challengeProgress: {
        ...mergedProgress[defaultState.activeProfileId].challengeProgress,
        ...(parsed.challengeProgress || {}),
      },
      roundAnswers: {
        ...mergedProgress[defaultState.activeProfileId].roundAnswers,
        ...(parsed.roundAnswers || {}),
      },
    };
  }

  return {
    ...structuredClone(defaultState),
    ...parsed,
    profiles: mergedProfiles,
    courses: mergedCourses,
    profileAssignments: mergedAssignments,
    profileProgress: mergedProgress,
    loggedIn: parsed.loggedIn ?? defaultState.loggedIn,
    activeProfileId: parsed.activeProfileId || defaultState.activeProfileId,
    activeCourseId: parsed.activeCourseId || defaultState.activeCourseId,
  };
}

async function loadState() {
  try {
    const response = await fetch(`${apiBase}/state`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return structuredClone(defaultState);
    }

    const payload = await response.json();
    return normalizeState(payload);
  } catch {
    return structuredClone(defaultState);
  }
}

async function saveState() {
  try {
    await fetch(`${apiBase}/state`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
  } catch {
    statusLine.textContent = "No se pudo sincronizar con Neon.";
  }
}

async function hydrateStateFromRemote() {
  state = await loadState();
  renderAll();
}

function levelFromPoints(points) {
  return Math.max(1, Math.floor(points / 200) + 1);
}

function levelProgress(points) {
  const remainder = points % 200;
  return {
    current: remainder,
    target: 200,
    percent: (remainder / 200) * 100,
  };
}

function unlockBadges() {
  const profileProgress = getActiveProfileProgress();
  const unlocked = badges.filter((badge) => badge.unlocked(profileProgress));
  const latest = unlocked[unlocked.length - 1];
  if (latest) {
    profileProgress.latestBadge = latest.title;
  }
  return unlocked;
}

function renderAuthState() {
  loginScreen.classList.toggle("hidden", state.loggedIn);
  appShell.classList.toggle("hidden", !state.loggedIn);
  teacherPanel?.classList.toggle("hidden", !state.loggedIn || getProfileById(state.activeProfileId).role !== "Docente");

  if (!state.loggedIn) {
    return;
  }

  const profile = getProfileById(state.activeProfileId);
  const course = getCourseById(state.activeCourseId);

  activeUserName.textContent = profile.name;
  activeUserMeta.textContent = `${profile.role} · ${profile.grade} · ${profile.focus}`;
  activeGroupChip.textContent = `${course.name} · Grupo ${course.group}`;
}

function renderProfiles() {
  profileGallery.innerHTML = getProfiles()
    .map((profile) => {
      const selected = profile.id === state.activeProfileId;
      const profileProgress = getProfileProgress(profile.id);
      return `
        <article class="profile-card ${selected ? "active" : ""}">
          <div class="profile-row">
            <div class="profile-avatar">${profile.avatar}</div>
            <div>
              <strong>${profile.name}</strong>
              <p>${profile.role} · ${profile.grade}</p>
            </div>
          </div>
          <div class="profile-meta">
            <span class="mini-chip info">Grupo ${profile.group}</span>
            <span class="mini-chip">${profile.focus}</span>
            <span class="mini-chip warn">${profileProgress.points} pts</span>
          </div>
          <button class="secondary" data-profile-switch="${profile.id}">${selected ? "Perfil activo" : "Usar perfil"}</button>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-profile-switch]").forEach((button) => {
    button.addEventListener("click", () => {
      const profile = getProfileById(button.dataset.profileSwitch);
      state.activeProfileId = profile.id;
      state.activeCourseId = profile.courseId;
      state.loggedIn = true;
      saveState();
      populateAuthControls();
      renderAll();
    });
  });
}

function renderCourseBoard() {
  const courses = getCourses();

  courseBoard.innerHTML = courses
    .map((course) => {
      const active = course.id === state.activeCourseId;
      const ranking = getCourseRanking(course.id);
      const courseAverage = ranking.length
        ? Math.round(ranking.reduce((total, entry) => total + entry.progress.points, 0) / ranking.length)
        : 0;
      const topStudent = ranking[0]?.profile.name || "Sin datos";
      return `
        <article class="board-card ${active ? "active" : ""}">
          <div class="board-meta">
            <span class="mini-chip good">${course.name}</span>
            <span class="mini-chip">Grupo ${course.group}</span>
          </div>
          <strong>${course.theme}</strong>
          <p>${course.objective}</p>
          <div class="profile-meta">
            <span class="mini-chip info">${ranking.length} estudiantes</span>
            <span class="mini-chip warn">${courseAverage} pts promedio</span>
          </div>
          <p>Docente: ${course.teacher} · Desafíos activos: ${course.activeChallenges} · Avance: ${course.completion}%</p>
          <p>Estudiante líder: ${topStudent}</p>
          <button class="secondary" data-course-switch="${course.id}">${active ? "Tablero activo" : "Abrir tablero"}</button>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-course-switch]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCourseId = button.dataset.courseSwitch;
      saveState();
      renderAll();
    });
  });
}

function renderTeacherPanel() {
  const isTeacher = state.loggedIn && getProfileById(state.activeProfileId).role === "Docente";
  if (!isTeacher) {
    return;
  }

  populateTeacherForm(state.activeCourseId);

  const activeCourse = getCourseById(state.activeCourseId);
  const ranking = getCourseRanking(activeCourse.id);

  teacherCourseSummary.textContent = activeCourse.name;
  teacherCourseMeta.textContent = `${ranking.length} estudiantes · Grupo ${activeCourse.group} · ${activeCourse.completion}% de avance`;

  teacherRanking.innerHTML = ranking
    .map(
      (entry, index) => `
        <div class="ranking-item">
          <strong>${index + 1}. ${entry.profile.name}</strong>
          <span>${entry.progress.points} pts · ${entry.progress.streak} días</span>
        </div>
      `,
    )
    .join("");
}

function renderWeeklyChallenges() {
  const profileProgress = getActiveProfileProgress();
  weeklyChallengesContainer.innerHTML = "";

  weeklyChallenges.forEach((challenge) => {
    const element = challengeTemplate.content.firstElementChild.cloneNode(true);
    element.querySelector(".pill").textContent = challenge.category;
    element.querySelector(".points-pill").textContent = `+${challenge.points} pts`;
    element.querySelector("h3").textContent = challenge.title;
    element.querySelector("p").textContent = challenge.description;

    const button = element.querySelector(".challenge-action");
    const completed = profileProgress.challengeProgress[challenge.id];
    button.textContent = completed ? "Completado" : challenge.action;
    button.disabled = completed;

    if (completed) {
      button.classList.remove("secondary");
      button.classList.add("primary");
    }

    button.addEventListener("click", () => completeChallenge(challenge.id));
    weeklyChallengesContainer.appendChild(element);
  });
}

function renderOlympiad() {
  const profileProgress = getActiveProfileProgress();
  olympiadRoundsContainer.innerHTML = "";

  olympiadRounds.forEach((round) => {
    const element = roundTemplate.content.firstElementChild.cloneNode(true);
    element.querySelector(".pill").textContent = round.title;
    element.querySelector("strong").textContent = "Selección múltiple";
    element.querySelector(".round-question").textContent = round.question;

    const optionsContainer = element.querySelector(".round-options");
    round.options.forEach((option) => {
      const optionButton = document.createElement("button");
      optionButton.className = "round-option";
      optionButton.textContent = option.label;
      if (profileProgress.roundAnswers[round.id] !== null) {
        const answeredCorrectly = profileProgress.roundAnswers[round.id] === option.correct;
        optionButton.classList.add(answeredCorrectly ? "correct" : "incorrect");
        optionButton.disabled = true;
      }
      optionButton.addEventListener("click", () => answerRound(round.id, option.correct, optionButton, element));
      optionsContainer.appendChild(optionButton);
    });

    olympiadRoundsContainer.appendChild(element);
  });
}

function renderBadges() {
  const profileProgress = getActiveProfileProgress();
  const unlocked = unlockBadges();
  badgeGallery.innerHTML = "";

  badges.forEach((badge) => {
    const element = badgeTemplate.content.firstElementChild.cloneNode(true);
    const isUnlocked = unlocked.some((entry) => entry.id === badge.id);

    element.querySelector(".badge-icon").textContent = badge.icon;
    element.querySelector("h3").textContent = badge.title;
    element.querySelector("p").textContent = badge.description;
    if (!isUnlocked) {
      element.classList.add("locked");
    }

    badgeGallery.appendChild(element);
  });

  badgeCount.textContent = `${unlocked.length} insignia${unlocked.length === 1 ? "" : "s"} activa${unlocked.length === 1 ? "" : "s"}`;
  latestBadge.textContent = profileProgress.latestBadge;
}

function renderDashboard() {
  const profileProgress = getActiveProfileProgress();
  profileProgress.level = levelFromPoints(profileProgress.points);
  const progress = levelProgress(profileProgress.points);
  const unlocked = unlockBadges();

  pointsValue.textContent = profileProgress.points;
  streakValue.textContent = `${profileProgress.streak} días`;
  levelValue.textContent = profileProgress.level;
  collabValue.textContent = `${profileProgress.collaborationScore}%`;
  levelProgressBar.style.width = `${progress.percent}%`;
  levelProgressText.textContent = `${progress.current} / ${progress.target}`;
  olympiadScore.textContent = `${profileProgress.olympiadCorrect}/3 correctas`;
  activeRoles.textContent = profileProgress.selectedRoles.length;
  syncRoleButtons();

  const lastEvent = profileProgress.collabSolved
    ? "El equipo ya resolvió el caso colaborativo."
    : profileProgress.challengeProgress["math-express"]
      ? "Buen avance: ya superaste un reto analítico."
      : "Empieza con un reto semanal para activar el progreso.";

  statusLine.textContent = lastEvent;
  olympiadHint.textContent =
    profileProgress.olympiadCorrect === 3
      ? "Desempeño perfecto. La insignia de alto rendimiento ya está disponible."
      : "Busca precisión total para desbloquear la bonificación final.";

  if (unlocked.length === badges.length) {
    statusLine.textContent = "Has desbloqueado todo el ecosistema de insignias.";
  }
}

function completeChallenge(challengeId) {
  const profileProgress = getActiveProfileProgress();
  const challenge = weeklyChallenges.find((item) => item.id === challengeId);
  if (!challenge || profileProgress.challengeProgress[challengeId]) {
    return;
  }

  profileProgress.challengeProgress[challengeId] = true;
  profileProgress.completedChallenges.push(challengeId);
  profileProgress.points += challenge.points;
  profileProgress.streak += 1;
  profileProgress.collaborationScore = Math.min(100, profileProgress.collaborationScore + 4);
  profileProgress.latestBadge = "";

  saveState();
  renderAll();
}

function answerRound(roundId, isCorrect, button, roundElement) {
  const profileProgress = getActiveProfileProgress();
  profileProgress.roundAnswers[roundId] = isCorrect;
  if (isCorrect) {
    profileProgress.points += 30;
    profileProgress.collaborationScore = Math.min(100, profileProgress.collaborationScore + 2);
  } else {
    profileProgress.points += 5;
  }

  button.classList.add(isCorrect ? "correct" : "incorrect");
  roundElement.querySelectorAll(".round-option").forEach((option) => {
    option.disabled = true;
    if (option === button) {
      option.textContent = `${option.textContent} ${isCorrect ? "· Correcto" : "· Revisar"}`;
    }
  });

  saveState();
  renderAll();
}

function reviewOlympiad() {
  const profileProgress = getActiveProfileProgress();
  const correctCount = Object.values(profileProgress.roundAnswers).filter(Boolean).length;
  profileProgress.olympiadCorrect = correctCount;
  profileProgress.olympiadReviewed = true;

  if (correctCount === 3) {
    profileProgress.points += 80;
    profileProgress.streak += 1;
    olympiadHint.textContent = "Excelencia matemática lograda. Se otorgó la bonificación completa.";
  } else if (correctCount >= 2) {
    profileProgress.points += 35;
    olympiadHint.textContent = "Buen desempeño. Revisa una ronda más para la bonificación máxima.";
  } else {
    olympiadHint.textContent = "Sigue practicando. Una mejor secuencia de razonamiento mejorará tu resultado.";
  }

  saveState();
  renderAll();
}

function toggleRole(button) {
  const profileProgress = getActiveProfileProgress();
  const role = button.dataset.role;
  const index = profileProgress.selectedRoles.indexOf(role);

  if (index >= 0) {
    profileProgress.selectedRoles.splice(index, 1);
  } else {
    profileProgress.selectedRoles.push(role);
  }

  button.classList.toggle("active");
  profileProgress.collaborationScore = Math.min(100, 48 + profileProgress.selectedRoles.length * 12);
  saveState();
  renderDashboard();
}

function submitCollaborativeAnswer() {
  const profileProgress = getActiveProfileProgress();
  const answer = Number.parseInt(collabAnswer.value, 10);
  const expected = 4;

  if (Number.isNaN(answer)) {
    olympiadHint.textContent = "Escribe una respuesta numérica para registrar el aporte del equipo.";
    return;
  }

  const activeRoleCount = Math.max(1, profileProgress.selectedRoles.length);
  if (answer === expected) {
    profileProgress.collabSolved = true;
    profileProgress.points += 90 + activeRoleCount * 10;
    profileProgress.collaborationScore = Math.min(100, profileProgress.collaborationScore + 18);
    profileProgress.streak += 1;
    profileProgress.latestBadge = "Sinergia de equipo";
    olympiadHint.textContent = "Respuesta correcta. El equipo avanzó con una colaboración efectiva.";
  } else {
    profileProgress.points += 12;
    profileProgress.collaborationScore = Math.max(20, profileProgress.collaborationScore - 6);
    olympiadHint.textContent = "La idea es buena, pero el cálculo final necesita revisión.";
  }

  saveState();
  renderAll();
}

function renderAll() {
  populateAuthControls();
  renderAuthState();
  renderCourseBoard();
  renderProfiles();
  renderTeacherPanel();
  renderWeeklyChallenges();
  renderOlympiad();
  renderBadges();
  if (state.loggedIn) {
    renderDashboard();
  }
}

renderAll();
void hydrateStateFromRemote();
