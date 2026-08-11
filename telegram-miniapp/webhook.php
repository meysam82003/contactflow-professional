<?php
require __DIR__.'/lib.php';
$cfg=cf_config(); if(!$cfg){http_response_code(503);exit('not configured');}
$secret=$_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN']??''; if(!hash_equals((string)$cfg['webhook_secret'],(string)$secret)){http_response_code(403);exit('forbidden');}
$u=json_decode(file_get_contents('php://input'),true); if(!is_array($u)){http_response_code(200);exit('ok');}
try{
  if(isset($u['business_connection'])){
    $bc=$u['business_connection']; $id=(string)($bc['id']??''); if($id){$xs=cf_read_json('connections',[]); $old=$xs[$id]??[]; $user=$bc['user']??[]; $xs[$id]=array_merge($old,['id'=>$id,'user_id'=>(string)($user['id']??''),'user_chat_id'=>(string)($bc['user_chat_id']??''),'first_name'=>$user['first_name']??'','last_name'=>$user['last_name']??'','username'=>$user['username']??'','date'=>(int)($bc['date']??time()),'enabled'=>(bool)($bc['is_enabled']??false),'rights'=>$bc['rights']??[],'updated_at'=>time()]); cf_write_json('connections',$xs);}
  }
  foreach(['business_message','edited_business_message'] as $field){
    if(isset($u[$field])){$m=$u[$field];$cid=(string)($m['business_connection_id']??'');$chat=$m['chat']??[];$chatId=(string)($chat['id']??'');if($cid&&$chatId){$ch=cf_read_json('business_chats',[]);$key=$cid.':'.$chatId;$ch[$key]=['connection_id'=>$cid,'chat_id'=>$chatId,'type'=>$chat['type']??'','first_name'=>$chat['first_name']??'','last_name'=>$chat['last_name']??'','username'=>$chat['username']??'','title'=>$chat['title']??'','last_message_at'=>(int)($m['date']??time()),'updated_at'=>time()];cf_write_json('business_chats',$ch);}}
  }
  if(isset($u['message'])){
    $m=$u['message']; $chat=$m['chat']??[]; if(($chat['type']??'')==='private'){
      $from=$m['from']??[]; $text=trim((string)($m['text']??'')); if(isset($from['id'])) cf_upsert_subscriber($from,null);
      if(preg_match('~^/start(?:@\w+)?(?:\s+.*)?$~i',$text)){
        $codes=cf_read_json('pair_codes',[]); foreach($codes as $k=>$r)if(($r['expires']??0)<time())unset($codes[$k]); do{$code=(string)random_int(100000,999999);}while(isset($codes[$code])); $codes[$code]=['user_id'=>(string)$from['id'],'chat_id'=>(string)$chat['id'],'user'=>$from,'expires'=>time()+600]; cf_write_json('pair_codes',$codes);
        $mini=cf_base_url().'/miniapp.html'; $txt="<b>ContactFlow Pair Code</b>\n\nکد اتصال این حساب:\n<code>{$code}</code>\n\n1) این کد را داخل ContactFlow وارد کنید.\n2) سپس در Telegram → Settings → Telegram Business → Chatbots همین Bot (@".htmlspecialchars($cfg['bot_username']).") را متصل کنید و دسترسی چت‌های موردنظر را بدهید.\n\nکد ۱۰ دقیقه اعتبار دارد. /subscribe برای رضایت پیام‌های تبلیغاتی.";
        cf_send($chat['id'],$txt,['reply_markup'=>json_encode(['inline_keyboard'=>[[['text'=>'باز کردن Mini App','web_app'=>['url'=>$mini]]]]])]);
      }elseif(preg_match('~^/subscribe(?:@\w+)?$~i',$text)){cf_upsert_subscriber($from,true);cf_send($chat['id'],'✅ رضایت پیام ثبت شد. هر زمان خواستید /stop بزنید.');}
      elseif(preg_match('~^/stop(?:@\w+)?$~i',$text)){cf_upsert_subscriber($from,false);cf_send($chat['id'],'⛔ رضایت پیام لغو شد.');}
      elseif(preg_match('~^/status(?:@\w+)?$~i',$text)){$cs=cf_read_json('connections',[]);$n=0;foreach($cs as $c)if((string)($c['user_id']??'')===(string)$from['id']&&!empty($c['enabled']))$n++;$sub=cf_read_json('subscribers',[]);$opt=!empty($sub[(string)$from['id']]['optin']);cf_send($chat['id'],'وضعیت: '.($n?'✅ Business متصل':'○ Business هنوز متصل نشده').' | رضایت پیام: '.($opt?'✅':'⛔'));}
    }
  }
}catch(Throwable $e){ error_log('ContactFlow webhook: '.$e->getMessage()); }
http_response_code(200); echo 'ok';
