package main

import (
    "embed"
    "encoding/json"
    "fmt"
    "io/fs"
    "log"
    "net"
    "net/http"
    "os/exec"
    "runtime"
    "time"
)

const version = "2.0.0-alpha.1"

//go:embed webapp/*
var embedded embed.FS

func main() {
    sub, err := fs.Sub(embedded, "webapp")
    if err != nil { log.Fatal(err) }

    mux := http.NewServeMux()
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json; charset=utf-8")
        _ = json.NewEncoder(w).Encode(map[string]any{
            "ok": true,
            "desktop": true,
            "version": version,
            "mode": "local-only",
        })
    })
    mux.Handle("/", http.FileServer(http.FS(sub)))

    ln, err := net.Listen("tcp", "127.0.0.1:17654")
    if err != nil { log.Fatalf("ContactFlow local UI port 17654: %v", err) }

    url := "http://127.0.0.1:17654/"
    go func() {
        time.Sleep(350 * time.Millisecond)
        if err := openBrowser(url); err != nil {
            fmt.Println("Open this address:", url)
        }
    }()

    // This HTTP listener is only the embedded local UI host. It is not an
    // account server, sync server, or remote API.
    if err := http.Serve(ln, mux); err != nil { log.Fatal(err) }
}

func openBrowser(url string) error {
    switch runtime.GOOS {
    case "windows":
        return exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
    case "darwin":
        return exec.Command("open", url).Start()
    default:
        return exec.Command("xdg-open", url).Start()
    }
}
