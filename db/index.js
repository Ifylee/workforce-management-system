// Imports the inqirer module
const inquirer = require('inquirer');

// Imports the pool class from the pg module
const {Pool} = require('pg');

// This creates a new Pool instance to handle connections to the database
const pool = new Pool({
    host: 'process.env.DB_HOST',
    user: 'process.env.DB_USER',
    password: 'process.env.DB_PASSWORD',
    database: 'process.env.DB_NAME',
    port:'process.env.DB_PORT'
});

// Event listener for when the pool connects successfully to the database
pool.on('connect', () => {
    console.log("Connected to the database");
});

// function to exit the application
function quit(){
    console.log("Goodbye!");
    process.exit();
    
}

// function to view all employees with their details
function viewEmployees() {
    // Query to select employee details
    sqlQuery = `SELECT employee.id, employee.first_name,
            employee.last_name, role.title, department.name AS department,
            role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
            FROM employee 
            JOIN role on employee.role_id = role.id
            JOIN department on role.department_id = department.id
            LEFT JOIN employee AS manager ON employee.manager_id = manager.id;`;
    // Using the pool object to execute the sql query
    pool.query(sqlQuery, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }
        // print a new line for better readability
        console.log("\n");
        // display results of the query in a table format
        console.table(results.rows)
        // Reload the main menu to allow further user actions
        loadMainMenu();
    });
}

// Function to view employees by department
function viewEmployeesByDepartment() {
    // Query to select all departments
    const sqlQuery = `SELECT * FROM department`; 
    pool.query( sqlQuery, (err, results) => {
       if(err) {
            console.log(err);
       }


        // Create an array of department choices for user selection
       const departmentChoices = results.rows.map(department => ({
            name: department.name,
            value: department.id
       }));
  
     // Prompt the user to select a department
    inquirer.prompt([{
        type: 'list',
        name: 'departmentId',
        message: 'Which department would you like to view their employees?',
        choices: departmentChoices
    }]).then(({departmentId}) => {
         // Query to select employees in the chosen department
        sqlQuery = `SELECT employee.id, employee.first_name,
                employee.last_name, role.title
                FROM employee 
                JOIN role ON employee.role_id = role.id
                JOIN department on role.department_id = department.id
                WHERE department.id = $1;`
         // Execute the query to get employee data for the selected department
        pool.query(sqlQuery, [departmentId], (err, results) => {
            if (err) {
                console.log(err);
                return;
            }
            // Print a new line for better readability
            console.log("\n");
            console.table(results.rows)
            // Reload the main menu to allow further user actions
            loadMainMenu();  
           });

        });


    });

}

// function for viewing employees by manager.
function viewEmployeesByManager() {
    const sqlQuery = `SELECT * FROM employee`;
    //  Execute the SQL query
    pool.query( sqlQuery, (err, results) => {
        if(err) {
            console.log(err);
       }

         // Map results to an array of choices for inquirer prompt
       const managerChoices = results.rows.map(({id, first_name, last_name}) => ({
            name: `${first_name} ${last_name}`,
            value: id
       }));

       // Prompt user to select a manager
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

          // Execute the SQL query with the selected manager's ID as parameter
        pool.query(sqlQuery, [managerId], (err, results) => {
            if (err) {
                console.log(err);
                return;
            }
                console.log("\n");
                 // Check if the selected manager has any direct reports
                if(results.rows.length === 0) {
                console.log("This employee has no direct report");
            } else {
                // Display the results in a table format
                console.table(results.rows);
                }
            
                // Return to the main menu after displaying the results
                loadMainMenu();  
            });
        });
    });
}


