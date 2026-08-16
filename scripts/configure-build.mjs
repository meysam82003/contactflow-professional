import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'web');
const target=path.join(root,'config.js');
if(!fs.existsSync(target))throw new Error(`config.js not found in ${root}`);
const config={
  edition:'Personal Ultimate 3.6',version:'3.6.0',
  telegramApiId:0,telegramApiHash:'',
  googleClientId:String(process.env.GOOGLE_CLIENT_ID||'').trim(),
  miniAppUrl:String(process.env.MINIAPP_URL||'').trim(),
  botUsername:String(process.env.TELEGRAM_BOT_USERNAME||'').trim().replace(/^@/,''),
  telegramMode:'desktop_export_offline',telegramPrimaryMode:'desktop_export_offline',telegramNativeAppConfigured:false
};
fs.writeFileSync(target,`window.CONTACTFLOW_CONFIG=${JSON.stringify(config)};\n`,'utf8');
process.stdout.write(JSON.stringify({version:config.version,telegramMode:config.telegramMode,telegramConfigured:false,googleConfigured:!!config.googleClientId,miniAppConfigured:!!config.miniAppUrl}));
