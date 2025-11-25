import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Header() {
  const { user, logout, currentProject } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-content">

        <div className="header-left">
          <h2 
            className="header-logo" 
            onClick={() => navigate("/projects")}
          >
            Диаграммы Ганта
          </h2>

          {currentProject && (
            <div className="project-info">
              <span className="project-name">{currentProject.name}</span>
              <span className={`project-role ${currentProject.role}`}>
                {currentProject.role === "admin" ? "Админ" : "Участник"}
              </span>
            </div>
          )}
        </div>

        <div className="header-right">
          {user && (
            <span className="user-email">
              {user.email}
            </span>
          )}

          <button className="logout-btn" onClick={handleLogout}>
            Выйти
          </button>
        </div>

      </div>
    </header>
  );
}
