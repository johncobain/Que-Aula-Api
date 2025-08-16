exports.up = (pgm) => {
  pgm.createTable("class_groups", {
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
    group_code: {
      type: "varchar(10)",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.addConstraint("class_groups", "unique_subject_group", {
    unique: ["subject_id", "group_code"],
  });

  pgm.createIndex("class_groups", "subject_id");
};

exports.down = (pgm) => {
  pgm.dropTable("class_groups");
};
