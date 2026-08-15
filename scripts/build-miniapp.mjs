import fs from 'node:fs';
import path from 'node:path';

const source=path.resolve(process.argv[2]||'web');
const output=path.resolve(process.argv[3]||'build/miniapp');
if(!fs.existsSync(path.join(source,'index.html')))throw new Error(`Web core not found: ${source}`);
if(fs.existsSync(output)&&fs.readdirSync(output).length)throw new Error(`Output directory must be empty: ${output}`);
fs.mkdirSync(output,{recursive:true});
fs.cpSync(source,output,{recursive:true});
const sdk='<script src="https://telegram.org/js/telegram-web-app.js?63"></script>';
const html=fs.readFileSync(path.join(output,'index.html'),'utf8').replace('<title>',`${sdk}<title>`);
fs.writeFileSync(path.join(output,'index.html'),html,'utf8');
fs.writeFileSync(path.join(output,'miniapp.html'),html,'utf8');
const sw=path.join(output,'sw.js');
fs.writeFileSync(sw,fs.readFileSync(sw,'utf8').replace("'./index.html'","'./index.html','./miniapp.html'"),'utf8');
fs.writeFileSync(path.join(output,'BUILD_INFO.txt'),`ContactFlow Personal Ultimate 3.3.0\nShared web core: yes\nTelegram Mini App entry: miniapp.html\nTelegram contacts: official User Session required\n`,'utf8');
console.log(JSON.stringify({source,output,version:'3.3.0',entry:'miniapp.html'}));
