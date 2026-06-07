<?php
function jsonResponse($code, $message, $data = null) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'code' => $code,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function success($data = null, $message = 'success') {
    jsonResponse(200, $message, $data);
}

function error($message = 'error', $code = 400) {
    jsonResponse($code, $message);
}

function formatDate($date, $format = 'Y-m-d H:i:s') {
    return date($format, strtotime($date));
}

function timeAgo($datetime) {
    $now = new DateTime();
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);

    if ($diff->y > 0) return $diff->y . '年前';
    if ($diff->m > 0) return $diff->m . '个月前';
    if ($diff->d > 0) return $diff->d . '天前';
    if ($diff->h > 0) return $diff->h . '小时前';
    if ($diff->i > 0) return $diff->i . '分钟前';
    return '刚刚';
}

function getPageParam($default = 1) {
    return max(1, intval($_GET['page'] ?? $default));
}

function getPageSizeParam($default = 10) {
    return min(100, max(1, intval($_GET['page_size'] ?? $default)));
}

function getQueryParam($key, $default = '') {
    return $_GET[$key] ?? $default;
}

function exportCSV($filename, $headers, $data) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '.csv"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM

    // 写入表头
    fputcsv($output, $headers);

    // 写入数据
    foreach ($data as $row) {
        fputcsv($output, $row);
    }

    fclose($output);
    exit;
}
