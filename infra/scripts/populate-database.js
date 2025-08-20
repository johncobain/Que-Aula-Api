require("dotenv").config();
const database = require("../database");
const classesData = require("../../src/data/classes.json");

async function populateDatabase() {
  let client;

  try {
    client = await database.getNewClient();
    console.log("🔄 Starting database population...");

    // Begin transaction
    await client.query("BEGIN");

    // Clear existing data (in order due to foreign keys)
    await client.query("DELETE FROM class_schedules");
    await client.query("DELETE FROM class_groups");
    await client.query("DELETE FROM subjects");
    await client.query("DELETE FROM teachers");
    await client.query("DELETE FROM classrooms");

    console.log("✅ Cleared existing data");

    // Maps to track inserted records
    const teachersMap = new Map();
    const classroomsMap = new Map();
    const subjectsMap = new Map();
    const classGroupsMap = new Map();

    // Insert subjects first
    for (const classData of classesData) {
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
          classData.multiClass,
          classData.greve,
        ]
      );

      subjectsMap.set(classData.name, result.rows[0].id);
    }

    console.log(`✅ Inserted ${subjectsMap.size} subjects`);

    // Insert teachers and classrooms, create class groups and schedules
    for (const classData of classesData) {
      const subjectId = subjectsMap.get(classData.name);

      // Handle class groups
      if (classData.multiClass && classData.classList) {
        // Multiple class groups
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
        }
      } else {
        // Single class group (default)
        const groupResult = await client.query(
          `
          INSERT INTO class_groups (subject_id, group_code)
          VALUES ($1, $2)
          RETURNING id
        `,
          [subjectId, "DEFAULT"]
        );

        classGroupsMap.set(`${classData.name}-DEFAULT`, groupResult.rows[0].id);
      }

      // Insert schedules
      for (const schedule of classData.classes) {
        // Insert teacher if not exists
        if (!teachersMap.has(schedule.teacher)) {
          // Check if teacher already exists
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

        // Insert classroom if not exists
        if (!classroomsMap.has(schedule.classroom)) {
          // Check if classroom already exists
          const existingClassroom = await client.query(
            `
            SELECT id FROM classrooms WHERE name = $1
          `,
            [schedule.classroom]
          );

          if (existingClassroom.rows.length > 0) {
            classroomsMap.set(schedule.classroom, existingClassroom.rows[0].id);
          } else {
            const classroomResult = await client.query(
              `
              INSERT INTO classrooms (name)
              VALUES ($1)
              RETURNING id
            `,
              [schedule.classroom]
            );

            classroomsMap.set(schedule.classroom, classroomResult.rows[0].id);
          }
        }

        // Determine class group
        const groupKey = schedule.whichClass
          ? `${classData.name}-${schedule.whichClass}`
          : `${classData.name}-DEFAULT`;

        const classGroupId = classGroupsMap.get(groupKey);
        const teacherId = teachersMap.get(schedule.teacher);
        const classroomId = classroomsMap.get(schedule.classroom);

        // Parse periods
        const startPeriod = parseInt(schedule.period[0]);
        const endPeriod = parseInt(schedule.period[schedule.period.length - 1]);

        // Insert class schedule
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

    await client.query("COMMIT");

    console.log("✅ Database population completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Subjects: ${subjectsMap.size}`);
    console.log(`   - Teachers: ${teachersMap.size}`);
    console.log(`   - Classrooms: ${classroomsMap.size}`);
    console.log(`   - Class Groups: ${classGroupsMap.size}`);
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

if (require.main === module) {
  populateDatabase().catch(console.error);
}

module.exports = populateDatabase;