function addEmployee() {
    // Prompt user for the employee's first and last name
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
        // Query the database to get the list of roles
        pool.query("SELECT * FROM role", (err, results) => {
            if (err) {
                console.log(err);
                return;
            }

            // Map the results to an array of choices for the roles prompt
            let roleChoices = results.rows.map(({ id, title }) => ({
                name: title,
                value: id
            }));

              // Query the database to get the list of employees (for managers)
            pool.query("SELECT * FROM employee", (err, results) => {
                if (err) {
                    console.log(err);
                    return;
                }

                 // Map the results to an array of choices for the managers prompt
                let managerChoices = results.rows.map(({ id, first_name, last_name }) => ({
                    name: `${first_name} ${last_name}`,
                    value: id
                }));

                // Prompt user for the employee's role and manager
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
                   // SQL query to insert the new employee into the database
                    const sqlQuery = `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)`;
                     // Execute the query with the provided data
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

// function to update empolyee's manager
function updateEmployeeManager() {
     // Query the database to get the list of employees
    pool.query("SELECT * FROM employee", (err, results) => {
        if (err) {
            console.log(err);
            return;
        }


        // Map the results to an array of choices for the employees prompt
        const employeeChoices = results.rows.map(({id, first_name, last_name}) => ({
            name: `${first_name} ${last_name}`,
            value: id,
        }));

            // Prompt user to select an employee whose manager needs to be updated
        inquirer.prompt([
            {
                type: "list",
                name: "employeeId",
                message: "Which employee's manager would you like to update?",
                choices: employeeChoices,

            }
        ]).then(({ employeeId}) => {
              // Query the database to get the list of possible new managers, excluding the selected employee
            pool.query("SELECT employee.id, employee.first_name, employee.last_name FROM employee WHERE employee.id != $1", [employeeId], (err, results) => {
                if (err) {
                    console.log(err);
                    return;
                }

                // Map the results to an array of choices for the managers prompt
                const managerChoices = results.rows.map(({id, first_name, last_name}) => ({
                    name: `${first_name} ${last_name}`,
                    value: id,
                }));

                // Prompt user to select the new manager for the employee
                inquirer.prompt([
                    {
                        type: "list",
                        name: "managerId",
                        message: "Who is the employee's new manager?",
                        choices: managerChoices, 
                    }
                ]).then(({ managerId }) => {
                     // SQL query to update the employee's manager in the database
                    let sqlQuery = `UPDATE employee SET manager_id = $1 WHERE id = $2`;
                      // Execute the SQL query with the selected manager's ID and employee's ID as parameters
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

// function to add a new department
function addDepartment() {
     // Prompt user to enter the name of the new department
    inquirer.prompt([
        {
            name: "name",
            message: "Enter the name of the new department"
        }
    ]).then(({ name }) => {
        // Query to insert the new department into the database
        const sqlQuery = `INSERT INTO department (name) VALUES ($1)`;
        // Execute the SQL query with the provided department name
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

// function to delete a department
function removeDepartment() {
    // Query the database to get the list of departments
    pool.query("SELECT * FROM department", (err, results) => {
        if (err) {
            console.log(err);
            return;
        }

        // Map the results to an array of choices for the departments prompt
        const departmentChoices = results.rows.map(({ id, name }) => ({
            name: name,
            value: id
        }));

         // Prompt user to select a department to delete.
        inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Which department would you like to remove?',
                choices: departmentChoices
            }
        ]).then(({ departmentId }) => {
            // Query to delete the selected department from the database
            const sqlQuery = `DELETE FROM department WHERE id = $1`;
             // Execute the SQL query with the selected department's ID as parameter
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

// function to calculate the total utilized budget for each department
function viewUtilizedBudgetByDpartment() {
     // Query to calculate the total utilized budget (sum of salaries) for each department
    const sqlQuery = `SELECT department.name AS department, 
            SUM(role.salary) AS utilized_budget
            FROM employee 
            JOIN role ON employee.role_id = role.id
            JOIN department ON role.department_id = department.id
            GROUP BY department.name;`;

      // Execute the SQL query
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

// function to get the list of roles
function viewRoles() {
     // SQL query for getting the list of roles with their department names and salaries
    const sqlQuery = `SELECT role.id, role.title, department.name AS department, role.salary
                FROM role
                JOIN department ON role.department_id = department.id;`;
         // Execute the SQL query
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

// function to add new roles
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

// function to load the main menu
function loadMainMenu() {
      // Prompt user with a list of options
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
        
         // Switch case to handle user's choice
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
                console.log("Invalid choice");
        }   
    });  
}

// function to initialize the application
function init() {
     // Display a welcome message to the user
    console.log("Welcome to Workforce Management System");
    // Load the main menu to present options to the user
    loadMainMenu();
}

// Call the init function to start the application
init();