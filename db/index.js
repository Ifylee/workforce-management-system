// Imports the inquirer module
const inquirer = require('inquirer');


// Imports the Pool class from the pg module
const { Pool } = require('pg');

// Creates a new Pool instance to handle connections to the database
const pool = new Pool({
    user: "postgres",
    password: "Yeshuaice!!2",
    database: "employee_db",
    host: "localhost",
    port: 5432
});

// Event listener for when the pool connects successfully to the database
pool.on('connect', () => {
    console.log("Connected to the database");
});

// Function to exit the application
function quit() {
    console.log("Goodbye!");
    pool.end(() => {
        process.exit();
    });
} 

// Function to view all employees with their details
function viewEmployees() {
    const sqlQuery = `SELECT employee.id, employee.first_name,
            employee.last_name, role.title, department.name AS department,
            role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
            FROM employee 
            JOIN role ON employee.role_id = role.id
            JOIN department ON role.department_id = department.id
            LEFT JOIN employee AS manager ON employee.manager_id = manager.id;`;
    
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

// Function to view all departments
function viewDepartments() {
    const sqlQuery = `SELECT * FROM department`;

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

// Function to view all roles
function viewAllRoles() {
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

// Function to view employees by department
function viewEmployeesByDepartment() {
    const sqlQuery = `SELECT * FROM department`; 

    pool.query(sqlQuery, (err, results) => {
        if (err) {
            console.log(err);
            return;
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
        }]).then(({ departmentId }) => {
            const sqlQuery = `SELECT employee.id, employee.first_name,
                    employee.last_name, role.title
                    FROM employee 
                    JOIN role ON employee.role_id = role.id
                    JOIN department ON role.department_id = department.id
                    WHERE department.id = $1;`;
            
            pool.query(sqlQuery, [departmentId], (err, results) => {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log("\n");
                console.table(results.rows);
                loadMainMenu();  
            });
        });
    });
}

// Function for viewing employees by manager
function viewEmployeesByManager() {
    const sqlQuery = `SELECT * FROM employee`;
    
    pool.query(sqlQuery, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }

        const managerChoices = results.rows.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`,
            value: id
        }));

        inquirer.prompt([{
            type: 'list',
            message: 'Which employee do you want to see direct report for?',
            choices: managerChoices,
            name: 'managerId'
        }])
        .then(({ managerId }) => {
            const sqlQuery = `SELECT employee.id, employee.first_name,
                employee.last_name, department.name AS department,
                role.title FROM employee
                JOIN role ON employee.role_id = role.id
                JOIN department ON role.department_id = department.id
                WHERE employee.manager_id = $1;`;

            pool.query(sqlQuery, [managerId], (err, results) => {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log("\n");
                if (results.rows.length === 0) {
                    console.log("This employee has no direct report");
                } else {
                    console.table(results.rows);
                }
                loadMainMenu();  
            });
        });
    });
}

// Function to add an employee
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

            const roleChoices = results.rows.map(({ id, title }) => ({
                name: title,
                value: id
            }));

            pool.query("SELECT * FROM employee", (err, results) => {
                if (err) {
                    console.log(err);
                    return;
                }

                const managerChoices = results.rows.map(({ id, first_name, last_name }) => ({
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
                            console.log(`Added employee: ${first_name} ${last_name}.`);
                        }
                        loadMainMenu();
                    });
                });
            });
        });
    });
}

// Function to update employee's role
function updateEmployeeRole() {
    // Query to get all employees
    pool.query("SELECT * FROM employee", (err, results) => {
        if (err) {
            console.log(err);
            return;
        }

        // Create an array of employee choices for the prompt
        const employeeChoices = results.rows.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`,
            value: id
        }));

        // Prompt to select the employee whose role you want to update
        inquirer.prompt([
            {
                type: "list",
                name: "employeeId",
                message: "Which employee's role would you like to update?",
                choices: employeeChoices
            }
        ]).then(({ employeeId }) => {
            // Query to get all roles
            pool.query("SELECT id, title FROM role", (err, results) => {
                if (err) {
                    console.log(err);
                    return;
                }

                // Create an array of role choices for the prompt
                const roleChoices = results.rows.map(({ id, title }) => ({
                    name: title,
                    value: id
                }));

                // Prompt to select the new role for the employee
                inquirer.prompt([
                    {
                        type: "list",
                        name: "roleId",
                        message: "What is the employee's new role?",
                        choices: roleChoices
                    }
                ]).then(({ roleId }) => {
                    const sqlQuery = `UPDATE employee SET role_id = $1 WHERE id = $2`;

                    // Execute the update query
                    pool.query(sqlQuery, [roleId, employeeId], (err) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        console.log("\n");
                        console.log("Employee role updated successfully");
                        loadMainMenu(); // Call the main menu function or next step in your app
                    });
                });
            });
        });
    });
}


