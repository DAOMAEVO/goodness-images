import fs from 'node:fs/promises'
import path from 'node:path'

const projectRoot = process.cwd()
const docsRoot = path.join(projectRoot, 'docs')
const outputRoot = path.join(projectRoot, 'public', 'prompt-gallery')
const galleryIndexPath = path.join(outputRoot, 'index.json')
const categoryName = '游戏素材'

const comprehensiveTitlePresets = [
  ['基础 UI 组件 - 通用控件', 'Game Assets - Basic UI Controls', 'basic-ui-controls'],
  ['基础 UI 组件 - 菜单与系统界面', 'Game Assets - Menus and System Screens', 'menus-system-screens'],
  ['基础 UI 组件 - HUD 战斗状态', 'Game Assets - HUD Combat Status', 'hud-combat-status'],
  ['基础 UI 组件 - 面板装饰元素', 'Game Assets - Panel Decorative Elements', 'panel-decor-elements'],
  ['游戏层素材 - 角色资产', 'Game Assets - Character Assets', 'character-assets'],
  ['游戏层素材 - 怪物与 NPC', 'Game Assets - Monsters and NPCs', 'monsters-npcs'],
  ['游戏层素材 - 场景环境资产', 'Game Assets - Scene and Environment Assets', 'scene-environment-assets'],
  ['游戏层素材 - 地形瓦片', 'Game Assets - Terrain Tiles', 'terrain-tiles'],
  ['游戏层素材 - 物品装备', 'Game Assets - Items and Equipment', 'items-equipment'],
  ['游戏层素材 - 技能与状态', 'Game Assets - Skills and Status Effects', 'skills-status-effects'],
  ['游戏层素材 - 粒子与战斗特效', 'Game Assets - Particles and Combat VFX', 'particles-combat-vfx'],
  ['游戏层素材 - 动画集', 'Game Assets - Animation Sets', 'animation-sets'],
  ['游戏层素材 - 宣传与商店物料', 'Game Assets - Promotion and Store Materials', 'promotion-store-materials'],
  ['游戏层素材 - 技术贴图与渲染', 'Game Assets - Technical Maps and Rendering', 'technical-maps-rendering'],
  ['游戏层素材 - 多端适配与输入图标', 'Game Assets - Responsive Layout and Input Icons', 'responsive-input-icons'],
  ['游戏层素材 - 键鼠提示', 'Game Assets - Keyboard and Mouse Hints', 'keyboard-mouse-hints'],
]

const sourceConfigs = [
  {
    fileName: 'gpt-image2 游戏素材全面测试.htm',
    sourceUrl: 'https://mp.weixin.qq.com/s/CpedmQKSQytZ5CeldSq8JA',
    author: 'gpt-image2 游戏素材全面测试',
    imageDir: 'docs/游戏/gpt-image2 游戏素材全面测试',
    idPrefix: 'game-asset-case',
    folderPrefix: 'game_asset_case',
    addedAt: '2026-04-30T14:28:03+08:00',
    mode: 'grouped-prompts',
    titlePresets: comprehensiveTitlePresets,
  },
  {
    fileName: '游戏元素拆分 gpt-image2.html',
    sourceUrl: 'https://mp.weixin.qq.com/s/eLTx7bCpckLHfefR2M9l4Q',
    author: '游戏元素拆分 gpt-image2',
    imageDir: 'docs/游戏/游戏元素拆分 gpt-image2',
    idPrefix: 'game-asset-split-case',
    folderPrefix: 'game_asset_split_case',
    addedAt: '2026-04-30T15:07:05+08:00',
    mode: 'prompt-before-image',
    titlePresets: [
      ['游戏层素材 - 角色拆分基础', 'Game Assets - Basic Character Parts', 'basic-character-parts'],
      ['游戏层素材 - 角色部件拆分明细', 'Game Assets - Character Part Breakdown', 'character-part-breakdown'],
      ['游戏层素材 - 角色拆分图集优化版', 'Game Assets - Optimized Character Parts Sprite Sheet', 'optimized-character-parts'],
      ['游戏层素材 - 人物动画拆分', 'Game Assets - Character Animation Breakdown', 'character-animation-breakdown'],
      ['游戏层素材 - 人物动作拆分', 'Game Assets - Character Action Breakdown', 'character-action-breakdown'],
      ['游戏层素材 - 技能特效拆分', 'Game Assets - Skill VFX Breakdown', 'skill-vfx-breakdown'],
      ['游戏层素材 - 成就动画特效拆分', 'Game Assets - Achievement Animation VFX Breakdown', 'achievement-animation-vfx-breakdown'],
      ['游戏层素材 - 装备动画特效拆分', 'Game Assets - Equipment Animation VFX Breakdown', 'equipment-animation-vfx-breakdown'],
      ['游戏层素材 - 横版背景拆分', 'Game Assets - Side-Scrolling Background Breakdown', 'side-scrolling-background-breakdown'],
      ['游戏层素材 - 男性表情拆分', 'Game Assets - Male Expression Breakdown', 'male-expression-breakdown'],
      ['游戏层素材 - 头部表情拆分', 'Game Assets - Head Expression Breakdown', 'head-expression-breakdown'],
      ['游戏层素材 - 卡片图层拆分', 'Game Assets - Card Layer Breakdown', 'card-layer-breakdown'],
      ['游戏层素材 - 机甲拆分', 'Game Assets - Mecha Breakdown', 'mecha-breakdown'],
      ['游戏层素材 - 武器拆分', 'Game Assets - Weapon Breakdown', 'weapon-breakdown'],
    ],
  },
]

