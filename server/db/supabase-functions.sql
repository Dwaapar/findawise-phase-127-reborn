-- Supabase RPC Functions for Universal Database Adapter
-- These functions enable raw SQL execution through Supabase RPC calls

-- Function to execute raw SQL queries
-- This function allows the Universal Database Adapter to run custom SQL through Supabase
CREATE OR REPLACE FUNCTION execute_sql(query text, params json DEFAULT '[]'::json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    param_count int;
    query_with_params text;
BEGIN
    -- Basic security checks
    IF query IS NULL OR trim(query) = '' THEN
        RAISE EXCEPTION 'Query cannot be empty';
    END IF;
    
    -- Check for dangerous operations (basic protection)
    IF query ~* '\b(DROP|ALTER|TRUNCATE|DELETE)\s+(DATABASE|SCHEMA|TABLE|USER|ROLE)\b' THEN
        RAISE EXCEPTION 'Dangerous operations not allowed';
    END IF;
    
    -- For now, execute query without parameter substitution
    -- In production, implement proper parameter binding
    EXECUTE query;
    
    -- Return success indicator
    SELECT json_build_object('success', true, 'affected_rows', 0) INTO result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

-- Function to get database health status
CREATE OR REPLACE FUNCTION get_db_health()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    table_count int;
    connection_count int;
    db_size text;
BEGIN
    -- Get basic database metrics
    SELECT count(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    SELECT count(*) INTO connection_count 
    FROM pg_stat_activity 
    WHERE state = 'active';
    
    SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;
    
    SELECT json_build_object(
        'status', 'healthy',
        'timestamp', now(),
        'metrics', json_build_object(
            'table_count', table_count,
            'active_connections', connection_count,
            'database_size', db_size
        )
    ) INTO result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'error', SQLERRM,
            'timestamp', now()
        );
END;
$$;

-- Function to check if table exists
CREATE OR REPLACE FUNCTION table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    );
END;
$$;

-- Function to get table row count
CREATE OR REPLACE FUNCTION get_table_count(table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    row_count bigint;
    result json;
BEGIN
    -- Verify table exists
    IF NOT table_exists(table_name) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Table does not exist: ' || table_name
        );
    END IF;
    
    -- Get row count using dynamic SQL
    EXECUTE format('SELECT count(*) FROM %I', table_name) INTO row_count;
    
    SELECT json_build_object(
        'success', true,
        'table_name', table_name,
        'row_count', row_count,
        'timestamp', now()
    ) INTO result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'table_name', table_name
        );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(text, json) TO authenticated;
GRANT EXECUTE ON FUNCTION get_db_health() TO authenticated;
GRANT EXECUTE ON FUNCTION table_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_count(text) TO authenticated;

-- Grant execute permissions to anon users for health checks
GRANT EXECUTE ON FUNCTION get_db_health() TO anon;
GRANT EXECUTE ON FUNCTION table_exists(text) TO anon;