// Function to update employee's manager
function updateEmployeeManager() {
    pool.query("SELECT * FROM employee", (err, results) => {
        if (err) {
            console.log(err);
            return;
        }

        const employeeChoices = results.rows.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`,
            value: id
        }));

        inquirer.prompt([
            {
                type: "list",
                name: "employeeId",
                message: "Which employee's manager would you like to update?",
                choices: employeeChoices
            }
        ]).then(({ employeeId }) => {
            pool.query("SELECT id, first_name, last_name FROM employee WHERE id != $1", [employeeId], (err, results) => {
                if (err) {
                    console.log(err);
                    return;
                }

                const managerChoices = results.rows.map(({ id, first_name, last_name }) => ({
                    name: `${first_name} ${last_name}`,
                    value: id
                }));

                inquirer.prompt([
                    {
                        type: "list",
                        name: "managerId",
                        message: "Who is the employee's new manager?",
                        choices: managerChoices
                    }
                ]).then(({ managerId }) => {
                    const sqlQuery = `UPDATE employee SET manager_id = $1 WHERE id = $2`;

                    pool.query(sqlQuery, [managerId, employeeId], (err) => {
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
        });
    });
}

// Function to add a new department
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

// Function to delete a department
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
                    return;
                }
                console.log("\n");
                console.log("Department removed");
                loadMainMenu();
            });
        });
    });
}

// Function to add a new role
function addRole() {
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
                name: "title",
                message: "Enter the title of the new role"
            },
            {
                name: "salary",
                message: "Enter the salary of the new role"
            },
            {
                type: 'list',
                name: 'department_id',
                message: "Which department does the role belong to?",
                choices: departmentChoices
            }
        ]).then(({ title, salary, department_id }) => {
            const sqlQuery = `INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)`;

            pool.query(sqlQuery, [title, salary, department_id], (err) => {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log(`Added role: ${title}`);
                loadMainMenu();
            });
        });
    });
}

// Function to delete a role
function removeRole() {
    pool.query("SELECT * FROM role", (err, results) => {
        if (err) {
            console.log(err);
            return;
        }

        const roleChoices = results.rows.map(({ id, title }) => ({
            name: title,
            value: id
        }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'roleId',
                message: 'Which role would you like to remove?',
                choices: roleChoices
            }
        ]).then(({ roleId }) => {
            const sqlQuery = `DELETE FROM role WHERE id = $1`;

            pool.query(sqlQuery, [roleId], (err) => {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log("\n");
                console.log("Role removed");
                loadMainMenu();
            });
        });
    });
}

// Main menu function for interacting with the user
function loadMainMenu() {
    inquirer.prompt([
        {
            type: "list",
            name: "action",
            message: "What would you like to do?",
            choices: [
                { name: "View all employees", value: "viewEmployees" },
                { name: "View all departments", value: "viewDepartments" },
                { name: "View employees by department", value: "viewEmployeesByDepartment" },
                { name: "View employees by manager", value: "viewEmployeesByManager" },
                { name: "View all roles", value: "viewAllRoles" },
                { name: "Add employee", value: "addEmployee" },
                { name: "Update employee manager", value: "updateEmployeeManager" },
                { name: "Update employee role", value: "updateEmployeeRole" },
                { name: "Add department", value: "addDepartment" },
                { name: "Remove department", value: "removeDepartment" },
                { name: "Add role", value: "addRole" },
                { name: "Remove role", value: "removeRole" },
                { name: "Quit", value: "quit" }
            ]
        }
    ]).then(({ action }) => {
        switch (action) {
            case "viewEmployees":
                viewEmployees();
                break;
            case "viewDepartments": 
                viewDepartments();
                break;
            case "viewEmployeesByDepartment":
                viewEmployeesByDepartment();
                break;
            case "viewEmployeesByManager":
                viewEmployeesByManager();
                break;
            case "viewAllRoles": 
                viewAllRoles();
                break;
            case "addEmployee":
                addEmployee();
                break;
            case "updateEmployeeManager":
                updateEmployeeManager();
                break;
            case "addDepartment":
                addDepartment();
                break;
            case "removeDepartment":
                removeDepartment();
                break;
            case "addRole":
                addRole();
                break;
            case "updateEmployeeRole":
                updateEmployeeRole();
                break;
            case "removeRole":
                removeRole();
                break;
            case "quit":
                quit();
                break;
        }
    });
}

// function to initialize the application
function init() {
    
    console.log("Welcome to Workforce Management System");
    // Load the main menu to present options to the user
    loadMainMenu();
}

// Call the init function to start the application
init();