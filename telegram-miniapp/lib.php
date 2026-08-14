<?php
const CF_VERSION = '3.2.0-business-hotfix';
function cf_storage_dir(){ $d=__DIR__.'/storage'; if(!is_dir($d)) @mkdir($d,0700,true); return $d; }
function cf_config_path(){ return cf_storage_dir().'/config.php'; }
function cf_config(){ $p=cf_config_path(); if(!is_file($p)) return null; $c=include $p; return is_array($c)?$c:null; }
function cf_base_url(){
  $https=(!empty($_SERVER['HTTPS'])&&strtolower((string)$_SERVER['HTTPS'])!=='off')||((int)($_SERVER['SERVER_PORT']??0)===443)||strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO']??''))==='https';
  $scheme=$https?'https':'http'; $host=$_SERVER['HTTP_HOST']??'localhost'; $dir=rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME']??'/')),'/');
  return $scheme.'://'.$host.($dir==='/'?'':$dir);
}
function cf_json($data,$status=200){ http_response_code($status); header('Content-Type: application/json; charset=utf-8'); echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
function cf_cors(){
  header('Access-Control-Allow-Origin: *'); header('Access-Control-Allow-Headers: Authorization, Content-Type, X-ContactFlow-Token, X-Telegram-Init-Data'); header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  if(($_SERVER['REQUEST_METHOD']??'GET')==='OPTIONS'){ http_response_code(204); exit; }
}
function cf_read_json($name,$default=[]){ $p=cf_storage_dir().'/'.$name.'.json'; if(!is_file($p)) return $default; $fp=@fopen($p,'rb'); if(!$fp) return $default; @flock($fp,LOCK_SH); $raw=stream_get_contents($fp); @flock($fp,LOCK_UN); fclose($fp); $j=json_decode($raw,true); return is_array($j)?$j:$default; }
function cf_write_json($name,$data){ $p=cf_storage_dir().'/'.$name.'.json'; $tmp=$p.'.tmp.'.bin2hex(random_bytes(4)); $raw=json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT); file_put_contents($tmp,$raw,LOCK_EX); @chmod($tmp,0600); rename($tmp,$p); }
function cf_body(){ $raw=file_get_contents('php://input'); $j=json_decode($raw,true); if(is_array($j)) return $j; return $_POST; }
function cf_token(){ return bin2hex(random_bytes(32)); }
function cf_tg($method,$params=[]){
  $c=cf_config(); if(!$c||empty($c['bot_token'])) throw new RuntimeException('Bot gateway not configured');
  $url='https://api.telegram.org/bot'.$c['bot_token'].'/'.$method;
  if(function_exists('curl_init')){ $ch=curl_init($url); curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$params,CURLOPT_TIMEOUT=>25,CURLOPT_CONNECTTIMEOUT=>8]); $raw=curl_exec($ch); $err=curl_error($ch); curl_close($ch); if($raw===false) throw new RuntimeException($err?:'Telegram request failed'); }
  else { $ctx=stream_context_create(['http'=>['method'=>'POST','header'=>'Content-Type: application/x-www-form-urlencoded\r\n','content'=>http_build_query($params),'timeout'=>25,'ignore_errors'=>true]]); $raw=file_get_contents($url,false,$ctx); if($raw===false) throw new RuntimeException('Telegram request failed'); }
  $j=json_decode($raw,true); if(!is_array($j)) throw new RuntimeException('Telegram invalid response'); return $j;
}
function cf_send($chatId,$text,$extra=[]){ return cf_tg('sendMessage',array_merge(['chat_id'=>(string)$chatId,'text'=>$text,'parse_mode'=>'HTML','disable_web_page_preview'=>'true'],$extra)); }
function cf_auth_client(){
  $h=$_SERVER['HTTP_AUTHORIZATION']??''; $raw=''; if(preg_match('/^Bearer\s+(.+)$/i',$h,$m)) $raw=trim($m[1]); if(!$raw) $raw=trim((string)($_SERVER['HTTP_X_CONTACTFLOW_TOKEN']??'')); if(!$raw) cf_json(['ok'=>false,'error'=>'pairing_required'],401);
  $clients=cf_read_json('clients',[]); $key=hash('sha256',$raw); if(empty($clients[$key])) cf_json(['ok'=>false,'error'=>'invalid_pairing'],401); $row=$clients[$key]; if(!empty($row['revoked'])) cf_json(['ok'=>false,'error'=>'pairing_revoked'],401); $row['_token_hash']=$key; return $row;
}
function cf_scoped_connection($client,$id){ $xs=cf_read_json('connections',[]); $c=$xs[$id]??null; if(!$c || (string)($c['user_id']??'')!==(string)$client['user_id']) cf_json(['ok'=>false,'error'=>'connection_not_found'],404); return $c; }
function cf_validate_init_data($raw,$maxAge=86400){
  $cfg=cf_config(); if(!$cfg||empty($cfg['bot_token'])||!$raw) return null; parse_str($raw,$d); $hash=$d['hash']??''; if(!$hash) return null; unset($d['hash']); unset($d['signature']); ksort($d,SORT_STRING); $parts=[]; foreach($d as $k=>$v)$parts[]=$k.'='.$v; $check=implode("\n",$parts);
  $secret=hash_hmac('sha256',$cfg['bot_token'],'WebAppData',true); $calc=hash_hmac('sha256',$check,$secret); if(!hash_equals($calc,$hash)) return null; $auth=(int)($d['auth_date']??0); if($auth && abs(time()-$auth)>$maxAge) return null; $u=json_decode($d['user']??'{}',true); return is_array($u)&&isset($u['id'])?$u:null;
}
function cf_upsert_subscriber($user,$optin=null){ $s=cf_read_json('subscribers',[]); $id=(string)$user['id']; $r=$s[$id]??['user_id'=>$id,'optin'=>false,'created_at'=>time()]; foreach(['first_name','last_name','username'] as $k) if(isset($user[$k]))$r[$k]=$user[$k]; if($optin!==null){$r['optin']=(bool)$optin;$r['consent_at']=time();} $r['updated_at']=time(); $s[$id]=$r; cf_write_json('subscribers',$s); return $r; }
function cf_safe_text($s,$max=3500){ $s=trim((string)$s); if(function_exists('mb_strlen')){ if(mb_strlen($s,'UTF-8')>$max)$s=mb_substr($s,0,$max,'UTF-8'); } else { if(strlen($s)>$max)$s=substr($s,0,$max); } return $s; }
