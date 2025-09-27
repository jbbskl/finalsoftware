#!/usr/bin/env python3
"""
Database migration runner
Runs SQL migrations in order from the migrations directory
"""

import os
import psycopg
from pathlib import Path

def run_migrations():
    """Run all pending migrations"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        return False
    
    migrations_dir = Path(__file__).parent / 'migrations'
    if not migrations_dir.exists():
        print(f"ERROR: Migrations directory not found: {migrations_dir}")
        return False
    
    # Get all migration files and sort them
    migration_files = sorted([f for f in migrations_dir.glob('*.sql')])
    
    if not migration_files:
        print("No migration files found")
        return True
    
    print(f"Found {len(migration_files)} migration files")
    
    try:
        # Connect to database
        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cur:
                # Create migrations tracking table if it doesn't exist
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS schema_migrations (
                        version VARCHAR(255) PRIMARY KEY,
                        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                """)
                
                # Get already applied migrations
                cur.execute("SELECT version FROM schema_migrations ORDER BY version")
                applied_migrations = {row[0] for row in cur.fetchall()}
                
                # Apply pending migrations
                for migration_file in migration_files:
                    version = migration_file.stem
                    
                    if version in applied_migrations:
                        print(f"Migration {version} already applied, skipping")
                        continue
                    
                    print(f"Applying migration: {version}")
                    
                    # Read and execute migration
                    with open(migration_file, 'r') as f:
                        migration_sql = f.read()
                    
                    cur.execute(migration_sql)
                    
                    # Record migration as applied
                    cur.execute(
                        "INSERT INTO schema_migrations (version) VALUES (%s)",
                        (version,)
                    )
                    
                    print(f"Migration {version} applied successfully")
                
                conn.commit()
                print("All migrations completed successfully")
                return True
                
    except Exception as e:
        print(f"ERROR: Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = run_migrations()
    exit(0 if success else 1)