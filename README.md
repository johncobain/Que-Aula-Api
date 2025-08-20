# Que Aula API 📚

REST API for the [que-aula.vercel.app](https://que-aula.vercel.app) website, an application dedicated to **Systems Analysis and Development (ADS) students at IFBA - Salvador Campus** to check class schedules, weekly calendar, and course flowchart.

## 📋 About the Project

The **Que Aula API** is a simple and efficient API that provides essential data for ADS students, including:

- **Daily class schedules**: Check which subjects you have today
- **Complete weekly calendar**: View your weekly schedule grid
- **Course flowchart**: Navigate through subjects and their prerequisites

## 🚀 Technologies Used

- **Node.js** - JavaScript runtime
- **Express.js** - Minimalist web framework
- **PostgreSQL** - Relational database
- **Neon** - Serverless PostgreSQL platform
- **node-pg-migrate** - Database migration tool
- **Nodemon** - Auto-reload during development
- **JSON** - Static data storage (fallback)

## 📁 Project Structure

```bash
que-aula-api/
├── package.json
├── README.md
├── vercel.json                # Vercel deployment configuration
├── .env                       # Environment variables
├── DADOS-GUIA.md             # Data guide
├── infra/                     # Infrastructure and database
│   ├── compose.yaml          # Docker Compose for local development
│   ├── database.js           # Database connection and query functions
│   ├── errors.js             # Custom error classes
│   ├── migrations/           # Database migrations
│   │   ├── 1755308004113_create-subjects.js
│   │   ├── 1755308122935_create-teachers.js
│   │   ├── 1755308163012_create-classrooms.js
│   │   ├── 1755308206331_create-class-groups.js
│   │   ├── 1755308297266_create-class-schedules.js
│   │   └── 1755308367003_create-updated-at-trigger-function.js
│   └── scripts/              # Utility scripts
│       ├── clean-database.js
│       ├── populate-database.js
│       ├── test-connection.js
│       ├── test-production-connection.js
│       └── wait-for-postgres.js
├── seeders/                   # Database seeders
└── src/
    ├── app.js                # Main server configuration
    ├── controllers/          # Business logic
    │   ├── classes.js        # Controller for subjects/schedules
    │   ├── flowchart.js      # Controller for flowchart
    │   └── migrator.js       # Controller for database migrations
    ├── data/                 # Static data in JSON (fallback)
    │   ├── classes.json      # Subject and schedule data
    │   └── flowchart.json    # Course flowchart data
    ├── models/               # Database models
    │   └── Subject.js        # Subject model with database operations
    ├── routes/               # Route definitions
    │   ├── classes.js        # Routes for subjects
    │   ├── flowchart.js      # Routes for flowchart
    │   └── migrations.js     # Routes for migrations
    └── services/             # Business services
        └── classTransformer.js # Transform database data to frontend format
```

## 🛠️ Installation and Setup

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Docker (for local database)
- PostgreSQL (optional, for local setup without Docker)

### Steps to run locally

1. **Clone the repository**

   ```bash
   git clone https://github.com/johncobain/Que-Aula-Api.git
   cd Que-Aula-Api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   NODE_ENV=development
   PORT=3000

   # Local development database
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5430
   POSTGRES_USER=local_user
   POSTGRES_DB=local_db
   POSTGRES_PASSWORD=local_password

   # Production database (Neon)
   DATABASE_URL=postgres://username:password@host:port/database?sslmode=require
   ```

4. **Start the database and run migrations**

   ```bash
   # Start local database with Docker
   npm run services:up

   # Run database migrations
   npm run migrations:up

   # Populate database with sample data
   npm run populate:db
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

The server will be running at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server with database setup
- `npm run services:up` - Start Docker PostgreSQL container
- `npm run services:stop` - Stop Docker services
- `npm run services:down` - Stop and remove Docker services
- `npm run migrations:up` - Run database migrations
- `npm run migrations:create` - Create new migration
- `npm run populate:db` - Populate database with sample data
- `npm run clean:db` - Clean all data from database
- `npm run test:connection` - Test local database connection
- `npm run test:prod` - Test production database connection

## 📚 API Documentation

### 🔍 Health Check

#### `GET /`

Endpoint to check if the API is working.

**Response:**

```json
{
  "message": "Que Aula API está funcionando!",
  "version": "1.1.0",
  "lastUpdate": "18/08/2025 10:30:00",
  "endpoints": {
    "classes": "/classes",
    "flowchart": "/flowchart",
    "info": "/info",
    "migrations": "/migrations"
  }
}
```

### 🎯 Subject Endpoints

#### `GET /classes`

Returns all subjects with their complete schedules from the database.

**Response:**

```json
[
  {
    "name": "ADM504",
    "description": "Contabilidade Geral",
    "semester": "0",
    "multiClass": false,
    "greve": false,
    "classes": [
      {
        "weekDay": "4",
        "period": ["4", "5"],
        "teacher": "Emerson Gibaut",
        "classroom": "BLOCO O - Sala 2 (1º Andar)"
      }
    ]
  }
]
```

#### `GET /classes/:className`

Returns details of a specific subject.

**Parameters:**

- `className` - Subject name/code (e.g., "ADM504")

**Example:**

```bash
GET /classes/ADM504
```

**Success response:**

```json
{
  "name": "ADM504",
  "description": "Contabilidade Geral",
  "semester": "0",
  "multiClass": false,
  "greve": false,
  "classes": [...]
}
```

**Error response:**

```json
{
  "error": "Class not found"
}
```

#### `POST /classes`

Creates new subjects in the database. Accepts both array format and wrapped object format.

**Request Body (Array format):**

```json
[
  {
    "name": "INF999",
    "description": "Test Subject",
    "semester": "0",
    "multiClass": false,
    "greve": false,
    "classes": [
      {
        "weekDay": "1",
        "period": ["2", "3"],
        "teacher": "Test Teacher",
        "classroom": "Test Room"
      }
    ]
  }
]
```

**Request Body (Wrapped format):**

```json
{
  "classes": [
    {
      "name": "INF999",
      "description": "Test Subject",
      "semester": "0",
      "multiClass": false,
      "greve": false,
      "classes": []
    }
  ]
}
```

**Success Response:**

```json
{
  "message": "Class creation process completed",
  "summary": {
    "total": 1,
    "created": 1,
    "skipped": 0,
    "errors": 0
  },
  "results": {
    "created": [
      {
        "name": "INF999",
        "description": "Test Subject",
        "semester": "0",
        "schedules": 1
      }
    ],
    "skipped": [],
    "errors": []
  }
}
```

#### `PUT /classes/:className` or `PATCH /classes/:className`

Updates an existing subject. You can update basic information, class groups, or schedules.

**Parameters:**

- `className` - Subject code (e.g., "INF027")

**Request Body (Partial Update):**

```json
{
  "description": "Updated Subject Name",
  "semester": "2",
  "greve": true
}
```

**Request Body (Update with Schedules):**

```json
{
  "description": "Advanced Programming",
  "multiClass": true,
  "classList": ["T01", "T02", "T03"],
  "classes": [
    {
      "weekDay": "1",
      "period": ["2", "3"],
      "teacher": "New Teacher",
      "classroom": "New Room",
      "whichClass": "T01"
    }
  ]
}
```

**Success Response:**

```json
{
  "message": "Subject updated successfully",
  "subject": {
    "name": "INF027",
    "description": "Advanced Programming",
    "semester": "2",
    "multiClass": true,
    "classList": ["T01", "T02", "T03"],
    "greve": false,
    "classes": [
      {
        "weekDay": "1",
        "period": ["2", "3"],
        "teacher": "New Teacher",
        "classroom": "New Room",
        "whichClass": "T01"
      }
    ]
  },
  "updated": {
    "name": "INF027",
    "description": "Advanced Programming",
    "semester": "2",
    "schedules": 1
  }
}
```

**Error Response:**

```json
{
  "error": "Not Found",
  "message": "Subject 'INF999' not found"
}
```

### 📊 Flowchart Endpoints

#### `GET /flowchart`

Returns the complete course flowchart organized by semesters.

**Response:**

```json
[
  [
    {
      "name": "INF027",
      "description": "Introdução à Lógica",
      "requiredFor": ["INF029", "INF006"],
      "credit": "60 - 3",
      "state": "default",
      "semester": 0
    }
  ]
]
```

#### `GET /flowchart/:classFlowchartName`

Returns specific information about a subject in the flowchart.

**Parameters:**

- `classFlowchartName` - Subject name/code in the flowchart

**Example:**

```bash
GET /flowchart/INF027
```

**Success response (200):**

```json
{
  "name": "INF027",
  "description": "Introdução à Lógica",
  "requiredFor": ["INF029", "INF006"],
  "credit": "60 - 3",
  "state": "default",
  "semester": 0
}
```

**Error response (404):**

```json
{
  "error": "Class not found"
}
```

### 🔄 Migration Endpoints

#### `GET /migrations`

Lists pending database migrations.

**Response:**

```json
[
  {
    "id": 1755308004113,
    "name": "1755308004113_create-subjects.js",
    "status": "pending"
  }
]
```

#### `POST /migrations`

Runs pending database migrations.

**Response:**

```json
[
  {
    "id": 1755308004113,
    "name": "1755308004113_create-subjects.js",
    "status": "completed"
  }
]
```

## 🏗️ Architecture

The API follows a **simplified MVC architecture** with database integration:

- **Models**: PostgreSQL database with Sequelize ORM and JSON fallback
- **Views**: JSON API responses
- **Controllers**: Business logic for data processing
- **Routes**: URL mapping to controllers
- **Services**: Data transformation and business services
- **Migrations**: Database schema versioning

### Database Schema

#### Tables

- **subjects**: Main subject information (code, name, semester, etc.)
- **teachers**: Teacher information
- **classrooms**: Classroom information
- **class_groups**: Subject groups (for multi-class subjects)
- **class_schedules**: Schedule information linking subjects, teachers, classrooms

#### Key Features

- **Foreign key relationships** ensuring data integrity
- **Automatic timestamps** with triggers for updated_at
- **Indexes** for optimal query performance
- **Migration system** for schema versioning
- **JSON fallback** for high availability

### Controllers

#### Classes Controller (`controllers/classes.js`)

- `list()` - Lists all subjects from database with JSON fallback
- `get(className)` - Searches subject by name
- `create(classesData)` - Creates new subjects in bulk with duplicate detection

#### Flowchart Controller (`controllers/flowchart.js`)

- `list()` - Lists complete flowchart
- `get(classFlowchartName)` - Searches subject in flowchart with optimized search

#### Migrator Controller (`controllers/migrator.js`)

- `listPendingMigrations()` - Lists pending migrations
- `runPendingMigrations()` - Executes pending migrations

### Data Structure

#### Classes JSON Format

Each subject contains:

- `name`: Subject code
- `description`: Full subject name
- `semester`: Subject semester
- `multiClass`: Whether it has multiple classes
- `greve`: Strike status
- `classes`: Array with schedules (weekday, period, teacher, classroom)
- `classList`: Array of class groups (for multi-class subjects)

#### Flowchart JSON Format

Organized as array of semesters, each subject contains:

- `name`: Subject code
- `description`: Full name
- `requiredFor`: Subjects that depend on this one
- `credit`: Credit hours and credits
- `state`: Status in flowchart
- `semester`: Subject semester

## 🎯 Use Cases

### For the Frontend (que-aula.vercel.app)

1. **View daily classes**: Filter subjects by day of the week
2. **Weekly calendar**: Display complete schedule grid
3. **Flowchart navigation**: Show prerequisites and dependencies
4. **Class management**: Create and manage new subjects via API

### Integration Examples

```javascript
// Fetch all subjects
const classes = await fetch("/classes").then((res) => res.json());

// Fetch specific subject
const subject = await fetch("/classes/INF027").then((res) => res.json());

// Fetch complete flowchart
const flowchart = await fetch("/flowchart").then((res) => res.json());

// Fetch subject in flowchart
const flowchartSubject = await fetch("/flowchart/INF027").then((res) =>
  res.json()
);

// Create new subjects
const result = await fetch("/classes", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify([
    {
      name: "INF999",
      description: "Test Subject",
      semester: "0",
      multiClass: false,
      greve: false,
      classes: [],
    },
  ]),
}).then((res) => res.json());
```

## 🔧 Development

### Adding New Features

1. **New endpoints**: Add routes in `/src/routes`
2. **New business logic**: Implement controllers in `/src/controllers`
3. **Database changes**: Create migrations in `/infra/migrations`
4. **New data transformations**: Add services in `/src/services`

### Database Development

```bash
# Create new migration
npm run migrations:create migration-name

