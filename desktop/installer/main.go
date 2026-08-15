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
const appVersion = "3.4.0"

var (
	user32          = syscall.NewLazyDLL("user32.dll")
	procMessageBoxW = user32.NewProc("MessageBoxW")
)

func utf16ptr(s string) *uint16 { p, _ := syscall.UTF16PtrFromString(s); return p }
func msg(text, title string, flags uintptr) int {
	r, _, _ := procMessageBoxW.Call(0, uintptr(unsafe.Pointer(utf16ptr(text))), uintptr(unsafe.Pointer(utf16ptr(title))), flags)
	return int(r)
}
func run(name string, args ...string) {
	c := exec.Command(name, args...)
	c.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	_ = c.Run()
}
func ps(script string) {
	run("powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script)
}
func installDir() string {
	return filepath.Join(os.Getenv("LOCALAPPDATA"), "Programs", "ContactFlow Personal Ultimate")
}
func q(s string) string { return strings.ReplaceAll(s, "'", "''") }
func makeShortcut(link, target string) {
	ps(fmt.Sprintf("$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut('%s');$s.TargetPath='%s';$s.WorkingDirectory='%s';$s.Description='ContactFlow Personal Ultimate';$s.Save()", q(link), q(target), q(filepath.Dir(target))))
}
func removeLater(dir string) {
	script := fmt.Sprintf("Start-Sleep -Milliseconds 800; Remove-Item -LiteralPath '%s' -Recurse -Force -ErrorAction SilentlyContinue", q(dir))
	_ = exec.Command("powershell.exe", "-NoProfile", "-WindowStyle", "Hidden", "-Command", script).Start()
}
func removeOldShortcuts() {
	for _, p := range []string{filepath.Join(os.Getenv("USERPROFILE"), "Desktop", "ContactFlow Professional.lnk"), filepath.Join(os.Getenv("APPDATA"), "Microsoft", "Windows", "Start Menu", "Programs", "ContactFlow Professional.lnk")} {
		_ = os.Remove(p)
	}
}
func uninstall() {
	if msg("ContactFlow Personal Ultimate از این ویندوز حذف شود؟\n\nداده‌های IndexedDB به‌صورت خودکار حذف نمی‌شوند تا Backup از بین نرود.", "حذف ContactFlow", 0x00000004|0x00000020) != 6 {
		return
	}
	dir := installDir()
	run("taskkill.exe", "/IM", "ContactFlow.exe", "/F")
	_ = os.Remove(filepath.Join(os.Getenv("USERPROFILE"), "Desktop", "ContactFlow Personal Ultimate.lnk"))
	_ = os.Remove(filepath.Join(os.Getenv("APPDATA"), "Microsoft", "Windows", "Start Menu", "Programs", "ContactFlow Personal Ultimate.lnk"))
	run("reg.exe", "delete", `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\ContactFlow Personal Ultimate`, "/f")
	msg("ContactFlow Personal Ultimate حذف شد.", "ContactFlow", 0x40)
	removeLater(dir)
}
func copySelf(dst string) error {
	src, e := os.Executable()
	if e != nil {
		return e
	}
	b, e := os.ReadFile(src)
	if e != nil {
		return e
	}
	return os.WriteFile(dst, b, 0755)
}
func install() error {
	if msg("به نصب ContactFlow Personal Ultimate 3.4 خوش آمدید.\n\nهسته مشترک Import/Merge هوشمند برای Desktop، Android، PWA و Telegram Mini App.", "ContactFlow Setup", 0x40) != 1 {
		return nil
	}
	if msg("برنامه برای همین کاربر ویندوز نصب شود؟\n\n%LOCALAPPDATA%\\Programs\\ContactFlow Personal Ultimate", "آماده نصب", 0x00000004|0x00000020) != 6 {
		return nil
	}
	dir := installDir()
	if e := os.MkdirAll(dir, 0755); e != nil {
		return e
	}
	run("taskkill.exe", "/IM", "ContactFlow.exe", "/F")
	removeOldShortcuts()
	b, e := payload.ReadFile("payload/ContactFlow.exe")
	if e != nil {
		return e
	}
	app := filepath.Join(dir, "ContactFlow.exe")
	if e = os.WriteFile(app, b, 0755); e != nil {
		return e
	}
	un := filepath.Join(dir, "Uninstall ContactFlow.exe")
	if e = copySelf(un); e != nil {
		return e
	}
	desktop := filepath.Join(os.Getenv("USERPROFILE"), "Desktop", "ContactFlow Personal Ultimate.lnk")
	startDir := filepath.Join(os.Getenv("APPDATA"), "Microsoft", "Windows", "Start Menu", "Programs")
	_ = os.MkdirAll(startDir, 0755)
	start := filepath.Join(startDir, "ContactFlow Personal Ultimate.lnk")
	makeShortcut(desktop, app)
	makeShortcut(start, app)
	key := `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\ContactFlow Personal Ultimate`
	run("reg.exe", "add", key, "/v", "DisplayName", "/t", "REG_SZ", "/d", appName, "/f")
	run("reg.exe", "add", key, "/v", "DisplayVersion", "/t", "REG_SZ", "/d", appVersion, "/f")
	run("reg.exe", "add", key, "/v", "UninstallString", "/t", "REG_SZ", "/d", un, "/f")
	msg("نصب کامل شد.\n\nبرنامه مستقیم Dashboard را باز می‌کند.", "ContactFlow", 0x40)
	_ = exec.Command(app).Start()
	return nil
}
func main() {
	exe, _ := os.Executable()
	if strings.Contains(strings.ToLower(filepath.Base(exe)), "uninstall") {
		uninstall()
		time.Sleep(150 * time.Millisecond)
		return
	}
	if e := install(); e != nil {
		msg("نصب انجام نشد:\n"+e.Error(), "ContactFlow Setup", 0x10)
	}
}
