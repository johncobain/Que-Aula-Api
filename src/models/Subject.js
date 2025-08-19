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

  static async createClasses(classesData) {
    let client;
    const results = {
      created: [],
      skipped: [],
      errors: [],
    };

    try {
      client = await database.getNewClient();
      await client.query("BEGIN");

      const teachersMap = new Map();
      const classroomsMap = new Map();
      const existingSubjects = new Set();

      const existingSubjectsResult = await client.query(
        "SELECT code FROM subjects"
      );
      existingSubjectsResult.rows.forEach((row) => {
        existingSubjects.add(row.code.toLowerCase());
      });

      for (const classData of classesData) {
        try {
          if (existingSubjects.has(classData.name.toLowerCase())) {
            results.skipped.push({
              name: classData.name,
              reason: "Subject already exists",
            });
            continue;
          }

          if (
            !classData.name ||
            !classData.description ||
            !classData.semester
          ) {
            results.errors.push({
              name: classData.name || "Unknown",
              reason: "Missing required fields (name, description, semester)",
            });
            continue;
          }

          const subjectResult = await client.query(
            `
            INSERT INTO subjects (code, name, semester, multi_class, on_strike)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `,
            [
              classData.name,
              classData.description,
              classData.semester,
              classData.multiClass || false,
              classData.greve || false,
            ]
          );

          const subjectId = subjectResult.rows[0].id;
          const classGroupsMap = new Map();

          if (classData.multiClass && classData.classList) {
            for (const groupCode of classData.classList) {
              const groupResult = await client.query(
                `
                INSERT INTO class_groups (subject_id, group_code)
                VALUES ($1, $2)
                RETURNING id
              `,
                [subjectId, groupCode]
              );

              classGroupsMap.set(groupCode, groupResult.rows[0].id);
            }
          } else {
            const groupResult = await client.query(
              `
              INSERT INTO class_groups (subject_id, group_code)
              VALUES ($1, $2)
              RETURNING id
            `,
              [subjectId, "DEFAULT"]
            );

            classGroupsMap.set("DEFAULT", groupResult.rows[0].id);
          }

          if (classData.classes && classData.classes.length > 0) {
            for (const schedule of classData.classes) {
              if (!teachersMap.has(schedule.teacher)) {
                const existingTeacher = await client.query(
                  `
                  SELECT id FROM teachers WHERE name = $1
                `,
                  [schedule.teacher]
                );

                if (existingTeacher.rows.length > 0) {
                  teachersMap.set(schedule.teacher, existingTeacher.rows[0].id);
                } else {
                  const teacherResult = await client.query(
                    `
                    INSERT INTO teachers (name)
                    VALUES ($1)
                    RETURNING id
                  `,
                    [schedule.teacher]
                  );

                  teachersMap.set(schedule.teacher, teacherResult.rows[0].id);
                }
              }

              if (!classroomsMap.has(schedule.classroom)) {
                const existingClassroom = await client.query(
                  `
                  SELECT id FROM classrooms WHERE name = $1
                `,
                  [schedule.classroom]
                );

                if (existingClassroom.rows.length > 0) {
                  classroomsMap.set(
                    schedule.classroom,
                    existingClassroom.rows[0].id
                  );
                } else {
                  const classroomResult = await client.query(
                    `
                    INSERT INTO classrooms (name)
                    VALUES ($1)
                    RETURNING id
                  `,
                    [schedule.classroom]
                  );

                  classroomsMap.set(
                    schedule.classroom,
                    classroomResult.rows[0].id
                  );
                }
              }

              const groupCode = schedule.whichClass || "DEFAULT";
              const classGroupId = classGroupsMap.get(groupCode);

              if (!classGroupId) {
                results.errors.push({
                  name: classData.name,
                  reason: `Class group '${groupCode}' not found for schedule`,
                });
                continue;
              }

              const teacherId = teachersMap.get(schedule.teacher);
              const classroomId = classroomsMap.get(schedule.classroom);

              const startPeriod = parseInt(schedule.period[0]);
              const endPeriod = parseInt(
                schedule.period[schedule.period.length - 1]
              );

              await client.query(
                `
                INSERT INTO class_schedules (
                  subject_id, class_group_id, teacher_id, classroom_id,
                  week_day, start_period, end_period
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
              `,
                [
                  subjectId,
                  classGroupId,
                  teacherId,
                  classroomId,
                  parseInt(schedule.weekDay),
                  startPeriod,
                  endPeriod,
                ]
              );
            }
          }

          results.created.push({
            name: classData.name,
            description: classData.description,
            semester: classData.semester,
            schedules: classData.classes ? classData.classes.length : 0,
          });

          existingSubjects.add(classData.name.toLowerCase());
        } catch (error) {
          results.errors.push({
            name: classData.name || "Unknown",
            reason: error.message,
          });
        }
      }

      await client.query("COMMIT");
      return results;
    } catch (error) {
      if (client) {
        await client.query("ROLLBACK");
      }
      throw error;
    } finally {
      if (client) {
        await client.end();
      }
    }
  }

  static async delete(code) {
    const client = await database.getNewClient();
    await client.query("DELETE FROM subjects WHERE code = $1", [code]);
    await client.query(
      "DELETE FROM class_groups WHERE subject_id IN (SELECT id FROM subjects WHERE code = $1)",
      [code]
    );
    await client.query(
      "DELETE FROM class_schedules WHERE subject_id IN (SELECT id FROM subjects WHERE code = $1)",
      [code]
    );
    await client.query("DELETE FROM subjects WHERE code = $1", [code]);
  }
}

module.exports = Subject;
