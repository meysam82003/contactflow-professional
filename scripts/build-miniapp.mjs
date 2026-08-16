import fs from 'node:fs';
import path from 'node:path';

const source=path.resolve(process.argv[2]||'web');
const output=path.resolve(process.argv[3]||'build/miniapp');
if(!fs.existsSync(path.join(source,'index.html')))throw new Error(`Web core not found: ${source}`);
if(fs.existsSync(output)&&fs.readdirSync(output).length)throw new Error(`Output directory must be empty: ${output}`);
fs.mkdirSync(output,{recursive:true});
fs.cpSync(source,output,{recursive:true});
const sdk='<script src="https://telegram.org/js/telegram-web-app.js?63"></script>';
const runtime='<script>document.documentElement.dataset.contactflowMiniapp="true"</script>';
const bulkInfo='<article class="panel info-card"><div class="info-symbol">⇧</div><h3>خروجی تا یک‌میلیون</h3><p>پردازش به‌صورت Cursor و قطعه‌ای انجام می‌شود؛ هر فایل را مستقل با Save As ذخیره کنید.</p><div class="code-sample" id="export-examples">تهران ایرانسل_0001.vcf<br/>قم ایرانسل_0001.vcf<br/>مشهد ایرانسل_0001.vcf</div></article>';
const legacyInfo='<article class="panel info-card"><div class="info-symbol">⇧</div><h3>خروجی Chunked</h3><p>برای حجم بالا چند فایل تولید می‌شود. هر فایل را مستقل می‌توانید دانلود کنید.</p><div class="code-sample">Tehran_0001.vcf<br/>Tehran_0002.vcf<br/>Tehran_0003.vcf</div></article>';
const html=fs.readFileSync(path.join(output,'index.html'),'utf8')
  .replace('<script src="./bulk-vcf-export.js"></script>','')
  .replace(/<!-- BULK_VCF_START -->[\s\S]*?<!-- BULK_VCF_END -->/g,'')
  .replace(bulkInfo,legacyInfo)
  .replace('<title>',`${sdk}${runtime}<title>`);
fs.writeFileSync(path.join(output,'index.html'),html,'utf8');
fs.writeFileSync(path.join(output,'miniapp.html'),html,'utf8');
fs.rmSync(path.join(output,'bulk-vcf-export.js'),{force:true});
const sw=path.join(output,'sw.js');
fs.writeFileSync(sw,fs.readFileSync(sw,'utf8').replace("'./index.html'","'./index.html','./miniapp.html'").replace(",'./bulk-vcf-export.js'",''),'utf8');
fs.writeFileSync(path.join(output,'BUILD_INFO.txt'),`ContactFlow Personal Ultimate 3.6.0\nShared offline core: yes\nMillion-contact VCF module: excluded from Mini App\nAtomic import/merge: yes\nProvince/operator inference: yes\nCity intelligence: yes\nTelegram Mini App entry: miniapp.html\nTelegram contacts: Telegram Desktop export, no API ID/hash\nDevice contacts: permission/capability gated\nSave As: native picker when available\n`,'utf8');
console.log(JSON.stringify({source,output,version:'3.6.0',entry:'miniapp.html',telegramMode:'desktop_export_offline'}));
