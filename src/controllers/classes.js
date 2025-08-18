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

module.exports = {
  list,
  get,
};
