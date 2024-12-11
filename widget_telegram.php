<?php
function CheckWidgetAction($data)
{
    if(empty($data['message']['text']) && empty($data['photo_url']) && empty($data['video_url']))
    {
        return false;
    }

    // Если есть текст сообщения
    $text = $data['message']['text'];

    // Если нет текста, но есть фото или видео
    if (empty($text) && (isset($data['photo_url']) || isset($data['video_url']))) {
        // Обработка фото
        if (isset($data['photo_url'])) {
            $mediaUrl = $data['photo_url'];
            // Например, сохраняем ссылку на фото в файл
            file_put_contents('photos.log', "Фото URL: $mediaUrl\n", FILE_APPEND);
        }

        // Обработка видео
        if (isset($data['video_url'])) {
            $mediaUrl = $data['video_url'];
            // Например, сохраняем ссылку на видео в файл
            file_put_contents('videos.log', "Видео URL: $mediaUrl\n", FILE_APPEND);
        }

        return true;
    }

    // Обработка сообщения с текстом
    if($text != '/start')
    {
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

if (CheckWidgetAction(json_decode(file_get_contents("php://input"), TRUE))) {
    die;
}
?>
