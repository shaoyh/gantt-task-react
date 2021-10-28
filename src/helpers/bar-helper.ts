import { Task, ViewMode, DateDeltaInit } from "../types/public-types";
import { BarTask, TaskTypeInternal } from "../types/bar-task";
import { BarMoveAction } from "../types/gantt-task-actions";
import { isLeapYear, getQuarter } from "../helpers/other-helper";
export const convertToBarTasks = (
  tasks: Task[],
  dates: Date[],
  columnWidth: number,
  rowHeight: number,
  taskHeight: number,
  barCornerRadius: number,
  handleWidth: number,
  barProgressColor: string,
  barProgressSelectedColor: string,
  barBackgroundColor: string,
  barBackgroundSelectedColor: string,
  projectProgressColor: string,
  projectProgressSelectedColor: string,
  projectBackgroundColor: string,
  projectBackgroundSelectedColor: string,
  milestoneBackgroundColor: string,
  milestoneBackgroundSelectedColor: string,
  viewMode: string,
  barBackgroundColorTimeError: string,
  barBackgroundColorCriticalPath: string
) => {
  const dateDelta =
    dates[1].getTime() -
    dates[0].getTime() -
    dates[1].getTimezoneOffset() * 60 * 1000 +
    dates[0].getTimezoneOffset() * 60 * 1000;
  let barTasks = tasks.map((t, i) => {
    return convertToBarTask(
      t,
      i,
      dates,
      dateDelta,
      columnWidth,
      rowHeight,
      taskHeight,
      barCornerRadius,
      handleWidth,
      barProgressColor,
      barProgressSelectedColor,
      barBackgroundColor,
      barBackgroundSelectedColor,
      projectProgressColor,
      projectProgressSelectedColor,
      projectBackgroundColor,
      projectBackgroundSelectedColor,
      milestoneBackgroundColor,
      milestoneBackgroundSelectedColor,
      viewMode,
      barBackgroundColorTimeError,
      barBackgroundColorCriticalPath
    );
  });

  // set dependencies
  barTasks = barTasks.map((task, i) => {
    const dependencies = task.dependencies || [];
    for (let j = 0; j < dependencies.length; j++) {
      const dependence = barTasks.findIndex(
        value => value.id === dependencies[j]
      );
      if (dependence !== -1) barTasks[dependence].barChildren.push(i);
    }
    return task;
  });
  return barTasks;
};

const convertToBarTask = (
  task: Task,
  index: number,
  dates: Date[],
  dateDelta: number,
  columnWidth: number,
  rowHeight: number,
  taskHeight: number,
  barCornerRadius: number,
  handleWidth: number,
  barProgressColor: string,
  barProgressSelectedColor: string,
  barBackgroundColor: string,
  barBackgroundSelectedColor: string,
  projectProgressColor: string,
  projectProgressSelectedColor: string,
  projectBackgroundColor: string,
  projectBackgroundSelectedColor: string,
  milestoneBackgroundColor: string,
  milestoneBackgroundSelectedColor: string,
  viewMode: string,
  barBackgroundColorTimeError: string,
  barBackgroundColorCriticalPath: string
): BarTask => {
  let barTask: BarTask;
  switch (task.type) {
    case "milestone":
      barTask = convertToMilestone(
        task,
        index,
        dates,
        dateDelta,
        columnWidth,
        rowHeight,
        taskHeight,
        barCornerRadius,
        handleWidth,
        milestoneBackgroundColor,
        milestoneBackgroundSelectedColor
      );
      break;
    case "project":
      barTask = convertToBar(
        task,
        index,
        dates,
        dateDelta,
        columnWidth,
        rowHeight,
        taskHeight,
        barCornerRadius,
        handleWidth,
        projectProgressColor,
        projectProgressSelectedColor,
        projectBackgroundColor,
        projectBackgroundSelectedColor,
        viewMode,
        barBackgroundColorTimeError,
        barBackgroundColorCriticalPath
      );
      break;
    default:
      barTask = convertToBar(
        task,
        index,
        dates,
        dateDelta,
        columnWidth,
        rowHeight,
        taskHeight,
        barCornerRadius,
        handleWidth,
        barProgressColor,
        barProgressSelectedColor,
        barBackgroundColor,
        barBackgroundSelectedColor,
        viewMode,
        barBackgroundColorTimeError,
        barBackgroundColorCriticalPath
      );
      break;
  }
  return barTask;
};

