<?php
/**
 * Authentication and Security Configuration
 * Avesat Payroll System
 */

require_once __DIR__ . '/database.php';

class Auth {
    
    private static $jwtSecret = 'your-super-secret-jwt-key-change-this-in-production';
    private static $sessionTimeout = 3600; // 1 hour
    
    /**
     * Initialize authentication
     */
    public static function init() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Load JWT secret from environment if available
        self::$jwtSecret = $_ENV['JWT_SECRET'] ?? $_SERVER['JWT_SECRET'] ?? self::$jwtSecret;
        self::$sessionTimeout = $_ENV['SESSION_TIMEOUT'] ?? $_SERVER['SESSION_TIMEOUT'] ?? self::$sessionTimeout;
    }
    
    /**
     * Authenticate user
     */
    public static function login($email, $password) {
        try {
            $sql = "SELECT u.*, et.kra_pin FROM users u 
                   LEFT JOIN employees e ON u.id = e.user_id 
                   LEFT JOIN employee_tax_info et ON e.id = et.employee_id 
                   WHERE u.email = ? AND u.isActive = 1";
            
            $user = Database::fetchOne($sql, [$email]);
            
            if ($user && password_verify($password, $user['password_hash'])) {
                // Update last login
                Database::execute(
                    "UPDATE users SET last_login = NOW() WHERE id = ?", 
                    [$user['id']]
                );
                
                // Create session
                $sessionToken = self::createSession($user['id']);
                
                // Remove sensitive data
                unset($user['password_hash']);
                
                // Log authentication
                self::logAction($user['id'], 'login', 'auth', null, ['ip' => $_SERVER['REMOTE_ADDR']]);
                
                return [
                    'success' => true,
                    'user' => $user,
                    'token' => $sessionToken
                ];
            }
            
            return ['success' => false, 'message' => 'Invalid credentials'];
            
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Login failed'];
        }
    }
    
    /**
     * Create user session
     */
    private static function createSession($userId) {
        $sessionToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + self::$sessionTimeout);
        
        Database::execute(
            "INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)",
            [$userId, $sessionToken, $expiresAt]
        );
        
        return $sessionToken;
    }
    
    /**
     * Validate session token
     */
    public static function validateToken($token) {
        if (empty($token)) {
            return false;
        }
        
        $sql = "SELECT us.*, u.* FROM user_sessions us 
               JOIN users u ON us.user_id = u.id 
               WHERE us.session_token = ? AND us.expires_at > NOW() AND u.isActive = 1";
        
        $session = Database::fetchOne($sql, [$token]);
        
        if ($session) {
            // Extend session
            Database::execute(
                "UPDATE user_sessions SET expires_at = ? WHERE session_token = ?",
                [date('Y-m-d H:i:s', time() + self::$sessionTimeout), $token]
            );
            
            return $session;
        }
        
        return false;
    }
    
    /**
     * Get current user from request
     */
    public static function getCurrentUser() {
        $token = self::getBearerToken();
        if ($token) {
            return self::validateToken($token);
        }
        return false;
    }
    
    /**
     * Extract bearer token from request
     */
    private static function getBearerToken() {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            $auth = $headers['Authorization'];
            if (preg_match('/Bearer\s(\S+)/', $auth, $matches)) {
                return $matches[1];
            }
        }
        
        // Check for token in query parameter
        return $_GET['token'] ?? $_POST['token'] ?? null;
    }
    
    /**
     * Logout user
     */
    public static function logout($token = null) {
        if (!$token) {
            $token = self::getBearerToken();
        }
        
        if ($token) {
            $user = self::validateToken($token);
            if ($user) {
                // Log logout
                self::logAction($user['user_id'], 'logout', 'auth', null, ['ip' => $_SERVER['REMOTE_ADDR']]);
            }
            
            // Delete session
            Database::execute("DELETE FROM user_sessions WHERE session_token = ?", [$token]);
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if user has required role
     */
    public static function hasRole($user, $requiredRoles) {
        if (!$user || !isset($user['role'])) {
            return false;
        }
        
        if (is_string($requiredRoles)) {
            $requiredRoles = [$requiredRoles];
        }
        
        return in_array($user['role'], $requiredRoles);
    }
    
    /**
     * Require authentication
     */
    public static function requireAuth($requiredRoles = null) {
        $user = self::getCurrentUser();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            exit;
        }
        
        if ($requiredRoles && !self::hasRole($user, $requiredRoles)) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            exit;
        }
        
        return $user;
    }
    
    /**
     * Hash password
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }
    
    /**
     * Generate secure token
     */
    public static function generateToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    /**
     * Log user action
     */
    public static function logAction($userId, $action, $resourceType, $resourceId = null, $metadata = []) {
        try {
            $sql = "INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values, ip_address, user_agent) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            Database::execute($sql, [
                $userId,
                $action,
                $resourceType,
                $resourceId,
                json_encode($metadata),
                $_SERVER['REMOTE_ADDR'] ?? '',
                $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);
        } catch (Exception $e) {
            error_log("Audit log error: " . $e->getMessage());
        }
    }
    
    /**
     * Clean expired sessions
     */
    public static function cleanExpiredSessions() {
        Database::execute("DELETE FROM user_sessions WHERE expires_at < NOW()");
    }
    
    /**
     * Rate limiting
     */
    public static function checkRateLimit($identifier, $maxAttempts = 5, $timeWindow = 300) {
        // Simple file-based rate limiting for cPanel compatibility
        $rateLimitFile = sys_get_temp_dir() . '/rate_limit_' . md5($identifier);
        
        if (file_exists($rateLimitFile)) {
            $data = json_decode(file_get_contents($rateLimitFile), true);
            
            if ($data && isset($data['attempts'], $data['reset_time'])) {
                if (time() < $data['reset_time']) {
                    if ($data['attempts'] >= $maxAttempts) {
                        return false; // Rate limit exceeded
                    }
                    $data['attempts']++;
                } else {
                    // Reset window
                    $data = ['attempts' => 1, 'reset_time' => time() + $timeWindow];
                }
            } else {
                $data = ['attempts' => 1, 'reset_time' => time() + $timeWindow];
            }
        } else {
            $data = ['attempts' => 1, 'reset_time' => time() + $timeWindow];
        }
        
        file_put_contents($rateLimitFile, json_encode($data));
        return true;
    }
    
    /**
     * Validate email format
     */
    public static function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Validate password strength
     */
    public static function isStrongPassword($password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/', $password);
    }
    
    /**
     * CSRF token generation and validation
     */
    public static function generateCSRFToken() {
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    public static function validateCSRFToken($token) {
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }
}

