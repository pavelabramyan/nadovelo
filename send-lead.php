<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method'], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    $data = $_POST;
}

if (!empty($data['website'])) {
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

function nado_len(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function nado_cut(string $value, int $max): string
{
    if (nado_len($value) <= $max) {
        return $value;
    }
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}

$name = trim((string) ($data['name'] ?? ''));
$phone = trim((string) ($data['phone'] ?? ''));
$comment = trim((string) ($data['comment'] ?? ''));

if ($name === '' || nado_len($name) > 100) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'name'], JSON_UNESCAPED_UNICODE);
    exit;
}

$digits = preg_replace('/\D+/', '', $phone);
if (!is_string($digits) || strlen($digits) !== 11) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'phone'], JSON_UNESCAPED_UNICODE);
    exit;
}

$comment = nado_cut($comment, 2000);
$to = 'info@nadovelo.ru';
$subject = 'Заявка с сайта НадоВело';
$body = "Имя: {$name}\nТелефон: {$phone}\n";
if ($comment !== '') {
    $body .= "Комментарий: {$comment}\n";
}
$body .= "\nСтраница: " . (string) ($_SERVER['HTTP_REFERER'] ?? '-') . "\n";
$body .= 'Время: ' . gmdate('Y-m-d H:i:s') . " UTC\n";

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$fromName = '=?UTF-8?B?' . base64_encode('НадоВело') . '?=';
$headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: ' . $fromName . ' <info@nadovelo.ru>',
    'Reply-To: info@nadovelo.ru',
    'X-Mailer: NadoVelo-Site',
]);

$sent = @mail($to, $encodedSubject, $body, $headers, '-finfo@nadovelo.ru');
if (!$sent) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'mail'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
