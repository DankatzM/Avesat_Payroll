<?php
/**
 * Main API Router for Avesat Payroll System
 * cPanel Compatible PHP Backend
 */

// Enable error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set timezone
date_default_timezone_set('Africa/Nairobi');

// Include required files
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth.php';

// Set security headers
Security::setSecurityHeaders();

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove /api prefix if present
$path = preg_replace('#^/api#', '', $path);
$path = trim($path, '/');

// Split path into segments
$segments = explode('/', $path);
$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;
$action = $segments[2] ?? null;

// Get request body for POST/PUT requests
$input = null;
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }
}

// Basic request logging
error_log("API Request: $method $path " . json_encode($input));

try {
    // Route the request
    switch ($resource) {
        case '':
        case 'health':
            handleHealthCheck();
            break;
            
        case 'auth':
            handleAuth($method, $action, $input);
            break;
            
        case 'users':
            handleUsers($method, $id, $action, $input);
            break;
            
        case 'employees':
            handleEmployees($method, $id, $action, $input);
            break;
            
        case 'payroll':
            handlePayroll($method, $id, $action, $input);
            break;
            
        case 'tax':
            handleTax($method, $id, $action, $input);
            break;
            
        case 'deductions':
            handleDeductions($method, $id, $action, $input);
            break;
            
        case 'leave':
            handleLeave($method, $id, $action, $input);
            break;
            
        case 'reports':
            handleReports($method, $id, $action, $input);
            break;
            
        case 'settings':
            handleSettings($method, $id, $action, $input);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}

/**
 * Health check endpoint
 */
function handleHealthCheck() {
    echo json_encode([
        'status' => 'ok',
        'timestamp' => date('c'),
        'version' => '1.0.0',
        'database' => Database::testConnection() ? 'connected' : 'disconnected'
    ]);
}

/**
 * Authentication endpoints
 */
function handleAuth($method, $action, $input) {
    switch ($action) {
        case 'login':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                return;
            }
            
            if (!isset($input['email'], $input['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Email and password required']);
                return;
            }
            
            // Rate limiting
            if (!Auth::checkRateLimit($input['email'] . '_' . $_SERVER['REMOTE_ADDR'])) {
                http_response_code(429);
                echo json_encode(['error' => 'Too many login attempts']);
                return;
            }
            
            $result = Auth::login($input['email'], $input['password']);
            
            if ($result['success']) {
                echo json_encode($result);
            } else {
                http_response_code(401);
                echo json_encode($result);
            }
            break;
            
        case 'logout':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                return;
            }
            
            Auth::logout();
            echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
            break;
            
        case 'me':
            if ($method !== 'GET') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                return;
            }
            
            $user = Auth::getCurrentUser();
            if ($user) {
                unset($user['password_hash']);
                echo json_encode(['user' => $user]);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Not authenticated']);
            }
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Auth endpoint not found']);
            break;
    }
}

/**
 * Users management
 */
function handleUsers($method, $id, $action, $input) {
    $user = Auth::requireAuth(['admin', 'hr_manager']);
    
    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single user
                $userData = Database::fetchOne(
                    "SELECT id, email, firstName, lastName, role, department, isActive, created_at, updated_at 
                     FROM users WHERE id = ?", 
                    [$id]
                );
                
                if ($userData) {
                    echo json_encode($userData);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'User not found']);
                }
            } else {
                // Get all users
                $users = Database::fetchAll(
                    "SELECT id, email, firstName, lastName, role, department, isActive, created_at, updated_at 
                     FROM users ORDER BY created_at DESC"
                );
                echo json_encode($users);
            }
            break;
            
        case 'POST':
            // Create user
            $required = ['email', 'firstName', 'lastName', 'role', 'password'];
            $missing = DatabaseUtils::validateRequired($input, $required);
            
            if (!empty($missing)) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields', 'fields' => $missing]);
                return;
            }
            
            if (!Auth::isValidEmail($input['email'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email format']);
                return;
            }
            
            if (!Auth::isStrongPassword($input['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Password too weak']);
                return;
            }
            
            $userId = DatabaseUtils::generateUUID();
            $passwordHash = Auth::hashPassword($input['password']);
            
            try {
                Database::execute(
                    "INSERT INTO users (id, email, firstName, lastName, role, department, password_hash) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [
                        $userId,
                        $input['email'],
                        $input['firstName'],
                        $input['lastName'],
                        $input['role'],
                        $input['department'] ?? null,
                        $passwordHash
                    ]
                );
                
                Auth::logAction($user['user_id'], 'create', 'user', $userId, $input);
                
                echo json_encode(['success' => true, 'id' => $userId]);
                
            } catch (PDOException $e) {
                if ($e->getCode() == 23000) { // Duplicate entry
                    http_response_code(409);
                    echo json_encode(['error' => 'Email already exists']);
                } else {
                    throw $e;
                }
            }
            break;
            
        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                return;
            }
            
            // Update user
            $updateFields = [];
            $params = [];
            
            foreach (['firstName', 'lastName', 'role', 'department', 'isActive'] as $field) {
                if (isset($input[$field])) {
                    $updateFields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }
            
            $params[] = $id;
            
            Database::execute(
                "UPDATE users SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?",
                $params
            );
            
            Auth::logAction($user['user_id'], 'update', 'user', $id, $input);
            
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                return;
            }
            
            // Soft delete
            Database::execute("UPDATE users SET isActive = 0 WHERE id = ?", [$id]);
            
            Auth::logAction($user['user_id'], 'delete', 'user', $id);
            
            echo json_encode(['success' => true]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}

/**
 * Include other endpoint handlers
 */
if (file_exists(__DIR__ . '/endpoints/employees.php')) {
    require_once __DIR__ . '/endpoints/employees.php';
} else {
    function handleEmployees($method, $id, $action, $input) {
        echo json_encode(['message' => 'Employees endpoint not implemented yet']);
    }
}

if (file_exists(__DIR__ . '/endpoints/payroll.php')) {
    require_once __DIR__ . '/endpoints/payroll.php';
} else {
    function handlePayroll($method, $id, $action, $input) {
        echo json_encode(['message' => 'Payroll endpoint not implemented yet']);
    }
}

if (file_exists(__DIR__ . '/endpoints/tax.php')) {
    require_once __DIR__ . '/endpoints/tax.php';
} else {
    function handleTax($method, $id, $action, $input) {
        echo json_encode(['message' => 'Tax endpoint not implemented yet']);
    }
}

function handleDeductions($method, $id, $action, $input) {
    echo json_encode(['message' => 'Deductions endpoint not implemented yet']);
}

function handleLeave($method, $id, $action, $input) {
    echo json_encode(['message' => 'Leave endpoint not implemented yet']);
}

function handleReports($method, $id, $action, $input) {
    echo json_encode(['message' => 'Reports endpoint not implemented yet']);
}

function handleSettings($method, $id, $action, $input) {
    echo json_encode(['message' => 'Settings endpoint not implemented yet']);
}
?>
