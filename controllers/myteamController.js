const { getEmployeeById, getManagerById, getEmployeesByManager } = require("../models/myteamModel");

const getEmployeeDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch employee details
    const employee = await getEmployeeById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Fetch manager details
    const manager = await getManagerById(employee.managerId);

    // Fetch all employees assigned to the manager
    const assignedEmployees = await getEmployeesByManager(employee.managerId);

    res.json({ employee, manager, assignedEmployees });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { getEmployeeDetails };