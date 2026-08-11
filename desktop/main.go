package main

import (
  "embed"
  "encoding/json"
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
  "strconv"
  "strings"
  "time"
)

//go:embed webapp/* webapp/icons/*
var content embed.FS

const appVersion = "3.0.0-alpha.1"
const defaultPort = 17655

func dataDir() string {
  var base string
  switch runtime.GOOS {
  case "windows":
    base = os.Getenv("LOCALAPPDATA")
  case "darwin":
    base = filepath.Join(os.Getenv("HOME"), "Library", "Application Support")
  default:
    if x := os.Getenv("XDG_CONFIG_HOME"); x != "" { base = x } else { base = filepath.Join(os.Getenv("HOME"), ".config") }
  }
  if base == "" { base = os.TempDir() }
  dir := filepath.Join(base, "ContactFlow Personal Ultimate")
  _ = os.MkdirAll(dir, 0700)
  return dir
}

func portFile() string { return filepath.Join(dataDir(), "desktop-port.txt") }

func savedPort() int {
  b, err := os.ReadFile(portFile())
  if err == nil {
    if p, e := strconv.Atoi(strings.TrimSpace(string(b))); e == nil && p >= 1024 && p <= 65535 { return p }
  }
  return defaultPort
}

func savePort(p int) { _ = os.WriteFile(portFile(), []byte(strconv.Itoa(p)), 0600) }

func openApp(target string) {
  if runtime.GOOS == "windows" {
    candidates := []string{
      filepath.Join(os.Getenv("ProgramFiles(x86)"), "Microsoft", "Edge", "Application", "msedge.exe"),
      filepath.Join(os.Getenv("ProgramFiles"), "Microsoft", "Edge", "Application", "msedge.exe"),
      filepath.Join(os.Getenv("ProgramFiles"), "Google", "Chrome", "Application", "chrome.exe"),
      filepath.Join(os.Getenv("ProgramFiles(x86)"), "Google", "Chrome", "Application", "chrome.exe"),
    }
    for _, p := range candidates {
      if p != "" {
        if _, err := os.Stat(p); err == nil {
          _ = exec.Command(p, "--app="+target, "--start-maximized").Start()
          return
        }
      }
    }
    _ = exec.Command("rundll32", "url.dll,FileProtocolHandler", target).Start()
    return
  }
  var cmd *exec.Cmd
  if runtime.GOOS == "darwin" { cmd = exec.Command("open", target) } else { cmd = exec.Command("xdg-open", target) }
  _ = cmd.Start()
}

func isOurServer(port int) bool {
  c := &http.Client{Timeout: 500 * time.Millisecond}
  r, err := c.Get(fmt.Sprintf("http://127.0.0.1:%d/health", port))
  if err != nil { return false }
  defer r.Body.Close()
  var x map[string]any
  if json.NewDecoder(r.Body).Decode(&x) != nil { return false }
  v, _ := x["version"].(string)
  local, _ := x["local_only"].(bool)
  return r.StatusCode == 200 && local && strings.HasPrefix(v, "3.0.")
}

func chooseListener() (net.Listener, int, error) {
  preferred := savedPort()
  candidates := []int{preferred}
  for p := defaultPort; p <= defaultPort+20; p++ { if p != preferred { candidates = append(candidates, p) } }
  for _, p := range candidates {
    ln, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", p))
    if err == nil { savePort(p); return ln, p, nil }
    if p == preferred && isOurServer(p) {
      openApp(fmt.Sprintf("http://127.0.0.1:%d/", p))
      return nil, p, nil
    }
  }
  return nil, 0, fmt.Errorf("no local port available")
}

func writeJSON(w http.ResponseWriter, status int, v any) {
  w.Header().Set("Content-Type", "application/json; charset=utf-8")
  w.WriteHeader(status)
  _ = json.NewEncoder(w).Encode(v)
}

func main() {
  ln, port, err := chooseListener()
  if err != nil { log.Fatal(err) }
  if ln == nil { return }
  target := fmt.Sprintf("http://127.0.0.1:%d/", port)

  sub, err := fs.Sub(content, "webapp")
  if err != nil { log.Fatal(err) }
  h := http.FileServer(http.FS(sub))
  mux := http.NewServeMux()

  mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    writeJSON(w, 200, map[string]any{"ok":true,"desktop":true,"local_only":true,"version":appVersion,"port":port})
  })

  mux.HandleFunc("/native/capabilities", func(w http.ResponseWriter, r *http.Request) {
    writeJSON(w, 200, map[string]any{
      "ok":true,
      "connector":true,
      "telegramQr":false,
      "reason":"tdlib_not_configured",
      "filePicker":false,
      "platform":runtime.GOOS,
      "version":appVersion,
    })
  })

  mux.HandleFunc("/native/telegram/qr", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost { writeJSON(w, 405, map[string]any{"ok":false,"error":"method_not_allowed"}); return }
    writeJSON(w, 501, map[string]any{
      "ok":false,
      "error":"TDLib Native Connector / Telegram App credentials are not configured in this build. No fake QR is generated.",
      "code":"not_configured",
    })
  })

  mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    if strings.HasSuffix(r.URL.Path, ".webmanifest") { w.Header().Set("Content-Type", "application/manifest+json") }
    if ext := filepath.Ext(r.URL.Path); ext != "" { if mt := mime.TypeByExtension(ext); mt != "" { w.Header().Set("Content-Type", mt) } }
    w.Header().Set("X-Content-Type-Options", "nosniff")
    w.Header().Set("Cache-Control", "no-cache")
    h.ServeHTTP(w, r)
  })

  srv := &http.Server{Handler:mux, ReadHeaderTimeout:5*time.Second, IdleTimeout:60*time.Second}
  go func(){ time.Sleep(250*time.Millisecond); openApp(target) }()
  if err := srv.Serve(ln); err != nil && err != http.ErrServerClosed { log.Fatal(err) }
}
