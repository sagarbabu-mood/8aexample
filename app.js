const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//Get a list of all todo's  whose status is TODO
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority = "", status = "" } = request.query;

  const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };

  const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };

  const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
  };
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT 
              *
            FROM
              todo
            WHERE 
              todo LIKE '%${search_q}%'
              AND status = '${status}'
              AND priority = '${priority}';
            `;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//Get specific todo API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const getTodo = await db.get(getTodoQuery);
  response.send(getTodo);
});

//Create todo in todo table API
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const createTodoQuery = `
    INSERT INTO
        todo(id, todo, priority, status)
    VALUES
        (
            ${id},
            '${todo}',
            '${priority}',
            '${status}'
        );`;
  await db.run(createTodoQuery);

  response.send("Todo Successfully Added");
});

//Update specific Todo API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const { todo, priority, status } = previousTodo;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//Delete specific API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteSpecificTodo = `
    DELETE
    FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteSpecificTodo);
  response.send("Todo Deleted");
});

module.exports = app;