# Run migrations
npm run migrations:up

# Test database connection
npm run test:connection

# Populate with sample data
npm run populate:db

# Clean database
npm run clean:db
```

## 📝 Important Notes

- **Database-first**: Primary data source is PostgreSQL with JSON fallback
- **Automatic fallback**: API automatically falls back to JSON files on database errors
- **Migration system**: Use migrations for all database schema changes
- **CORS enabled**: Configured for cross-origin requests
- **Environment-based**: Different configurations for development and production
- **Serverless-ready**: Optimized for Vercel deployment

## 🚀 Deployment

### Vercel (Recommended)

This API is configured for deployment on [**Vercel**](https://vercel.com) with Neon PostgreSQL.

#### Production Setup

1. **Database**: Create a Neon PostgreSQL database
2. **Environment variables**: Set up in Vercel dashboard

   ```env
   NODE_ENV=production
   DATABASE_URL=postgres://user:pass@host:port/db?sslmode=require
   ```

3. **Deployment**: Connect GitHub repository to Vercel

#### Automatic Deploy

- Each push to the main branch will be automatically deployed
- Migrations should be run manually after deployment

#### Manual Deploy

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Production Environment Variables

Required environment variables for Vercel:

- `NODE_ENV=production`
- `DATABASE_URL` - Full Neon PostgreSQL connection string
- `POSTGRES_HOST` - Neon database host
- `POSTGRES_PORT=5432`
- `POSTGRES_USER` - Neon database user
- `POSTGRES_DB` - Database name
- `POSTGRES_PASSWORD` - Database password

### Production Configuration Features

- ✅ **SSL/TLS support** for Neon connections
- ✅ **CORS configured** for frontend access
- ✅ **Health check** available at `/`
- ✅ **Migration endpoint** for database updates
- ✅ **JSON fallback** for high availability
- ✅ **Serverless functions** optimized for Vercel
- ✅ **Error handling** with automatic fallback

## 📞 Support

This API was developed specifically for ADS students at IFBA - Salvador. For suggestions or issues, check the project repository on GitHub.

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Database Schema Updates

When updating the database schema:

1. Create a new migration: `npm run migrations:create migration-name`
2. Write the migration in the generated file
3. Test locally: `npm run migrations:up`
4. Update models and controllers as needed
5. Test the API endpoints
6. Deploy to production and run migrations

---

**Developed for the academic community of IFBA Salvador** 🎓
