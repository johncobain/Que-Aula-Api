const list = (req, res) => {
  const classes = require("../data/classes.json");
  return res.status(200).json(classes);
};

const get = (req, res) => {
  const { className } = req.params;
  const classes = require("../data/classes.json");
  const classData = classes.find(
    (c) => c.name?.toLowerCase() === className.toLowerCase()
  );
  return res.status(200).json(classData || { error: "Class not found" });
};

module.exports = {
  list,
  get,
};
