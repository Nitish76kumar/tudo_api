const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cron = require("node-cron");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const tasksFilePath = "./data/tasks.json";

// Create a new task
app.post("/tasks", (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const tasks = loadTasks();
  const newTask = { id: Date.now(), title, completed: false };
  tasks.push(newTask);
  saveTasks(tasks);

  res.status(201).json(newTask);
});

// Get all tasks
app.get("/tasks", (req, res) => {
  const tasks = loadTasks();
  res.json(tasks);
});

// Update a task
app.put("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);
  const { title, completed } = req.body;

  const tasks = loadTasks();
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (title) {
    tasks[taskIndex].title = title;
  }

  if (completed !== undefined) {
    tasks[taskIndex].completed = completed;
  }

  saveTasks(tasks);

  res.json(tasks[taskIndex]);
});

// Delete a task
app.delete("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);

  const tasks = loadTasks();
  const updatedTasks = tasks.filter((task) => task.id !== taskId);

  if (tasks.length === updatedTasks.length) {
    return res.status(404).json({ error: "Task not found" });
  }

  saveTasks(updatedTasks);

  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Cron job to delete completed tasks at a specific time (e.g., midnight)
cron.schedule("0 0 * * *", () => {
  const tasks = loadTasks();
  const updatedTasks = tasks.filter((task) => !task.completed);
  saveTasks(updatedTasks);
  console.log("Cron job executed to delete completed tasks");
});

function loadTasks() {
  try {
    const tasksData = fs.readFileSync(tasksFilePath);
    return JSON.parse(tasksData);
  } catch (err) {
    return [];
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
}
