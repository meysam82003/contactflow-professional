# ContactFlow Personal Ultimate 3.1

Local-first contact management, bulk import/export, Iranian number generator, Telegram Mini App workspace, desktop shell, and Android shell.

Version: `3.1.0-alpha.1`

## 🚀 Quick Access

### Telegram Mini App

Source package:
- `telegram-miniapp/miniapp.html`

Open source location:
- https://github.com/meysam82003/contactflow-professional/tree/agent/miniapp-workspace-refactor/telegram-miniapp

### Downloads

Build files are published from GitHub Actions when a release build is completed:

- Actions:
  https://github.com/meysam82003/contactflow-professional/actions

- Releases:
  https://github.com/meysam82003/contactflow-professional/releases

## 📘 Installation Guide

### Telegram Mini App Setup

1. Create or select your Telegram Bot using BotFather.
2. Configure the Mini App URL.
3. Deploy the `telegram-miniapp` package.
4. Open the Mini App from Telegram.

### Android / Windows

Project folders:

- `android/` — Android wrapper
- `desktop/` — Windows/Linux/macOS shell

Build instructions and automation:

- `.github/workflows/`
- GitHub Actions page

## Architecture

ContactFlow uses a Local-First architecture:

- Core contacts stay in local IndexedDB.
- Backup/export works through local files.
- Telegram Mini App is a full workspace, not only a bot panel.
- Bot is used as launcher/integration layer.

## Telegram Integration

Supported flows:

- Open selected contact in Telegram.
- Export contacts as CSV/TXT/VCF.
- Share VCF files.
- Restore local backups.

The Mini App does not bypass Telegram privacy or internal user sessions.

## Main Components

- `telegram-miniapp/` — Telegram Mini App package
- `enhancements/` — runtime features
- `desktop/` — desktop application shell
- `android/` — Android application shell
- `scripts/` — build scripts

## Persian Documentation

- `README_FA.md`
- `docs/`

## Release

Run GitHub Actions release workflow to build:

- Windows
- Android APK
- Linux
- macOS
- PWA
- Telegram Mini App package

SHA256 checksums are generated during release builds.
