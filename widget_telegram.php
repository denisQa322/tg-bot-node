<?php
function CheckWidgetAction($data)
{
    if (empty($data['message']['text']) && empty($data['message']['photo']) && empty($data['message']['video'])) {
        return false;
    }

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
    return false;
}
if (CheckWidgetAction(json_decode(file_get_contents("php://input"), TRUE))) {
    die;
}


?>
