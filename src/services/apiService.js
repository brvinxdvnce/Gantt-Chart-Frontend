const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const projectService = {
  getProjects: () => 
    fetch(`${API_BASE}/projects`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createProject: (name) =>
    fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    }).then(handleResponse),

  getProject: (projectId) =>
    fetch(`${API_BASE}/projects/${projectId}`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  updateProject: (projectId, data) =>
    fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  deleteProject: (projectId) =>
    fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  setRootTask: (projectId, taskId) =>
    fetch(`${API_BASE}/projects/${projectId}/root?taskId=${taskId}`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    }).then(handleResponse),

  addMember: (projectId, userId) =>
    fetch(`${API_BASE}/projects/${projectId}/members?userId=${userId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(handleResponse),

  removeMember: (projectId, userId) =>
    fetch(`${API_BASE}/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  updateMemberRole: (projectId, userId, role) =>
    fetch(`${API_BASE}/projects/${projectId}/members/${userId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    }).then(handleResponse)
};

export const teamService = {
  createTeam: (teamData) =>
    fetch(`${API_BASE}/teams`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(teamData)
    }).then(handleResponse),

  addTeamMember: (teamId, memberId) =>
    fetch(`${API_BASE}/teams/${teamId}/${memberId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(handleResponse),

  removeTeamMember: (teamId, memberId) =>
    fetch(`${API_BASE}/teams/${teamId}/${memberId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse)
};

export const taskService = {
  getTasksByProject: (projectId) =>
    fetch(`${API_BASE}/tasks?projectId=${projectId}`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createTask: (taskData) =>
    fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    }).then(handleResponse),

  getTask: (taskId) =>
    fetch(`${API_BASE}/tasks/${taskId}`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  updateTask: (taskId, taskData) =>
    fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    }).then(handleResponse),

  deleteTask: (taskId) =>
    fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  addDependency: (taskId, dependentTaskId) =>
    fetch(`${API_BASE}/tasks/${taskId}/dependence`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ dependentTaskId })
    }).then(handleResponse),

  removeDependency: (taskId, dependentTaskId) =>
    fetch(`${API_BASE}/tasks/${taskId}/dependence`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ dependentTaskId })
    }).then(handleResponse),

  addPerformer: (taskId, userId) =>
    fetch(`${API_BASE}/tasks/${taskId}/performers?userId=${userId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(handleResponse),

  removePerformer: (taskId, userId) =>
    fetch(`${API_BASE}/tasks/${taskId}/performers?userId=${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse)
};

export const userService = {
  register: (userData) =>
    fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }).then(handleResponse),

  login: (credentials) =>
    fetch(`${API_BASE}/users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(handleResponse),

  getUser: (userId) =>
    fetch(`${API_BASE}/users/${userId}`, {
      headers: getAuthHeaders()
    }).then(handleResponse)
};