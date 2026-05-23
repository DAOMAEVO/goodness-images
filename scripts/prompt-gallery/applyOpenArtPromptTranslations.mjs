import fs from 'node:fs/promises'
import path from 'node:path'

const projectRoot = process.cwd()
const galleryPath = path.join(projectRoot, 'public', 'prompt-gallery', 'index.json')
const candidatesPath = path.join(projectRoot, 'docs', 'outputs', 'prompt_gallery_import_candidates.json')

const translations = {
  'openart-84c6RPfWLeCu8o0eFVOH-a-lone-hooded-warrior-faces-a-four-headed-serpen': `以下分镜表严格保留用户指定的视觉风格。

[项目概览]
- 时长：15 秒
- 风格锁定：黑暗电影感史诗奇幻，高对比剪影，棕褐与金琥珀色光照，雾气氛围，写实材质。
- 核心故事：一名孤独的兜帽战士站在嶙峋山巅，面对四头巨蛇般的庞然怪物，准备进行最后一次爆发式反击。
- 叙事流程：铺垫（包围）/ 发展（咆哮）/ 转折（拔剑）/ 回报（斩击）/ 结尾（光之爆炸）
- 镜头数：7
- 版式逻辑：自上而下阅读的竖向分镜表。

[竖向分镜表]
CUT 01：00:00-00:02，广角低机位，战士站在尖锐岩石上，四个沉睡的巨大蛇头以剪影围绕。镜头缓慢推进，金色雾气中蛇头开始轻微移动；斗篷在强风中翻动。关键帧：高耸岩石上的兜帽战士、四个巨蛇头、金琥珀雾、高对比剪影、史诗奇幻。限制：不要鲜艳色彩、不要现代科技、不要露出战士面部。
CUT 02：00:02-00:04，最左侧蛇头特写，从闭口到猛然扑向镜头，张开颌骨露出针状牙齿。快速跟随蛇头前冲，琥珀光中有唾液飞溅。限制：不要卡通化、不要血腥、不要改变蛇的设计。
CUT 03：00:04-00:06，从战士靴子后方仰拍。战士沉稳调整重心，其他三个蛇头开始嘶鸣，岩面碎石震动。限制：不要露出脸，保持暗调光线。
CUT 04：00:06-00:08，中近景浅景深，战士的手伸向腰间剑柄，手指握紧时琥珀色火花亮起。强调皮革、金属与缓慢蓄势。
CUT 05：00:08-00:10，顶部中央蛇头从云中垂下俯视战士，随后发出可见声波般的咆哮，雾气被震开。保持单色琥珀/棕褐调。
CUT 06：00:10-00:13，广角镜头，四个蛇头同时扑向战士所在中心；拔剑瞬间爆发耀眼金光。画面是冲击帧，怪物汇聚后被径向光爆吞没。
CUT 07：00:13-00:15，极远景，山峰被金色能量球吞没；光芒散入雾中，只留下战士胜利剪影与退散的阴影。不要破坏山岩尺度。

[完整分镜表提示词]
生成一张专业电影分镜表，包含 7 个竖向面板，呈现完整 15 秒序列。风格为黑暗史诗奇幻，高对比剪影与金琥珀照明。每格标注 CUT 编号和 TIME 时间戳，并配有摄影机运动、动作说明等制作文字。整体保持粗粝写实材质、棕褐色调与统一雾气氛围。

[一致性锚点]
主角：兜帽剪影、长披风、不可见面部。服装：厚重旧斗篷、皮革护手、稳固靴子。道具：古剑，拔出时剑柄发出琥珀能量。环境：黑色嶙峋岩台与浓厚发光金雾。光色：琥珀、棕褐、黑色，高对比轮廓光。禁止漂移：蛇头数量必须始终为四个；光线不可转为冷色；战士始终保持剪影。`,

  'openart-wYDKgdWVcCHqstvTMxOf-a-silver-haired-demon-hunter-in-a-crimson-coat-b': `以下游戏画面序列严格保留用户指定的视觉风格。

[玩法概览]
- 时长：15 秒
- 视觉风格锁定：Devil May Cry 系列风格，高保真风格化写实、哥特与现代融合、高对比光照、锐利粒子特效、皮革与金属材质。
- 呈现模式：真实游戏实机截图。
- 核心场景：银发恶魔猎人穿深红皮革长外套，在废墟哥特教堂中与巨大的 Hell Knight 和一群低阶恶魔战斗。
- 镜头逻辑：动态第三人称动作镜头；群体控制时拉远，空中连段时收紧并跟随攻击弧线，面对 Boss 时低机位锁定。
- HUD：右上角醒目的 Stylish Rank 评分，左上角华丽生命/Devil Trigger 条，底部 Boss 血条。
- 场景数：6

[玩法序列]
SCENE 01 开场突刺：玩家站在教堂入口，HUD 显示 D 级；随后向前突刺冲刺，巨剑拖出白色能量击中恶魔群。第三人称背后跟随，红皮衣有运动模糊，角落有华丽 HUD。避免电影过场、无 HUD、低清材质或静态姿势。
SCENE 02 High Time 浮空：玩家向上挥剑，把恶魔挑到空中，评分升至 C。低机位仰拍穹顶，蓝色打击火花，皮革和金属质感高保真。
SCENE 03 Rainstorm 枪击：玩家倒悬在空中旋转，用黑白双枪向下连射，子弹形成雨幕，评分到 A。金色 A 级 UI、明亮枪口火光与教堂窗户戏剧光。
SCENE 04 Devil Trigger 激活：落地后紫色冲击波爆发，角色被恶魔气场包围，HUD 变为霓虹紫，评分到 S。画面边缘轻微色差，紫色电光与烟雾强烈。
SCENE 05 Boss 战 Hell Knight：15 英尺高的装甲恶魔骑士挥动巨锤，玩家用 Trickster 闪避留下残影。宽幅横向格斗视角，底部显示 “HELL KNIGHT CAVALIERE” Boss 血条，角落显示 SS。
SCENE 06 SSS 终结：玩家蓄力下劈，红白高对比冲击帧，Boss 化为黑色晶体碎片，右侧 SSS 评分大幅跳动。要强冲击、强 HUD、高对比。

[全局 HUD 包]
玩家 HUD：左上绿色生命条与紫色 Devil Trigger 符文。敌人/Boss：底部中央深哥特字体名称与长血条。导航：左下小型华丽圆形罗盘。技能/物品：右下武器图标（剑/枪）。锁定：红色同心圆与菱形中心。目标文字：顶部小白字 “Exterminate the Demon Presence”。按钮提示：PS5/Xbox 风格金属字体。

[一致性锚点]
主角：银发、及地红皮革外套、皮带扣、黑裤。武器：骷髅护手超大阔剑、黑白双枪。敌人：骨质昆虫恶魔与黑曜石装甲骑士，红色核心发光。环境：破败哥特教堂、碎彩窗中的蓝月光、大理石地面碎片。特效：强 bloom、蓝/紫/红锐利粒子轨迹、高对比阴影。UI：Stylish Rank 必须最醒目。禁止柔和绘画感、禁止电影黑边。主图应像 DMC 风格动作游戏的真实截图，而不是概念图或海报。`,

  'openart-CmcWprDgPmFTZPkI4ri4-a-professional-3-view-character-reference-sheet-': `专业三视图角色参考表（turnaround），包含正面、侧面和背面视角。画面展示全身角色，所有角度水平对齐，并保持一致的角色比例和服装细节。背景为纯白，艺术风格写实。右侧展示角色面部的局部特写，包含三种不同表情。图片中不要出现任何说明文字。`,

  'openart-9gJnHOU0nzpGVR6y9qVD-ashes-of-the-ancient-dragonspine-duel': `以下分镜板严格保留用户指定的视觉风格。

[板头]
标题：远古余烬：龙脊决斗。项目：Ashes of the Ancient。格式：16:9。序列：01/01。时长：15 秒。风格锁定：高保真奇幻 CGI、写实材质、黑暗电影光照、发光紫色魔法点缀。

[场景卡]
SCENE 01 远古苏醒：从黑暗精灵战士背后低机位拍摄，她在巨大的远古火龙前显得极小，龙喉中有余烬聚集。结尾龙展开巨翼遮住夕阳并发出震耳咆哮，地面尘土与碎石震动。画面关键词：长白发黑暗精灵、黑紫装甲、巨型黑色火龙、橙色喉光、废墟石柱、电影光。
SCENE 02 炼狱吐息：火龙猛地探头，橙色火焰束从口中喷出并吞没前景。黑暗精灵以剪影向左侧高速闪避，留下紫色魔法轨迹。镜头用极远景展示火焰规模，再快速摇移跟随精灵动作。
SCENE 03 紫刃反击：精灵从火焰边缘翻滚而出，双匕首蓄起紫色能量，随后冲向龙爪与鳞片间的薄弱点。镜头切为中近景和运动跟拍，强调匕首轨迹、火星、鳞片质感。
SCENE 04 龙爪压制：火龙巨爪砸向地面，石板碎裂，精灵从爪间翻身闪过。使用低角度广角，体现体型差距、冲击尘雾和紫色残影。
SCENE 05 跃向龙首：黑暗精灵沿断裂石柱跳跃升高，朝龙头发起空中突袭。镜头仰拍，背景是燃烧天空、巨翼和飞散余烬。
SCENE 06 魔法爆发：匕首刺入龙鳞裂隙，紫色魔法能量爆开，与橙色龙火形成强烈色彩对撞。镜头紧贴冲击点，强调能量裂纹、火花与鳞片碎屑。
SCENE 07 余烬之后：远景显示龙在废墟中退缩或倒下，黑暗精灵站在烟雾与紫色余辉中。镜头慢慢拉远，留下史诗决斗后的寂静。

[角色、音效与方向]
主角为白发黑暗精灵女战士，黑紫装甲、双匕首、敏捷而冷静。敌人为巨型远古火龙，黑鳞、橙色喉光、巨大双翼。整体音效包含低频龙吼、火焰喷射、石块崩裂、魔法嗡鸣与匕首划破空气。保持 16:9、电影景深、高保真 CGI，不要卡通、低细节、明亮日光或平面光。`,

  'openart-PKkEfH5T9HvPfqREJBsI-a-high-stakes-shootout-in-a-dusty-frontier-town-': `以下游戏画面序列严格保留用户指定的视觉风格。

[玩法概览]
时长 15 秒。视觉风格锁定为 Red Dead Redemption 式粗粝西部写实：高对比日照、胶片颗粒、精细皮革与木质资产、温暖黄金时刻光线。呈现模式为真实游戏截图。核心场景是一场尘土飞扬的边境小镇枪战，最后骑马逃离。镜头为第三人称越肩动态战斗跟随，并包含短暂 “Dead Eye” 慢动作转场。HUD 使用经典西部极简风格：左下圆形小地图、底部中心生命/体力/Dead Eye 核心、右上武器与弹药状态。

[玩法序列]
SCENE 01 对峙：牛仔在小镇主街面对三名歹徒，手悬在枪套上，屏幕出现 “R2 DRAW” 提示。左下小地图显示红点，核心状态满格。低角度第三人称越肩镜头，热浪从地面升起。不要现代 UI、血条或魔法。
SCENE 02 Dead Eye 激活：画面变为棕褐暖色，时间放慢，敌人头部和胸口出现红色 X 标记。玩家举起 Cattleman Revolver，Dead Eye 计量条快速下降。不要过场黑边或菜单画面。
SCENE 03 掩体射击：玩家扑到木箱后方，子弹击碎木板，随后探身还击，枪口烟雾升起。右上弹药显示 3/18，左下小地图可见。不要漂浮伤害数字或头顶血条。
SCENE 04 冲向马匹：玩家起身奔向拴着的白色阿拉伯马，同时开最后一枪。马旁出现 “Y MOUNT” 提示，右上出现红色 Wanted 通缉文字，体力核心跳动。
SCENE 05 大逃亡：玩家翻身上马，迎着子弹冲出小镇奔向峡谷，身后尘云吞没街道。HUD 显示马匹体力图标与 “EVADE THE LAW” 目标文字，远处骑手剪影追赶。

[全局 HUD 包]
玩家 HUD：左下圆形羊皮纸风小地图，底部中心生命/体力/Dead Eye 白色图标核心。敌人：小地图红点，无头顶血条。武器：右上 Revolver 与弹药计数。瞄准：细白点准星，Dead Eye 中有红色 X。目标文字：底部中心简洁白色无衬线。按钮提示：小型白色 A/X/Y/B 或 R2/L2 图标。

[一致性锚点]
主角穿旧皮革防尘大衣、棕色 Stetson 帽、双弹带、粗犷胡茬；武器为木柄 Cattleman Revolver 和磨旧皮枪套。敌人为时代准确的歹徒与警长。环境是干旱沙漠小镇、晒白木板、拴马柱、风滚草和橙色沙地。保持 1890 年代写实感、尘土、烟雾、体积光与胶片颗粒；不要霓虹轮廓或过度游戏化发光。`,

  'openart-RwbfPBffHPJqIhZPJUq5-cinematic-film-still-low-angle-shot-a-high-fashi': `电影剧照感低角度镜头：一位高级时装模特站在圆形宴会桌上，手持电锯，身穿图案复杂的先锋派长裙。场景位于昏暗复古舞厅，背后有巨大的发光水晶吊灯，形成金色光环与剪影效果。使用温暖琥珀与黄色光线、浓重电影雾气、体积雾、35mm 胶片颗粒、复古调色、1970 年代超现实时尚编辑风格。氛围神秘、忧郁，柔焦但保留高级时装质感。`,

  'openart-Yje3pkn9mHv20DlJEVIa-cinematic-dark-fantasy-concept-art-tiny-silhouet': `电影感黑暗奇幻概念艺术：一个极小的人类剪影站在中央山峰顶端，周围环绕三条巨大的远古邪神蛇怪，张开满是尖牙的巨口。构图对称，形成夸张的巨大尺度对比。使用强烈琥珀色体积光、厚重金色雾气、深阴影、纪念碑式压迫氛围、超写实材质与洛夫克拉夫特式恐怖风格，8K 分辨率，画幅 1:1。`,

  'openart-2sJByiw8ZFp1RcaxhEDi-cinematic-top-down-overhead-shot-a-woman-in-a-fl': `电影感俯拍顶视角：一位穿着飘逸薰衣草紫薄纱礼服的女性漂浮在完美圆形的深色反光池中央，水面散落白色与粉色花瓣。周围是茂密植物园、热带枝叶与背景中的石阶。使用低调戏剧光、穿过树叶的斑驳阳光、深阴影、忧郁空灵氛围与暗黑浪漫主义。整体为美术摄影风格，35mm 胶片质感，细腻胶片颗粒。`,

  'openart-H2MmorzTEpSNDNCJnPjK-cinematic-monochrome-film-still-high-contrast-bl': `电影感黑白剧照，高对比黑白摄影：孤独人物骑着白马穿过贴地浓雾，背景是黑暗哥特荒原、扭曲枯树、粗粝岩地与远处阴影。使用强烈轮廓、深黑阴影、银白雾气、35mm 胶片颗粒和古典恐怖片氛围。画面应庄严、孤寂、神秘，保持写实摄影质感。`,

  'openart-CUauQu79bmYBMjpjt1b6-cinematic-wide-shot-a-woman-in-a-flowing-vibrant': `电影感广角镜头：一位穿着鲜艳红色长裙的女性站在巨大火环中央，橙黄火焰围绕主体，背景为纯黑，地面是深色沥青。戏剧化暖光从火焰照亮红裙与人物轮廓，形成强烈明暗对比。画面具有高端时尚大片、电影剧照与超现实仪式感，保持火焰细节、布料流动和黑暗背景的纯净。`,

  'openart-ruOI7XDmqocdWP089MI4-high-end-fashion-editorial-photography-with-a-ci': `风格与光线：高端时尚编辑摄影，具有电影感的都市-自然混合美学。明亮但微雾的自然日光，柔和、略去饱和的色调。技术亮点是戏剧性的长曝光运动模糊：行人或背景形成流动拖影，而主体保持清晰。主体为时装模特，穿着层次丰富的造型，在城市街道或绿植环境中呈现从容姿态。构图强调动静对比、真实街拍氛围、35mm 胶片质感、细腻布料纹理和高级时尚杂志感。`,

  'openart-KBCU7QAu6FT5abfuQGS3-high-fashion-night-out-street-photography-with-a': `风格与光线：高级时尚“夜晚外出”街拍摄影，具有电影感 35mm 胶片美学。使用锐利的直射机顶闪光灯强烈照亮主体，在黑暗城市背景中形成高对比、清晰高光和明显阴影。主体穿着精致夜间时装，姿态自信，背景是都市夜景、暗色街道与反光表面。整体要有复古派对抓拍、高级杂志街拍、真实皮肤纹理、胶片颗粒和鲜明闪光质感。`,

  'openart-8tAKc2QdvgV42FJG63Dh-create-a-surreal-cinematic-scene-of-a-lone-figur': `创建一幅超现实电影场景：一名身穿白色兜帽长袍的孤独人物站在大片盛开的白花田中，面向悬浮的未来主义 UFO。飞船造型光滑极简，白色机身、宽翼、黑色光滑穹顶。整体为写实电影感，柔和自然光，白色花海、神秘静谧氛围、强烈尺度对比和轻微科幻感。`,

  'openart-PWiDpzDHtBREO0Njb0nw-cinematic-shot-of-an-ethereal-woman-suspended-in': `电影感镜头：一位空灵女性悬挂在金属圆环上，身体后仰形成戏剧化姿态，身穿破损白色先锋羽毛礼服，长长的碎布飘垂。场景为黑暗剧场舞台，顶部聚光灯形成强烈光束，背景深黑。强调漂浮感、舞台戏剧性、羽毛与布料纹理、柔和烟雾、优雅又危险的高级时装摄影氛围。`,

  'openart-5IxqiMZTfv6EqSEL70ou-a-candid-high-contrast-fashion-portrait-captured': `风格与光线：一张随性、高对比的时尚人像，使用刺眼的直射机顶闪光灯拍摄。画面带有厚重 35mm 胶片颗粒和高噪点，营造粗粝 90 年代低保真美学。闪光灯在主体皮肤和服装上形成明亮高光，背景更暗。主体为年轻时尚人物，姿态自然自信，服装和配饰具有复古编辑感。保持真实皮肤纹理、胶片噪点、闪光阴影和抓拍氛围。`,

  'openart-gRDDk8AMJMUBNW9fCY0d-it-is-a-rural-setting-at-golden-hour-but-the-sky': `金色时刻的乡村场景，但天空布满风暴云，一股巨大的龙卷风已经在一栋单层牧场住宅附近接地。房子前院里有两只长颈鹿和一只大猩猩。画面要有写实灾害摄影感、戏剧性天空、强风与尘土、超现实但可信的动物出现场景。`,

  'openart-khpzthTNncarQADVioH8-high-end-urban-fashion-photography-editorial-sty': `高端都市时尚摄影，编辑大片风格。使用自然阴天光线，色彩柔和、略微去饱和，均匀照亮服装材质。主体为时装模特，在城市街头环境中展示复杂层次服装与配饰。强调真实街拍、布料纹理、现代都市背景、克制高级感和自然姿态。`,

  'openart-KjPfmYkKj72NYU4RLt8D-vintage-90s-high-fashion-editorial-aesthetic-cap': `复古 90 年代高级时尚编辑美学，35mm 胶片拍摄。强烈直射自然阳光造成高对比，并在主体后方墙面投下锐利深色阴影。画面有厚重模拟胶片颗粒、轻微色偏和杂志大片质感。主体为时装模特，穿着大胆复古造型，姿态自信。保持强阳光、硬阴影、真实皮肤、布料细节和 90 年代时尚氛围。`,

  'openart-70ZMjzOOoHlRLZ6FxtT5-a-humorous-candid-amateur-snapshot-with-a-nostal': `风格与光线：幽默、随手拍的业余快照，带有怀旧 2000 年代初低保真数码相机质感。画面有高噪点、明显数码颗粒、轻微软焦和略微过曝的直射日光。主体是一只浅棕色短毛狗的近距离正面肖像，嘴里横叼着一个完整芝士汉堡，眼睛紧闭，表情像是极度享受。狗有白色口鼻区域、黑色尼龙项圈和金属吊牌。背景应像普通户外日常场景，保持真实、好笑、抓拍感。`,

  'openart-PwZcsFrthkYgIOFgzDmf-retro-modern-fashion-editorial-photo-medium-shot': `复古现代时尚编辑照片，中景。一位自信模特站在完全铺满哑光天蓝色方形浴室瓷砖的角落里。她穿浅湖蓝 T 恤，胸前有金色闪粉 “Sizzle” 字样，搭配复古造型。整体颜色明亮、干净、带一点 90 年代杂志感。强调瓷砖网格、服装颜色、闪粉文字、时尚姿态、真实皮肤和高保真摄影质感。`,

  'openart-PoBmlUQdk6nfZFThgroL-vintage-90s-fashion-editorial-style-captured-on-': `复古 90 年代时尚编辑风格，35mm 胶片拍摄。高对比强烈自然阳光在主体和室内空间中投下锐利几何阴影。色彩饱和、胶片颗粒明显，带有怀旧杂志感。主体为模特，在复古电话亭、餐厅卡座或类似小空间中摆姿。重点表现阳光图案、服装纹理、复古色彩、真实胶片噪点和高级时装摄影氛围。`,

  'openart-uJFPPB5LuW0KA1DsuBN8-high-fashion-editorial-photography-with-a-glamor': `高级时尚编辑摄影，具有华丽电影感“夜晚外出”美学。使用锐利直射机顶闪光灯，主体高光清晰、阴影深邃，背景为暗色都市夜景。主体可能为一组时尚人物或派对造型，穿着精致服装与配饰。画面应有 35mm 胶片颗粒、闪光灯抓拍、夜生活氛围、真实皮肤与高级杂志质感。`,

  'openart-ChLuUkMSeJyfRuu1LX6O-an-authentic-90s-vintage-film-photograph-with-a-': `真实 90 年代复古胶片照片，怀旧低保真美学。画面以戏剧化光效为主：上方直射阳光形成明亮竖向金色镜头眩光，同时有明显红色漏光或胶片烧灼感。主体为时尚人物，处在户外或车内等自然环境中。保持胶片颗粒、轻微模糊、暖色偏、真实抓拍感和复古摄影缺陷。`,

  'openart-1yHYUIDF9Rq2HifhW7hn-cinematic-anime-art-style-low-angle-worm-s-eye-v': `电影感动漫艺术风格，低角度虫视广角构图，从前景战士双腿之间形成戏剧化框景。画面带粗粝图像小说美学、赛璐璐动画质感、合成波霓虹灯光。主要光源来自发光的品红色圆形传送门或能量环。强调英雄姿态、强透视、动态动作、暗色背景与霓虹反差。`,

  'openart-viU69sVslTwH3TdEpgcy-professional-fashion-photography-medium-shot-of-': `专业时尚摄影，中景。一位模特坐在柔和粉色背景前，穿白色黑波点束身衣、不透明白色连裤袜和黑色尖头高跟鞋。配饰精致，姿态优雅。使用干净棚拍光、柔和肤色、高级杂志质感、简洁构图和复古女性化风格。`,

  'openart-UXfsxT1w0Ytac21bqvVZ-high-end-fashion-editorial-photography-with-a-ci': `高端时尚编辑摄影，电影感都市-自然美学。明亮微雾自然日光，柔和去饱和色调。突出长曝光运动模糊：背景人物或街景拖出流动轨迹，而主体时装模特保持清晰。构图强调动静对比、现代街头环境、服装层次、胶片颗粒与高级时尚杂志感。`,

  'openart-zv9SqJp8nXWoiQaUfF6k-an-amateur-lo-fi-vintage-snapshot-with-a-nostalg': `业余低保真复古快照，怀旧 90 年代傻瓜相机美学。使用刺眼直射机顶闪光灯，在主体眼中造成明显红眼效果，并在纯黑或暗色背景上投下硬阴影。画面有强噪点、颗粒、轻微失焦和真实抓拍缺陷。主体为时尚人物，姿态随意，整体像夜晚派对或室内闪光快照。`,

  'openart-5vXs2mec8MJEky46bhZv-high-fashion-editorial-portrait-with-a-minimalis': `高级时尚编辑人像，极简 90 年代美学。使用强烈直射闪光灯，形成高对比光线，让鲜艳服装颜色在中性背景前跳出。画面有真实 35mm 胶片颗粒、轻微噪点和杂志大片感。主体为模特，穿大胆配色服装与配饰，姿态自信，保持真实皮肤和布料纹理。`,

  'openart-v9tXa0rvk5HUSaCzekFi-high-end-fashion-editorial-portrait-with-a-polis': `风格与光线：高端时尚编辑人像，精致 90 年代美学。柔和明亮棚拍灯光让皮肤有轻柔光泽，同时突出毛绒与珠宝纹理。画面有干净高保真 35mm 胶片质感、细腻模拟颗粒和专业时尚杂志感。

主体与姿态：年轻女性的头肩近景人像，神情沉着优雅，视线微微向下，手指轻触太阳穴附近，构图精致动态。

时尚与配饰：夸张猫眼太阳镜，厚实豹纹仿毛框和深色镜片为视觉中心；银色镶钻戒指、银色圈形耳环；真实皮肤毛孔、自然雀斑、柔润裸色唇、清晰眉形、凌乱精致卷发盘发、白色缎面指甲。

背景：极简纯米白或浅灰棚拍墙面，浅景深让太阳镜与脸部前侧最清晰。`,

  'openart-7XrvV3Nrwx70UQHGGeej-a-dramatic-low-angle-wide-angle-street-style-edi': `戏剧性的低角度广角街头时尚编辑照片，从下方向上拍摄坐在城市边缘台阶上的模特。她巨大的白色厚底运动鞋和醒目的红色鞋底在前景清晰并产生强烈透视压缩。她自信地俯视镜头，穿红色白条纹风衣、黑色腿套和复杂耳饰，金棕色长卷发飘动。背景为现代摩天楼和清澈蓝天。90 年代美学，鞋子锐利对焦，色彩鲜艳，硬阳光，胶片颗粒。`,

  'openart-D4a4R2aS2kG0rgOWumDh-a-vibrant-high-energy-35mm-film-photograph-with-': `风格与光线：活力强烈的 35mm 胶片照片，复古低保真美学。锐利直射机顶闪光灯在主体皮肤和衣服上形成明亮高光，类似 90 年代随手快照。厚重模拟胶片颗粒、可见噪点和温暖略饱和色调。

主体与姿态：年轻亚洲女性灿烂大笑，表情兴奋，直视镜头。她以俏皮张腿姿势坐在凳子或拳击台边缘，头发自然凌乱，散发自信快乐能量。

服装：白色红领 ringer T 恤，印有肌肉健美图案和 “I WANT BANGKOK” 蓝字；深靛蓝牛仔夹克松垮披在肩上；高腰蓝色牛仔短裤；黄色拳击手套造型皮包，带褶边和细肩带。

环境：真实泰拳馆，背景有蓝黑拳台围绳、带泰文的拳台围裙、暗色工业空间。`,

  'openart-xUhXGHYCY2oLPIpdHzZT-a-high-energy-nostalgic-90s-summer-aesthetic-wit': `风格与美学：高能量、怀旧 90 年代夏日气息，并带有俏皮先锋 twist。使用鱼眼镜头从极低角度拍摄，形成动态圆形畸变。色彩高度饱和，有明显 35mm 胶片颗粒和细腻模拟噪点。后期加入粗厚的手绘粉色波浪轮廓线，框住中央主体。

主体与姿态：一位年轻女性，蓬松凌乱的姜色/赤褐色卷发，倒挂在黑色橡胶轮胎秋千上，闭眼快乐地咬着融化的橙黄色冰棒，表情兴奋。皮肤在阳光下保留雀斑和自然纹理。

服装与配饰：浅蓝无袖 ringer 短上衣，深森林绿滚边；多层彩色珠串手链；浅粉蓝指甲。

环境：晴朗户外游乐场，地面是金棕色木屑，背景有深蓝无云天空、红色金属游乐架和虚化绿树。`,

  'openart-7IsNAsY1O7C3PZkWBjLL-authentic-y2k-street-fashion-photography-early-2': `真实 Y2K 街头时尚摄影，2000 年代初美学。刺眼直射闪光灯制造高对比照明、皮肤亮高光和锐利暗影，并带轻微电影 bloom 与复古胶片颗粒，呈现怀旧低保真数码相机感。

主体：时髦东亚年轻女性，浓密卷曲黑发，靠在金属围栏前动态摆姿。一条腿站立，另一条腿抬起展示鞋履，表情自信略带挑逗，戴无框有色眼镜。

穿搭：豹纹军帽；棕色与藕紫色无肩带 bandeau 上衣，由层叠磨损布料、扣带和胸前皮带缠绕细节构成；超短牛仔热裤和银色铆钉腰带；及膝牛仔系带细高跟靴，结合运动鞋与高跟元素，带金属铆钉和白色鞋带；多层银链项链、金属手镯和手链。

背景与光线：金色网格围栏反光，后方为柔和橙蓝晚霞。黄金时刻逆光与正面闪光混合，在主体轮廓周围形成光晕。技术细节：35mm 胶片、鲜艳饱和、高对比、过曝高光、轻微运动模糊、牛仔和金属质感锐利。`,

  'openart-6Sezg2HDdcIsio3lt9rZ-2040s-tech-couture-radiant-electric-pink-and-liq': `2040 年代科技高定，明亮电光粉与液态铬。动作：模特站在镜面墙电梯内，手指停在铬色接缝上。场景：反光电梯立方体，画面中部有从左到右横向掠过面板的光 streak，抛光银色边框和白色高光。摄影与光线：32mm 中广角，主光从镜头右侧来，顶部反弹光；超光滑高亮、细腻颗粒、光学眩光；不要可见文字。`,

  'openart-OqjOKflzGCm3KNccJut2-visualizing-the-latent-space-t-sne-scatter-plot-': `可视化“潜空间”（t-SNE 散点图）。在黑暗 3D 空间中展示不同颜色分组的聚类数据点，点之间有微妙连接线。整体为科学可视化风格。`,

  'openart-nXzNpChvZBafLPrUzReJ-a-close-up-dynamic-portrait-of-a-young-woman-wit': `主体与姿态：年轻女性的动态近景人像，扎光滑编织马尾。她俏皮眨眼，同时用力咬下一颗大而清脆的红黄色苹果，苹果上已有可见咬痕。表情犀利、有表现力，露出白牙。

时尚与配饰：窄黑框矩形眼镜，镜腿点缀小水钻；妆容为浓重棕红唇釉和清晰眉形；白色大珍珠吊坠耳环、简洁黑色无袖上衣；指甲为浅薰衣草或银蓝色。

场景与构图：户外滨水区域，背景中布鲁克林大桥的标志性剪影横跨水面，远处纽约天际线在明亮朦胧的日落天空下虚化。紧凑中近景突出面部表情。

光线与摄影：高对比 90 年代时尚编辑风格。直射机顶闪光灯在皮肤和苹果上形成明亮高光，并与黄金时刻暖色逆光结合。画面有复古 35mm 胶片颗粒、细噪点、真实皮肤纹理、毛孔和雀斑。`,

  'openart-VIx1Ce7srcvOwtYGN4UT-google-street-view-coordinates-48-8566-2-3522-pa': `Google 街景，坐标 48.8566, 2.3522（法国巴黎）。生成写实街道级视图，带 Google Maps UI 叠层、导航箭头和街道名称标签。`,

  'openart-dV76R29kxThJPHbhjmft-a-nostalgic-90s-vintage-analog-film-photograph-w': `风格与光线：怀旧 90 年代复古模拟胶片照片，忧郁电影感都市美学。厚重 35mm 胶片颗粒和高噪点贯穿画面，模拟复古傻瓜相机的低保真效果。光线柔和、平坦、自然，像阴影城市小巷或阴天下午。色调略去饱和，带冷青蓝底色，类似韩国或香港经典艺术电影。

主体与姿态：身材修长、精瘦的年轻亚洲男性站在画面中央，表情冷静克制，直视镜头，手中拿着冰棒靠近嘴边，另一只手插兜，姿态放松而酷。

穿搭：白色罗纹背心扎进裤中；经典深蓝直筒牛仔裤，细棕色皮带；浅色米白帆布鞋。

环境：韩国街边小杂货店前，蓝色招牌写着 “강동미니수퍼”，有旧青绿色遮阳棚，店前堆放黑色塑料箱、小红灰塑料凳，室内可见冰柜和货品。地面为磨损深色沥青，前景有圆形金属井盖。`,

  'openart-cxjxVUHfEqpjjzFjmH2Q-8-bit-style-san-francisco': `8-bit 像素风旧金山。`,

  'openart-LUSgr2aNgDm52KVlaL2w-arrange-a-variety-of-japanese-foods-onigiri-moch': `将多种日本食物（饭团、麻糬、拉面配料、寿司卷）排列成清晰可读的单词 “Japan”。使用俯拍构图、柔和光线和干净背景。食物要看起来新鲜、色彩丰富，并被整齐塑形以保持文字可读性。`,

  'openart-eTWCRyMveDVrphVFI6Mn-create-an-image-about-the-tortoise-and-the-hare-': `创作一张关于《龟兔赛跑》的图像，用一系列钉在软木板上的宝丽来照片重新讲述故事。每张照片捕捉一个关键时刻，下方带简短说明文字。将照片沿松散的时间顺序排布，并用彩色线绳连接事件和角色。使用温暖光线营造怀旧感。加入咖啡杯印、回形针、手写便签等偶然细节，增强真实感。`,

  'openart-4jjcLVZw5ZnrT7teBzC5-create-8-different-initial-sketches-leading-to-t': `创作 8 个不同的初始草图，展示这些草图如何逐步发展成最终 Logo 设计。`,

  'openart-1kb4WnNAi5OFnbrncVEg-moody-low-light-fashion-photography-with-a-vinta': `风格与光线：低调昏暗的时尚摄影，复古 35mm 模拟胶片美学。画面有厚重胶片颗粒和细噪点。使用柔和直射闪光照亮主体，同时在背景中形成深邃电影阴影。色彩温暖、泥土色、略去饱和，具有 90 年代高级时装编辑风格。

主体与姿态：美丽年轻女性站在宏伟楼梯上，深色浓密长卷发，表情性感自信，直视镜头。皮肤有自然柔光、真实纹理和细颗粒。她一只手臂靠在深色抛光木质扶手上。

服装与配饰：精致挂脖迷你裙，上半身为深棕虎纹，下半身为暗酒红花卉/佩斯利蕾丝褶皱裙；手腕戴金色与象牙色复古叠戴手镯，佩戴大颗祖母绿色戒指；指甲为深暗红。

环境：昏暗宏伟的古典室内，右侧是厚重华丽深色木楼梯和扶手。背景被黑暗包裹，只有细微建筑线脚隐约可见，营造亲密神秘的夜间氛围。关键词：90s 时尚编辑、模拟胶片颗粒、高噪点、35mm 摄影、硬闪、低光、虎纹裙、电影光、8K、真实毛孔、深色雕花木质室内。`,

  'openart-Qw7fGbxwScWmoIfFto7o-create-a-hand-drawn-isometric-schematic-diagram-': `创建一张手绘风格的等距示意图，主题为加纳海岸角城堡（Cape Coast Castle）。`,

  'openart-5NvAMKnoNk849Te0UZmT-create-an-infographic-image-of-the-empire-state-': `创建一张帝国大厦信息图，将地标的真实照片与蓝图风技术注释和图解叠加在一起。在角落的手绘框中加入标题 “The Empire State Building”。添加白色粉笔风草图，展示关键结构数据、重要尺寸、材料数量、内部图解、载荷流向箭头、剖面、平面图以及显著建筑/工程特征。风格为照片上的白线蓝图美学、技术/建筑注释风格和教育信息图感觉。`,

  'openart-irMKagRgJ0EkHFJ4mB3T-a-professional-cinematic-visual-development-boar': `一张专业电影感视觉开发板，用于高端 3D 动画长片。画面采用干净浅灰编辑版式与有序网格面板。开发板展示两个主角：一只蓬松橙棕色小熊猫，具有明显白色脸部花纹和蓬松环纹尾巴；一只鲜艳彩虹穿山甲，覆盖从深紫到亮黄的虹彩多色鳞片。

顶部：角色设计表。为两个角色展示正交三视图（正面、侧面、背面），保持一致的 3D 毛发与鳞片材质；同时展示一组表情研究，包括“动画式对话”和“突然震惊/恐惧”。

中部：场景与环境设计。展示为小动物定制的现代电动车内部，有发光全息仪表盘和触感皮革座椅。另一个环境面板展示金色时刻阳光照耀的海岸公路，并转入一棵倒下的巨大雪松堵住车道的戏剧画面。俯视 blocking 图说明车辆轨迹与障碍物距离。

底部：分镜序列。面板 1：红熊猫驾驶，穿山甲在深入对话中兴奋比划的中景双人镜头。面板 2：透过挡风玻璃的 POV，弯道后突然出现倒树。面板 3：极近景，红熊猫爪子猛踩金属刹车踏板。面板 4：侧面广角，车辆前倾，轮胎在沥青上冒烟尖叫。面板 5：两个角色猛地向前撞进安全带，眼睛因肾上腺素睁大。

技术细节：用红色运动箭头标注“快速推进”和“手持震动”的镜头运动图。光线说明：对话段落为温暖高调车内光，紧急段落转为高对比电影阴影。风格为专业 Pixar 灵感 3D 动画，8K，光线追踪反射，道路面板有运动模糊，并带优雅字体标签 “Scene 14: The Near Miss” 与干净黑色分隔线。`,
}

async function main() {
  const gallery = JSON.parse(await fs.readFile(galleryPath, 'utf8'))
  const updatedIds = applyTranslations(gallery.examples ?? [])
  gallery.generatedAt = new Date().toISOString()
  await fs.writeFile(galleryPath, `${JSON.stringify(gallery, null, 2)}\n`, 'utf8')

  try {
    const candidates = JSON.parse(await fs.readFile(candidatesPath, 'utf8'))
    applyTranslations(candidates.examples ?? [])
    candidates.generatedAt = new Date().toISOString()
    await fs.writeFile(candidatesPath, `${JSON.stringify(candidates, null, 2)}\n`, 'utf8')
  } catch (error) {
    console.warn(`Candidate file was not updated: ${error instanceof Error ? error.message : String(error)}`)
  }

  console.log(`Applied ${updatedIds.length} OpenArt prompt translations.`)
}

function applyTranslations(examples) {
  const updatedIds = []
  for (const example of examples) {
    const translation = translations[example.id]
    if (!translation) continue

    example.promptZh = translation
    example.promptsZh = [translation]
    updatedIds.push(example.id)
  }
  return updatedIds
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
