export class TaskDTO {
  constructor(data) {
    this.id = data.id;
    this.text = data.text;
    this.startDate = data.startDate;
    this.duration = data.duration;
    this.progress = data.progress;
    this.parentId = data.parentId;
    this.type = data.type;
  }
}

export class LinkDTO {
  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.sourceTaskId = data.sourceTaskId;
    this.targetTaskId = data.targetTaskId;
  }
}

export const ganttConverter = {
  toGanttFormat(backendData) {
    const tasks = backendData.tasks || [];
    const links = backendData.links || [];
    
    return {
      data: tasks.map(task => ({
        id: task.id,
        text: task.text,
        start_date: this.formatDate(task.startDate),
        duration: task.duration,
        progress: task.progress,
        parent: task.parentId,
        type: task.type
      })),
      links: links.map(link => ({
        id: link.id,
        type: link.type,
        source: link.sourceTaskId,
        target: link.targetTaskId
      }))
    };
  },

  toBackendFormat(ganttData) {
    return {
      tasks: ganttData.data.map(task => ({
        id: task.id,
        text: task.text,
        startDate: this.parseDate(task.start_date),
        duration: task.duration,
        progress: task.progress,
        parentId: task.parent,
        type: task.type
      })),
      links: ganttData.links.map(link => ({
        id: link.id,
        type: link.type,
        sourceTaskId: link.source,
        targetTaskId: link.target
      }))
    };
  },

  formatDate(dateString) {
    if (!dateString) return new Date().toISOString().split('T')[0];
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  },

  parseDate(ganttDate) {
    return new Date(ganttDate).toISOString();
  }
};