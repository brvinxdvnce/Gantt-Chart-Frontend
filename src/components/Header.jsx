import { useContext, useState } from "react"; 
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import UserSettingsModal from "./UserSettingsModal"; 

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h2 className="header-logo" onClick={() => navigate("/projects")}>
            Диаграммы Ганта
          </h2>
        </div>

        <div className="header-right">
          {user && (
            <span 
              className="user-email" 
              style={{ cursor: 'pointer', textDecoration: 'underline' }} 
              onClick={() => setIsModalOpen(true)} 
            >
              {user.email}
            </span>
          )}

          <button className="logout-btn" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>

      {isModalOpen && (
        <UserSettingsModal onClose={() => setIsModalOpen(false)} />
      )}
    </header>
  );
}
