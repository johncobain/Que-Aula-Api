exports.up = (pgm) => {
  pgm.createTable("teachers", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    name: {
      type: "varchar(255)",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("teachers", "name");
};

exports.down = (pgm) => {
  pgm.dropTable("teachers");
};
