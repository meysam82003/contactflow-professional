package main

import (
  "embed"
  "fmt"
  "os"
  "os/exec"
  "path/filepath"
  "strings"
  "syscall"
  "time"
  "unsafe"
)

//go:embed payload/ContactFlow.exe
var payload embed.FS

const appName="ContactFlow Professional"

var (
  user32=syscall.NewLazyDLL("user32.dll")
  procMessageBoxW=user32.NewProc("MessageBoxW")
)
func utf16ptr(s string)*uint16{p,_:=syscall.UTF16PtrFromString(s);return p}
func msg(text,title string,flags uintptr)int{r,_,_:=procMessageBoxW.Call(0,uintptr(unsafe.Pointer(utf16ptr(text))),uintptr(unsafe.Pointer(utf16ptr(title))),flags);return int(r)}
func run(name string,args ...string){c:=exec.Command(name,args...);c.SysProcAttr=&syscall.SysProcAttr{HideWindow:true};_ = c.Run()}
func ps(script string){run("powershell.exe","-NoProfile","-ExecutionPolicy","Bypass","-Command",script)}
func installDir()string{return filepath.Join(os.Getenv("LOCALAPPDATA"),"Programs","ContactFlow Professional")}
func q(s string)string{return strings.ReplaceAll(s,"'","''")}
func makeShortcut(link,target string){ps(fmt.Sprintf("$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut('%s');$s.TargetPath='%s';$s.WorkingDirectory='%s';$s.Description='ContactFlow Professional';$s.Save()",q(link),q(target),q(filepath.Dir(target))))}
func removeLater(dir string){script:=fmt.Sprintf("Start-Sleep -Milliseconds 800; Remove-Item -LiteralPath '%s' -Recurse -Force -ErrorAction SilentlyContinue",q(dir));_ = exec.Command("powershell.exe","-NoProfile","-WindowStyle","Hidden","-Command",script).Start()}
func uninstall(){
  if msg("ContactFlow Professional از این ویندوز حذف شود؟\n\nداده‌های مرورگر/IndexedDB به‌صورت خودکار حذف نمی‌شوند تا Backup شما از بین نرود.","حذف ContactFlow",0x00000004|0x00000020)!=6{return}
  dir:=installDir();run("taskkill.exe","/IM","ContactFlow.exe","/F")
  desktop:=filepath.Join(os.Getenv("USERPROFILE"),"Desktop","ContactFlow Professional.lnk")
  start:=filepath.Join(os.Getenv("APPDATA"),"Microsoft","Windows","Start Menu","Programs","ContactFlow Professional.lnk")
  _=os.Remove(desktop);_=os.Remove(start)
  run("reg.exe","delete",`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\ContactFlow Professional`,"/f")
  msg("ContactFlow حذف شد.","ContactFlow",0x40);removeLater(dir)
}
func copySelf(dst string)error{src,err:=os.Executable();if err!=nil{return err};b,err:=os.ReadFile(src);if err!=nil{return err};return os.WriteFile(dst,b,0755)}
func install()error{
  if msg("به نصب ContactFlow Professional 1.2 خوش آمدید.\n\nاین نسخه به Python نیاز ندارد و برای حساب/Sync می‌تواند به Gateway خصوصی شما متصل شود.","ContactFlow Setup",0x40)!=1{return nil}
  if msg("برنامه برای همین کاربر ویندوز نصب شود؟\n\nمسیر نصب:\n%LOCALAPPDATA%\\Programs\\ContactFlow Professional","آماده نصب",0x00000004|0x00000020)!=6{return nil}
  dir:=installDir();if err:=os.MkdirAll(dir,0755);err!=nil{return err};run("taskkill.exe","/IM","ContactFlow.exe","/F")
  b,err:=payload.ReadFile("payload/ContactFlow.exe");if err!=nil{return err};app:=filepath.Join(dir,"ContactFlow.exe");if err=os.WriteFile(app,b,0755);err!=nil{return err}
  un:=filepath.Join(dir,"Uninstall ContactFlow.exe");if err=copySelf(un);err!=nil{return err}
  desktop:=filepath.Join(os.Getenv("USERPROFILE"),"Desktop","ContactFlow Professional.lnk")
  startDir:=filepath.Join(os.Getenv("APPDATA"),"Microsoft","Windows","Start Menu","Programs");_ = os.MkdirAll(startDir,0755);start:=filepath.Join(startDir,"ContactFlow Professional.lnk")
  makeShortcut(desktop,app);makeShortcut(start,app)
  run("reg.exe","add",`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\ContactFlow Professional`,"/v","DisplayName","/t","REG_SZ","/d",appName,"/f")
  run("reg.exe","add",`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\ContactFlow Professional`,"/v","DisplayVersion","/t","REG_SZ","/d","1.2.0","/f")
  run("reg.exe","add",`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\ContactFlow Professional`,"/v","UninstallString","/t","REG_SZ","/d",un,"/f")
  msg("نصب با موفقیت انجام شد.\n\nمی‌توانید ContactFlow را از Desktop یا Start Menu اجرا کنید.","نصب کامل شد",0x40)
  _ = exec.Command(app).Start();return nil
}
func main(){exe,_:=os.Executable();if strings.Contains(strings.ToLower(filepath.Base(exe)),"uninstall"){uninstall();time.Sleep(150*time.Millisecond);return};if err:=install();err!=nil{msg("نصب انجام نشد:\n"+err.Error(),"ContactFlow Setup",0x10)}}
