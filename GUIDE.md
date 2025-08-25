# 📝 Data Management Guide

## For course data maintainers

### 🎯 How to update schedules and subjects

The API now uses a **PostgreSQL database** as the primary data source. Here are the available methods:

#### Method 1: API Endpoints (Recommended)

1. **Create new subjects:**

   ```bash
   curl -X POST https://que-aula-api.vercel.app/classes \
     -H "Content-Type: application/json" \
     -d '[{
       "name": "INF999",
       "description": "New Subject",
       "semester": "3",
       "multiClass": false,
       "greve": false,
       "classes": [
         {
           "weekDay":"1",
           "period":["2","3"],
           "teacher":"Test Teacher",
           "classroom":"Test Room"
         }
       ]
     }]'
   ```

2. **Update existing subjects:**

   ```bash
   curl -X PUT https://que-aula-api.vercel.app/classes/INF027 \
     -H "Content-Type: application/json" \
     -d '{
       "description": "Updated Subject Name",
       "semester": "2"
     }'
   ```

3. **Delete subjects:**

   ```bash
   curl -X DELETE https://que-aula-api.vercel.app/classes/INF027
   ```

4. **Populate database from JSON:**

   ```bash
   curl -X POST https://que-aula-api.vercel.app/classes/populate
   ```

5. **Clean database:**

   ```bash
   curl -X DELETE https://que-aula-api.vercel.app/classes/clean
   ```

#### Method 2: Database Direct Access

1. **Access Neon Console:**

   - Go to [console.neon.tech](https://console.neon.tech)
   - Select the Que Aula API project
   - Use SQL Editor

2. **Update data with SQL:**

   ```sql
   -- Update subject info
   UPDATE subjects
   SET name = 'New Subject Name', semester = '3'
   WHERE code = 'INF027';

   -- Add new schedule
   INSERT INTO class_schedules (...) VALUES (...);
   ```

### 📋 Data structure

#### Database Tables

**subjects** - Main subject information:

```sql
- id: Primary key
- code: Subject code (e.g., "INF027")
- name: Subject description
- semester: Subject semester
- multi_class: Whether has multiple classes
- on_strike: Strike status
- created_at, updated_at: Timestamps
```

**teachers** - Teacher information:

```sql
- id: Primary key
- name: Teacher full name
- created_at: Timestamp
```

**classrooms** - Classroom information:

```sql
- id: Primary key
- name: Classroom location
- created_at: Timestamp
```

**class_groups** - Subject groups (for multi-class subjects):

```sql
- id: Primary key
- subject_id: References subjects
- group_code: Group identifier (e.g., "T01", "T02")
- created_at: Timestamp
```

**class_schedules** - Schedule information:

```sql
- id: Primary key
- subject_id: References subjects
- class_group_id: References class_groups
- teacher_id: References teachers
- classroom_id: References classrooms
- week_day: Day of week (1=Monday, 2=Tuesday, etc.)
- start_period, end_period: Class periods
- created_at, updated_at: Timestamps
```

#### JSON Format (API Response)

**Classes JSON:**

```json
{
  "name": "INF027",
  "description": "Introduction to Logic",
  "semester": "1",
  "multiClass": false,
  "greve": false,
  "classes": [
    {
      "weekDay": "1", // 1=Monday, 2=Tuesday, etc.
      "period": ["1", "2"], // Class periods
      "teacher": "Teacher Name",
      "classroom": "Classroom Location"
    }
  ]
}
```

**Multi-class subjects:**

```json
{
  "name": "INF028",
  "description": "Programming Logic",
  "semester": "1",
  "multiClass": true,
  "classList": ["T01", "T02", "T03"],
  "greve": false,
  "classes": [
    {
      "weekDay": "1",
      "period": ["1", "2"],
      "teacher": "Teacher A",
      "classroom": "Room 101",
      "whichClass": "T01"
    },
    {
      "weekDay": "2",
      "period": ["3", "4"],
      "teacher": "Teacher B",
      "classroom": "Room 102",
      "whichClass": "T02"
    }
  ]
}
```

**Flowchart JSON:**

```json
{
  "name": "INF027",
  "description": "Introduction to Logic",
  "requiredFor": ["INF029", "INF006"], // Subjects that depend on this
  "credit": "60 - 3", // Hours - credits
  "state": "default", // Status in flowchart
  "semester": 1 // Subject semester
}
```

### 🔧 Quick Data Management

For immediate data updates, you can use these API endpoints:

#### Reset and Populate Database

```bash
# Clean all data and repopulate from classes.json
curl -X POST https://que-aula-api.vercel.app/classes/populate

# Response example:
{
  "message": "Database populated successfully from classes.json",
  "summary": {
    "subjects": 38,
    "teachers": 45,
    "classrooms": 25,
    "classGroups": 42,
    "schedules": 156
  },
  "created": 38,
  "errors": 0
}
```

#### Clean Database Only

```bash
# Remove all data (use with caution!)
curl -X DELETE https://que-aula-api.vercel.app/classes/clean

# Response:
{
  "message": "Database cleaned successfully",
  "timestamp": "2024-08-24T10:30:00.000Z"
}
```

#### Bulk Import New Data

```bash
# Import multiple subjects at once
curl -X POST https://que-aula-api.vercel.app/classes \
  -H "Content-Type: application/json" \
  -d @path/to/new-subjects.json
```

### ⚡ Important tips

- **Database-first approach**: The API primarily uses PostgreSQL database
- **Use API endpoints**: Preferred method for data updates
- **Populate endpoint**: Automatically reads from `src/data/classes.json`
- **Clean before populate**: The populate endpoint automatically cleans first
- **Test locally first**: Always test changes before production
- **Use descriptive commits**: For easy change tracking
- **Backup important data**: Keep backups of critical information
- **Validate data format**: Ensure correct structure before saving

### 🔧 Development workflow

1. **Local development:**

   ```bash
   # Start development server
   npm run dev

   # Populate with sample data (script method)
   npm run populate:db
   
   # Or populate via API (recommended)
   npm run populate:api
   ```

2. **Database management:**

   ```bash
   # Create new migration
   npm run migrations:create new-feature

   # Test connection
   npm run test:connection

   # Clean database (script method)
   npm run clean:db
   
   # Or clean via API
   npm run clean:api
   ```

3. **Production deployment:**
   - Changes to main branch auto-deploy via Vercel
   - Database changes require manual migration execution
   - Monitor via Vercel dashboard and Neon console

### 🚨 Troubleshooting

1. **Database connection issues:**

   - Check environment variables in Vercel
   - Verify Neon database status
   - Check connection string format

2. **API errors:**

   - Check Vercel function logs
   - Verify JSON file syntax (fallback)
   - Test endpoints with curl/Postman

3. **Data inconsistencies:**

   - Compare database vs JSON data
   - Use populate endpoint to reset from JSON: `POST /classes/populate`
   - Run data validation scripts
   - Check migration status

4. **Emergency data recovery:**

   - Use the populate endpoint to restore from `classes.json`
   - Check backup files if available
   - Contact development team for database restore

5. **Performance issues:**
   - Monitor database query performance
   - Check indexes on frequently queried columns
   - Optimize API response caching

### 📞 Contact

For technical issues or questions:

- Check the project repository on GitHub
- Contact the development team
- Review API documentation in README.md

---

**Last update:** August 19, 2025