const convertToBar = (
  task: Task,
  index: number,
  dates: Date[],
  dateDelta: number,
  columnWidth: number,
  rowHeight: number,
  taskHeight: number,
  barCornerRadius: number,
  handleWidth: number,
  barProgressColor: string,
  barProgressSelectedColor: string,
  barBackgroundColor: string,
  barBackgroundSelectedColor: string,
  viewMode: string,
  barBackgroundColorTimeError: string,
  barBackgroundColorCriticalPath: string
): BarTask => {
  const x1: any = taskXCoordinate(
    task.start,
    dates,
    dateDelta,
    columnWidth,
    viewMode
  );
  let x2: any = taskXCoordinate(
    task.end,
    dates,
    dateDelta,
    columnWidth,
    viewMode
  );
  const y = taskYCoordinate(index, rowHeight, taskHeight);

  const styles = {
    backgroundColor: barBackgroundColor,
    backgroundSelectedColor: barBackgroundSelectedColor,
    progressColor: barProgressColor,
    progressSelectedColor: barProgressSelectedColor,
    barBackgroundColorTimeError: barBackgroundColorTimeError,
    barBackgroundColorCriticalPath: barBackgroundColorCriticalPath,
    ...task.styles,
  };
  const typeInternal: TaskTypeInternal = task.type;
  if (typeInternal === "task" && x2 - x1 < handleWidth * 2) {
    // typeInternal = "smalltask";
    x2 = x1 + handleWidth * 2 + 4;
  }
  return {
    ...task,
    typeInternal,
    x1,
    x2,
    y,
    index,
    barCornerRadius,
    handleWidth,
    height: taskHeight,
    barChildren: [],
    styles,
  };
};

const convertToMilestone = (
  task: Task,
  index: number,
  dates: Date[],
  dateDelta: number,
  columnWidth: number,
  rowHeight: number,
  taskHeight: number,
  barCornerRadius: number,
  handleWidth: number,
  milestoneBackgroundColor: string,
  milestoneBackgroundSelectedColor: string
) => {
  const x: any = taskXCoordinate(task.start, dates, dateDelta, columnWidth);
  const y = taskYCoordinate(index, rowHeight, taskHeight);

  const x1 = x - taskHeight * 0.5;
  const x2 = x + taskHeight * 0.5;

  const rotatedHeight = taskHeight / 1.414;
  const styles = {
    backgroundColor: milestoneBackgroundColor,
    backgroundSelectedColor: milestoneBackgroundSelectedColor,
    progressColor: "",
    progressSelectedColor: "",
    ...task.styles,
  };
  return {
    ...task,
    end: task.start,
    x1,
    x2,
    y,
    index,
    barCornerRadius,
    handleWidth,
    typeInternal: task.type,
    progress: 0,
    height: rotatedHeight,
    barChildren: [],
    styles,
  };
};

