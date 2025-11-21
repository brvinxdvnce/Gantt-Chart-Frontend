import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { projectService } from "../services/apiService.js";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user, setProject } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await projectService.getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
      const mockProjects = [
        { 
          id: 1, 
          name: "Веб-сайт компании", 
          role: "admin", 
          members: 3,
          createdBy: user?.email
        },
        { 
          id: 2, 
          name: "Мобильное приложение", 
          role: "member", 
          members: 5,
          createdBy: "colleague@test.com"
        }
      ];
      setProjects(mockProjects);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const newProject = await projectService.createProject(newProjectName);
      setProjects([...projects, newProject]);
      setNewProjectName("");
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка создания проекта:', error);
      const newProject = { 
        id: Date.now(), 
        name: newProjectName,
        role: "admin", 
        members: 1,
        createdBy: user?.email
      };
      setProjects([...projects, newProject]);
      setNewProjectName("");
      setShowForm(false);
    }
  };

  const enterProject = (project) => {
    setProject(project, project.role);
    navigate(`/projects/${project.id}`);
  };

  if (loading) {
    return (
      <div className="projects-container">
        <div className="empty-state">
          <h3>Загрузка проектов...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1>Мои проекты</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Создать проект
        </button>
      </div>

      {showForm && (
        <div className="create-project-form">
          <h3>Создать новый проект</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Введите название проекта"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="form-input"
              onKeyPress={(e) => e.key === 'Enter' && createProject()}
            />
            <button onClick={createProject} className="btn-success">
              Создать
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="projects-grid">
        {projects.map(project => (
          <div
            key={project.id}
            onClick={() => enterProject(project)}
            className="project-card"
          >
            <div className="project-header">
              <h3 className="project-name">{project.name}</h3>
              <span className={`role-badge ${project.role}`}>
                {project.role === 'admin' ? 'Админ' : 'Участник'}
              </span>
            </div>
            
            <div className="project-details">
              <p className="project-meta">👥 Участников: {project.members}</p>
              <p className="project-creator">Создатель: {project.createdBy}</p>
            </div>
            
            <div className="project-hover">
              Открыть проект
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && !showForm && (
        <div className="empty-state">
          <h3>У вас пока нет проектов</h3>
          <p>Создайте первый проект чтобы начать работу</p>
        </div>
      )}
    </div>
  );
}