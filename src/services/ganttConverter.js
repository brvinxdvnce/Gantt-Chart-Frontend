const mapBackendTypeToGantt = (backendType) => {
  const t = Number(backendType);
  switch (t) {
    case 2: return 0; 
    case 0: return 1; 
    case 3: return 2; 
    case 1: return 3; 
    default: return 0;
  }
};

const MS_IN_DAY = 24 * 60 * 60 * 1000;

function ensureDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calcDuration(start, end) {
  const from = ensureDate(start);
  const to = ensureDate(end);
  if (!from || !to) return 1;
  const diff = Math.max(1, Math.round((to - from) / MS_IN_DAY));
  return diff;
}

function buildLinksFromDependencies(tasks = []) {
  const links = [];
  tasks.forEach((task) => {
    (task.dependencies || task.Dependencies || []).forEach((dep) => {
      const parentId = dep.parentId ?? dep.ParentId;
      const childId = dep.childId ?? dep.ChildId ?? task.id ?? task.Id;
      if (!parentId || !childId) return;
      links.push({
        id: dep.id ?? dep.Id ?? `${parentId}-${childId}`,
        type: `${dep.type ?? dep.Type ?? 0}`,
        sourceTaskId: parentId,
        targetTaskId: childId,
      });
    });
  });
  return links;
}

function mergeTasks(structure = {}) {
  const tasks = [];
  if (structure.rootTask) tasks.push(structure.rootTask);
  if (Array.isArray(structure.tasks)) tasks.push(...structure.tasks);
  if (Array.isArray(structure.data)) tasks.push(...structure.data);
  return tasks.filter(Boolean);
}

export const ganttConverter = {
  toGanttFormat(backendData = {}) {
    const tasks = mergeTasks(backendData);
    const links =
      backendData.links && backendData.links.length
        ? backendData.links
        : buildLinksFromDependencies(tasks);

    return {
      data: tasks.map((task) => {
        const start =
          task.startDate ??
          task.startTime ??
          task.StartDate ??
          task.StartTime ??
          task.start_date;

        const end =
          task.endDate ??
          task.endTime ??
          task.EndDate ??
          task.EndTime ??
          task.end_date;

        // ✅ сначала вычисляем isCompleted
        const isCompleted =
          task.isCompleted ??
          task.IsCompleted ??
          false;

        // ✅ потом – progress (чтобы не было обращения к несуществующей переменной)
        const progress =
          typeof task.progress === "number"
            ? task.progress
            : (isCompleted ? 1 : 0);

        return {
          id: task.id ?? task.Id,
          text: task.text ?? task.name ?? task.Name ?? "Новая задача",
          start_date: this.formatDate(start),
          duration: calcDuration(start, end),
          progress,
          parent:
            task.parentId ??
            task.ParentId ??
            task.parentTaskId ??
            task.ParentTaskId ??
            task.parent,
          type: task.type ?? task.Type ?? "task",

          // это нужно для чекбокса в колонке "Готово"
          isCompleted: Boolean(isCompleted),
        };
      }),

      links: links.map((link) => {
        const backendType = link.type ?? link.Type ?? 0;

        return {
          id: link.id ?? link.Id ?? `${link.sourceTaskId}-${link.targetTaskId}`,
          type: String(mapBackendTypeToGantt(backendType)),
          source: link.sourceTaskId ?? link.SourceTaskId ?? link.source,
          target: link.targetTaskId ?? link.TargetTaskId ?? link.target,
        };
      }),
    };
  },

  toBackendFormat(ganttData, projectId) {
    return {
      tasks: ganttData.data.map((task) => ({
        projectId: projectId ?? task.projectId ?? null,
        name: task.text,
        description: task.description ?? "",
        isCompleted: Boolean(task.isCompleted ?? (task.progress && task.progress >= 1)),
        startTime: this.parseDate(task.start_date),
        endTime: this.addDuration(task.start_date, task.duration),
      })),
      links: ganttData.links.map((link) => ({
        parentId: link.source,
        childId: link.target,
        type: Number(link.type ?? 0),
      })),
    };
  },

  formatDate(dateInput) {
    const date = ensureDate(dateInput) ?? new Date();
    return date.toISOString().split("T")[0];
  },

  parseDate(ganttDate) {
    const date = ensureDate(ganttDate) ?? new Date();
    return date.toISOString();
  },

  addDuration(dateString, duration) {
    const start = ensureDate(dateString) ?? new Date();
    const days = Number(duration) || 1;
    const end = new Date(start.getTime() + days * MS_IN_DAY);
    return end.toISOString();
  },

  formatDate(dateInput) {
    const date = ensureDate(dateInput) ?? new Date();
    return date.toISOString().split("T")[0];
  },

  parseDate(ganttDate) {
    const date = ensureDate(ganttDate) ?? new Date();
    return date.toISOString();
  },

  addDuration(dateString, duration) {
    const start = ensureDate(dateString) ?? new Date();
    const days = Number(duration) || 1;
    const end = new Date(start.getTime() + days * MS_IN_DAY);
    return end.toISOString();
  },
};