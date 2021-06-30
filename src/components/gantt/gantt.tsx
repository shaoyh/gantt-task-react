import React, {
  useState,
  SyntheticEvent,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { ViewMode, GanttProps } from "../../types/public-types";
import { GridProps } from "../grid/grid";
import {
  ganttDateRange,
  seedDates,
  addToDate,
} from "../../helpers/date-helper";
import { CalendarProps } from "../calendar/calendar";
import { TaskGanttContentProps } from "./task-gantt-content";
import { StandardTooltipContent, Tooltip } from "../other/tooltip";
import { VerticalScroll } from "../other/vertical-scroll";
import { TaskGantt } from "./task-gantt";
import { BarTask } from "../../types/bar-task";
import { convertToBarTasks } from "../../helpers/bar-helper";
import { GanttEvent } from "../../types/gantt-task-actions";
import { DateSetup } from "../../types/date-setup";
import styles from "./gantt.module.css";
import { HorizontalScroll } from "../other/horizontal-scroll";
export const Gantt: React.FunctionComponent<GanttProps> = ({
  tasks,
  headerHeight = 50,
  columnWidth = 60,
  listCellWidth = "155px",
  listWidth = 500,
  listBottomHeight = 48,
  rowHeight = 50,
  viewMode = ViewMode.Day,
  locale = "en-GB",
  //locale = "zh-cn",
  barFill = 60,
  barCornerRadius = 3,
  barProgressColor = "#a3a3ff",
  barProgressSelectedColor = "#8282f5",
  barBackgroundColor = "#b8c2cc",
  barBackgroundSelectedColor = "#aeb8c2",
  projectProgressColor = "#7db59a",
  projectProgressSelectedColor = "#59a985",
  projectBackgroundColor = "#fac465",
  projectBackgroundSelectedColor = "#f7bb53",
  milestoneBackgroundColor = "#f1c453",
  milestoneBackgroundSelectedColor = "#f29e4c",
  handleWidth = 8,
  timeStep = 300000,
  arrowColor = "grey",
  fontFamily = "Arial, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue",
  fontSize = "14px",
  arrowIndent = 20,
  todayColor = "#A3A3FF",
  TooltipContent = StandardTooltipContent,
  onDateChange,
  onProgressChange,
  onDoubleClick,
  onDelete,
  onSelect,
  renderTaskListComponent,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);
  const taskGanttContainerRef = useRef<any>({});
  const verticalScrollContainerRef = useRef<HTMLDivElement>(null);
  const horizontalScrollContainerRef = useRef<HTMLDivElement>(null);

  const [dateSetup, setDateSetup] = useState<DateSetup>(() => {
    const [startDate, endDate] = ganttDateRange();
    return { viewMode, dates: seedDates(startDate, endDate, viewMode) };
  });

  const [taskHeight, setTaskHeight] = useState((rowHeight * barFill) / 100);
  const [taskListWidth, setTaskListWidth] = useState(listWidth);
  const [svgContainerWidth, setSvgContainerWidth] = useState(0);
  const [ganttHeight, setGanttHeight] = useState(0);
  const [svgContainerHeight, setSvgContainerHeight] = useState(ganttHeight);
  const [barTasks, setBarTasks] = useState<BarTask[]>([]);
  const [ganttEvent, setGanttEvent] = useState<GanttEvent>({
    action: "",
  });

  const [selectedTask, setSelectedTask] = useState<BarTask>();
  const [failedTask, setFailedTask] = useState<BarTask | null>(null);

  const eleListTableBodyRef = useRef<any>(null);
  const refScrollY: any = useRef(0);
  const refScrollX: any = useRef(0);
  const [ignoreScrollEvent, setIgnoreScrollEvent] = useState(false);
  // 到今天移动的距离
  // const [todayDistance, setTodayDistance] = useState(0);
  const svgWidth = dateSetup.dates.length * columnWidth;
  const ganttFullHeight = barTasks.length * rowHeight;

  // task change events
  useEffect(() => {
    const [startDate, endDate] = ganttDateRange();
    const newDates = seedDates(startDate, endDate, viewMode);
    setDateSetup({ dates: newDates, viewMode });
    setBarTasks(
      convertToBarTasks(
        tasks,
        newDates,
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
        milestoneBackgroundSelectedColor
      )
    );
  }, [
    tasks,
    viewMode,
    rowHeight,
    barCornerRadius,
    columnWidth,
    taskHeight,
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
  ]);
  useEffect(() => {
    const { changedTask, action } = ganttEvent;
    if (changedTask) {
      if (action === "delete") {
        setGanttEvent({ action: "" });
        setBarTasks(barTasks.filter(t => t.id !== changedTask.id));
      } else if (
        action === "move" ||
        action === "end" ||
        action === "start" ||
        action === "progress"
      ) {
        const prevStateTask = barTasks.find(t => t.id === changedTask.id);
        if (
          prevStateTask &&
          (prevStateTask.start.getTime() !== changedTask.start.getTime() ||
            prevStateTask.end.getTime() !== changedTask.end.getTime() ||
            prevStateTask.progress !== changedTask.progress)
        ) {
          // actions for change
          const newTaskList = barTasks.map(t =>
            t.id === changedTask.id ? changedTask : t
          );
          setBarTasks(newTaskList);
        }
      }
    }
  }, [ganttEvent, barTasks]);

  useEffect(() => {
    if (failedTask) {
      setBarTasks(barTasks.map(t => (t.id !== failedTask.id ? t : failedTask)));
      setFailedTask(null);
    }
  }, [failedTask, barTasks]);

  useEffect(() => {
    const newTaskHeight = (rowHeight * barFill) / 100;
    if (newTaskHeight !== taskHeight) {
      setTaskHeight(newTaskHeight);
    }
  }, [rowHeight, barFill, taskHeight]);

  useEffect(() => {
    if (!listCellWidth) {
      setTaskListWidth(0);
    }
    if (taskListRef.current) {
      setTaskListWidth(taskListRef.current.offsetWidth);
    }
  }, [taskListRef, listCellWidth]);

  useEffect(() => {
    if (wrapperRef.current) {
      setSvgContainerWidth(wrapperRef.current.offsetWidth - taskListWidth);
    }
  }, [wrapperRef, taskListWidth]);

  useEffect(() => {
    if (ganttHeight) {
      setSvgContainerHeight(ganttHeight + headerHeight);
    } else {
      setSvgContainerHeight(tasks.length * rowHeight + headerHeight);
    }
  }, [ganttHeight, tasks]);

  useEffect(() => {
    const ele = taskGanttContainerRef?.current?.horizontalContainerRef;
    if (ele) {
      setGanttHeight(ele.offsetHeight);
    }
  }, [taskGanttContainerRef?.current?.horizontalContainerRef]);

  const setElementsScrollY = () => {
    eleListTableBodyRef.current && (eleListTableBodyRef.current.scrollTop = refScrollY.current);
    taskGanttContainerRef?.current?.horizontalContainerRef && (taskGanttContainerRef.current.horizontalContainerRef.scrollTop = refScrollY.current);
    verticalScrollContainerRef?.current && (verticalScrollContainerRef.current.scrollTop = refScrollY.current);
  };

  const setElementsScrollX = () => {
    taskGanttContainerRef?.current?.verticalGanttContainerRef && (taskGanttContainerRef.current.verticalGanttContainerRef.scrollLeft = refScrollX.current);
    horizontalScrollContainerRef?.current && (horizontalScrollContainerRef.current.scrollLeft = refScrollX.current);
  };
  
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log(event.deltaX, event.deltaY)
    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
      if (event.deltaX !== 0) {
        const scrollX = refScrollX.current;
        const scrollMove = event.deltaX;
        let newScrollX = scrollX + scrollMove;
        if (newScrollX < 0) {
          newScrollX = 0;
        } else if (newScrollX > svgWidth) {
          newScrollX = svgWidth;
        }
        refScrollX.current = newScrollX;
        setElementsScrollX();
      }
    }
    else {
      if (event.deltaY !== 0) {
        // Y轴滚动处理
        const max = ganttFullHeight - ganttHeight;
        const scrollY = refScrollY.current;
        let newScrollY = scrollY + event.deltaY;
        if (newScrollY < 0) {
          newScrollY = 0;
        } else if (newScrollY > max) {
          newScrollY = max;
        }
        refScrollY.current = newScrollY;
        setElementsScrollY();
      }
    }
    setIgnoreScrollEvent(true);
  }, [refScrollX.current, refScrollY.current, ganttHeight, setElementsScrollY, setElementsScrollX]);

  // scroll events
  useEffect(() => {
    // subscribe if scroll is necessary
    if (wrapperRef.current) {
      wrapperRef.current.addEventListener("wheel", handleWheel, {
        passive: false,
      });
    }
    return () => {
      if (wrapperRef.current) {
        wrapperRef.current.removeEventListener("wheel", handleWheel);
      }
    };
  }, [wrapperRef.current, handleWheel]);

  const handleScrollY = (event: SyntheticEvent<HTMLDivElement>) => {
    const scrollY = refScrollY.current;
    if (scrollY !== event.currentTarget.scrollTop && !ignoreScrollEvent) {
      refScrollY.current = event.currentTarget.scrollTop;
      setElementsScrollY();
    }
    setIgnoreScrollEvent(false);
  };

  const handleScrollX = (event: SyntheticEvent<HTMLDivElement>) => {
    const scrollX = refScrollX.current;
    if (scrollX !== event.currentTarget.scrollLeft && !ignoreScrollEvent) {
      refScrollX.current = event.currentTarget.scrollLeft;
      setElementsScrollX();
    }
    setIgnoreScrollEvent(false);
  };

  /**
   * Handles arrow keys events and transform it to new scroll
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const scrollY = refScrollY.current;
    const scrollX = refScrollX.current;
    let newScrollY = scrollY;
    let newScrollX = scrollX;
    let isX = true;
    switch (event.key) {
      case "Down": // IE/Edge specific value
      case "ArrowDown":
        newScrollY += rowHeight;
        isX = false;
        break;
      case "Up": // IE/Edge specific value
      case "ArrowUp":
        newScrollY -= rowHeight;
        isX = false;
        break;
      case "Left":
      case "ArrowLeft":
        newScrollX -= columnWidth;
        break;
      case "Right": // IE/Edge specific value
      case "ArrowRight":
        newScrollX += columnWidth;
        break;
    }
    if (isX) {
      if (newScrollX < 0) {
        newScrollX = 0;
      } else if (newScrollX > svgWidth) {
        newScrollX = svgWidth;
      }
      refScrollX.current = newScrollX;
      setElementsScrollX();
    } else {
      if (newScrollY < 0) {
        newScrollY = 0;
      } else if (newScrollY > ganttFullHeight - ganttHeight) {
        newScrollY = ganttFullHeight - ganttHeight;
      }
      refScrollY.current = newScrollY;
      setElementsScrollY();
    }
    setIgnoreScrollEvent(true);
  };

  /**
   * Task select event
   */
  const handleSelectedTask = (taskId: string) => {
    const newSelectedTask = barTasks.find(t => t.id === taskId);
    const oldSelectedTask = barTasks.find(
      t => !!selectedTask && t.id === selectedTask.id
    );
    if (onSelect) {
      if (oldSelectedTask) {
        onSelect(oldSelectedTask, false);
      }
      if (newSelectedTask) {
        onSelect(newSelectedTask, true);
      }
    }
    setSelectedTask(newSelectedTask);
  };

  const gridProps: GridProps = {
    columnWidth,
    svgWidth,
    tasks: tasks,
    rowHeight,
    dates: dateSetup.dates,
    todayColor,
  };
  const calendarProps: CalendarProps = {
    dateSetup,
    locale,
    viewMode,
    headerHeight,
    columnWidth,
    fontFamily,
    fontSize,
  };
  const barProps: TaskGanttContentProps = {
    tasks: barTasks,
    dates: dateSetup.dates,
    ganttEvent,
    selectedTask,
    rowHeight,
    taskHeight,
    columnWidth,
    arrowColor,
    timeStep,
    fontFamily,
    fontSize,
    arrowIndent,
    svgWidth,
    setGanttEvent,
    setFailedTask,
    setSelectedTask: handleSelectedTask,
    onDateChange,
    onProgressChange,
    onDoubleClick,
    onDelete,
  };

  const TaskListComponent = useMemo(() => {
    if (typeof renderTaskListComponent === "function") {
      return renderTaskListComponent();
    }
    return null;
  }, [renderTaskListComponent]);

  useEffect(() => {
    if (TaskListComponent) {
      eleListTableBodyRef.current = document.querySelector('.BaseTable__table-main .BaseTable__body');
    }
  }, [TaskListComponent]);

  const toToday = useCallback(() => {
    // 之前考虑通过context， 在grid-body中setState 传递移动的距离，但是页面会抖动
    const now = new Date();
    let tickX = 0;
    let newTickX = 0;
    for (let i = 0; i < dateSetup.dates.length; i++) {
      const date = dateSetup.dates[i];
      if (
        (i + 1 !== dateSetup.dates.length &&
          date.getTime() < now.getTime() &&
          dateSetup.dates[i + 1].getTime() >= now.getTime()) ||
        // if current date is last
        (i !== 0 &&
          i + 1 === dateSetup.dates.length &&
          date.getTime() < now.getTime() &&
          addToDate(
            date,
            date.getTime() - dateSetup.dates[i - 1].getTime(),
            "millisecond"
          ).getTime() >= now.getTime())
      ) {
        // 当天的零点的时间戳（毫秒）
        const currentStamp = new Date(
          new Date().toLocaleDateString()
        ).getTime();
        // 当天和上一个时间的差
        const currentMinus =
          (currentStamp + 86400000 - dateSetup.dates[i].getTime()) / 86400000;
        // 前后时间差
        const totalMinus =
          (dateSetup.dates[i + 1].getTime() - dateSetup.dates[i].getTime()) /
          86400000;
        newTickX =
          tickX +
          columnWidth * (currentMinus / totalMinus) -
          columnWidth / totalMinus / 2;
      }
      tickX += columnWidth;
    }
    refScrollX.current = newTickX - svgContainerWidth / 2;
    setElementsScrollX();
  }, [dateSetup]);

  useEffect(() => {
    if (viewMode === ViewMode.Day) {
      setTimeout(() => {
        toToday();
      }, 0);
    }
  }, [wrapperRef.current, svgContainerWidth, toToday]);

  return (
    <div className={styles.box}>
      <div className={styles.handleBtn}>
        <button onClick={toToday} className={styles.toDoday}>
          今天
        </button>
      </div>
      <div
        className={styles.wrapper}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        ref={wrapperRef}
      >
        {listCellWidth && TaskListComponent && (
          <div ref={taskListRef} className={styles.taskListWrapper} style={{width: `${taskListWidth}px`}}>
            {TaskListComponent}
            <div className={styles.mask} />
          </div>
        )}
        {tasks.length > 0 && (
          <TaskGantt
            ref={taskGanttContainerRef}
            gridProps={gridProps}
            calendarProps={calendarProps}
            barProps={barProps}
            ganttHeight={ganttHeight}
          />
        )}
        {ganttEvent.changedTask && (
          <Tooltip
            arrowIndent={arrowIndent}
            rowHeight={rowHeight}
            svgContainerHeight={svgContainerHeight}
            svgContainerWidth={svgContainerWidth}
            fontFamily={fontFamily}
            fontSize={fontSize}
            scrollX={refScrollX.current}
            scrollY={refScrollY.current}
            task={ganttEvent.changedTask}
            headerHeight={headerHeight}
            taskListWidth={taskListWidth}
            TooltipContent={TooltipContent}
          />
        )}
        <VerticalScroll
          ref={verticalScrollContainerRef}
          ganttFullHeight={ganttFullHeight}
          ganttHeight={ganttHeight}
          headerHeight={headerHeight}
          listBottomHeight={listBottomHeight}
          onScroll={handleScrollY}
        />
        <HorizontalScroll
          ref={horizontalScrollContainerRef}
          listBottomHeight={listBottomHeight}
          svgWidth={svgWidth}
          taskListWidth={taskListWidth}
          onScroll={handleScrollX}
        />
      </div>
    </div>
  );
};
