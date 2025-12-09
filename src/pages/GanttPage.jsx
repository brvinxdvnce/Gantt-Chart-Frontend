import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { projectService, taskService } from "../services/apiService.js";
import { ganttConverter } from "../services/ganttConverter.js";


const normalizeRole = (value) => {
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


const memberId = (member) => member?.user?.id ?? member?.id;

const isGuid = (value) => {
  if (typeof value !== "string") return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
};

export default function GanttPage() {
  const { id } = useParams();
  const navigate = useNavigate();
   const { currentProject, setProject, user } = useContext(AuthContext);
  const ganttContainer = useRef(null);
  const ganttReady = useRef(false);
   const ganttEventIds = useRef([]);
   const isStatusUpdateRef = useRef(false);
   

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [members, setMembers] = useState([]);
  const [memberError, setMemberError] = useState("");
  const [loading, setLoading] = useState(true);
  const [projectInfo, setProjectInfo] = useState(null);
const [inviteCodes, setInviteCodes] = useState([]); 
const [inviteError, setInviteError] = useState("");

 const loadProject = useCallback(async () => {
  if (!id) return;
  try {
    setLoading(true);
    const response = await projectService.get(id);
    const data = response?.result ?? response;

    console.log("PROJECT DATA:", data);           
    console.log("PROJECT MEMBERS:", data?.members);

    

    setProjectInfo(data);
    setMembers(data?.members ?? []);
    setInviteCodes(data?.inviteCodes ?? []);

    

    

   

    const userId = user?.id ?? localStorage.getItem("userId");

    let role;

    const isCreator =
      data?.creatorId === userId || data?.creator?.id === userId;

    if (isCreator) {
      role = "admin";
    } else if (data?.members && userId) {
      const me = data.members.find((m) => memberId(m) === userId);
      if (me) {
        role = normalizeRole(me.role);
      }
    }

    if (!role) {
  role = "member";
}


if (
  data?.id &&
  (!currentProject || currentProject.id !== data.id || !currentProject.role)
) {
  setProject({ id: data.id, name: data.name }, role);
}

    if (ganttReady.current && window.gantt) {
      const gantt = window.gantt;
      gantt.clearAll?.();
      gantt.parse(
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
}, [id, user?.id]);



  const setupGanttEvents = useCallback(
  (gantt, reload) => {
    if (ganttEventIds.current.length) {
      ganttEventIds.current.forEach((evId) => {
        gantt.detachEvent(evId);
      });
      ganttEventIds.current = [];
    }

    const toTaskDto = (task) => {
      const startDate =
        task.start_date || ganttConverter.formatDate(new Date());

       const dto = {
    projectId: id,
    name: task.text,
    description: task.description ?? "",
    isCompleted:
      task.isCompleted ?? Boolean(task.progress && task.progress >= 1),
    startTime: ganttConverter.toBackendStartIso(startDate),
    endTime: ganttConverter.toBackendEndIso(startDate, task.duration),
  };

      console.log("DTO для задачи:", dto);
      return dto;
    };

    const mapLinkTypeToBackend = (ganttType) => {
      const t = Number(ganttType);
      switch (t) {
        case 0: return 2;
        case 1: return 0;
        case 2: return 3;
        case 3: return 1;
        default: return 2;
      }
    };

    const evIds = [];

    evIds.push(
      gantt.attachEvent("onAfterTaskAdd", async (taskId, task) => {
        try {
          console.log("onAfterTaskAdd", taskId, task);
          await taskService.createTask(toTaskDto(task));
          await reload();
        } catch (error) {
          console.error("Ошибка создания задачи:", error);
        }
      })
    );

    evIds.push(
      gantt.attachEvent("onAfterTaskUpdate", async (taskId, task) => {
        try {
           if (isStatusUpdateRef.current) {
        console.log(
          "onAfterTaskUpdate: пропускаем PATCH, это статус-апдейт",
          { taskId }
        );
        isStatusUpdateRef.current = false;
        return true;
      }
          console.log("onAfterTaskUpdate", taskId, task);
          await taskService.updateTask(taskId, toTaskDto(task));
          await reload();
        } catch (error) {
          console.error("Ошибка обновления задачи:", error);
        }
      })
    );

    evIds.push(
      gantt.attachEvent("onAfterTaskDelete", async (taskId) => {
        
        try {
          console.log("onAfterTaskDelete", taskId);
          await taskService.deleteTask(taskId);
          await reload();
        } catch (error) {
          console.error("Ошибка удаления задачи:", error);
        }
      })
    );

    evIds.push(
      gantt.attachEvent("onAfterLinkAdd", async (linkId, link) => {
        try {
          console.log("onAfterLinkAdd", linkId, link);

          const dependenceDto = {
            parentId: link.source,
            childId: link.target,
            type: mapLinkTypeToBackend(link.type),
          };

          console.log("DTO зависимости (ADD):", dependenceDto);

          await taskService.addDependency(link.source, dependenceDto);
        } catch (error) {
          console.error("Ошибка создания зависимости:", error);
        }
      })
    );

    evIds.push(
      gantt.attachEvent("onAfterLinkDelete", async (linkId, link) => {
        try {
          console.log("onAfterLinkDelete", linkId, link);

          const dependenceDto = {
            parentId: link.source,
            childId: link.target,
            type: mapLinkTypeToBackend(link.type),
          };

          console.log("DTO зависимости (REMOVE):", dependenceDto);

          await taskService.removeDependency(link.source, dependenceDto);
        } catch (error) {
          console.error("Ошибка удаления зависимости:", error);
        }
      })
    );

   
    evIds.push(
  gantt.attachEvent("onTaskClick", function (taskId, e) {
    const target = e.target || e.srcElement;
    console.log("onTaskClick fired", { taskId, target });

    if (!target) return true;

   
    let checkbox = null;

    if (target.classList?.contains("task-complete-checkbox")) {
      checkbox = target;
    } else if (target.closest) {
      checkbox = target.closest("input.task-complete-checkbox");
    }

  
    if (!checkbox) {
      return true;
    }

    e.preventDefault?.();
    e.stopPropagation?.();

    const task = gantt.getTask(taskId);
    const newStatus = !task.isCompleted;

    console.log("Перед запросом setTaskStatus", { taskId, newStatus, task });


    checkbox.checked = newStatus;

    (async () => {
      try {
        const res = await taskService.setTaskStatus(taskId, newStatus);
        console.log("Ответ от setTaskStatus", res);

        if (res?.success) {
          task.isCompleted = newStatus;
          task.progress = newStatus ? 1 : 0;

          isStatusUpdateRef.current = true;
          gantt.updateTask(taskId);
        } else {
          alert(res?.message || "Задачу нельзя завершить");
          checkbox.checked = task.isCompleted;
        }
      } catch (error) {
        console.error("Ошибка изменения статуса задачи:", error);
        alert("Не удалось изменить статус задачи");
        checkbox.checked = task.isCompleted;
      }
    })();


    return false;
  })
);

evIds.push(
  gantt.attachEvent("onBeforeLightbox", function (taskId) {
    const task = gantt.getTask(taskId);

  
    const selectedIds = Array.isArray(task.performerIds)
      ? task.performerIds.map(String)
      : [];

    const allMembers = gantt.config._members || [];

    console.log("onBeforeLightbox members:", allMembers, "task:", task, "selectedIds:", selectedIds);

    const itemsHtml = allMembers
      .map((m) => {
        const id = String(memberId(m));
        const name =
          m.user?.username ||
          m.user?.email ||
          m.username ||
          m.email ||
          id;

        const checked = selectedIds.includes(id) ? "checked" : "";

        return `
          <label style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
            <input type="checkbox" class="performer-checkbox" value="${id}" ${checked} />
            <span>${name}</span>
          </label>
        `;
      })
      .join("");

    task.performers_html = `
      <div style="display:flex; flex-direction:column; gap:4px;">
        <small>Отметьте ответственных (можно несколько):</small>
        <div id="performers-list"
             style="display:flex; flex-direction:column; gap:2px; max-height:140px; overflow-y:auto;">
          ${itemsHtml}
        </div>
      </div>
    `;

    return true;
  })
);

evIds.push(
  gantt.attachEvent("onLightboxSave", function (taskId, task, is_new) {
    if (!isGuid(taskId)) {
      console.warn("Пропускаем сохранение исполнителей для временной задачи", taskId);
      return true;
    }

    const lightbox = gantt.getLightbox();
    if (!lightbox) return true;

    const checkboxes = lightbox.querySelectorAll("input.performer-checkbox");
    if (!checkboxes.length) return true;

   
    const selectedIds = Array.from(checkboxes)
      .filter((ch) => ch.checked)
      .map((ch) => String(ch.value));

    
    const oldUserIds = Array.isArray(task.performerIds)
      ? task.performerIds.map(String)
      : [];

    const toAdd = selectedIds.filter((id) => !oldUserIds.includes(id));
    const toRemove = oldUserIds.filter((id) => !selectedIds.includes(id));

    console.log("SAVE PERFORMERS", {
      taskId,
      selectedIds,
      oldUserIds,
      toAdd,
      toRemove,
    });

    if (!toAdd.length && !toRemove.length) {
     
      return true;
    }

   
    task.performerIds = selectedIds;

    (async () => {
      try {
        await Promise.all([
         
          ...toAdd.map((userId) =>
            taskService.addUserPerformer(taskId, userId)
          ),
        
          ...toRemove.map((userId) =>
            taskService.removeUserPerformer(taskId, userId)
          ),
        ]);

        console.log("Исполнители задачи обновлены");
        await reload();
      } catch (error) {
        console.error("Ошибка обновления исполнителей задачи:", error);
      }
    })();

    return true;
  })
);



    ganttEventIds.current = evIds;
  },
  [id]
);


  

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
  if (window.gantt) {
    window.gantt.config._members = members || [];
    console.log("set _members:", window.gantt.config._members);
  }
}, [members]);

  useEffect(() => {
  if (!ganttContainer.current || !window.gantt || ganttReady.current) return;

  const gantt = window.gantt;
  gantt.config.date_format = "%Y-%m-%d";

  gantt.config.columns = [
  { name: "text", label: "Задача", tree: true, width: "*" },
  {
    name: "completed",
    label: "Готово",
    align: "center",
    width: 70,
    template: function (task) {
      const checked = task.isCompleted ? "checked" : "";
      return `<input type="checkbox" class="task-complete-checkbox" ${checked} />`;
    },
  },
  { name: "start_date", label: "Начало", align: "center", width: 90 },
  { name: "duration", label: "Длительность", align: "center", width: 70 },
  { name: "add", label: "", width: 44 },
];

  gantt.locale.labels.section_description = "Описание";
  gantt.locale.labels.section_performers = "Ответственные";
  gantt.locale.labels.section_time = "Время";

  gantt.config.lightbox.sections = [
    { name: "description", height: 38, map_to: "text", type: "textarea", focus: true },
    { name: "performers", height: 80, type: "template", map_to: "performers" },
    { name: "time", type: "duration", map_to: "auto" },
  ];

   gantt.config.lightbox.sections = [
  {
    name: "description",
    height: 38,
    map_to: "text",
    type: "textarea",
    focus: true,
  },
  {
    name: "performers",
    height: 80,
    type: "template",
    map_to: "performers_html", 
  },
  {
    name: "time",
    type: "duration",
    map_to: "auto",
  },
];



  gantt.init(ganttContainer.current);
  ganttReady.current = true;
  setupGanttEvents(gantt, loadProject);

  return () => {
    ganttReady.current = false;
    if (window.gantt) {
      if (ganttEventIds.current.length) {
        ganttEventIds.current.forEach((evId) => {
          window.gantt.detachEvent(evId);
        });
        ganttEventIds.current = [];
      }
      window.gantt.clearAll?.();
      window.gantt.destroy?.();
    }
  };
}, [id, setupGanttEvents, loadProject]);

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

 
  const nextRoleEnum = currentRole === "admin" ? 0 : 1;

try {
  await projectService.changeMemberRole(id, targetId, nextRoleEnum);
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
    {}
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
        <h1 style={{ margin: "0 0 5px 0" }}>
          {projectInfo?.name ?? currentProject?.name}
        </h1>
        <div style={{ color: "#666" }}>
          Роль:{" "}
          <strong>
            {currentProject?.role === "admin" ? "Админ" : "Участник"}
          </strong>
        </div>
      </div>

      {currentProject?.role === "admin" && (
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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

    {}
    {currentProject?.role === "admin" && inviteCodes?.length > 0 && (
      <div
        style={{
          background: "#fff3cd",
          border: "1px solid #ffeeba",
          color: "#856404",
          padding: "10px 15px",
          borderRadius: "4px",
          marginBottom: "15px",
        }}
      >
        <div style={{ marginBottom: "5px" }}>
          Коды приглашения для этого проекта:
        </div>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          {inviteCodes.map((inv) => (
            <li
              key={inv.code}
              style={{ fontFamily: "monospace", fontSize: "16px" }}
            >
              {inv.code}
            </li>
          ))}
        </ul>
      </div>
    )}

    {}
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
          <span style={{ marginLeft: "10px", color: "#666" }}>
            Загрузка...
          </span>
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

    {}
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
          <div className="error-message" style={{ marginBottom: "15px" }}>
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
                      background:
                        formattedRole === "admin" ? "#dc3545" : "#6c757d",
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
                      background:
                        formattedRole === "admin" ? "#6c757d" : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {formattedRole === "admin"
                      ? "Убрать админа"
                      : "Сделать админом"}
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