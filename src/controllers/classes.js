const Subject = require("../models/Subject");
const ClassTransformer = require("../services/classTransformer");

const list = async (req, res) => {
  try {
    const dbRows = await Subject.findAll();
    const classes = ClassTransformer.transformToFrontendFormat(dbRows);
    return res.status(200).json(classes);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get = async (req, res) => {
  try {
    const { className } = req.params;
    const dbRows = await Subject.findByCode(className);
    const classData = ClassTransformer.transformSingleSubject(dbRows);

    if (!classData) {
      return res.status(404).json({ error: "Class not found" });
    }
    return res.status(200).json(classData);
  } catch (error) {
    console.error("Error fetching class:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const create = async (req, res) => {
  try {
    let classesData;

    if (Array.isArray(req.body)) {
      classesData = req.body;
    } else if (req.body.classes && Array.isArray(req.body.classes)) {
      classesData = req.body.classes;
    } else {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "Request body must be an array of classes or contain a 'classes' array property",
      });
    }

    if (classesData.length === 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Classes array cannot be empty",
      });
    }

    const results = await Subject.createClasses(classesData);

    let status = 201;
    if (results.created.length === 0 && results.errors.length > 0) {
      status = 400;
    } else if (results.created.length === 0 && results.skipped.length > 0) {
      status = 200;
    }

    return res.status(status).json({
      message: "Class creation process completed",
      summary: {
        total: classesData.length,
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      results: results,
    });
  } catch (error) {
    console.error("Error creating classes:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create classes",
      details: error.message,
    });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { className } = req.params;
    if (!className) {
      console.error("Class name is required for deletion");
      return res.status(400).json({ error: "Class name is required" });
    }

    const classData = await Subject.findByCode(className);
    if (!classData || classData.length === 0) {
      console.error(`Class ${className} not found`);
      return res.status(404).json({ error: "Class not found" });
    }

    await Subject.delete(className);
    console.log(`Class ${className} deleted successfully`);
    return res.status(204).json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  list,
  get,
  create,
  delete: deleteClass,
};