/**
 * Security headers and CORS
 */
class Security {
    
    public static function setSecurityHeaders() {
        // CORS headers
        header('Access-Control-Allow-Origin: *'); // Adjust for production
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        // Security headers
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Content type
        header('Content-Type: application/json; charset=utf-8');
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }
    
    public static function sanitizeInput($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeInput'], $data);
        }
        return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
    }
    
    public static function validateInput($data, $rules) {
        $errors = [];
        
        foreach ($rules as $field => $rule) {
            $value = $data[$field] ?? null;
            
            if (isset($rule['required']) && $rule['required'] && empty($value)) {
                $errors[$field] = ucfirst($field) . ' is required';
                continue;
            }
            
            if (!empty($value)) {
                if (isset($rule['type'])) {
                    switch ($rule['type']) {
                        case 'email':
                            if (!Auth::isValidEmail($value)) {
                                $errors[$field] = 'Invalid email format';
                            }
                            break;
                        case 'numeric':
                            if (!is_numeric($value)) {
                                $errors[$field] = ucfirst($field) . ' must be numeric';
                            }
                            break;
                        case 'date':
                            if (!strtotime($value)) {
                                $errors[$field] = 'Invalid date format';
                            }
                            break;
                    }
                }
                
                if (isset($rule['min_length']) && strlen($value) < $rule['min_length']) {
                    $errors[$field] = ucfirst($field) . ' must be at least ' . $rule['min_length'] . ' characters';
                }
                
                if (isset($rule['max_length']) && strlen($value) > $rule['max_length']) {
                    $errors[$field] = ucfirst($field) . ' must not exceed ' . $rule['max_length'] . ' characters';
                }
            }
        }
        
        return $errors;
    }
}

// Initialize authentication
Auth::init();
?>
