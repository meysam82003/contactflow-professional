import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'web');
const target=path.join(root,'config.js');
if(!fs.existsSync(target))throw new Error(`config.js not found in ${root}`);
const apiId=Number(String(process.env.TELEGRAM_API_ID||'').trim())||0;
const apiHash=String(process.env.TELEGRAM_API_HASH||'').trim();
if((apiId||apiHash)&&(!Number.isInteger(apiId)||apiId<=0||!/^[a-f0-9]{32}$/i.test(apiHash)))throw new Error('TELEGRAM_API_ID/HASH must be a valid pair; API hash must be 32 hexadecimal characters');
const config={
  edition:'Personal Ultimate 3.5',version:'3.5.0',
  telegramApiId:apiId,telegramApiHash:apiHash,
  googleClientId:String(process.env.GOOGLE_CLIENT_ID||'').trim(),
  miniAppUrl:String(process.env.MINIAPP_URL||'').trim(),
  botUsername:String(process.env.TELEGRAM_BOT_USERNAME||'').trim().replace(/^@/,''),
  telegramMode:'user_session_optional',telegramNativeAppConfigured:false
};
fs.writeFileSync(target,`window.CONTACTFLOW_CONFIG=${JSON.stringify(config)};\n`,'utf8');
process.stdout.write(JSON.stringify({version:config.version,telegramConfigured:!!(apiId&&apiHash),googleConfigured:!!config.googleClientId,miniAppConfigured:!!config.miniAppUrl}));
