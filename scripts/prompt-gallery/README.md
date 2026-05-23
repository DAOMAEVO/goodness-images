# 提示词库维护脚本

这些脚本用于维护公共提示词库与内置示例素材。它们不是运行时依赖，也不会被打包到前端。

## 脚本说明

- `buildPromptGallery.mjs`: 从整理好的提示词资料和示例图片生成 `public/prompt-gallery/index.json`，并复制公共图库图片。
- `generatePromptGalleryThumbnails.mjs`: 根据 `public/prompt-gallery/index.json` 生成图库缩略图，输出到 `public/prompt-gallery/_thumbs/`。
- `translatePromptGallery.mjs`: 辅助维护提示词库的中文标题、分类和提示词翻译。
- `applyOpenArtPromptTranslations.mjs`: 将已整理好的 OpenArt 示例中文提示词写回公共图库索引；如果本地 `docs/outputs/` 不存在，只会跳过候选文件更新。
- `importGameAssetGallery.mjs`: 将本地游戏素材示例导入公共提示词库。

## 本地中间产物

`docs/outputs/` 是本地抓取、分类和导入流程的中间产物目录，可能包含原始图片、原始 JSON、远程 CDN URL、本机路径和处理缓存。该目录不随开源仓库提交，已在 `.gitignore` 中忽略。

如果需要重新导入外部素材，请先在本地生成或准备 `docs/outputs/`，再运行对应脚本。公共站点实际读取的是 `public/prompt-gallery/` 下的索引、图片和缩略图。

## NPM 命令

```bash
npm run build:prompt-gallery
npm run build:prompt-gallery:thumbs
npm run import:game-assets
npm run translate:prompt-gallery
npm run apply:openart-translations
```
