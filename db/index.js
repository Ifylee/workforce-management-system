const inquirer = require('inquirer');
const {Pool} = require('pg');


const pool = new Pool({
    host: 'process.env.DB_HOST',
    user: 'process.env.DB_USER',
    password: 'process.env.DB_PASSWORD',
    database: 'process.env.DB_NAME',
    port:'process.env.DB_PORT'
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
            FROM employee 
            JOIN role on employee.role_id = role.id
            JOIN department on role.department_id = department.id
            LEFT JOIN employee AS manager ON employee.manager_id = manager.id;`;
    pool.query(sqlQuery, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log("\n");
        console.table(results.rows)
        loadMainMenu();
    });
}

function viewEmployeesByDepartment() {
    const sqlQuery = `SELECT * FROM department`; 
    pool.query( sqlQuery, (err, results) => {
       if(err) {
            console.log(err);
       }

       const departmentChoices = results.rows.map(department => ({
            name: department.name,
            value: department.id
       }));
  
    inquirer.prompt([{
        type: 'list',
        name: 'departmentId',
        message: 'Which department would you like to view their employees?',
        choices: departmentChoices
    }]).then(({departmentId}) => {
        sqlQuery = `SELECT employee.id, employee.first_name,
                employee.last_name, role.title
                FROM employee 
                JOIN role ON employee.role_id = role.id
                JOIN department on role.department_id = department.id
                WHERE department.id = $1;`
        pool.query(sqlQuery, [departmentId], (err, results) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log("\n");
            console.table(results.rows)
            loadMainMenu();  
           });

        });


    });

}

function viewEmployeesByManager() {
    const sqlQuery = `SELECT * FROM employee`; 
    pool.query( sqlQuery, (err, results) => {
        if(err) {
            console.log(err);
       }

       const managerChoices = results.rows.map(({id, first_name, last_name}) => ({
            name: `${first_name} ${last_name}`,
            value: id
       }));

       inquirer.prompt([{
            type: 'list',
            message: 'Which employee do you want to see direct report for?',
            choices: managerChoices,
       }])
       .then(({managerId}) => {
            const sqlQuery = `SELECT employee.id, employee.first_name,
                employee.last_name, department.name AS department,
                role.title FROM employee
                JOIN role on employee.role_id = role.id
                JOIN department on role.department_id = department.id
                WHERE employee.manager_id = $1;`;
        pool.query(sqlQuery, [managerId], (err, results) => {
            if (err) {
                console.log(err);
                return;
            }
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
                    const sqlQuery = `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)`;
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
        if (err) {
            console.log(err);
            return;
        }
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
                if (err) {
                    console.log(err);
                    return;
                }
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
                    let sqlQuery = `UPDATE employee SET manager_id = $1 WHERE id = $2`;
                    pool.query(sqlQuery, [managerId, employeeId],  (err) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
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
    inquirer.prompt([
        {
            name: "name",
            message: "Enter the name of the new department"
        }
    ]).then(({ name }) => {
        const sqlQuery = `INSERT INTO department (name) VALUES ($1)`;
        pool.query(sqlQuery, [name], (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log(`Added department: ${name}`);
            }
            loadMainMenu();
        });
    });

}

function removeDepartment() {
    pool.query("SELECT * FROM department", (err, results) => {
        if (err) {
            console.log(err);
            return;
        }

        const departmentChoices = results.rows.map(({ id, name }) => ({
            name: name,
            value: id
        }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Which department would you like to remove?',
                choices: departmentChoices
            }
        ]).then(({ departmentId }) => {
            const sqlQuery = `DELETE FROM department WHERE id = $1`;
            pool.query(sqlQuery, [departmentId], (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(`Department removed`);
                }
                loadMainMenu();
            });
        });
    });

}

function viewUtilizedBudgetByDpartment() {
    const sqlQuery = `SELECT department.name AS department, 
            SUM(role.salary) AS utilized_budget
            FROM employee 
            JOIN role ON employee.role_id = role.id
            JOIN department ON role.department_id = department.id
            GROUP BY department.name;`;
    pool.query(sqlQuery, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log("\n");
        console.table(results.rows);
        loadMainMenu();
    });

}

function viewRoles() {
    const sqlQuery = `SELECT role.id, role.title, department.name AS department, role.salary
                      FROM role
                      JOIN department ON role.department_id = department.id;`;
    pool.query(sqlQuery, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log("\n");
        console.table(results.rows);
        loadMainMenu();
    });
}

function addRole() {
     // Query to get all departments
     pool.query("SELECT * FROM department", (err, results) => {
        if (err) {
            console.log(err);
            return;
        }

        // Prepare department choices for user input
        const departmentChoices = results.rows.map(({ id, name }) => ({
            name: name,
            value: id
        }));

        // Prompt user for role details
        inquirer.prompt([
            {
                name: 'title',
                message: 'Enter the title of the role'
            },
            {
                name: 'salary',
                message: 'Enter the salary for this role'
            },
            {
                type: 'list',
                name: 'department_id',
                message: 'Select the department for this role',
                choices: departmentChoices
            }
        ]).then(({ title, salary, department_id }) => {
            //This query is to insert new role
            const sqlQuery = `INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)`;
            pool.query(sqlQuery, [title, salary, department_id], (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(`Role added: ${title}`);
                }
                loadMainMenu();
            });
        });
    });
}

function removeRole() {
     // This is a query to get all roles
     pool.query("SELECT * FROM role", (err, results) => {
        if (err) {
            console.log(err);
            return;
        }

        // This prepares role choices for user input
        const roleChoices = results.rows.map(({ id, title }) => ({
            name: title,
            value: id
        }));

        // This Prompts user to select a role to remove
        inquirer.prompt([
            {
                type: 'list',
                name: 'roleId',
                message: 'Which role would you like to remove?',
                choices: roleChoices
            }
        ]).then(({ roleId }) => {
            //This query deletes the selected role
            const sqlQuery = `DELETE FROM role WHERE id = $1`;
            pool.query(sqlQuery, [roleId], (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(`Role removed`);
                }
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
        const { choice } = answers;
        
        
        switch (choice) {
            case "VIEW_EMPLOYEES":
                viewEmployees();
                break;
            case "VIEW_EMPLOYEES_BY_DEPARTMENT":
                viewEmployeesByDepartment();
                break;
            case "VIEW_EMPLOYEES_BY_MANAGER":
                viewEmployeesByManager();
                break;
            case "ADD_EMPLOYEE":
                addEmployee();
                break;
            case "REMOVE_EMPLOYEE":
                removeEmployee();
                break;
            case "UPDATE_EMPLOYEE_ROLE":
                updateEmployeeRole();
                break;
            case "UPDATE_EMPLOYEE_MANAGER":
                updateEmployeeManager();
                break;
            case "QUIT":
                quit();
                break;
            default:
        }   
    });  
}


function init() {
    console.log("Welcome to Workforce Management System");
    loadMainMenu();
}

init();