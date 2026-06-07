<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$today = date('Y-m-d');

$stats = [
    'today_usage' => db()->count('tool_usage', "DATE(used_at) = ?", [$today]),
    'today_users' => db()->count('users', "DATE(created_at) = ?", [$today]),
    'total_users' => db()->count('users'),
    'total_usage' => db()->count('tool_usage'),
];

success($stats);
