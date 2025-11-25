const API_ORIGIN = import.meta.env?.VITE_API_URL ?? "http://localhost:5056";
const API_URL = `${API_ORIGIN}/api`;

const defaultHeaders = {
  "Content-Type": "application/json",
};

export const AUTH_EVENTS = {
  unauthorized: "auth:unauthorized",
};

function buildBody(payload) {
  if (payload === undefined || payload === null) return undefined;
  return typeof payload === "string" ? payload : JSON.stringify(payload);
}

async function parseResponse(response) {
  const raw = await response.text();
  let data = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (_) {
      data = raw;
    }
  }

  if (!response.ok) {
    const message =
      (data && data.message) ||
      (typeof data === "string" && data) ||
      `Ошибка ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const token = localStorage.getItem("jwt_token");
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: buildBody(body),
  });

  if (response.status === 204) return null;

  try {
    return await parseResponse(response);
  } catch (error) {
    if (
      (error.status === 401 || error.status === 403) &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new Event(AUTH_EVENTS.unauthorized));
    }
    throw error;
  }
}

export const userService = {
  register(dto) {
    return request("/users/register", { method: "POST", body: dto });
  },
  login(credentials) {
    return request("/users/login", { method: "POST", body: credentials });
  },
  getById(userId) {
    return request(`/users/${userId}`);
  },
};

export const projectService = {
  list(userId) {
    const query = userId ? `?userId=${userId}` : "";
    return request(`/projects${query}`);
  },
  create(dto) {
    return request("/projects", { method: "POST", body: dto });
  },
  get(projectId) {
    return request(`/projects/${projectId}`);
  },
  update(projectId, dto) {
    return request(`/projects/${projectId}`, { method: "PATCH", body: dto });
  },
  remove(projectId) {
    return request(`/projects/${projectId}`, { method: "DELETE" });
  },
  setRootTask(projectId, taskId) {
    return request(`/projects/${projectId}/root?taskId=${taskId}`, {
      method: "PATCH",
    });
  },
  addMember(projectId, userId) {
    return request(`/projects/${projectId}/members?userId=${userId}`, {
      method: "POST",
    });
  },
  removeMember(projectId, userId) {
    return request(`/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
    });
  },
  changeMemberRole(projectId, userId, dto) {
    return request(`/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      body: dto,
    });
  },
};

export const teamService = {
  create(dto) {
    return request("/teams", { method: "POST", body: dto });
  },
  addMember(teamId, memberId) {
    return request(`/teams/${teamId}/${memberId}`, { method: "POST" });
  },
  removeMember(teamId, memberId) {
    return request(`/teams/${teamId}/${memberId}`, { method: "DELETE" });
  },
};

export const taskService = {
  createTask(dto) {
    return request("/tasks", { method: "POST", body: dto });
  },
  getTask(taskId) {
    return request(`/tasks/${taskId}`);
  },
  updateTask(taskId, dto) {
    return request(`/tasks/${taskId}`, { method: "PATCH", body: dto });
  },
  deleteTask(taskId) {
    return request(`/tasks/${taskId}`, { method: "DELETE" });
  },
  addDependency(taskId, dto) {
    return request(`/tasks/${taskId}/dependence`, {
      method: "POST",
      body: {
        parentId: dto.parentId,
        childId: dto.childId,
        type: dto.type,
      },
    });
  },
  removeDependency(taskId, dto) {
    return request(`/tasks/${taskId}/dependence`, {
      method: "DELETE",
      body: {
        parentId: dto.parentId,
        childId: dto.childId,
        type: dto.type,
      },
    });
  },
  addUserPerformer(taskId, userId) {
    return request(`/tasks/${taskId}/performers/users?id=${userId}`, {
      method: "POST",
    });
  },
  removeUserPerformer(taskId, userId) {
    return request(`/tasks/${taskId}/performers/users?id=${userId}`, {
      method: "DELETE",
    });
  },


  addTeamPerformer(taskId, teamId) {
    return request(`/tasks/${taskId}/performers/teams?id=${teamId}`, {
      method: "POST",
    });
  },
  removeTeamPerformer(taskId, teamId) {
    return request(`/tasks/${taskId}/performers/teams?id=${teamId}`, {
      method: "DELETE",
    });
  },
};

const apiClient = {
  request,
};

export default apiClient;
