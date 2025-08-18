const database = require("../../infra/database");

class Subject {
  static async findAll() {
    const query = `
      SELECT 
        s.*,
        cg.id as class_group_id,
        cg.group_code,
        cs.week_day,
        cs.start_period,
        cs.end_period,
        t.name as teacher_name,
        cl.name as classroom_name
      FROM subjects s
      LEFT JOIN class_groups cg ON s.id = cg.subject_id
      LEFT JOIN class_schedules cs ON cg.id = cs.class_group_id
      LEFT JOIN teachers t ON cs.teacher_id = t.id
      LEFT JOIN classrooms cl ON cs.classroom_id = cl.id
      ORDER BY s.code, cg.group_code, cs.week_day, cs.start_period
    `;

    const result = await database.query(query);
    return result.rows;
  }

  static async findByCode(code) {
    const query = `
      SELECT 
        s.*,
        cg.id as class_group_id,
        cg.group_code,
        cs.week_day,
        cs.start_period,
        cs.end_period,
        t.name as teacher_name,
        cl.name as classroom_name
      FROM subjects s
      LEFT JOIN class_groups cg ON s.id = cg.subject_id
      LEFT JOIN class_schedules cs ON cg.id = cs.class_group_id
      LEFT JOIN teachers t ON cs.teacher_id = t.id
      LEFT JOIN classrooms cl ON cs.classroom_id = cl.id
      WHERE LOWER(s.code) = LOWER($1)
      ORDER BY cg.group_code, cs.week_day, cs.start_period
    `;

    const result = await database.query({ text: query, values: [code] });
    return result.rows;
  }
}

module.exports = Subject;
