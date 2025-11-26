import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { projectService } from "../services/apiService.js";

const roleToBadge = (role) => {
  if (role === 0 || role === 1 || role === "Creator" || role === "Admin") {
    return "admin";
  }

  return "member";
};

export default function ProjectsPage() {
  const { user, setProject } = useContext(AuthContext);
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", deadLine: "" });

  const canCreate = useMemo(() => form.name.trim().length > 0, [form.name]);

  const loadProjects = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await projectService.list(user.id);
      setProjects(Array.isArray(data) ? data : []);
      console.log(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Не удалось загрузить проекты");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async () => {
    if (!canCreate || !user?.id) return;

    setCreating(true);
    setError("");
    try {
      const dto = {
        name: form.name.trim(),
        creatorId: user.id,
        deadLine: form.deadLine ? new Date(form.deadLine).toISOString() : null
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

  const openProject = (project) => {
    const currentRole = roleToBadge(project.currentUserRole ?? project.role);
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
        <div className="form-row">
          <input
            type="text"
            placeholder="Название проекта"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="form-input"
          />
          <input
            type="date"
            value={form.deadLine}
            onChange={(e) => setForm({ ...form, deadLine: e.target.value })}
            className="form-input"
          />
          <button
            className="btn-success"
            onClick={handleCreate}
            disabled={!canCreate || creating}
          >
            {creating ? "Создание..." : "Создать"}
          </button>
        </div>
        {error && <div className="error-message" style={{ marginTop: 16 }}>{error}</div>}
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
                <span className={`role-badge ${roleToBadge(project.currentUserRole ?? project.role)}`}>
                  {roleToBadge(project.currentUserRole ?? project.role) === "admin"
                    ? "Админ"
                    : "Участник"}
                </span>
              </div>
              <div className="project-details">
                <p className="project-meta">
                  Участников: {project.usersCount ?? project.members?.length ?? 1}
                </p>
                <p className="project-creator">
                  Создатель: {project.creatorNickName ?? project.creator?.username ?? "—"}
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
