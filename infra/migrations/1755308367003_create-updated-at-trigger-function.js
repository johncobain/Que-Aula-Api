exports.up = (pgm) => {
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  pgm.sql(`
    CREATE TRIGGER update_subjects_updated_at 
    BEFORE UPDATE ON subjects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  pgm.sql(`
    CREATE TRIGGER update_class_schedules_updated_at 
    BEFORE UPDATE ON class_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.sql("DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;");
  pgm.sql(
    "DROP TRIGGER IF EXISTS update_class_schedules_updated_at ON class_schedules;"
  );
  pgm.sql("DROP FUNCTION IF EXISTS update_updated_at_column();");
};
