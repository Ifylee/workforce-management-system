\c employee_db

-- Insert multiple rows into the department table
INSERT INTO department (name)
VALUES ('Engineering')
, ('Legal')
, ('Finance')
, ('Sales');


-- Insert multiple rows into the role table.
-- Each row includes a role title, salary and department_id
INSERT INTO role (title, salary, department_id)
VALUES ('Software Engineer', 120000, 1)
, ('Sales Lead', 80000, 2)
, ('Accountant', 100000, 3)
, ('Salesperson', 60000, 4)
, ('Account Manager', 120000, 3)
, ('Lead Engineer', 150000, 1)
, ('lawyer', 120000, 4)
, ('Legal Team Lead', 200000, 3);


-- Insert multiple rows into the employee table. 
-- Each row includes an employee's first name, last name, role_id and manager_id
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ('Paul', 'Brown', 1, NULL)
, ('Mike', 'Doe', 2 ,1)
, ( 'Ashley', 'Dickson', 3, 1)
, ('Kevin' , 'Klein', 4 ,3)
, ('Prince', ' Lee', 5, 3)
, ('Sarah', 'Harper', 6, 1)
, ('Sandra', 'Cruise', 7, 4);