async function main() {
  const importResults = []
  const examples = []

  for (const config of sourceConfigs) {
    const sourceFile = await findGameAssetHtml(config.fileName)
    const decodedHtml = decodeEscapedHtml(await fs.readFile(sourceFile, 'utf8'))
    const groups = createGroups(decodedHtml, config)
    const sourceExamples = await buildExamples(groups, config)

    examples.push(...sourceExamples)
    importResults.push({
      file: path.relative(projectRoot, sourceFile),
      examples: sourceExamples.length,
      images: sourceExamples.reduce((total, example) => total + example.imagePaths.length, 0),
      remoteImages: sourceExamples.reduce((total, example) => total + example.remoteImageUrls.length, 0),
    })
  }

  const gallery = JSON.parse(await fs.readFile(galleryIndexPath, 'utf8'))
  const existingExamples = Array.isArray(gallery.examples) ? gallery.examples : []

  gallery.categories = Array.from(new Set([...(gallery.categories ?? []), categoryName]))
  gallery.examples = [
    ...existingExamples.filter((example) => {
      return example.category !== categoryName && example.category !== '游戏素材类型'
    }),
    ...examples,
  ]
  gallery.total = gallery.examples.length
  gallery.generatedAt = new Date().toISOString()

  await fs.writeFile(galleryIndexPath, `${JSON.stringify(gallery, null, 2)}\n`, 'utf8')

  for (const result of importResults) {
    console.log(
      `Imported ${result.examples} examples and ${result.images} images from ${result.file}. Remote fallbacks: ${result.remoteImages}.`,
    )
  }
  console.log(`Game asset prompt gallery now has ${examples.length} examples.`)
}

async function findGameAssetHtml(fileName) {
  const entries = await fs.readdir(docsRoot, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dir = path.join(docsRoot, entry.name)
    const files = await fs.readdir(dir)
    const htmlFile = files.find((file) => file === fileName)
    if (htmlFile) return path.join(dir, htmlFile)
  }
  throw new Error(`Game asset HTML source was not found under docs/: ${fileName}`)
}

function decodeEscapedHtml(value) {
  return value
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
}

function extractPromptBlocks(html) {
  return [...html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)]
    .map((match) => {
      return [...match[1].matchAll(/<code\b[^>]*>([\s\S]*?)<\/code>/g)]
        .map((codeMatch) => cleanText(codeMatch[1]))
        .filter(Boolean)
        .join('\n')
    })
    .filter((text) => text.startsWith('游戏素材') || text.startsWith('游戏角色素材'))
}

function extractImageItems(html) {
  return [...html.matchAll(/<img\b[^>]*js_insertlocalimg[^>]*>/g)]
    .map((match) => ({
      id: getAttribute(match[0], 'data-imgfileid'),
      url: decodeHtmlEntities(getAttribute(match[0], 'data-src')),
      index: match.index,
      tag: match[0],
    }))
    .filter((item) => item.url)
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`${name}=["']([^"']+)["']`))
  return match?.[1] ?? ''
}

