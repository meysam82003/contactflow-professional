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

const appName = "ContactFlow Personal Ultimate"
const appVersion = "3.0.0-alpha.1"

var (
  user32 = syscall.NewLazyDLL("user32.dll")
  procMessageBoxW = user32.NewProc("MessageBoxW")
)

func utf16ptr(s string) *uint16 { p,_ := syscall.UTF16PtrFromString(s); return p }
func msg(text,title string,flags uintptr) int { r,_,_ := procMessageBoxW.Call(0,uintptr(unsafe.Pointer(utf16ptr(text))),uintptr(unsafe.Pointer(utf16ptr(title))),flags); return int(r) }
func run(name string,args ...string){ c:=exec.Command(name,args...); c.SysProcAttr=&syscall.SysProcAttr{HideWindow:true}; _ = c.Run() }
func ps(script string){ run("powershell.exe","-NoProfile","-ExecutionPolicy","Bypass","-Command",script) }
func installDir() string { return filepath.Join(os.Getenv("LOCALAPPDATA"),"Programs","ContactFlow Personal Ultimate") }
func q(s string) string { return strings.ReplaceAll(s,"'","''") }
func makeShortcut(link,target string){ ps(fmt.Sprintf("$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut('%s');$s.TargetPath='%s';$s.WorkingDirectory='%s';$s.Description='ContactFlow Personal Ultimate';$s.Save()",q(link),q(target),q(filepath.Dir(target)))) }
func removeLater(dir string){ script:=fmt.Sprintf("Start-Sleep -Milliseconds 800; Remove-Item -LiteralPath '%s' -Recurse -Force -ErrorAction SilentlyContinue",q(dir)); _ = exec.Command("powershell.exe","-NoProfile","-WindowStyle","Hidden","-Command",script).Start() }

func removeOldShortcuts(){
  oldDesktop := filepath.Join(os.Getenv("USERPROFILE"),"Desktop","ContactFlow Professional.lnk")
  oldStart := filepath.Join(os.Getenv("APPDATA"),"Microsoft","Windows","Start Menu","Programs","ContactFlow Professional.lnk")
  _ = os.Remove(oldDesktop)
  _ = os.Remove(oldStart)
}

func uninstall(){
  if msg("ContactFlow Personal Ultimate از این ویندوز حذف شود؟\n\nداده‌های مرورگر/IndexedDB به‌صورت خودکار حذف نمی‌شوند تا Backup شما از بین نرود.","حذف ContactFlow",0x00000004|0x00000020) != 6 { return }
  dir := installDir()
  run("taskkill.exe","/IM","ContactFlow.exe","/F")
  desktop := filepath.Join(os.Getenv("USERPROFILE"),"Desktop","ContactFlow Personal Ultimate.lnk")
  start := filepath.Join(os.Getenv("APPDATA"),"Microsoft","Windows","Start Menu","Programs","ContactFlow Personal Ultimate.lnk")
  _ = os.Remove(desktop); _ = os.Remove(start)
  run("reg.exe","delete",`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\ContactFlow Personal Ultimate`,"/f")
  msg("ContactFlow Personal Ultimate حذف شد.","ContactFlow",0x40)
  removeLater(dir)
}

func copySelf(dst string) error { src,err:=os.Executable(); if err!=nil{return err}; b,err:=os.ReadFile(src); if err!=nil{return err}; return os.WriteFile(dst,b,0755) }

func install() error {
  if msg("به نصب ContactFlow Personal Ultimate 3.0 خوش آمدید.\n\nاین نسخه Local-First است و Login، Register، Forgot Password و Server URL ندارد.","ContactFlow Setup",0x40) != 1 { return nil }
  if msg("برنامه برای همین کاربر ویندوز نصب شود؟\n\nمسیر نصب:\n%LOCALAPPDATA%\\Programs\\ContactFlow Personal Ultimate","آماده نصب",0x00000004|0x00000020) != 6 { return nil }

  dir := installDir()
  if err := os.MkdirAll(dir,0755); err != nil { return err }

  // Stop both old and new shell before replacing the payload.
  run("taskkill.exe","/IM","ContactFlow.exe","/F")
  removeOldShortcuts()

  b,err := payload.ReadFile("payload/ContactFlow.exe")
  if err != nil { return err }
  app := filepath.Join(dir,"ContactFlow.exe")
  if err = os.WriteFile(app,b,0755); err != nil { return err }

  un := filepath.Join(dir,"Uninstall ContactFlow.exe")
  if err = copySelf(un); err != nil { return err }

  desktop := filepath.Join(os.Getenv("USERPROFILE"),"Desktop","ContactFlow Personal Ultimate.lnk")
  startDir := filepath.Join(os.Getenv("APPDATA"),"Microsoft","Windows","Start Menu","Programs")
  _ = os.MkdirAll(startDir,0755)
  start := filepath.Join(startDir,"ContactFlow Personal Ultimate.lnk")
  makeShortcut(desktop,app)
  makeShortcut(start,app)

  key := `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\ContactFlow Personal Ultimate`
  run("reg.exe","add",key,"/v","DisplayName","/t","REG_SZ","/d",appName,"/f")
  run("reg.exe","add",key,"/v","DisplayVersion","/t","REG_SZ","/d",appVersion,"/f")
  run("reg.exe","add",key,"/v","UninstallString","/t","REG_SZ","/d",un,"/f")

  msg("نصب با موفقیت انجام شد.\n\nContactFlow مستقیم وارد Dashboard محلی می‌شود و هیچ حساب ContactFlow لازم نیست.","نصب کامل شد",0x40)
  _ = exec.Command(app).Start()
  return nil
}

func main(){
  exe,_ := os.Executable()
  if strings.Contains(strings.ToLower(filepath.Base(exe)),"uninstall") { uninstall(); time.Sleep(150*time.Millisecond); return }
  if err := install(); err != nil { msg("نصب انجام نشد:\n"+err.Error(),"ContactFlow Setup",0x10) }
}
