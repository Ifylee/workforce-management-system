SELECT employee.id, employee.first_name,
employee.last_name, role.title, department.name AS department,
role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
FROM employee JOIN role on employee.role_id = role.id
JOIN department on role.department_id = department.id
JOIN employee manager on employee.manager_id = manager.id;


SELECT employee.id, employee.first_name,
employee.last_name, role.title
FROM employee JOIN role on employee.role_id = role.id
JOIN department on role.department_id = department.id
WHERE department.id = 1;


SELECT employee.id, employee.first_name,
employee.last_name, department.name AS department,
role.title FROM employee
JOIN role on employee.role_id = role.id
JOIN department on role.department_id = department.id
WHEREemployee.manager_id = 1;