<?php
require __DIR__.'/lib.php';
$cfg=cf_config();if(!$cfg)die("not configured\n");
$key=$argv[1]??($_GET['key']??'');if(!hash_equals((string)$cfg['cron_key'],(string)$key))die("forbidden\n");
$jobs=cf_read_json('jobs',[]);$processed=0;
foreach($jobs as $id=>&$j){
  if($processed>=15)break;
  if(!in_array($j['status'],['queued','running','waiting'],true)||!empty($j['cancelled'])||($j['next_run']??0)>time())continue;
  for($k=0;$k<3&&$j['cursor']<count($j['targets']);$k++){
    $t=$j['targets'][$j['cursor']];$r=cf_tg('sendMessage',['business_connection_id'=>$j['connection_id'],'chat_id'=>(string)$t['chat_id'],'text'=>$j['text'],'disable_web_page_preview'=>'true']);
    if(!empty($r['ok'])){$j['sent']++;$j['cursor']++;}
    else if(($r['error_code']??0)==429){$j['next_run']=time()+max(1,(int)($r['parameters']['retry_after']??30));$j['status']='waiting';break;}
    else{$j['failed']++;$j['cursor']++;}
    $processed++;usleep(500000);
  }
  if($j['cursor']>=count($j['targets']))$j['status']='done';else if($j['status']!=='waiting')$j['status']='running';$j['updated_at']=time();
}
unset($j);cf_write_json('jobs',$jobs);echo "processed={$processed}\n";
