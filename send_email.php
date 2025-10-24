<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Настройки
$recipient_email = 'kovalev.vova@list.ru';

// Простая проверка на спам (без honeypot полей)
function is_spam($data) {
    // Проверка обязательных полей
    if (empty($data['name']) || empty($data['phone']) || empty($data['object_type'])) {
        return true;
    }

    // Проверка email (если указан)
    if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        return true;
    }

    // Проверка телефона (базовая)
    $digits = preg_replace('/\D/', '', $data['phone']);
    if (strlen($digits) < 10) {
        return true;
    }

    return false;
}

// Основной обработчик
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Получаем данные из запроса
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        echo json_encode(['success' => false, 'error' => 'invalid_json']);
        exit;
    }

    // Проверяем на спам
    if (is_spam($input)) {
        echo json_encode(['success' => false, 'error' => 'spam_detected']);
        exit;
    }

    // Очищаем данные
    $name = htmlspecialchars(trim($input['name']), ENT_QUOTES, 'UTF-8');
    $phone = htmlspecialchars(trim($input['phone']), ENT_QUOTES, 'UTF-8');
    $email = htmlspecialchars(trim($input['email']), ENT_QUOTES, 'UTF-8');
    $object_type = htmlspecialchars(trim($input['object_type']), ENT_QUOTES, 'UTF-8');
    $message = htmlspecialchars(trim($input['message']), ENT_QUOTES, 'UTF-8');

    // Тип объекта
    $object_types = [
        'apartment' => 'Квартира',
        'house' => 'Частный дом',
        'office' => 'Офис',
        'commercial' => 'Коммерческое помещение',
        'other' => 'Другое'
    ];
    $object_type_text = isset($object_types[$object_type]) ? $object_types[$object_type] : 'Не указано';

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
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>Новая заявка с сайта</h2>
        </div>
        <div class='content'>
            <div class='field'><span class='label'>Имя:</span> $name</div>
            <div class='field'><span class='label'>Телефон:</span> $phone</div>
            <div class='field'><span class='label'>Email:</span> " . ($email ? $email : 'Не указан') . "</div>
            <div class='field'><span class='label'>Тип объекта:</span> $object_type_text</div>
            <div class='field'><span class='label'>Сообщение:</span> " . ($message ? nl2br($message) : 'Не указано') . "</div>
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
    $subject = "Новая заявка: $name - $object_type_text";

    // Кодируем тему для UTF-8
    $subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

    if (mail($recipient_email, $subject, $email_body, $headers)) {
        echo json_encode(['success' => true, 'message' => 'Заявка успешно отправлена']);
    } else {
        echo json_encode(['success' => false, 'error' => 'email_send_failed']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'method_not_allowed']);
}
?>