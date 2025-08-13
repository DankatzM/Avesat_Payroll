<?php
/**
 * Database Configuration for cPanel Deployment
 * Avesat Payroll System
 */

class Database {
    
    // Database configuration - Update these for your cPanel hosting
    private static $config = [
        'host' => 'localhost',        // Usually localhost for cPanel
        'username' => '',             // Your cPanel database username
        'password' => '',             // Your cPanel database password
        'database' => '',             // Your database name
        'charset' => 'utf8mb4',
        'port' => 3306
    ];
    
    private static $connection = null;
    
    /**
     * Get database connection
     */
    public static function getConnection() {
        if (self::$connection === null) {
            try {
                // Load configuration from environment or config file
                self::loadConfig();
                
                $dsn = sprintf(
                    "mysql:host=%s;port=%d;dbname=%s;charset=%s",
                    self::$config['host'],
                    self::$config['port'],
                    self::$config['database'],
                    self::$config['charset']
                );
                
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
                ];
                
                self::$connection = new PDO($dsn, self::$config['username'], self::$config['password'], $options);
                
            } catch (PDOException $e) {
                error_log("Database connection failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed']);
                exit;
            }
        }
        
        return self::$connection;
    }
    
    /**
     * Load configuration from file or environment
     */
    private static function loadConfig() {
        // Try to load from .env file first
        $envFile = __DIR__ . '/../../.env';
        if (file_exists($envFile)) {
            $env = parse_ini_file($envFile);
            if ($env) {
                self::$config['host'] = $env['DB_HOST'] ?? self::$config['host'];
                self::$config['username'] = $env['DB_USERNAME'] ?? self::$config['username'];
                self::$config['password'] = $env['DB_PASSWORD'] ?? self::$config['password'];
                self::$config['database'] = $env['DB_DATABASE'] ?? self::$config['database'];
                self::$config['port'] = $env['DB_PORT'] ?? self::$config['port'];
            }
        }
        
        // Fallback to cPanel environment variables if available
        if (empty(self::$config['username'])) {
            self::$config['host'] = $_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'] ?? 'localhost';
            self::$config['username'] = $_ENV['DB_USERNAME'] ?? $_SERVER['DB_USERNAME'] ?? '';
            self::$config['password'] = $_ENV['DB_PASSWORD'] ?? $_SERVER['DB_PASSWORD'] ?? '';
            self::$config['database'] = $_ENV['DB_DATABASE'] ?? $_SERVER['DB_DATABASE'] ?? '';
            self::$config['port'] = $_ENV['DB_PORT'] ?? $_SERVER['DB_PORT'] ?? 3306;
        }
    }
    
    /**
     * Test database connection
     */
    public static function testConnection() {
        try {
            $pdo = self::getConnection();
            $stmt = $pdo->query("SELECT 1");
            return $stmt !== false;
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Execute a prepared statement
     */
    public static function execute($sql, $params = []) {
        try {
            $pdo = self::getConnection();
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Database query failed: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Fetch single row
     */
    public static function fetchOne($sql, $params = []) {
        $stmt = self::execute($sql, $params);
        return $stmt->fetch();
    }
    
    /**
     * Fetch all rows
     */
    public static function fetchAll($sql, $params = []) {
        $stmt = self::execute($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Insert and return last insert ID
     */
    public static function insert($sql, $params = []) {
        self::execute($sql, $params);
        return self::getConnection()->lastInsertId();
    }
    
    /**
     * Begin transaction
     */
    public static function beginTransaction() {
        return self::getConnection()->beginTransaction();
    }
    
    /**
     * Commit transaction
     */
    public static function commit() {
        return self::getConnection()->commit();
    }
    
    /**
     * Rollback transaction
     */
    public static function rollback() {
        return self::getConnection()->rollBack();
    }
    
    /**
     * Close connection
     */
    public static function close() {
        self::$connection = null;
    }
    
    /**
     * Get database configuration for setup
     */
    public static function getConfig() {
        return self::$config;
    }
    
    /**
     * Update configuration
     */
    public static function updateConfig($config) {
        self::$config = array_merge(self::$config, $config);
        self::$connection = null; // Reset connection
    }
}

/**
 * Database utilities
 */
class DatabaseUtils {
    
    /**
     * Generate UUID v4
     */
    public static function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    
    /**
     * Sanitize input
     */
    public static function sanitize($input) {
        if (is_array($input)) {
            return array_map([self::class, 'sanitize'], $input);
        }
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Validate required fields
     */
    public static function validateRequired($data, $required) {
        $missing = [];
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing[] = $field;
            }
        }
        return $missing;
    }
    
    /**
     * Format datetime for database
     */
    public static function now() {
        return date('Y-m-d H:i:s');
    }
    
    /**
     * Format date for database
     */
    public static function formatDate($date) {
        return date('Y-m-d', strtotime($date));
    }
    
    /**
     * Escape like parameter
     */
    public static function escapeLike($string) {
        return str_replace(['%', '_'], ['\%', '\_'], $string);
    }
}

// Auto-include this file when needed
if (!function_exists('getDB')) {
    function getDB() {
        return Database::getConnection();
    }
}
?>
