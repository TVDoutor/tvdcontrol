<?php

/**
 * Response Helper - Consistent JSON responses
 */
class Response {
    /**
     * Send success response
     */
    public static function success($data = null, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    /**
     * Send error response
     */
    public static function error($message, $status = 400) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode(['error' => $message]);
        exit;
    }

    /**
     * Send unauthorized response
     */
    public static function unauthorized($message = 'Não autorizado') {
        self::error($message, 401);
    }

    /**
     * Send forbidden response
     */
    public static function forbidden($message = 'Acesso negado') {
        self::error($message, 403);
    }

    /**
     * Send not found response
     */
    public static function notFound($message = 'Não encontrado') {
        self::error($message, 404);
    }

    /**
     * Send no content response
     */
    public static function noContent() {
        http_response_code(204);
        exit;
    }
}
