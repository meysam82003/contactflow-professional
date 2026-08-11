# 3.1 CI browser-bundle fix

The first 3.1 CI run exposed missing Webpack 5 browser fallbacks required by the Telegram Web-MTProto dependency graph. The build was patched with browser polyfills for `util`, `assert`, `constants`, `path`, `os`, `vm`, `url`, `querystring`, `http`, `https`, `zlib` and `tty`, while Node-only filesystem/network modules remain disabled. Workflows copy the readable `enhancements/` browser-build files over the canonical augmentation bundle before bundling.
