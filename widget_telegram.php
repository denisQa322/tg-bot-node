<?
function CheckWidgetAction($data)
{
    if(empty($data['message']['text']))
    {
        return false;
    }
    $text = $data['message']['text'];

    if($text != '/start')
    {
        $ch = curl_init('https://telegramwh.omnidesk.ru/webhooks/telegram/7042/8fcf89793acb6780');
        curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt( $ch, CURLOPT_SSL_VERIFYHOST, 0 );
        curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );

        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

        $result = curl_exec($ch);
        $result = !empty($result) ? @json_decode($result,TRUE) : null;

        curl_close ($ch);
        if(isset($result['success']) && $result['success'] === '2' ) {
            return false;
        }
        elseif($result['success']) {
            return true;
        }
    }
    return FALSE;
}
   if(CheckWidgetAction(json_decode(file_get_contents("php://input"),TRUE)))
   {
       die;
   }
?>