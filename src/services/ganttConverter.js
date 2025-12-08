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

  // считаем разницу по дням без учёта часов, чтобы таймзона не портила
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  const diffDays = Math.round((toMidnight - fromMidnight) / MS_IN_DAY);
  return Math.max(1, diffDays || 1);
}

// ---------- ХЕЛПЕРЫ ДАТ ----------

// Только дата для Gantt: "YYYY-MM-DD"
function toGanttDateString(value) {
  if (typeof value === "string" && value.length >= 10) {
    return value.slice(0, 10);
  }

  const d = ensureDate(value) ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


function toBackendStartIso(dateInput) {
  
  const dateString = toGanttDateString(dateInput); 

  const [y, m, d] = dateString.split("-").map(Number);
 
  const localNoon = new Date(y, m - 1, d, 12, 0, 0);
  return localNoon.toISOString();
}

function toBackendEndIso(dateInput, duration) {
  const dateString = toGanttDateString(dateInput); 
  const [y, m, d] = dateString.split("-").map(Number);

  const baseNoon = new Date(y, m - 1, d, 12, 0, 0);
  const days = Number(duration) || 1;

  const end = new Date(baseNoon.getTime() + days * MS_IN_DAY);
  return end.toISOString();
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

        const startStr = toGanttDateString(start);
        const endStr = toGanttDateString(end);

        const isCompleted =
          task.isCompleted ??
          task.IsCompleted ??
          false;

        const progress =
          typeof task.progress === "number"
            ? task.progress
            : (isCompleted ? 1 : 0);

        return {
          id: task.id ?? task.Id,
          text: task.text ?? task.name ?? task.Name ?? "Новая задача",
          start_date: startStr,                   
          duration: calcDuration(startStr, endStr),
          progress,
          parent:
            task.parentId ??
            task.ParentId ??
            task.parentTaskId ??
            task.ParentTaskId ??
            task.parent,
          type: task.type ?? task.Type ?? "task",
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
        isCompleted: Boolean(
          task.isCompleted ?? (task.progress && task.progress >= 1)
        ),
        startTime: toBackendStartIso(task.start_date),
        endTime: toBackendEndIso(task.start_date, task.duration),
      })),
      links: ganttData.links.map((link) => ({
        parentId: link.source,
        childId: link.target,
        type: Number(link.type ?? 0),
      })),
    };
  },

 
  formatDate(dateInput) {
    return toGanttDateString(dateInput);
  },

  parseDate(ganttDate) {
    return toBackendStartIso(toGanttDateString(ganttDate));
  },

  addDuration(dateString, duration) {
    return toBackendEndIso(toGanttDateString(dateString), duration);
  },


  toBackendStartIso,
  toBackendEndIso,
  toGanttDateString,
};
