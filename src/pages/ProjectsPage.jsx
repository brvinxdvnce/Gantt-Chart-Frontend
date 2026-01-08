import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { projectService, inviteService } from "../services/apiService.js";

const roleToBadge = (value) => {
  if (value === null || value === undefined) {
    return "member";
  }

  if (typeof value === "number") {
    return value === 1 ? "admin" : "member";
  }

  const num = Number(value);
  if (!Number.isNaN(num)) {
    return num === 1 ? "admin" : "member";
  }

  const role = String(value).toLowerCase();

  if (role === "admin") {
    return "admin";
  }

  if (role === "member" || role === "user") {
    return "member";
  }

  return "member";
};

const getProjectRole = (project, currentUserId) => {

  if (
    !currentUserId
    ? false
    : project.creatorId === currentUserId ||
      project.creator?.id === currentUserId ||      
      project.creatorUserId === currentUserId       
  ) {
    return "admin";
  }


  const raw = project.currentUserRole ?? project.role;
  return roleToBadge(raw);
};


export default function ProjectsPage() {
  const { user, setProject } = useContext(AuthContext);
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", deadLine: "" });

  const [inviteCode, setInviteCode] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const canCreate = useMemo(() => form.name.trim().length > 0, [form.name]);

  
  const loadProjects = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await projectService.list(user.id);
      setProjects(Array.isArray(data) ? data : []);
      console.log("projects:", Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Не удалось загрузить проекты");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProjects();
    setProject(null, null);
  },  [loadProjects, setProject]);

  const handleCreate = async () => {
    if (!canCreate || !user?.id) return;

    setCreating(true);
    setError("");
    try {
      const dto = {
        name: form.name.trim(),
        creatorId: user.id,
        deadLine: form.deadLine ? new Date(form.deadLine).toISOString() : null,
      };
      await projectService.create(dto);
      await loadProjects();
      setForm({ name: "", deadLine: "" });
    } catch (err) {
      setError(err.message || "Ошибка создания проекта");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!user?.id || !inviteCode.trim()) return;

    setInviteError("");
    setInviteSuccess("");
    setInviteLoading(true);

    try {
      await inviteService.join(inviteCode.trim(), user.id);
      setInviteSuccess("Вы успешно присоединились к проекту по коду");
      setInviteCode("");
      await loadProjects();
    } catch (err) {
      console.error("Ошибка присоединения по коду:", err);
      setInviteError(err.message || "Не удалось присоединиться по коду");
    } finally {
      setInviteLoading(false);
    }
  };

  const openProject = (project) => {
  const currentRole = getProjectRole(project, user?.id);
  setProject(project, currentRole);
  navigate(`/projects/${project.id}`);
};

  if (loading) {
    return <div className="projects-loading">Загрузка проектов...</div>;
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1>Мои проекты</h1>
      </div>

      <div className="create-project-form">
      <h3>Создать проект</h3>
      <div
        className="form-row"
        style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}
      >
    
    <input
      type="text"
      placeholder="Название проекта"
      value={form.name}
      onChange={(e) => setForm({ ...form, name: e.target.value })}
      className="form-input"
      style={{ flex: 1 }}
    />

   
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label
        htmlFor="deadLine"
        style={{ marginBottom: 4, fontSize: 14, fontWeight: 500 }}
      >
        Дедлайн
      </label>
      <input
        id="deadLine"
        type="date"
        value={form.deadLine}
        onChange={(e) => setForm({ ...form, deadLine: e.target.value })}
        className="form-input"
        style={{ padding: "6px 8px", borderRadius: 4, border: "1px solid #ccc" }}
      />
    </div>

   
    <button
      className="btn-success"
      onClick={handleCreate}
      disabled={!canCreate || creating}
    >
      {creating ? "Создание..." : "Создать"}
    </button>
  </div>
</div>


      <div className="join-by-code-form" style={{ marginTop: 24, marginBottom: 40}}>
        <h3>Присоединиться к проекту по коду</h3>
        <div className="form-row">
          <input
            type="text"
            placeholder="Код приглашения (например, ABC123)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="form-input"
            style={{ maxWidth: 250 }}
          />
          <button
            className="btn-primary"
            onClick={handleJoinByCode}
            disabled={inviteLoading || !inviteCode.trim()}
          >
            {inviteLoading ? "Подключение..." : "Подключиться"}
          </button>
        </div>
        {inviteError && (
          <div className="error-message" style={{ marginTop: 12 }}>
            {inviteError}
          </div>
        )}
        {inviteSuccess && (
          <div
            className="success-message"
            style={{ marginTop: 12, color: "green" }}
          >
            {inviteSuccess}
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <h3>У вас пока нет проектов</h3>
          <p>Создайте первый проект, чтобы начать работу с диаграммой Ганта</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => openProject(project)}
            >
              <div className="project-header">
                <h2 className="project-name">{project.name}</h2>
               <span
  className={`role-badge ${getProjectRole(project, user?.id)}`}
>
  {getProjectRole(project, user?.id) === "admin"
    ? "Админ"
    : "Участник"}
</span>
              </div>
              <div className="project-details">
                <p className="project-meta">
                  Участников: {project.usersCount ?? project.members?.length ?? 1}
                </p>
                <p className="project-creator">
                  Создатель:{" "}
                  {project.creatorNickName ??
                    project.creator?.username ??
                    "—"}
                </p>
                {project.deadLine && (
                  <p className="project-meta">
                    Дедлайн: {new Date(project.deadLine).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="project-hover">Открыть проект</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
