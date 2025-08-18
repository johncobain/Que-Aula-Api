class ClassTransformer {
  static transformToFrontendFormat(dbRows) {
    const subjectsMap = new Map();

    dbRows.forEach((row) => {
      const subjectKey = row.code;

      if (!subjectsMap.has(subjectKey)) {
        subjectsMap.set(subjectKey, {
          name: row.code,
          description: row.name,
          semester: row.semester,
          multiClass: row.multi_class,
          greve: row.on_strike,
          classes: [],
          classList: new Set(),
        });
      }

      const subject = subjectsMap.get(subjectKey);

      if (row.week_day && row.teacher_name) {
        const classSchedule = {
          weekDay: row.week_day.toString(),
          period: this.generatePeriodArray(row.start_period, row.end_period),
          teacher: row.teacher_name,
          classroom: row.classroom_name,
        };

        if (row.multi_class && row.group_code) {
          classSchedule.whichClass = row.group_code;
          subject.classList.add(row.group_code);
        }

        subject.classes.push(classSchedule);
      }

      if (row.group_code) {
        subject.classList.add(row.group_code);
      }
    });

    return Array.from(subjectsMap.values()).map((subject) => {
      const result = {
        name: subject.name,
        description: subject.description,
        semester: subject.semester,
        multiClass: subject.multiClass,
        greve: subject.greve,
        classes: subject.classes,
      };

      if (subject.multiClass && subject.classList.size > 0) {
        result.classList = Array.from(subject.classList).sort();
      }

      return result;
    });
  }

  static generatePeriodArray(startPeriod, endPeriod) {
    const periods = [];
    for (let i = startPeriod; i <= endPeriod; i++) {
      periods.push(i.toString());
    }
    return periods;
  }

  static transformSingleSubject(dbRows) {
    if (dbRows.length === 0) {
      return null;
    }

    const transformed = this.transformToFrontendFormat(dbRows);
    return transformed[0] || null;
  }
}

module.exports = ClassTransformer;
