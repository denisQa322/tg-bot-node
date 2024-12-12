<?php
function CheckWidgetAction($data)
{
    // Если в данных есть поле bot_reply, логируем его
    if (!empty($data['bot_reply'])) {
        file_put_contents('bot_replies.log', date('Y-m-d H:i:s') . " - Ответ бота: " . $data['bot_reply'] . PHP_EOL, FILE_APPEND);
        return true; // Можно вернуть true, так как это не ошибка
    }

    // Проверяем текст сообщения
    if (empty($data['message']['text'])) {
        return false;
    }
    $text = $data['message']['text'];

    // Если сообщение не /start, отправляем его в Omnidesk
    if ($text != '/start') {
        $ch = curl_init('https://telegramwh.omnidesk.ru/webhooks/telegram/7037/de6bf551b7e2170e');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

        $result = curl_exec($ch);
        $result = !empty($result) ? @json_decode($result, TRUE) : null;

        curl_close($ch);
        if (isset($result['success']) && $result['success'] === '2') {
            return false;
        } elseif ($result['success']) {
            return true;
        }
    }
    return false;
}

// Обработка входящих данных
if (CheckWidgetAction(json_decode(file_get_contents("php://input"), TRUE))) {
    die;
}
?>
