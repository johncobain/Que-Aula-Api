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

  static async update(code, updateData) {
    let client;
    const results = {
      updated: null,
      errors: [],
    };

    try {
      client = await database.getNewClient();
      await client.query("BEGIN");

      const existingSubject = await client.query(
        "SELECT id FROM subjects WHERE LOWER(code) = LOWER($1)",
        [code]
      );

      if (existingSubject.rows.length === 0) {
        results.errors.push({
          name: code,
          reason: "Subject not found",
        });
        return results;
      }

      const subjectId = existingSubject.rows[0].id;

      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (updateData.description !== undefined) {
        updateFields.push(`name = $${paramCount}`);
        updateValues.push(updateData.description);
        paramCount++;
      }

      if (updateData.semester !== undefined) {
        updateFields.push(`semester = $${paramCount}`);
        updateValues.push(updateData.semester);
        paramCount++;
      }

      if (updateData.multiClass !== undefined) {
        updateFields.push(`multi_class = $${paramCount}`);
        updateValues.push(updateData.multiClass);
        paramCount++;
      }

      if (updateData.greve !== undefined) {
        updateFields.push(`on_strike = $${paramCount}`);
        updateValues.push(updateData.greve);
        paramCount++;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (updateFields.length > 1) {
        updateValues.push(code);
        const updateQuery = `
          UPDATE subjects 
          SET ${updateFields.join(", ")} 
          WHERE LOWER(code) = LOWER($${paramCount})
        `;

        await client.query(updateQuery, updateValues);
      }

      if (updateData.classList !== undefined) {
        await client.query(
          "DELETE FROM class_schedules WHERE class_group_id IN (SELECT id FROM class_groups WHERE subject_id = $1)",
          [subjectId]
        );
        await client.query("DELETE FROM class_groups WHERE subject_id = $1", [
          subjectId,
        ]);

        const classGroupsMap = new Map();

        if (
          updateData.multiClass &&
          updateData.classList &&
          updateData.classList.length > 0
        ) {
          for (const groupCode of updateData.classList) {
            const groupResult = await client.query(
              "INSERT INTO class_groups (subject_id, group_code) VALUES ($1, $2) RETURNING id",
              [subjectId, groupCode]
            );
            classGroupsMap.set(groupCode, groupResult.rows[0].id);
          }
        } else {
          const groupResult = await client.query(
            "INSERT INTO class_groups (subject_id, group_code) VALUES ($1, $2) RETURNING id",
            [subjectId, "DEFAULT"]
          );
          classGroupsMap.set("DEFAULT", groupResult.rows[0].id);
        }
      }

      if (updateData.classes !== undefined) {
        const classGroupsResult = await client.query(
          "SELECT id, group_code FROM class_groups WHERE subject_id = $1",
          [subjectId]
        );

        const classGroupsMap = new Map();
        classGroupsResult.rows.forEach((row) => {
          classGroupsMap.set(row.group_code, row.id);
        });

        await client.query(
          "DELETE FROM class_schedules WHERE subject_id = $1",
          [subjectId]
        );

        const teachersMap = new Map();
        const classroomsMap = new Map();

        for (const schedule of updateData.classes) {
          if (!teachersMap.has(schedule.teacher)) {
            const existingTeacher = await client.query(
              "SELECT id FROM teachers WHERE name = $1",
              [schedule.teacher]
            );

            if (existingTeacher.rows.length > 0) {
              teachersMap.set(schedule.teacher, existingTeacher.rows[0].id);
            } else {
              const teacherResult = await client.query(
                "INSERT INTO teachers (name) VALUES ($1) RETURNING id",
                [schedule.teacher]
              );
              teachersMap.set(schedule.teacher, teacherResult.rows[0].id);
            }
          }

          if (!classroomsMap.has(schedule.classroom)) {
            const existingClassroom = await client.query(
              "SELECT id FROM classrooms WHERE name = $1",
              [schedule.classroom]
            );

            if (existingClassroom.rows.length > 0) {
              classroomsMap.set(
                schedule.classroom,
                existingClassroom.rows[0].id
              );
            } else {
              const classroomResult = await client.query(
                "INSERT INTO classrooms (name) VALUES ($1) RETURNING id",
                [schedule.classroom]
              );
              classroomsMap.set(schedule.classroom, classroomResult.rows[0].id);
            }
          }

          const groupCode = schedule.whichClass || "DEFAULT";
          const classGroupId = classGroupsMap.get(groupCode);

          if (!classGroupId) {
            results.errors.push({
              name: code,
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

      const updatedSubject = await this.findByCode(code);

      results.updated = {
        name: code,
        description: updateData.description,
        semester: updateData.semester,
        schedules: updateData.classes ? updateData.classes.length : null,
      };

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

  static async clean() {
    let client;
    try {
      client = await database.getNewClient();
      await client.query("BEGIN");

      await client.query("DELETE FROM class_schedules");
      await client.query("DELETE FROM class_groups");
      await client.query("DELETE FROM subjects");
      await client.query("DELETE FROM teachers");
      await client.query("DELETE FROM classrooms");

      await client.query("COMMIT");
      console.log("✅ Database cleaned successfully");
    } catch (error) {
      if (client) {
        await client.query("ROLLBACK");
      }
      console.error("❌ Clean failed:", error);
      throw error;
    } finally {
      if (client) {
        await client.end();
      }
    }
  }

  static async populate() {
    let client;
    const results = {
      created: [],
      errors: [],
      summary: {
        subjects: 0,
        teachers: 0,
        classrooms: 0,
        classGroups: 0,
        schedules: 0,
      },
    };

    try {
      const classesData = require("../data/classes.json");

      if (!classesData || !Array.isArray(classesData)) {
        throw new Error("Invalid classes.json format - expected an array");
      }

      client = await database.getNewClient();
      await client.query("BEGIN");

      console.log("🔄 Starting database population from classes.json...");

      const teachersMap = new Map();
      const classroomsMap = new Map();
      const subjectsMap = new Map();
      const classGroupsMap = new Map();

      const validClassesData = classesData.filter(
        (classData) =>
          classData &&
          classData.name &&
          classData.description &&
          classData.semester !== undefined
      );

      console.log(
        `📚 Found ${validClassesData.length} valid subjects in classes.json`
      );

      for (const classData of validClassesData) {
        try {
          const result = await client.query(
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

          const subjectId = result.rows[0].id;
          subjectsMap.set(classData.name, subjectId);
          results.summary.subjects++;

          results.created.push({
            name: classData.name,
            description: classData.description,
            semester: classData.semester,
          });

          console.log(`✅ Created subject: ${classData.name}`);
        } catch (error) {
          results.errors.push({
            name: classData.name,
            reason: `Failed to create subject: ${error.message}`,
          });
          console.error(
            `❌ Failed to create subject ${classData.name}:`,
            error.message
          );
        }
      }

      for (const classData of validClassesData) {
        try {
          const subjectId = subjectsMap.get(classData.name);
          if (!subjectId) continue;

          if (
            classData.multiClass &&
            classData.classList &&
            classData.classList.length > 0
          ) {
            for (const groupCode of classData.classList) {
              const groupResult = await client.query(
                `
                INSERT INTO class_groups (subject_id, group_code)
                VALUES ($1, $2)
                RETURNING id
              `,
                [subjectId, groupCode]
              );

              classGroupsMap.set(
                `${classData.name}-${groupCode}`,
                groupResult.rows[0].id
              );
              results.summary.classGroups++;
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

            classGroupsMap.set(
              `${classData.name}-DEFAULT`,
              groupResult.rows[0].id
            );
            results.summary.classGroups++;
          }

          if (
            classData.classes &&
            Array.isArray(classData.classes) &&
            classData.classes.length > 0
          ) {
            for (const schedule of classData.classes) {
              try {
                if (
                  !schedule.teacher ||
                  !schedule.classroom ||
                  !schedule.weekDay ||
                  !schedule.period
                ) {
                  console.warn(
                    `⚠️ Skipping invalid schedule for ${classData.name}`
                  );
                  continue;
                }

                if (!teachersMap.has(schedule.teacher)) {
                  const existingTeacher = await client.query(
                    `
                    SELECT id FROM teachers WHERE name = $1
                  `,
                    [schedule.teacher]
                  );

                  if (existingTeacher.rows.length > 0) {
                    teachersMap.set(
                      schedule.teacher,
                      existingTeacher.rows[0].id
                    );
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
                    results.summary.teachers++;
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
                    results.summary.classrooms++;
                  }
                }

                const groupKey = schedule.whichClass
                  ? `${classData.name}-${schedule.whichClass}`
                  : `${classData.name}-DEFAULT`;

                const classGroupId = classGroupsMap.get(groupKey);
                if (!classGroupId) {
                  results.errors.push({
                    name: classData.name,
                    reason: `Class group '${
                      schedule.whichClass || "DEFAULT"
                    }' not found for schedule`,
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

                results.summary.schedules++;
              } catch (scheduleError) {
                results.errors.push({
                  name: classData.name,
                  reason: `Failed to create schedule: ${scheduleError.message}`,
                });
                console.error(
                  `❌ Failed to create schedule for ${classData.name}:`,
                  scheduleError.message
                );
              }
            }
          }
        } catch (classError) {
          results.errors.push({
            name: classData.name,
            reason: `Failed to process class: ${classError.message}`,
          });
          console.error(
            `❌ Failed to process class ${classData.name}:`,
            classError.message
          );
        }
      }

      await client.query("COMMIT");

      console.log("✅ Database population completed successfully!");
      console.log(`📊 Summary:`);
      console.log(`   - Subjects: ${results.summary.subjects}`);
      console.log(`   - Teachers: ${results.summary.teachers}`);
      console.log(`   - Classrooms: ${results.summary.classrooms}`);
      console.log(`   - Class Groups: ${results.summary.classGroups}`);
      console.log(`   - Schedules: ${results.summary.schedules}`);

      return results;
    } catch (error) {
      if (client) {
        await client.query("ROLLBACK");
      }
      console.error("❌ Population failed:", error);
      throw error;
    } finally {
      if (client) {
        await client.end();
      }
    }
  }
}

module.exports = Subject;
