exports.up = (pgm) => {
  pgm.createTable("class_schedules", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    subject_id: {
      type: "integer",
      notNull: true,
      references: "subjects(id)",
      onDelete: "CASCADE",
    },
    class_group_id: {
      type: "integer",
      notNull: true,
      references: "class_groups(id)",
      onDelete: "CASCADE",
    },
    teacher_id: {
      type: "integer",
      notNull: true,
      references: "teachers(id)",
      onDelete: "RESTRICT",
    },
    classroom_id: {
      type: "integer",
      notNull: true,
      references: "classrooms(id)",
      onDelete: "RESTRICT",
    },
    week_day: {
      type: "integer",
      notNull: true,
      check: "week_day >= 1 AND week_day <= 7",
    },
    start_period: {
      type: "integer",
      notNull: true,
      check: "start_period >= 0",
    },
    end_period: {
      type: "integer",
      notNull: true,
      check: "end_period >= start_period",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("class_schedules", "subject_id");
  pgm.createIndex("class_schedules", "class_group_id");
  pgm.createIndex("class_schedules", "teacher_id");
  pgm.createIndex("class_schedules", "classroom_id");
  pgm.createIndex("class_schedules", "week_day");

  pgm.createIndex("class_schedules", [
    "week_day",
    "start_period",
    "end_period",
  ]);
};

exports.down = (pgm) => {
  pgm.dropTable("class_schedules");
};
