// pages/GanttPage.jsx
import { useState, useContext, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function GanttPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, setProject } = useContext(AuthContext);
  const ganttContainer = useRef(null);
  useEffect(() => {
    if (ganttContainer.current && window.gantt) {
      initGantt();
    }
    return () => {
      if (window.gantt && window.gantt.destroy) {
        window.gantt.destroy();
      }
    };
  }, []);
  const initGantt = () => {
    const gantt = window.gantt;
    gantt.config.date_format = "%Y-%m-%d";
    const tasks = {
      data: [
        { id: 1, text: "Проект", start_date: "2024-01-01", duration: 10, progress: 0.4, open: true },
        { id: 2, text: "Планирование", start_date: "2024-01-01", duration: 3, progress: 1, parent: 1 },
        { id: 3, text: "Разработка", start_date: "2024-01-04", duration: 5, progress: 0.6, parent: 1 },
        { id: 4, text: "Тестирование", start_date: "2024-01-09", duration: 2, progress: 0, parent: 1 }
      ],
      links: [
        { id: 1, source: 2, target: 3, type: "0" },
        { id: 2, source: 3, target: 4, type: "0" }
      ]
    };

    gantt.init(ganttContainer.current);
    gantt.parse(tasks);
  };
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [members, setMembers] = useState([
    { id: 1, email: "admin@test.com", role: "admin" },
    { id: 2, email: "user1@test.com", role: "member" },
    { id: 3, email: "user2@test.com", role: "member" }
  ]);
  const addMember = () => {
    if (newMemberEmail.trim()) {
      const newMember = { id: Date.now(), email: newMemberEmail, role: "member" };
      setMembers([...members, newMember]);
      setNewMemberEmail("");
      setShowAddMember(false);
    }
  };
  const removeMember = (memberId) => {
    setMembers(members.filter(m => m.id !== memberId));
  };
  const toggleAdminRole = (memberId) => {
    setMembers(members.map(m => 
      m.id === memberId 
        ? { ...m, role: m.role === "admin" ? "member" : "admin" } 
        : m
    ));
  };
  const deleteProject = () => {
    if (window.confirm("Удалить проект?")) {
      navigate("/projects");
    }
  };
  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "8px",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0" }}>{currentProject?.name}</h1>
          <div style={{ color: "#666" }}>
            Роль: <strong>{currentProject?.role === "admin" ? "Админ" : "Участник"}</strong>
          </div>
        </div>

        {currentProject?.role === "admin" && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={() => setShowAddMember(true)}
              style={{ padding: "8px 16px", background: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Добавить участника
            </button>
            <button 
              onClick={deleteProject}
              style={{ padding: "8px 16px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Удалить проект
            </button>
          </div>
        )}
      </div>
      <div style={{ 
        background: "white", 
        borderRadius: "8px",
        marginBottom: "20px",
        overflow: "hidden"
      }}>
        <div style={{ padding: "15px 20px", borderBottom: "1px solid #eee" }}>
          <h3 style={{ margin: 0 }}>Диаграмма Ганта</h3>
        </div>
        <div 
          ref={ganttContainer}
          style={{ 
            height: "500px",
            width: "100%"
          }}
        />
      </div>
      {currentProject?.role === "admin" && (
        <div style={{ 
          background: "white", 
          padding: "20px", 
          borderRadius: "8px" 
        }}>
          <h3 style={{ margin: "0 0 15px 0" }}>Участники проекта</h3>
          {showAddMember && (
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <input
                type="email"
                placeholder="Email участника"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                style={{ 
                  padding: "8px 12px", 
                  border: "1px solid #ddd", 
                  borderRadius: "4px", 
                  flex: 1 
                }}
              />
              <button 
                onClick={addMember}
                style={{ padding: "8px 16px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Добавить
              </button>
              <button 
                onClick={() => setShowAddMember(false)}
                style={{ padding: "8px 16px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Отмена
              </button>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {members.map(member => (
              <div 
                key={member.id}
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: "10px",
                  background: "#f8f9fa",
                  borderRadius: "4px"
                }}
              >
                <div>
                  {member.email} 
                  <span style={{ 
                    marginLeft: "10px", 
                    padding: "2px 8px", 
                    background: member.role === "admin" ? "#dc3545" : "#6c757d",
                    color: "white",
                    borderRadius: "12px",
                    fontSize: "12px"
                  }}>
                    {member.role === "admin" ? "Админ" : "Участник"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    onClick={() => toggleAdminRole(member.id)}
                    style={{ 
                      padding: "4px 8px", 
                      background: member.role === "admin" ? "#6c757d" : "#007bff", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "3px", 
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    {member.role === "admin" ? "Убрать админа" : "Сделать админом"}
                  </button>
                  <button 
                    onClick={() => removeMember(member.id)}
                    style={{ 
                      padding: "4px 8px", 
                      background: "#dc3545", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "3px", 
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}