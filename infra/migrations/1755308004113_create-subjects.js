exports.up = (pgm) => {
  pgm.createTable("subjects", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    code: {
      type: "varchar(10)",
      notNull: true,
      unique: true,
    },
    name: {
      type: "varchar(255)",
      notNull: true,
    },
    semester: {
      type: "varchar(10)",
      notNull: true,
    },
    multi_class: {
      type: "boolean",
      default: false,
    },
    on_strike: {
      type: "boolean",
      default: false,
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
  pgm.createIndex("subjects", "code");
};

exports.down = (pgm) => {
  pgm.dropTable("subjects");
};
