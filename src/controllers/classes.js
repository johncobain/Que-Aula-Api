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

const update = async (req, res) => {
  try {
    const { className } = req.params;

    if (!className) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Class name is required",
      });
    }

    const updateData = req.body;
    const allowedFields = [
      "description",
      "semester",
      "multiClass",
      "greve",
      "classes",
      "classList",
    ];
    const providedFields = Object.keys(updateData).filter((field) =>
      allowedFields.includes(field)
    );

    if (providedFields.length === 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "At least one field must be provided for update",
        allowedFields: allowedFields,
      });
    }

    const existingSubject = await Subject.findByCode(className);
    if (!existingSubject || existingSubject.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: `Subject '${className}' not found`,
      });
    }

    const results = await Subject.update(className, updateData);

    if (results.errors.length > 0) {
      return res.status(400).json({
        error: "Update Failed",
        message: "Failed to update subject",
        errors: results.errors,
      });
    }

    const updatedSubjectData = await Subject.findByCode(className);
    const transformedSubject =
      ClassTransformer.transformSingleSubject(updatedSubjectData);

    return res.status(200).json({
      message: "Subject updated successfully",
      subject: transformedSubject,
      updated: results.updated,
    });
  } catch (error) {
    console.error("Error updating subject:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update subject",
      details: error.message,
    });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { className } = req.params;

    if (!className) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Class name is required",
      });
    }

    const classData = await Subject.findByCode(className);
    if (!classData || classData.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: `Subject '${className}' not found`,
      });
    }

    await Subject.delete(className);

    return res.status(200).json({
      message: `Subject '${className}' deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete subject",
      details: error.message,
    });
  }
};

module.exports = {
  list,
  get,
  create,
  update,
  delete: deleteClass,
};
