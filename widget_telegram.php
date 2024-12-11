<?php
function CheckWidgetAction($data)
{
    if (empty($data['message'])) {
        return false;
    }

    // Проверка текста
    if (!empty($data['message']['text']) && $data['message']['text'] != '/start') {
        return sendToWebhook($data);
    }

    // Проверка фото
    if (!empty($data['message']['photo'])) {
        $fileId = end($data['message']['photo'])['file_id']; // Берем самое большое фото
        $fileUrl = getTelegramFileUrl($fileId);
        if ($fileUrl) {
            $data['file_url'] = $fileUrl;
            return sendToWebhook($data);
        }
    }

    // Проверка видео
    if (!empty($data['message']['video'])) {
        $fileId = $data['message']['video']['file_id'];
        $fileUrl = getTelegramFileUrl($fileId);
        if ($fileUrl) {
            $data['file_url'] = $fileUrl;
            return sendToWebhook($data);
        }
    }

    return false;
}

function getTelegramFileUrl($fileId)
{
    $telegramToken = 'YOUR_TELEGRAM_BOT_TOKEN';
    $url = "https://api.telegram.org/bot$telegramToken/getFile?file_id=$fileId";

    $response = file_get_contents($url);
    $result = json_decode($response, true);

    if (!empty($result['result']['file_path'])) {
        $filePath = $result['result']['file_path'];
        return "https://api.telegram.org/file/bot$telegramToken/$filePath";
    }

    return false;
}

function sendToWebhook($data)
{
    $ch = curl_init('https://telegramwh.omnidesk.ru/webhooks/telegram/7037/de6bf551b7e2170e');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

    $result = curl_exec($ch);
    $result = !empty($result) ? @json_decode($result, true) : null;

    curl_close($ch);

    if (isset($result['success']) && $result['success'] === '2') {
        return false;
    } elseif (!empty($result['success'])) {
        return true;
    }

    return false;
}

if (CheckWidgetAction(json_decode(file_get_contents("php://input"), true))) {
    die;
}
?>
