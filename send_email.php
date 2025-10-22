<?php
// Настройки
$recipient_email = 'kovalev.vova@mail.ru'; // Замените на вашу почту
$max_requests_per_hour = 5; // Максимальное количество запросов с одного IP в час

// Функция для логирования
function log_request($ip, $data, $is_spam = false) {
    $log_file = 'form_requests.log';
    $timestamp = date('Y-m-d H:i:s');
    $status = $is_spam ? 'SPAM' : 'VALID';
    $log_entry = "[$timestamp] [$status] IP: $ip | Data: " . json_encode($data) . "\n";
    file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX);
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

// Проверка на спам
function is_spam($data, $ip) {
    // Проверка honeypot полей
    if (!empty($data['company']) || !empty($data['email_confirm']) ||
        (isset($data['agree_terms']) && $data['agree_terms'] === '1')) {
        return true;
    }

    // Проверка обязательных полей
    if (empty($data['name']) || empty($data['phone']) || empty($data['security_question'])) {
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


    // Проверка частоты запросов
    global $max_requests_per_hour;
    if (check_request_frequency($ip, $max_requests_per_hour)) {
        return true;
    }

    return false;
}

// Проверка частоты запросов
function check_request_frequency($ip, $max_per_hour) {
    $log_file = 'form_requests.log';
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
    $name = htmlspecialchars(trim($input['name']));
    $phone = htmlspecialchars(trim($input['phone']));
    $email = htmlspecialchars(trim($input['email']));
    $security_question = htmlspecialchars(trim($input['security_question']));
    $message = htmlspecialchars(trim($input['message']));

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
    <html>
    <head>
        <title>Новая заявка с сайта</title>
        <style>
            body { font-family: Arial, sans-serif; }
            .header { background: #d32f2f; color: white; padding: 20px; }
            .content { padding: 20px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>Новая заявка с сайта Региональной пожарно-спасательной службы</h2>
        </div>
        <div class='content'>
            <div class='field'><span class='label'>Имя:</span> $name</div>
            <div class='field'><span class='label'>Телефон:</span> $phone</div>
            <div class='field'><span class='label'>Email:</span> " . ($email ? $email : 'Не указан') . "</div>
            <div class='field'><span class='label'>Тип объекта:</span> $object_type</div>
            <div class='field'><span class='label'>Сообщение:</span> " . ($message ? $message : 'Не указано') . "</div>
            <div class='field'><span class='label'>IP адрес:</span> $ip</div>
            <div class='field'><span class='label'>Время отправки:</span> " . date('d.m.Y H:i') . "</div>
        </div>
    </body>
    </html>
    ";

    // Заголовки письма
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=utf-8\r\n";
    $headers .= "From: Региональная пожарно-спасательная служба <noreply@rpss.ru>\r\n";
    if (!empty($email)) {
        $headers .= "Reply-To: $email\r\n";
    }

    // Отправляем письмо
    $subject = "Новая заявка: $name - $object_type";

    if (mail($recipient_email, $subject, $email_body, $headers)) {
        log_request($ip, $input, false);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'method_not_allowed']);
}
?>