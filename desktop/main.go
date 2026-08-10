package main

import (
  "embed"
  "fmt"
  "io/fs"
  "log"
  "mime"
  "net"
  "net/http"
  "os"
  "os/exec"
  "path/filepath"
  "runtime"
  "strings"
  "time"
)

//go:embed webapp/* webapp/icons/*
var content embed.FS

const addr = "127.0.0.1:17654"
const url = "http://127.0.0.1:17654/"

func openApp(target string) {
  if runtime.GOOS == "windows" {
    candidates := []string{
      filepath.Join(os.Getenv("ProgramFiles(x86)"), "Microsoft", "Edge", "Application", "msedge.exe"),
      filepath.Join(os.Getenv("ProgramFiles"), "Microsoft", "Edge", "Application", "msedge.exe"),
      filepath.Join(os.Getenv("ProgramFiles"), "Google", "Chrome", "Application", "chrome.exe"),
      filepath.Join(os.Getenv("ProgramFiles(x86)"), "Google", "Chrome", "Application", "chrome.exe"),
    }
    for _, p := range candidates {
      if p != "" { if _, err := os.Stat(p); err == nil { _ = exec.Command(p, "--app="+target, "--start-maximized").Start(); return } }
    }
    _ = exec.Command("rundll32", "url.dll,FileProtocolHandler", target).Start()
    return
  }
  var cmd *exec.Cmd
  switch runtime.GOOS {case "darwin": cmd=exec.Command("open",target); default: cmd=exec.Command("xdg-open",target)}
  _ = cmd.Start()
}

func main() {
  ln, err := net.Listen("tcp", addr)
  if err != nil { openApp(url); return }
  sub, err := fs.Sub(content, "webapp"); if err != nil { log.Fatal(err) }
  h := http.FileServer(http.FS(sub))
  mux := http.NewServeMux()
  mux.HandleFunc("/health", func(w http.ResponseWriter,r *http.Request){w.Header().Set("Content-Type","application/json");fmt.Fprint(w,`{"ok":true,"desktop":true,"version":"1.2.0"}`)})
  mux.HandleFunc("/", func(w http.ResponseWriter,r *http.Request){
    if strings.HasSuffix(r.URL.Path,".webmanifest") { w.Header().Set("Content-Type","application/manifest+json") }
    if ext:=filepath.Ext(r.URL.Path); ext!="" { if mt:=mime.TypeByExtension(ext);mt!="" {w.Header().Set("Content-Type",mt)} }
    w.Header().Set("X-Content-Type-Options","nosniff")
    w.Header().Set("Cache-Control","no-cache")
    h.ServeHTTP(w,r)
  })
  srv:=&http.Server{Handler:mux,ReadHeaderTimeout:5*time.Second,IdleTimeout:60*time.Second}
  go func(){time.Sleep(250*time.Millisecond);openApp(url)}()
  if err:=srv.Serve(ln);err!=nil&&err!=http.ErrServerClosed{log.Fatal(err)}
}