const taskXCoordinate = (
  xDate: Date,
  dates: Date[],
  dateDelta: number,
  columnWidth: number,
  viewMode?: string
) => {
  if (!xDate) return;
  let precision;
  let index = 0;
  if (viewMode === ViewMode.Month) {
    index =
      xDate?.getFullYear() * 12 +
      xDate?.getMonth() -
      dates[0]?.getFullYear() * 12 -
      dates[0]?.getMonth();
    if (isLeapYear(xDate?.getFullYear()) && xDate?.getMonth() === 1) {
      precision = DateDeltaInit.LeapMounth;
    } else {
      precision = DateDeltaInit[ViewMode.Month][xDate?.getMonth() + 1];
    }
  } else if (viewMode === ViewMode.Year) {
    index = xDate?.getFullYear() - dates[0]?.getFullYear();
    precision = isLeapYear(xDate?.getFullYear())
      ? DateDeltaInit[ViewMode.Year].leap
      : DateDeltaInit[ViewMode.Year].common;
  } else if (viewMode === ViewMode.Quarter) {
    index =
      xDate?.getFullYear() * 4 +
      getQuarter(xDate?.getMonth() + 1) -
      dates[0]?.getFullYear() * 4 -
      getQuarter(dates[0]?.getMonth() + 1);
    if (
      isLeapYear(xDate?.getFullYear()) &&
      getQuarter(xDate?.getMonth() + 1) === 1
    ) {
      precision = DateDeltaInit.LeapQuarter;
    } else {
      precision =
        DateDeltaInit[ViewMode.Quarter][getQuarter(xDate?.getMonth() + 1)];
    }
  } else {
    index = ~~(
      (xDate.getTime() -
        dates[0].getTime() +
        xDate.getTimezoneOffset() -
        dates[0].getTimezoneOffset()) /
      dateDelta
    );
    precision = dateDelta;
  }
  if (index < 0) {
    index = 0;
  } else if (index > dates.length - 1) {
    index = dates.length - 1;
  }
  const x = Math.round(
    (index +
      (xDate.getTime() -
        dates[index].getTime() -
        xDate.getTimezoneOffset() * 60 * 1000 +
        dates[index].getTimezoneOffset() * 60 * 1000) /
        precision) *
      columnWidth
  );
  return x;
};

const taskYCoordinate = (
  index: number,
  rowHeight: number,
  taskHeight: number
) => {
  const y = index * rowHeight + (rowHeight - taskHeight) / 2;
  return y;
};

export const progressWithByParams = (
  taskX1: number,
  taskX2: number,
  progress: number
) => {
  return (taskX2 - taskX1) * progress * 0.01;
};

export const progressByProgressWidth = (
  progressWidth: number,
  barTask: BarTask
) => {
  const barWidth = barTask.x2 - barTask.x1;
  const progressPercent = Math.round((progressWidth * 100) / barWidth);
  if (progressPercent >= 100) return 100;
  else if (progressPercent <= 0) return 0;
  else {
    return progressPercent;
  }
};

const progressByX = (x: number, task: BarTask) => {
  if (x >= task.x2) return 100;
  else if (x <= task.x1) return 0;
  else {
    const barWidth = task.x2 - task.x1;
    const progressPercent = Math.round(((x - task.x1) * 100) / barWidth);
    return progressPercent;
  }
};

export const getProgressPoint = (
  progressX: number,
  taskY: number,
  taskHeight: number
) => {
  const point = [
    progressX - 5,
    taskY + taskHeight,
    progressX + 5,
    taskY + taskHeight,
    progressX,
    taskY + taskHeight - 5.66,
  ];
  return point.join(",");
};

const startByX = (x: number, xStep: number, task: BarTask) => {
  if (x >= task.x2 - task.handleWidth * 2) {
    x = task.x2 - task.handleWidth * 2;
  }
  const steps = Math.round((x - task.x1) / xStep);
  const additionalXValue = steps * xStep;
  const newX = task.x1 + additionalXValue;
  return newX;
};

const endByX = (x: number, xStep: number, task: BarTask) => {
  if (x <= task.x1 + task.handleWidth * 2) {
    x = task.x1 + task.handleWidth * 2;
  }
  const steps = Math.round((x - task.x2) / xStep);
  const additionalXValue = steps * xStep;
  const newX = task.x2 + additionalXValue;
  return newX;
};

const moveByX = (x: number, xStep: number, task: BarTask) => {
  const steps = Math.round((x - task.x1) / xStep);
  const additionalXValue = steps * xStep;
  const newX1 = task.x1 + additionalXValue;
  const newX2 = newX1 + task.x2 - task.x1;
  return [newX1, newX2];
};

