<?php
session_start();

// Check if user is authenticated
if (isset($_SESSION['user']) && isset($_SESSION['token'])) {
    // Redirect to dashboard
    header('Location: /dashboard');
    exit;
} else {
    // Redirect to login
    header('Location: /login');
    exit;
}
