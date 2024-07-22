const inquirer = require('inquirer');
const {Pool} = require('pg');


const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: 'Yeshuaice!!2',
    database: 'employee_db',
    port: 5432
},
    console.log("Connected to the database")
);

pool.connect();

function quit(){
    console.log("Goodbye!");
    process.exit();
    
}

function viewEmployees() {
    sqlQuery = `SELECT employee.id, employee.first_name,
            employee.last_name, role.title, department.name AS department,
            role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
            FROM employee JOIN role on employee.role_id = role.id
            JOIN department on role.department_id = department.id
            JOIN employee manager on employee.manager_id = manager.id;`;
            pool.query(sqlQuery, (err, results) => {
                console.log("\n");
                console.table(results.rows)
                loadMainMenu();
            }) 
}

function viewEmployeesByDepartment() {
    let sqlQuery = `SELECT * FROM department`; 
    pool.query( sqlQuery, (err, results) => {
       if(err) {
            console.log(err);
       }

       const departmentChoices = results.rows.map(department => ({
            name: department.name,
            value: department.id

       })) 

       
    inquirer.prompt([{
        list: 'list',
        name: 'departmentId',
        message: 'Which department would you like to view their employees?',
        choices: departmentChoices
    }]).then(({departmentId}) => {
        sqlQuery = `SELECT employee.id, employee.first_name,
        employee.last_name, role.title
        FROM employee JOIN role on employee.role_id = role.id
        JOIN department on role.department_id = department.id
        WHERE department.name = $1;`
        pool.query(sqlQuery, [departmentId], (err, results) => {
            console.log("\n");
                 console.table(results.rows)
                 loadMainMenu();  
            });

        });


    });

}

function loadMainMenu() {
    inquirer.prompt([{
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        choices: [
            {
                name:"View All Employees",
                value: "VIEW_EMPLOYEES"
            },
            {
                name: "View All Employees By Department",
                value:"VIEW_EMPLOYEES_BY_DEPARTMENT"
            },
            // ---Enter 15 total options here ---
            {

                name: "Quit",
                value: "QUIT"
            }
        ]
    }]).then((answers) => {
        let { choice } = answers;

        if(choice === "VIEW_EMPLOYEES") {
            viewEmployees()
        }
        else if(choice === "VIEW_EMPLOYEES_BY_DEPARTMENT") {
            viewEmployeesByDepartment()
        }
        else {
            quit();
        }   

    });  
}



function init() {
    console.log("Welcome to Workforce Management System");
    loadMainMenu();
}

init();