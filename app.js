const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server Running at http://localhost:3000/`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

const hasStatusAndPriorityProperty = (requestQuery) => {
    return (requestQuery.status!==undefined && requestQuery.priority!==undefined);
};

const hasStatusProperty = (requestQuery) => {
    return (requestQuery.status !==undefined);
};

const hasPriorityProperty = (requestQuery) => {
    return (requestQuery.priority !==undefined);
};

const hasCategoryProperty = (requestQuery) => {
    return (requestQuery.category !==undefined);
};

const hasCategoryAndStatusProperty = (requestQuery) => {
    return (requestQuery.category !== undefined && requestQuery.status!==undefined);
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
    return (requestQuery.category !== undefined && requestQuery.priority !==undefined);
};

const hasSearchQueryProperty = (requestQuery) => {
    return (requestQuery.search_q!==undefined)
}

const responseObject = (dbObject) => {
    return {
id: dbObject.id,
        todo: dbObject.todo,
        category : dbObject.category,
        priority : dbObject.priority,
        status : dbObject.status,
        dueDate : dbObject.due_date
    }
        
    
};

app.get("/todos/", async (request, response) => {
    let data = null;
    let getTodoQuery = "";
    const {search_q = "", priority, status, category} = request.query;
    switch(true) {
        case hasStatusAndPriorityProperty(request.query):
            if (priority==="HIGH" || priority==="MEDIUM" || priority==="LOW") {
                if (status==="TO DO" || status==="IN PROGRESS" || status==="DONE"){
                    getTodoQuery = `SELECT * FROM todo WHERE status = '${status}'
                     AND priority = '${priority}';`;
                    data = await db.all(getTodoQuery);
                    response.send(data.map((eachQuery) => responseObject(eachQuery)));
                }else{
                    response.status(400);
                    response.send("Invalid Todo Status");
                }
            }else{
                    response.status(400);
                    response.send("Invalid Todo Priority");
            }
            break;
        
        case hasStatusProperty(request.query):
            if (status==="TO DO" || status==="IN PROGRESS" || status==="DONE") {
                getTodoQuery = `SELECT * FROM todo WHERE status = '${status}';`;
                    data = await db.all(getTodoQuery);
                    response.send(data.map((eachQuery) => responseObject(eachQuery)));
            }else{
                  response.status(400);
                  response.send("Invalid Todo Status");
            }
            break;

        case hasPriorityProperty(request.query):
            if (priority==="HIGH" || priority==="MEDIUM" || priority==="LOW") {
                
                    getTodoQuery = `SELECT * FROM todo WHERE
                     priority = '${priority}';`;
                    data = await db.all(getTodoQuery);
                    response.send(data.map((eachQuery) => responseObject(eachQuery)));             
            }else{
                response.status(400);
                response.send("Invalid Todo Priority");
            }
            break;

        case hasCategoryProperty(request.query):
            if (category==="WORK" || category==="HOME" || category==="LEARNING") {
                getTodoQuery = `SELECT * FROM todo WHERE category = '${category}';`;
                data = await db.all (getTodoQuery);
                response.send(data.map((eachQuery) => responseObject(eachQuery)));
            }else{
                response.status(400);
                response.send("Invalid Todo Category");
            }
            break;
        case hasCategoryAndStatusProperty(request.query):
            if (category==="WORK" || category==="HOME" || category==="LEARNING") {
            if (status==="TO DO" || status==="IN PROGRESS" || status==="DONE"){
                getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' AND
                status = '${status}';`;
                data = await db.all (getTodoQuery);
                response.send(data.map((eachQuery) => responseObject(eachQuery)));
            }else{
                response.status(400);
                  response.send("Invalid Todo Status");
            }
            }else{
                response.status(400);
                response.send("Invalid Todo Category");
            }
            break;
        
        case hasCategoryAndPriorityProperty(request.query):
            if (category==="WORK" || category==="HOME" || category==="LEARNING") {
              if (priority==="HIGH" || priority==="MEDIUM" || priority==="LOW"){
                getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' AND 
                priority='${priority}';`;
                data = await db.all (getTodoQuery);
                response.send(data.map((eachQuery) => responseObject(eachQuery)));
            }else{
                response.status(400);
                  response.send("Invalid Todo Priority");
            }
            }else{
                response.status(400);
                response.send("Invalid Todo Category");
            }
            break;

        case hasSearchQueryProperty(request.query):
             getTodoQuery = `SELECT * FROM todo WHERE todo LIKE  '%${search_q}%';`;
             data = await db.all(getTodoQuery);
             response.send(data.map((eachQuery) => responseObject(eachQuery)));
             default:
        
        getTodoQuery = `SELECT * FROM todo;`;
             data = await db.all(getTodoQuery);
             response.send(data.map((eachQuery) => responseObject(eachQuery)));
    };
});