function cleanText(value) {
  return decodeHtmlEntities(value)
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function createGroups(html, config) {
  if (config.mode === 'prompt-before-image') {
    return createPromptBeforeImageGroups(html, config)
  }

  const prompts = extractPromptBlocks(html)
  const imageItems = extractImageItems(html)

  if (prompts.length !== imageItems.length) {
    throw new Error(
      `Prompt/image count mismatch in ${config.fileName}: ${prompts.length} prompts, ${imageItems.length} images`,
    )
  }

  return groupByPrompt(prompts, imageItems)
}

function createPromptBeforeImageGroups(html, config) {
  const content = extractArticleContent(html)
  const imageItems = extractImageItems(content)
  const groups = []
  const seenImages = new Set()
  let lastIndex = 0
  let currentGroup = null

  for (const item of imageItems) {
    const key = item.id || item.url
    const contextText = cleanText(content.slice(lastIndex, item.index))
    const prompt = extractPromptFromContext(contextText)

    if (seenImages.has(key)) {
      lastIndex = item.index + item.tag.length
      continue
    }
    seenImages.add(key)

    if (prompt) {
      currentGroup = {
        prompt,
        sourceIndexes: [groups.length],
        imageUrls: [],
      }
      groups.push(currentGroup)
    }

    if (currentGroup) {
      currentGroup.imageUrls.push(item.url)
    }

    lastIndex = item.index + item.tag.length
  }

  if (!groups.length) {
    throw new Error(`No prompt/image groups found for ${config.fileName}`)
  }

  return groups
}

function extractArticleContent(html) {
  return html.match(/<div[^>]+id=["']js_content["'][\s\S]*?<\/div>\s*<script/)?.[0] ?? html
}

function extractPromptFromContext(text) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''

  const longPromptIndex = normalized.indexOf('游戏角色素材')
  if (longPromptIndex >= 0) {
    return normalized.slice(longPromptIndex).trim()
  }

  const shortPromptIndex = normalized.lastIndexOf('游戏素材')
  if (shortPromptIndex >= 0) {
    return normalized.slice(shortPromptIndex).trim()
  }

  return ''
}

function groupByPrompt(prompts, imageItems) {
  const groups = new Map()
  for (const [index, prompt] of prompts.entries()) {
    const imageItem = imageItems[index]
    const imageKey = imageItem.id || imageItem.url

    if (!groups.has(prompt)) {
      groups.set(prompt, {
        prompt,
        sourceIndexes: [],
        imageUrls: [],
        imageKeys: new Set(),
      })
    }
    const group = groups.get(prompt)
    if (group.imageKeys.has(imageKey)) continue

    group.sourceIndexes.push(index)
    group.imageUrls.push(imageItem.url)
    group.imageKeys.add(imageKey)
  }
  return [...groups.values()].map(({ imageKeys, ...group }) => group)
}

async function buildExamples(groups, config) {
  const examples = []

  for (const [index, group] of groups.entries()) {
    const caseNumber = index + 1
    const [titleZh, titleEn, slug] = config.titlePresets[index] ?? createFallbackTitle(group.prompt, caseNumber)
    const id = `${config.idPrefix}-${String(caseNumber).padStart(3, '0')}-${slug}`
    const folder = `${config.folderPrefix}${String(caseNumber).padStart(3, '0')}`
    const imagePaths = []
    const remoteImageUrls = []
    const folderPath = path.join(outputRoot, folder)

    await fs.rm(folderPath, { recursive: true, force: true })

    for (const [imageIndex, imageUrl] of group.imageUrls.entries()) {
      const fileName = imageIndex === 0 ? 'output.png' : `output${imageIndex}.png`
      const localPath = path.join(folderPath, fileName)
      const publicPath = normalizePath(path.posix.join('prompt-gallery', folder, fileName))

      try {
        await downloadImage(imageUrl, localPath)
        imagePaths.push(publicPath)
      } catch (error) {
        console.warn(`Failed to download ${imageUrl}: ${error instanceof Error ? error.message : String(error)}`)
        remoteImageUrls.push(imageUrl)
      }
    }

    examples.push({
      id,
      titleZh,
      titleEn,
      category: categoryName,
      author: config.author,
      sourceUrl: config.sourceUrl,
      caseAnchor: `#${id}`,
      imageDir: config.imageDir,
      imagePaths,
      remoteImageUrls,
      promptOriginal: group.prompt,
      promptZh: group.prompt,
      promptsOriginal: [group.prompt],
      promptsZh: [group.prompt],
      requiresReference: false,
      arguments: [],
      addedAt: config.addedAt,
    })
  }

  return examples
}

function createFallbackTitle(prompt, caseNumber) {
  const lines = prompt.split('\n').filter(Boolean)
  const title = `${lines[2] || '游戏素材'} - ${lines[3] || `案例 ${caseNumber}`}`.replace(/,+$/, '')
  return [title, `Game Asset Case ${caseNumber}`, `case-${caseNumber}`]
}

async function downloadImage(url, filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const response = await fetch(url, {
    headers: {
      Referer: 'https://mp.weixin.qq.com/',
      'User-Agent': 'Mozilla/5.0',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(filePath, buffer)
}

function normalizePath(value) {
  return value.replace(/\\/g, '/')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
