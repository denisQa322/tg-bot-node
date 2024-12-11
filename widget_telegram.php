<?php
function CheckWidgetAction($data)
{
    if (empty($data['message']['text']) && empty($data['photo_url']) && empty($data['video_url'])) {
        return false;
    }

    // Логируем данные для отладки
    file_put_contents('debug.log', "Полученные данные: " . print_r($data, true), FILE_APPEND);

    // Если есть текст сообщения
    $text = $data['message']['text'] ?? null;

    // Если нет текста, но есть фото или видео
    if (empty($text) && (isset($data['photo_url']) || isset($data['video_url']))) {
        $mediaUrl = $data['photo_url'] ?? $data['video_url'];
        $mediaType = isset($data['photo_url']) ? 'Фото' : 'Видео';

        // Логируем медиа
        file_put_contents('media.log', "$mediaType URL: $mediaUrl\n", FILE_APPEND);

        $data['message']['text'] = "$mediaType отправлено"; // Добавляем текст для Omnidesk

        // Отправляем в Omnidesk
        return sendToOmnidesk($data);
    }

    // Обработка сообщения с текстом
    if ($text !== '/start') {
        return sendToOmnidesk($data);
    }

    return false;
}

function sendToOmnidesk($data)
{
    $ch = curl_init('https://telegramwh.omnidesk.ru/webhooks/telegram/7037/de6bf551b7e2170e');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

    $result = curl_exec($ch);
    $resultDecoded = !empty($result) ? @json_decode($result, TRUE) : null;

    // Логируем результат
    file_put_contents('omnidesk.log', "Отправка данных: " . json_encode($data) . "\nРезультат: " . print_r($resultDecoded, true), FILE_APPEND);

    curl_close($ch);

    return isset($resultDecoded['success']) && $resultDecoded['success'] === true;
}

if (CheckWidgetAction(json_decode(file_get_contents("php://input"), TRUE))) {
    die;
}

?>
