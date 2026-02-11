<?php

/**
 * Database class - Singleton pattern with PDO
 */
class Database {
    private static $instance = null;
    private $pdo = null;
    private $config = null;

    private function __construct() {
        $this->config = require __DIR__ . '/config.php';
        $this->connect();
    }

    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Establish PDO connection
     */
    private function connect() {
        $db = $this->config['db'];
        
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $db['host'],
            $db['port'],
            $db['database']
        );

        try {
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => true, // Connection pooling
            ];

            $this->pdo = new PDO($dsn, $db['user'], $db['password'], $options);
            
            error_log(sprintf(
                '[tvdcontrol-php] db: %s@%s:%d/%s',
                $db['user'],
                $db['host'],
                $db['port'],
                $db['database']
            ));
        } catch (PDOException $e) {
            error_log('[tvdcontrol-php] Database connection error: ' . $e->getMessage());
            throw new Exception('Database connection failed');
        }
    }

    /**
     * Get PDO instance
     */
    public function getPdo() {
        return $this->pdo;
    }

    /**
     * Execute a query and return all rows
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('[tvdcontrol-php] Query error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Execute a query and return single row
     */
    public function queryOne($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch();
            return $result ?: null;
        } catch (PDOException $e) {
            error_log('[tvdcontrol-php] QueryOne error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Execute a statement (INSERT, UPDATE, DELETE)
     * Returns affected rows count
     */
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log('[tvdcontrol-php] Execute error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get last insert ID
     */
    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }

    /**
     * Begin transaction
     */
    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public function commit() {
        return $this->pdo->commit();
    }

    /**
     * Rollback transaction
     */
    public function rollback() {
        return $this->pdo->rollBack();
    }

    /**
     * Execute within transaction
     */
    public function transaction($callback) {
        try {
            $this->beginTransaction();
            $result = $callback($this);
            $this->commit();
            return $result;
        } catch (Exception $e) {
            $this->rollback();
            throw $e;
        }
    }
}
