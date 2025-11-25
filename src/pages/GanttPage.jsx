import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { projectService, taskService } from "../services/apiService.js";
import { ganttConverter } from "../services/ganttConverter.js";

const normalizeRole = (value) => {
  if (value === 0 || value === 1 || value === "Creator" || value === "Admin") {
    return "admin";
  }
  return "member";
};

const memberId = (member) => member?.userId ?? member?.id;

export default function GanttPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, setProject } = useContext(AuthContext);
  const ganttContainer = useRef(null);
  const ganttReady = useRef(false);

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [members, setMembers] = useState([]);
  const [memberError, setMemberError] = useState("");
  const [loading, setLoading] = useState(true);
  const [projectInfo, setProjectInfo] = useState(null);

  const loadProject = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await projectService.get(id);
      const data = response?.result ?? response;
      setProjectInfo(data);
      setMembers(data?.members ?? []);
      const role = normalizeRole(data?.currentUserRole ?? data?.role);
      if (data?.id) {
        setProject({ id: data.id, name: data.name }, role);
      }
      if (ganttReady.current && window.gantt) {
        window.gantt.clearAll?.();
        window.gantt.parse(
          ganttConverter.toGanttFormat({
            rootTask: data?.rootTask,
            tasks: data?.tasks,
          })
        );
      }
    } catch (error) {
      console.error("Ошибка загрузки проекта:", error);
    } finally {
      setLoading(false);
    }
  }, [id, setProject]);

  const setupGanttEvents = useCallback(
    (gantt, projectId, reload) => {
      const toTaskDto = (task) => {
        const startDate = task.start_date || ganttConverter.formatDate(new Date());
        return {
          projectId,
          name: task.text,
          description: task.description ?? "",
          isCompleted: Boolean(task.progress && task.progress >= 1),
          dependencies: [],
          startTime: ganttConverter.parseDate(startDate),
          endTime: ganttConverter.addDuration(startDate, task.duration),
        };
      };

      gantt.attachEvent("onTaskCreated", async (task) => {
        try {
          await taskService.createTask(toTaskDto(task));
          await reload();
        } catch (error) {
          console.error("Ошибка создания задачи:", error);
        }
      });

      gantt.attachEvent("onTaskChanged", async (taskId, task) => {
        try {
          await taskService.updateTask(taskId, toTaskDto(task));
          await reload();
        } catch (error) {
          console.error("Ошибка обновления задачи:", error);
        }
      });

      gantt.attachEvent("onTaskDeleted", async (taskId) => {
        try {
          await taskService.deleteTask(taskId);
          await reload();
        } catch (error) {
          console.error("Ошибка удаления задачи:", error);
        }
      });

      gantt.attachEvent("onLinkCreated", async (link) => {
        try {
          const dependenceDto = {
            parentId: link.source,
            childId: link.target,
            type: Number(link.type ?? 0),
          };
          await taskService.addDependency(link.target, dependenceDto);
        } catch (error) {
          console.error("Ошибка создания зависимости:", error);
        }
      });

      gantt.attachEvent("onLinkDeleted", async (idValue, link) => {
        try {
          const dependenceDto = {
            parentId: link.source,
            childId: link.target,
            type: Number(link.type ?? 0),
          };
          await taskService.removeDependency(link.target, dependenceDto);
        } catch (error) {
          console.error("Ошибка удаления зависимости:", error);
        }
      });
    },
    []
  );

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (ganttContainer.current && window.gantt) {
      const gantt = window.gantt;
      gantt.config.date_format = "%Y-%m-%d";
      gantt.init(ganttContainer.current);
      ganttReady.current = true;
      setupGanttEvents(gantt, id, loadProject);
      loadProject();
    }

    return () => {
      ganttReady.current = false;
      if (window.gantt) {
        window.gantt.clearAll?.();
        window.gantt.destroy?.();
      }
    };
  }, [id, loadProject, setupGanttEvents]);

  const handleAddMember = async () => {
    if (!newMemberId.trim()) return;

    setMemberError("");
    try {
      await projectService.addMember(id, newMemberId.trim());
      setNewMemberId("");
      setShowAddMember(false);
      await loadProject();
    } catch (error) {
      setMemberError(error.message || "Не удалось добавить участника");
    }
  };

  const handleRemoveMember = async (member) => {
    const targetId = memberId(member);
    if (!targetId) return;

    try {
      await projectService.removeMember(id, targetId);
      await loadProject();
    } catch (error) {
      setMemberError(error.message || "Не удалось удалить участника");
    }
  };

  const handleToggleRole = async (member) => {
    const targetId = memberId(member);
    if (!targetId) return;

    const currentRole = normalizeRole(member.role);
    const nextRole = currentRole === "admin" ? "User" : "Admin";

    try {
      await projectService.changeMemberRole(id, targetId, { role: nextRole });
      await loadProject();
    } catch (error) {
      setMemberError(error.message || "Не удалось изменить роль участника");
    }
  };

  const deleteProject = async () => {
    if (!window.confirm("Удалить проект?")) return;

    try {
      await projectService.remove(id);
      navigate("/projects");
    } catch (error) {
      console.error("Не удалось удалить проект:", error);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 5px 0" }}>{projectInfo?.name ?? currentProject?.name}</h1>
          <div style={{ color: "#666" }}>
            Роль:{" "}
            <strong>
              {currentProject?.role === "admin" ? "Админ" : "Участник"}
            </strong>
          </div>
        </div>

        {currentProject?.role === "admin" && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowAddMember(true)}
              style={{
                padding: "8px 16px",
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Добавить участника
            </button>
            <button
              onClick={deleteProject}
              style={{
                padding: "8px 16px",
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Удалить проект
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "8px",
          marginBottom: "20px",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "15px 20px", borderBottom: "1px solid #eee" }}>
          <h3 style={{ margin: 0 }}>Диаграмма Ганта</h3>
          {loading && (
            <span style={{ marginLeft: "10px", color: "#666" }}>Загрузка...</span>
          )}
        </div>
        <div
          ref={ganttContainer}
          style={{
            height: "500px",
            width: "100%",
          }}
        />
      </div>
      {currentProject?.role === "admin" && (
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0" }}>Участники проекта</h3>
          {showAddMember && (
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <input
                type="text"
                placeholder="ID пользователя (UUID)"
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  flex: 1,
                }}
              />
              <button
                onClick={handleAddMember}
                style={{
                  padding: "8px 16px",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Добавить
              </button>
              <button
                onClick={() => setShowAddMember(false)}
                style={{
                  padding: "8px 16px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Отмена
              </button>
            </div>
          )}
          {memberError && (
            <div
              className="error-message"
              style={{ marginBottom: "15px" }}
            >
              {memberError}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {members.map((member) => {
              const formattedRole = normalizeRole(member.role);
              return (
                <div
                  key={memberId(member)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                    background: "#f8f9fa",
                    borderRadius: "4px",
                  }}
                >
                  <div>
                    {member.email ?? member.username ?? memberId(member)}
                    <span
                      style={{
                        marginLeft: "10px",
                        padding: "2px 8px",
                        background: formattedRole === "admin" ? "#dc3545" : "#6c757d",
                        color: "white",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    >
                      {formattedRole === "admin" ? "Админ" : "Участник"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleToggleRole(member)}
                      style={{
                        padding: "4px 8px",
                        background: formattedRole === "admin" ? "#6c757d" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      {formattedRole === "admin" ? "Убрать админа" : "Сделать админом"}
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member)}
                      style={{
                        padding: "4px 8px",
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}