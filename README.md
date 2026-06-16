# Human Resources and Operational Management System

## Overview

The Human Resources and Operational Management System (HROMS) is a full-stack web application designed to streamline human resources and operational workflows. The solution consists of a React-based frontend client and an ASP.NET Core 8.0 backend API, backed by a Microsoft SQL Server database.

## OTMS Development Team
| Roles  | Name |
| ------------- | ------------- |
| Project Manager | Vanessa Reuteras  |
| Business Analyst and Quality Assurance | Kenneth Yulip  |
| Frontend Developer | Hermione Benitez  |
| Backend Developer | John Angelo Mikhail Reveche  |

## Technology Stack

### Backend

- **.NET 8.0** - ASP.NET Core Web API
- **Entity Framework Core 8.0** - Object-relational mapper for database access
- **Microsoft SQL Server (MSSQL)** - Primary relational database
- **JWT Bearer Authentication** - Secure API authentication
- **Google Authentication APIs** - External identity provider integration
- **Swashbuckle.AspNetCore** - Swagger/OpenAPI documentation
- **SignalR** - Real-time communication for notifications
- **ClosedXML** - Excel report generation
- **QuestPDF** - PDF document generation
- **MailKit** - Email delivery services

### Frontend

- **React 18** - User interface library
- **TypeScript** - Typed JavaScript development
- **Vite** - Build tooling and development server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API communication
- **SignalR Client** - Real-time server communication
- **Recharts** - Data visualization and charting
- **Tabler Icons / Lucide React** - Icon libraries
- **Vitest** - Unit testing framework

## Prerequisites

The following software must be installed before running the project:

- **.NET SDK 8.0** or higher
  - Download from: https://dotnet.microsoft.com/download/dotnet/8.0
  - Verify installation: `dotnet --version`

- **Node.js 18** or higher
  - Download from: https://nodejs.org/
  - Verify installation: `node --version` and `npm --version`

- **Microsoft SQL Server**
  - SQL Server 2019 or higher, or SQL Server Express
  - Download from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
  - Alternatively, use SQL Server LocalDB for local development

- **SQL Server Management Studio (SSMS)** or **Azure Data Studio** (recommended for database management)

- **Visual Studio 2022**, **Visual Studio Code**, or another compatible IDE

- **Git** (for version control)
  - Download from: https://git-scm.com/download/win

- **Web Browser**
  - A modern browser such as Chrome, Firefox, Edge, or Safari

## Installation Instructions

### Step 1: Clone or Download the Repository

```bash
git clone <repository-url>
cd HROMS
```

### Step 2: Configure the Database

1. Open `appsettings.json` or create user secrets for the backend project.
2. Update the SQL Server connection string to point to your MSSQL instance.

Example connection string format:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=OTMSDb;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

3. Apply the existing Entity Framework migrations to create the database schema.

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### Step 3: Restore and Build the Backend

```bash
dotnet restore
dotnet build
```

### Step 4: Run the Backend API

```bash
dotnet run
```

The backend will start and Swagger UI will be available at:

```
http://localhost:5100/swagger
```

### Step 5: Install Frontend Dependencies

Open a separate terminal and run the following command from the project root:

```bash
npm install
```

### Step 6: Run the Frontend Development Server

```bash
npm run dev
```

The frontend application will be available at:

```
http://localhost:5173
```

## Usage

### Starting Both Applications

1. Start the backend API:

```bash
dotnet run
```

2. In a separate terminal, start the frontend:

```bash
npm run dev
```

3. Open the frontend in your browser:

```
http://localhost:5173
```

### Accessing the API Documentation

Once the backend is running, open the following URL in your browser:

```
http://localhost:5100/swagger
```

### Testing an API Endpoint with curl

```bash
curl -X GET "http://localhost:5100/api/WeatherForecast" -H "accept: application/json"
```

### Running Frontend Tests

```bash
npm test
```

### Building the Frontend for Production

```bash
npm run build
```

## Project Structure

```
OTMS/
├── Controllers/                       # API controllers
├── Common/                            # Shared constants, helpers, and exceptions
├── Service/                           # Business logic services and interfaces
├── Migrations/                        # Entity Framework Core migrations
├── wwwroot/                           # Frontend application source and assets
│   ├── src/
│   │   ├── Pages/                     # React page components
│   │   ├── components/                # Reusable React components
│   │   ├── test/                      # Unit and integration tests
│   │   ├── main.tsx                   # Frontend entry point
│   │   └── index.css                  # Global styles
│   ├── index.html                     # HTML entry point
│   └── uploads/                       # Uploaded file storage
├── Properties/
│   └── launchSettings.json            # Launch configuration
├── appsettings.json                   # Application configuration
├── appsettings.Development.json       # Development configuration
├── OTMS.csproj                        # Backend project file
├── OTMS.sln                           # Solution file
├── package.json                       # Frontend dependencies and scripts
├── vite.config.ts                     # Vite configuration
└── README Folder/
    └── README.md                      # Project documentation
```

## Contributing

### Submitting Issues

If you encounter any issues or bugs, please submit them through the project's issue tracker. When creating an issue, please include the following information:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior and actual behavior
- Environment details, including operating system, .NET version, Node.js version, and browser
- Any relevant error messages, logs, or screenshots

### Submitting Pull Requests

1. Fork the repository.
2. Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes and commit them:

```bash
git commit -m "Add your commit message"
```

4. Push the branch to your fork:

```bash
git push origin feature/your-feature-name
```

5. Open a Pull Request with a clear description of the changes, the problem being solved, and any testing performed.

Please ensure that your changes follow the existing coding conventions, that the backend builds successfully, and that all frontend tests pass before submitting a pull request.

## License

This project is proprietary software. All rights reserved.

## Support

For additional support or questions, please contact the development team.

