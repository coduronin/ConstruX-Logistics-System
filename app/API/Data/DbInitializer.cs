using System;
using System.IO;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace ConstruX.API.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        // Make sure the database exists (creates the file if it doesn't exist)
        context.Database.OpenConnection();
        context.Database.CloseConnection();

        bool dbExistsAndSeeded = false;
        try
        {
            // If the sites table exists and has any data, we assume it's seeded.
            if (context.Sites.Any())
            {
                dbExistsAndSeeded = true;
            }
        }
        catch (Exception)
        {
            // Table doesn't exist or database is uninitialized
        }

        if (dbExistsAndSeeded)
        {
            Console.WriteLine("Database already initialized and seeded.");
            return;
        }

        Console.WriteLine("Initializing database schema and seeding data...");

        // Search for the SQL files starting from the current directory
        string currentDir = Directory.GetCurrentDirectory();
        string? projectRootDir = FindProjectRootDir(currentDir);
        
        if (projectRootDir == null)
        {
            throw new FileNotFoundException("Could not find the project root directory containing the 'schema' and 'data' folders.");
        }

        string schemaPath = Path.Combine(projectRootDir, "schema", "create_tables.sql");
        string dataPath = Path.Combine(projectRootDir, "data", "insert_data.sql");
        string viewsPath = Path.Combine(projectRootDir, "queries", "view.sql");

        if (!File.Exists(schemaPath))
        {
            throw new FileNotFoundException($"Could not find schema file at {schemaPath}");
        }

        if (!File.Exists(dataPath))
        {
            throw new FileNotFoundException($"Could not find data file at {dataPath}");
        }

        if (!File.Exists(viewsPath))
        {
            throw new FileNotFoundException($"Could not find views file at {viewsPath}");
        }

        // Open connection explicitly so that PRAGMA statement persists across commands
        context.Database.OpenConnection();
        try
        {
            Console.WriteLine("Disabling foreign key constraints temporarily for seeding...");
            context.Database.ExecuteSqlRaw("PRAGMA foreign_keys = OFF;");

            // Execute create tables script
            Console.WriteLine($"Running schema script: {schemaPath}");
            string schemaSql = File.ReadAllText(schemaPath);
            context.Database.ExecuteSqlRaw(schemaSql);

            // Execute insert data script
            Console.WriteLine($"Running data insertion script: {dataPath}");
            string dataSql = File.ReadAllText(dataPath);
            context.Database.ExecuteSqlRaw(dataSql);

            // Execute views script
            Console.WriteLine($"Running views script: {viewsPath}");
            string viewsSql = File.ReadAllText(viewsPath);
            context.Database.ExecuteSqlRaw(viewsSql);

            Console.WriteLine("Re-enabling foreign key constraints...");
            context.Database.ExecuteSqlRaw("PRAGMA foreign_keys = ON;");
        }
        finally
        {
            context.Database.CloseConnection();
        }

        Console.WriteLine("Database initialized and seeded successfully.");
    }

    private static string? FindProjectRootDir(string startDir)
    {
        string? dir = startDir;
        while (dir != null)
        {
            if (Directory.Exists(Path.Combine(dir, "schema")) && Directory.Exists(Path.Combine(dir, "data")))
            {
                return dir;
            }
            dir = Directory.GetParent(dir)?.FullName;
        }
        return null;
    }
}
