const list = (req, res) => {
  const flowchart = require("../data/flowchart.json");
  return res.status(200).json(flowchart);
};

const get = (req, res) => {
  const { classFlowchartName } = req.params;
  const flowchart = require("../data/flowchart.json");

  for (const semester of flowchart) {
    const foundClass = semester.find(
      (c) => c.name?.toLowerCase() === classFlowchartName.toLowerCase()
    );
    if (foundClass) {
      return res.status(200).json(foundClass);
    }
  }

  return res.status(404).json({ error: "Class not found" });
};

module.exports = {
  list,
  get,
};
