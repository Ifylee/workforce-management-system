const inquirer = require('inquirer');
const {Pool} = require('pg');


const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: 'Yeshuaice!!2',
    database: 'employee_db',
    port: 5432
});

pool.on('connect', () => {
    console.log("Connected to the database");
});

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
        type: 'list',
        name: 'departmentId',
        message: 'Which department would you like to view their employees?',
        choices: departmentChoices
    }]).then(({departmentId}) => {
        sqlQuery = `SELECT employee.id, employee.first_name,
        employee.last_name, role.title
        FROM employee JOIN role on employee.role_id = role.id
        JOIN department on role.department_id = department.id
        WHERE department.id = $1;`
        pool.query(sqlQuery, [departmentId], (err, results) => {
            console.log("\n");
                 console.table(results.rows)
                 loadMainMenu();  
            });

        });


    });

}

function viewEmployeesByManager() {
    let sqlQuery = `SELECT * FROM employee`; 
    pool.query( sqlQuery, (err, results) => {
        if(err) {
            console.log(err);
       }

       const managerChoices = results.rows.map(({id, first_name, last_name}) => ({
            name: `${first_name} ${last_name}`,
            value: id,
       }));

       inquirer.prompt([{
            type: 'list',
            message: 'Which employee do you want to see direct report for?',
            choices: managerChoices,
       }])
       .then(({managerId}) => {
        sqlQuery = `SELECT employee.id, employee.first_name,
        employee.last_name, department.name AS department,
        role.title FROM employee
        JOIN role on employee.role_id = role.id
        JOIN department on role.department_id = department.id
        WHERE employee.manager_id = $1;`;

        pool.query(sqlQuery, [managerId], (err, results) => {
                console.log("\n");
                if(results.rows.length === 0) {
                console.log("This employee has no direct report");
                
                } else {
                    console.table(results.rows);
                }
            
                loadMainMenu();  
            });
        });
    });
}


function addEmployee() {
    inquirer.prompt([
        {
            name: "first_name",
            message: "Enter the employee's first name"
        },
        {
            name: "last_name",
            message: "Enter the employee's last name"
        }
    ]).then(({ first_name, last_name }) => {
        pool.query("SELECT * FROM role", (err, results) => {
            if (err) {
                console.log(err);
                return;
            }

            let roleChoices = results.rows.map(({ id, title }) => ({
                name: title,
                value: id
            }));

            pool.query("SELECT * FROM employee", (err, results) => {
                if (err) {
                    console.log(err);
                    return;
                }

                let managerChoices = results.rows.map(({ id, first_name, last_name }) => ({
                    name: `${first_name} ${last_name}`,
                    value: id
                }));

                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'role_id',
                        message: "What is the employee's role?",
                        choices: roleChoices
                    },
                    {
                        type: "list",
                        name: "managerId",
                        message: "Who is the employee's manager?",
                        choices: managerChoices
                    }
                ]).then(({ role_id, managerId }) => {
                    let sqlQuery = `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)`;
                    pool.query(sqlQuery, [first_name, last_name, role_id, managerId], (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(`Adding employee: ${first_name} ${last_name}...`);
                        }
                        loadMainMenu();
                    });
                });
            });
        });
    });
}

function updateEmployeeManager() {
    pool.query("SELECT * FROM employee", (err, results) => {
        const employeeChoices = results.rows.map(({id, first_name, last_name}) => ({
            name: `${first_name} ${last_name}`,
            value: id,
        }));

        inquirer.prompt([
            {
                type: "list",
                name: "employeeId",
                message: "Which employee's manager would you like to update?",
                choices: employeeChoices,

            }
        ]).then(({ employeeId}) => {
            pool.query("SELECT employee.id, employee.first_name, employee.last_name FROM employee WHERE employee.id != $1", [employeeId], (err, results) => {
                const managerChoices = results.rows.map(({id, first_name, last_name}) => ({
                    name: `${first_name} ${last_name}`,
                    value: id,
                }));

                inquirer.prompt([
                    {
                        type: "list",
                        name: "managerId",
                        message: "Who is the employee's new manager?",
                        choices: managerChoices, 
                    }
                ]).then(({ managerId }) => {
                    let sqlQuery = `UPDATE employee SET manager_id = $1 WHERE ID = $2`;
                    pool.query(sqlQuery, [managerId, employeeId],  (err, results) => {
                        console.log("\n");
                        console.log("Employee manager updated");
                        loadMainMenu(); 
                    });
                }); 
            });
        })

    });
}

function addDepartment() {

}

function removeDepartment() {

}

function viewUtilizedBudgetByDpartment() {

}

function viewRoles() {

}

function addRole() {

}

function removeRole() {

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
            {
                name: "View All Employees By manager",
                value:"VIEW_EMPLOYEES_BY_MANAGER"   

            },
            {
                name: "Add Employee",
                value: "ADD_EMPLOYEE",
            },
            {
                name: "Remove Employee",
                value: "REMOVE_EMPLOYEE",
            },
            {
                 name: "Update Employee Role",
                value: "UPDATE_EMPLOYEE_ROLE",
            },
            {
                
                name: "Update Employee Manager",
                value: "UPDATE_EMPLOYEE_MANAGER",
            },
            {
                name: "Quit",
                value: "QUIT"
            }
        ]
    }]).then((answers) => {
        let { choice } = answers;

        if(choice === "VIEW_EMPLOYEES") {
            viewEmployees()
        } else if(choice === "VIEW_EMPLOYEES_BY_DEPARTMENT") {
            viewEmployeesByDepartment()
        } else if(choice === "VIEW_EMPLOYEES_BY_MANAGER") {
            viewEmployeesByManager();
        } else if(choice === "ADD_EMPLOYEE") {
            addEmployee();
        } else if (choice === "REMOVE_EMPLOYEE") {
            removeEmployee();
        } else if (choice === "UPDATE_EMPLOYEE_ROLE") {
            updateEmployeeRole();
        } else if (choice === "UPDATE_EMPLOYEE_MANAGER") {
            updateEmployeeManager();
        } else {
            quit();
        }   
    });  
}



function init() {
    console.log("Welcome to Workforce Management System");
    loadMainMenu();
}

init();