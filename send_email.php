<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://yourdomain.com'); // Замените на ваш домен
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

// Включить вывод ошибок для отладки (отключить в продакшене)
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

// Настройки
$recipient_email = 'kovalev.vova@mail.ru';
$max_requests_per_hour = 5;
$log_directory = __DIR__ . '/../logs/'; // Логи вне корневой директории
$log_file = $log_directory . 'form_requests.log';

// Создаем директорию для логов если не существует
if (!file_exists($log_directory)) {
    mkdir($log_directory, 0700, true);
}

// Функция для безопасного логирования
function log_request($ip, $data, $is_spam = false) {
    global $log_file;

    $timestamp = date('Y-m-d H:i:s');
    $status = $is_spam ? 'SPAM' : 'VALID';

    // Очищаем чувствительные данные для лога
    $log_data = $data;
    unset($log_data['csrf_token']);
    $log_data['phone'] = substr($data['phone'], 0, 3) . '***' . substr($data['phone'], -3);
    if (!empty($log_data['email'])) {
        $log_data['email'] = substr($data['email'], 0, 3) . '***' . strstr($data['email'], '@');
    }

    $log_entry = "[$timestamp] [$status] IP: $ip | Data: " . json_encode($log_data) . "\n";

    if (file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX) === false) {
        error_log("Cannot write to log file: $log_file");
    }
}

// Валидация email
function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Валидация телефона
function validate_phone($phone) {
    $cleaned = preg_replace('/[^\d+]/', '', $phone);
    $digits = preg_replace('/\D/', '', $cleaned);
    return strlen($digits) >= 10 && strlen($digits) <= 15;
}

// Проверка CSRF токена
function validate_csrf_token($token) {
    return !empty($token) && preg_match('/^csrf_[a-z0-9]+_\d+$/', $token);
}

// Проверка на спам
function is_spam($data, $ip) {
    // Проверка CSRF токена
    if (empty($data['csrf_token']) || !validate_csrf_token($data['csrf_token'])) {
        return true;
    }

    // Проверка honeypot полей
    if (!empty($data['company']) || !empty($data['email_confirm']) ||
        (isset($data['agree_terms']) && $data['agree_terms'] === '1')) {
        return true;
    }

    // Проверка обязательных полей
    if (empty($data['name']) || empty($data['phone']) || empty($data['security_question'])) {
        return true;
    }

    // Проверка длины имени
    if (strlen(trim($data['name'])) < 2 || strlen(trim($data['name'])) > 50) {
        return true;
    }

    // Проверка email (если указан)
    if (!empty($data['email']) && !validate_email($data['email'])) {
        return true;
    }

    // Проверка телефона
    if (!validate_phone($data['phone'])) {
        return true;
    }

    // Проверка слишком короткого сообщения (если указано)
    if (!empty($data['message']) && strlen(trim($data['message'])) < 5) {
        return true;
    }

    // Проверка слишком длинного сообщения
    if (!empty($data['message']) && strlen(trim($data['message'])) > 1000) {
        return true;
    }

    // Проверка частоты запросов
    global $max_requests_per_hour;
    if (check_request_frequency($ip, $max_requests_per_hour)) {
        return true;
    }

    return false;
}

// Проверка частоты запросов
function check_request_frequency($ip, $max_per_hour) {
    global $log_file;
    if (!file_exists($log_file)) return false;

    $one_hour_ago = time() - 3600;
    $ip_count = 0;

    $logs = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($logs as $log) {
        if (strpos($log, $ip) !== false && strpos($log, 'VALID') !== false) {
            preg_match('/\[(.*?)\]/', $log, $matches);
            if (isset($matches[1])) {
                $log_time = strtotime($matches[1]);
                if ($log_time >= $one_hour_ago) {
                    $ip_count++;
                }
            }
        }
    }

    return $ip_count >= $max_per_hour;
}

// Функция для отправки email через PHPMailer (рекомендуется)
function send_email_phpmailer($to, $subject, $body, $from_email, $from_name) {
    // Здесь должна быть реализация с PHPMailer
    // Это пример базовой реализации

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=utf-8\r\n";
    $headers .= "From: $from_name <$from_email>\r\n";
    $headers .= "Reply-To: $from_email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Кодируем тему в UTF-8
    $subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

    return mail($to, $subject, $body, $headers);
}

// Основной обработчик
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Получаем данные из запроса
    $input = json_decode(file_get_contents('php://input'), true);
    $ip = $_SERVER['REMOTE_ADDR'];

    // Проверяем на спам
    if (is_spam($input, $ip)) {
        log_request($ip, $input, true);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'spam_detected']);
        exit;
    }

    // Очищаем данные
    $name = htmlspecialchars(trim($input['name']), ENT_QUOTES, 'UTF-8');
    $phone = htmlspecialchars(trim($input['phone']), ENT_QUOTES, 'UTF-8');
    $email = htmlspecialchars(trim($input['email']), ENT_QUOTES, 'UTF-8');
    $security_question = htmlspecialchars(trim($input['security_question']), ENT_QUOTES, 'UTF-8');
    $message = htmlspecialchars(trim($input['message']), ENT_QUOTES, 'UTF-8');

    // Тип объекта
    $object_types = [
        'apartment' => 'Квартира',
        'house' => 'Частный дом',
        'office' => 'Офис',
        'commercial' => 'Коммерческое помещение',
        'other' => 'Другое'
    ];
    $object_type = isset($object_types[$security_question]) ? $object_types[$security_question] : 'Не указано';

    // Формируем тело письма
    $email_body = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset=\"utf-8\">
        <title>Новая заявка с сайта</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #d32f2f; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .field { margin-bottom: 15px; padding: 10px; background: white; border-left: 4px solid #d32f2f; }
            .label { font-weight: bold; color: #d32f2f; display: inline-block; width: 120px; }
            .footer { padding: 15px; text-align: center; background: #eee; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>🚨 Новая заявка с сайта Региональной пожарно-спасательной службы</h2>
        </div>
        <div class='content'>
            <div class='field'><span class='label'>👤 Имя:</span> $name</div>
            <div class='field'><span class='label'>📞 Телефон:</span> $phone</div>
            <div class='field'><span class='label'>✉️ Email:</span> " . ($email ? $email : 'Не указан') . "</div>
            <div class='field'><span class='label'>🏢 Тип объекта:</span> $object_type</div>
            <div class='field'><span class='label'>💬 Сообщение:</span> " . ($message ? nl2br($message) : 'Не указано') . "</div>
            <div class='field'><span class='label'>🌐 IP адрес:</span> $ip</div>
            <div class='field'><span class='label'>🕒 Время отправки:</span> " . date('d.m.Y H:i') . "</div>
        </div>
        <div class='footer'>
            <p>Это письмо было отправлено автоматически с сайта Региональной пожарно-спасательной службы</p>
        </div>
    </body>
    </html>
    ";

    // Отправляем письмо
    $subject = "🔥 Новая заявка: $name - $object_type";
    $from_email = "noreply@rpss.ru";
    $from_name = "Региональная пожарно-спасательная служба";

    if (send_email_phpmailer($recipient_email, $subject, $email_body, $from_email, $from_name)) {
        log_request($ip, $input, false);
        echo json_encode(['success' => true, 'message' => 'Заявка успешно отправлена']);
    } else {
        error_log("Failed to send email to: $recipient_email");
        echo json_encode(['success' => false, 'error' => 'email_send_failed']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'method_not_allowed']);
}
?>