const dateByX = (
  x: number,
  taskX: number,
  taskDate: Date,
  xStep: number,
  timeStep: number
) => {
  let newDate = new Date(((x - taskX) / xStep) * timeStep + taskDate.getTime());
  newDate = new Date(
    newDate.getTime() +
      (newDate.getTimezoneOffset() - taskDate.getTimezoneOffset()) * 60000
  );
  return newDate;
};

/**
 * Method handles event in real time(mousemove) and on finish(mouseup)
 */
export const handleTaskBySVGMouseEvent = (
  svgX: number,
  action: BarMoveAction,
  selectedTask: BarTask,
  xStep: number,
  timeStep: number,
  initEventX1Delta: number
): { isChanged: boolean; changedTask: BarTask } => {
  let result: { isChanged: boolean; changedTask: BarTask };
  switch (selectedTask.type) {
    case "milestone":
      result = handleTaskBySVGMouseEventForMilestone(
        svgX,
        action,
        selectedTask,
        xStep,
        timeStep,
        initEventX1Delta
      );
      break;
    default:
      result = handleTaskBySVGMouseEventForBar(
        svgX,
        action,
        selectedTask,
        xStep,
        timeStep,
        initEventX1Delta
      );
      break;
  }
  return result;
};

const handleTaskBySVGMouseEventForBar = (
  svgX: number,
  action: BarMoveAction,
  selectedTask: BarTask,
  xStep: number,
  timeStep: number,
  initEventX1Delta: number
): { isChanged: boolean; changedTask: BarTask } => {
  const changedTask: BarTask = { ...selectedTask };
  let isChanged = false;
  switch (action) {
    case "progress":
      changedTask.progress = progressByX(svgX, selectedTask);
      isChanged = changedTask.progress !== selectedTask.progress;
      break;
    case "start": {
      const newX1 = startByX(svgX, xStep, selectedTask);
      changedTask.x1 = newX1;
      isChanged = changedTask.x1 !== selectedTask.x1;
      if (isChanged) {
        changedTask.start = dateByX(
          newX1,
          selectedTask.x1,
          selectedTask.start,
          xStep,
          timeStep
        );
      }
      break;
    }
    case "end": {
      const newX2 = endByX(svgX, xStep, selectedTask);
      changedTask.x2 = newX2;
      isChanged = changedTask.x2 !== selectedTask.x2;
      if (isChanged) {
        changedTask.end = dateByX(
          newX2,
          selectedTask.x2,
          selectedTask.end,
          xStep,
          timeStep
        );
      }
      break;
    }
    case "move": {
      const [newMoveX1, newMoveX2] = moveByX(
        svgX - initEventX1Delta,
        xStep,
        selectedTask
      );
      isChanged = newMoveX1 !== selectedTask.x1;
      if (isChanged) {
        changedTask.start = dateByX(
          newMoveX1,
          selectedTask.x1,
          selectedTask.start,
          xStep,
          timeStep
        );
        changedTask.end = dateByX(
          newMoveX2,
          selectedTask.x2,
          selectedTask.end,
          xStep,
          timeStep
        );
        changedTask.x1 = newMoveX1;
        changedTask.x2 = newMoveX2;
      }
      break;
    }
  }
  return { isChanged, changedTask };
};

const handleTaskBySVGMouseEventForMilestone = (
  svgX: number,
  action: BarMoveAction,
  selectedTask: BarTask,
  xStep: number,
  timeStep: number,
  initEventX1Delta: number
): { isChanged: boolean; changedTask: BarTask } => {
  const changedTask: BarTask = { ...selectedTask };
  let isChanged = false;
  switch (action) {
    case "move": {
      const [newMoveX1, newMoveX2] = moveByX(
        svgX - initEventX1Delta,
        xStep,
        selectedTask
      );
      isChanged = newMoveX1 !== selectedTask.x1;
      if (isChanged) {
        changedTask.start = dateByX(
          newMoveX1,
          selectedTask.x1,
          selectedTask.start,
          xStep,
          timeStep
        );
        changedTask.end = changedTask.start;
        changedTask.x1 = newMoveX1;
        changedTask.x2 = newMoveX2;
      }
      break;
    }
  }
  return { isChanged, changedTask };
};