app.get("/todos/:todoId/", async (request, response) => {
    const {todoId} = request.params;
    const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
    const data = await db.get(getTodoQuery);
    response.send(responseObject(data));
});

app.get("/agenda/", async (request, response) => {
    const {date} = request.query;
    console.log(isMatch(date, "yyyy-MM-dd"))
    if (isMatch(date, "yyyy-MM-dd")) {
        const newDate = format(new Date(date), "yyyy-MM-dd");
        //console.log(newDate);
        const getTodoQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
        const responseState = await db.get(getTodoQuery)
        response.send(responseState.map((eachQuery) => responseObject(eachQuery)))

    }else{
        response.status(400);
        response.send("Invalid Due Date")
    }
});

app.post("/todos/", async (request, response) => {
    const {id, todo, priority, status, category, dueDate} = request.body;
    if (priority==="HIGH" || priority==="MEDIUM" || priority==="LOW"){
        if (status==="TO DO" || status==="IN PROGRESS" || status==="DONE") {
            if (category==="WORK" || category==="HOME" || category==="LEARNING") {
                if (isMatch(dueDate, "yyyy-MM-dd")) {
                    const postDate = format(new Date(dueDate), "yyyy-MM-dd");
                    const postTodoQuery = `
    INSERT INTO todo 
    (id, todo, priority, status, category, due_date)
    VALUES (${id}, '${todo}', '${priority}', '${status}', '${category}', '${postDate}');`;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
              
            }else{
               response.status(400);
               response.send("Invalid Due Date");
            }
            }else{
          response.status(400);
          response.send("Invalid Todo Category");
        }
        }else{
          response.status(400);
          response.send("Invalid Todo Status");
        }
    }else{
          response.status(400);
          response.send("Invalid Todo Priority");
    }
    
});

app.put("/todos/:todoId/", async (request, response) => {
    const {todoId} = request.params;
    let updateTodo = "";
    const todoItems = `SELECT * FROM todo WHERE id = ${todoId};`;
    const {
        todo = todoItems.todo,
        priority = todoItems.priority,
        status = todoItems.status,
        category = todoItems.category,
        dueDate = todoItems.dueDate
    } = request.body;
    const requestData = request.body;
    let updateTodoQuery;
    switch(true) {
        case requestData.status!==undefined:
            if (status==="TO DO" || status==="IN PROGRESS" || status==="DONE"){
                updateTodoQuery = `
                UPDATE todo SET
                todo = '${todo}', priority = '${priority}', status='${status}',
                 category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`;

                 await db.run(updateTodoQuery);
                 response.send("Status Updated")
            } else{
                response.status(400);
                response.send("Invalid Todo Status")
            }
            break;
        
        case requestData.priority !== undefined:
         
            if (priority==="HIGH" || priority==="MEDIUM" || priority==="LOW"){
                updateTodoQuery = `
                UPDATE todo SET
                todo = '${todo}', priority = '${priority}', status='${status}',
                 category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`;

                 await db.run(updateTodoQuery);
                 response.send("Priority Updated")
            } else{
                response.status(400);
                response.send("Invalid Todo Priority")
            }
            break;   
        
        case requestData.todo !== undefined:
         
            
                updateTodoQuery = `
                UPDATE todo SET
                todo = '${todo}', priority = '${priority}', status='${status}',
                 category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`;

                 await db.run(updateTodoQuery);
                 response.send("Todo Updated");
           
            break;   

         case requestData.category !== undefined:
         
            if (category==="WORK" || category==="HOME" || category==="LEARNING"){
                updateTodoQuery = `
                UPDATE todo SET
                todo = '${todo}', priority = '${priority}', status='${status}',
                 category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`;

                 await db.run(updateTodoQuery);
                 response.send("Category Updated")
            } else{
                response.status(400);
                response.send("Invalid Todo Category")
            }
            break; 
            
        case requestData.dueDate !== undefined:
         
            if (isMatch(dueDate, "yyyy-MM-dd")){
                const newDate = format(new Date(dueDate), "yyyy-MM-dd");
                updateTodoQuery = `
                UPDATE todo SET
                todo = '${todo}', priority = '${priority}', status='${status}',
                 category = '${category}', due_date = '${newDate}' WHERE id = ${todoId};`;

                 await db.run(updateTodoQuery);
                 response.send("Due Date Updated")
            } else{
                response.status(400);
                response.send("Invalid Due Date")
            }
            break; 
    }

});

app.delete("/todos/:todoId/", async (request, response) => {
    const {todoId} = request.params;
    const deleteTodoQuery = `
    DELETE FROM todo WHERE id = ${todoId};`;
    await db.run(deleteTodoQuery);
    response.send("Todo Deleted");
});

module.exports = app;
