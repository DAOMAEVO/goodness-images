# VPS Docker 部署说明

## 文件说明

- `package-for-vps.ps1`：本地构建镜像并导出 tar 包。
- `build-gpt-image-playground-image.ps1`：`package-for-vps.ps1` 的别名入口，命名风格更接近 `new-api/scripts`。
- `run-on-vps.sh`：在 VPS 上导入 tar 包并启动容器。
- `deploy-gpt-image-playground.sh`：`run-on-vps.sh` 的别名入口。
- `docker-compose.vps.yml`：VPS 侧使用的 compose 文件。
- `.env.vps.example`：VPS 侧环境变量示例。

## 本地打包

在项目根目录打开 PowerShell：

```powershell
.\deploy\package-for-vps.ps1
```

如果你更喜欢和 `new-api` 相近的命名，也可以用：

```powershell
.\deploy\build-gpt-image-playground-image.ps1
```

如果 VPS 是 ARM64：

```powershell
.\deploy\package-for-vps.ps1 -Platform linux/arm64
```

## 构建期参数

下面这些参数会在本地构建镜像时写入前端产物：

- `SystemApiUrl` -> `VITE_SYSTEM_API_URL`
- `SystemApiKey` -> `VITE_SYSTEM_API_KEY`
- `SystemApiMode` -> `VITE_SYSTEM_API_MODE`
- `SystemModel` -> `VITE_SYSTEM_MODEL`
- `SystemTimeout` -> `VITE_SYSTEM_TIMEOUT`
- `SystemCodexCli` -> `VITE_SYSTEM_CODEX_CLI`

示例：

```powershell
.\deploy\package-for-vps.ps1 `
  -SystemApiUrl "https://api.openai.com/v1" `
  -SystemApiKey "sk-xxxx" `
  -SystemApiMode "images" `
  -SystemModel "gpt-image-2" `
  -SystemTimeout "300" `
  -SystemCodexCli "false"
```

## 复制到 VPS

脚本会把产物输出到 `deploy/bundle/`。把整个目录复制到 VPS 即可：

```bash
scp -r deploy/bundle user@your-vps:/opt/gpt-image-playground
```

## VPS 启动

```bash
cd /opt/gpt-image-playground/bundle
cp .env.vps.example .env
chmod +x run-on-vps.sh
./run-on-vps.sh
```

如果你更喜欢和 `new-api` 相近的命名，也可以执行：

```bash
chmod +x deploy-gpt-image-playground.sh
./deploy-gpt-image-playground.sh
```

## 注意事项

- 这是“本地 build/save，VPS load/up”的流程，VPS 不需要源码，也不需要再次 `docker build`。
- `API_URL` 是运行时变量，只影响前端默认 API 地址。
- `VITE_SYSTEM_*` 是构建期变量，只在本地打包镜像时生效。
- 本地构建平台必须和 VPS 架构匹配，常见是 `linux/amd64`，ARM 机器则用 `linux/arm64`。
