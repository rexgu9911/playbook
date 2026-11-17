// Chinese interface for Playbook. Game titles, creators and descriptions stay as their creators wrote them.
// The app renders English; PB_I18N.apply(root) swaps interface text in place when the language is zh.
(() => {
  const saved = (() => { try { return localStorage.getItem('pb-lang'); } catch { return null; } })();
  const lang = saved || ((navigator.languages || [navigator.language || '']).some(l => /^zh/i.test(l)) ? 'zh' : 'en');
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

  const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  const G = { Action: '动作', Adventure: '冒险', Sim: '模拟', Shooter: '射击', Puzzle: '解谜', Strategy: '策略', Racing: '竞速', Arcade: '街机',
    Sports: '体育', RPG: '角色扮演', Roguelike: 'Roguelike', Flight: '飞行', Platformer: '平台跳跃', Survivor: '幸存者', Other: '其他',
    Movement: '移动', Feel: '手感', Progression: '成长', Feedback: '反馈', Camera: '镜头', Combat: '战斗', UI: '界面', Audio: '音效', Generation: '生成' };
  const P = { 'Game jam': 'Game Jam', Web: '网页', X: 'X', YouTube: 'YouTube', 'Hacker News': 'Hacker News', Reddit: 'Reddit', 'itch.io': 'itch.io', Wavedash: 'Wavedash' };
  const g = s => G[s] || s;
  const week = (m, d, y) => `${y ? y + '年' : ''}${MON[m]}月${d}日这一周`;
  const GENRE_RX = '(Action|Adventure|Sim|Shooter|Puzzle|Strategy|Racing|Arcade|Sports|RPG|Roguelike|Flight|Platformer|Survivor|Other)';

  // exact strings (text nodes, attributes, or whole elements; {0} {1} keep the element's own links)
  const D = {
    // chrome
    'Play': '游戏', 'Make': '制作', 'Creators': '创作者', 'Jam': 'Jam', 'Submit a game': '提交游戏', 'Connect MCP': '接入 MCP', 'Search': '搜索',
    'Search games, creators…': '搜索游戏、创作者…', 'Search games, creators, mechanics…': '搜索游戏、创作者、手感组件…', 'Home': '首页', 'Skip to content': '跳到正文',
    'Search games, creators, mechanics': '搜索游戏、创作者、手感组件', 'Show more': '显示更多', 'What this game is made of. Take all of it, or just the parts you want.': '这款游戏由什么组成。可以全部拿走，也可以只取你想要的部分。', 'Featured games': '精选游戏', 'Previous': '上一个', 'Next': '下一个', '· remix of {0}': '· 改编自 {0}', 'Dialog': '对话框',
    'Weekly picks': '每周精选', 'Game index': '游戏索引', 'About': '关于', 'All games': '全部游戏', 'Start here': '从这里开始', 'Game feel': '手感组件', 'Recipes': '配方',
    'Claim your profile': '认领主页', 'Respawn ↑': '重生 ↑', 'GitHub ↗': 'GitHub ↗', 'Menu': '菜单', 'Close': '关闭', 'Search games': '搜索游戏', 'Playbook home': 'Playbook 首页',
    'Main': '主导航', 'Quick': '快捷导航', 'Scroll left': '向左滚动', 'Scroll right': '向右滚动', 'Fullscreen': '全屏', 'Restart': '重新开始', 'move': '移动', 'open': '打开', 'close': '关闭',
    'The home of vibe gaming. Play the best AI-made web games, meet the people making them, and make yours feel this good.': 'vibe gaming 的主场。玩最好的 AI 网页游戏，认识做出它们的人，也让你的游戏手感更好。',
    'Games listed on Playbook belong to their creators. We link to their own pages and show the cover image they publish; nothing is copied or hosted here. Creators can claim or remove a listing at any time. Playbook MCP is free and open source.':
      'Playbook 收录的游戏属于它们的作者。我们只链接作者自己的页面，展示作者公开发布的封面图，不复制、不托管任何内容。作者可以随时认领或下架。Playbook MCP 免费开源。',
    'Copied': '已复制', 'Opened GitHub in a new tab': '已在新标签页打开 GitHub', 'Please choose an .html file': '请选择一个 .html 文件',
    // home
    'This week in vibe gaming': '本周 vibe gaming 精选', 'Read the issue': '阅读本期', 'Past issues': '往期', 'Pick of the week': '本周最佳', 'Showreel': '展示片', 'Playbook at a glance': 'Playbook 概览',
    'Cursor Vibe Jam winners inside': '收录 Cursor Vibe Jam 获奖作品', 'Free and open-source MCP': '免费开源的 MCP',
    'All-time best': '历史最佳', 'The vibe-coded games people keep coming back to: jam winners and the ones that went viral.': '大家玩了又玩的 vibe 游戏：Game Jam 冠军，以及在网上爆火的作品。',
    'New this week': '本周新游戏', 'Fresh from X, game jams and itch. Every card opens the creator’s own page.': '新鲜出炉，来自 X、Game Jam 和 itch.io。',
    'Creators to follow': '值得关注的创作者', 'The people behind the best vibe games right now.': '当下最好的 vibe 游戏背后的人。',
    'Game feel, ready to install': '手感组件，即装即用', 'What a one-line prompt gets wrong. Poke the live demo, then add it to your game by name.': '一句提示词做不好的那部分。先玩玩演示，再按名字加进你的游戏。',
    'Browse by genre': '按类型浏览', 'From the game jams': 'Game Jam 精选', 'Winners and standouts from Cursor Vibe Jam and other AI game jams.': 'Cursor Vibe Jam 和其他 AI 游戏比赛的获奖与出彩作品。',
    'See all': '查看全部', 'For vibe coders · free and open source': '给 vibe coder · 免费开源', 'Make yours feel this good': '让你的游戏也这么好玩',
    'Game feel, recipes and search, inside your own coding agent': '手感、配方和搜索，都在你自己的编程助手里', 'Cursor, Codex, Desktop': 'Cursor、Codex、Desktop',
    'Hit-stop, shake, dodge roll, combos': '打击停顿、震屏、闪避翻滚、连招', 'Open games you can remake': '可以重做的开源游戏', 'Who makes the best vibe games': '谁在做最好的 vibe 游戏',
    'Free': '免费', 'Made one, or found one? Send it in': '自己做的，或者发现的好游戏？发给我们', 'Coming soon': '即将开始', 'Community': '社区', 'Get notified': '提醒我',
    'Our first vibe gaming jam is coming. Make a game with AI, share it as a link, get picked by the community.': '我们的第一届 vibe gaming 比赛就要来了。用 AI 做一款游戏，以链接分享，由社区评选。',
    // play / cards
    'Updated every week': '每周更新', 'Play the best vibe-coded games': '玩最好的 <em>vibe</em> 游戏', 'Meet the creators': '认识创作者', 'All': '全部', '3D only': '只看 3D', 'Newest': '最新',
    'Found on': '发现于', 'Anywhere': '全部来源', 'Live': '实时', 'Unknown creator': '未知作者', 'Is this yours? Claim or remove': '这是你的作品？认领或下架',
    'Listings are links to third-party pages that their creators made public. Titles and credits are shown as given at the source; each link was last checked on the date in our index. Creators can claim or remove a listing from its card at any time.':
      '收录内容都是作者公开发布的第三方页面链接。标题和署名按原始来源显示，每个链接都标注了最近检查日期。作者可以随时在卡片上认领或下架。',
    'Review queue': '审核队列',
    // make
    'For vibe coders': '给 vibe coder', 'Make vibe games that feel good': '做出<em>手感好</em>的 vibe 游戏',
    'A one-line prompt gets you a game that runs. Playbook helps with the rest: the timing, impact and polish that keep people playing, pulled straight into your own coding agent.':
      '一句提示词能做出一个能跑的游戏。剩下的交给 Playbook：节奏、打击感和打磨，这些让人愿意一直玩下去的东西，直接装进你自己的编程助手。',
    'Connect your agent': '接入你的编程助手', 'Claude Code, Cursor or Codex. One command. No account, no API key.': 'Claude Code、Cursor 或 Codex，一条命令搞定，不用注册，不用 API key。',
    'Other clients': '其他客户端', 'Add game feel': '加上手感', 'Browse game feel': '浏览手感组件', 'Start from a recipe': '从配方开始', 'Browse recipes': '浏览配方', 'Share it': '分享出去',
    'Made something good? Send it in. The best ones go into the weekly picks, credited to you.': '做出好东西了？发给我们。最好的会进入每周精选，并署上你的名字。',
    'Poke the live demo, then add it by name.': '先玩玩演示，再按名字加进游戏。', 'Open recipes': '开源配方', 'Whole games you can remake: prompt, mechanics, look, sound and source.': '可以整款重做的游戏：提示词、机制、画风、音效和源码。',
    'Live demo': '在线演示',
    // creators
    'The people making vibe games': '做 <em>vibe 游戏</em>的人',
    'Everyone behind a game we list, linked to their own pages. Is one of them you? Open your profile to claim it, fix the details or take it down.': '我们收录的每款游戏背后的作者，都链接到他们自己的主页。其中有你吗？打开你的主页，可以认领、修改信息或下架。',
    'Profiles are built from the public posts where creators shared their games. Nothing is copied or hosted here.': '主页信息来自创作者公开分享游戏的帖子，我们不复制、不托管任何内容。',
    'X profile ↗': 'X 主页 ↗', 'Reddit profile ↗': 'Reddit 主页 ↗', 'Is this you? Claim this profile': '是你吗？认领这个主页', 'Claim this profile.': '认领这个主页。',
    'Add your links and a short bio, fix a credit, list another game of yours, or ask us to take the profile down.': '添加你的链接和简介、修正署名、补充你的其他游戏，或者要求我们下架主页。',
    'I want to': '我想要', 'Claim my profile': '认领我的主页', 'Add another game of mine': '补充我的其他游戏', 'Fix a credit or detail': '修正署名或信息', 'Remove my profile and games': '下架我的主页和游戏',
    'A link that shows this is you': '能证明是你的链接', 'https:// (a post or page on the account above)': 'https://（上面这个账号发的帖子或页面）', 'Continue on GitHub': '去 GitHub 继续',
    'This opens a pre-filled issue on our GitHub repo. Removal requests are acted on as soon as we see them.': '会在我们的 GitHub 仓库打开一个预填好的 issue。下架请求我们看到后会立即处理。',
    'Is this yours?': '这是你的作品吗？', 'Claim the listing to edit its details, or ask us to take it down. Removal requests from the creator are honoured without questions.': '认领后可以修改信息，也可以要求下架。作者本人的下架请求，我们无条件执行。',
    'Claim this listing': '认领这条收录', 'Remove this listing': '下架这条收录', 'Fix the credit or details': '修正署名或信息', 'Your public handle or a link that shows it is yours': '你的公开账号，或能证明是你作品的链接',
    '@handle or https://': '@账号 或 https://', 'Discover': '发现', 'Submit a game.': '提交一款游戏。',
    'Yours or one you found. We check that it loads and that the creator shared it publicly, then list it with a link and credit.': '你自己的，或者你发现的都行。我们会确认能打开、作者是公开分享的，再以链接加署名的方式收录。',
    'Playable link': '可玩链接', 'Creator handle': '作者账号', 'Where it was shared': '在哪里分享的', 'Link to the post': '帖子链接', '@handle': '@账号',
    'This opens a pre-filled public issue on our GitHub repo (a free GitHub account is needed). We check every link by hand before listing it.': '会在我们的 GitHub 仓库打开一个预填好的公开 issue（需要一个免费 GitHub 账号）。每个链接收录前我们都会人工检查。',
    // game page
    'Play here': '在这里玩', 'Made with': '制作工具', 'Engine': '引擎', 'Shared': '分享时间', 'Link checked': '链接检查', 'Where it was shared ↗': '在哪里分享的 ↗', 'Copy share link': '复制分享链接', 'Profile': '主页',
    'Play here runs the creator’s own page in a sandboxed frame. Playbook links to the creator’s site and credits them; nothing is copied or hosted here.': '「在这里玩」会在一个隔离的框里运行作者自己的页面。Playbook 只链接作者的网站并署名，不复制、不托管任何内容。',
    'Playbook links to the creator’s site and credits them; nothing is copied or hosted here.': 'Playbook 只链接作者的网站并署名，不复制、不托管任何内容。',
    // mechanics + recipes + mcp
    'Mechanics': '手感组件', 'Small parts that make a game feel good.': '让游戏手感变好的小零件。', 'Each one is a live demo, a prompt and an install command. Poke them. They react.': '每个都有在线演示、提示词和安装命令。点点看，它们会有反应。',
    'Live demo. Click, tap or use the keyboard inside the frame.': '在线演示。在框里点击、触摸或用键盘操作。', 'Install': '安装', 'Key numbers': '关键数值', 'Or paste into your agent': '或者粘贴进你的编程助手',
    'Copy prompt': '复制提示词', 'Works with': '适用于', 'In the wild': '实际应用', 'Games using it.': '用到它的游戏。',
    'The first line works once {0} is installed; the prompt works in any coding agent as is.': '安装 {0} 之后第一行就能用；提示词在任何编程助手里都能直接用。',
    'Every game is a recipe': '每款游戏都是一份<em>配方</em>', 'Remix': '改编', 'Remake this game': '重做这款游戏', 'Lineage': '谱系', 'remixed into →': '改编成 →', 'Prompt': '提示词', 'Art direction': '美术方向',
    'Sound': '音效', 'Recipe': '配方', 'More recipes': '更多配方', 'Make it yours.': '做成你的版本。', 'Keep the mechanics and feel. Change what it looks like and who it is about.': '保留机制和手感，换掉外观和主角。',
    'New theme': '新主题', 'Player is': '玩家是', 'Difficulty': '难度', 'Chill': '轻松', 'Same as original': '和原作一样', 'Brutal': '硬核', 'With Playbook MCP': '使用 Playbook MCP', 'Without MCP': '不用 MCP',
    'Paste into Claude Code, Cursor or Codex. The MCP version also pulls the source and mechanic code: {0}.': '粘贴到 Claude Code、Cursor 或 Codex。MCP 版本还会拉取源码和组件代码：{0}。', 'install it': '去安装',
    'Run this in your terminal, then start claude in your project.': '在终端里运行这条命令，然后在你的项目里启动 claude。',
    'Add this to ~/.cursor/mcp.json (or .cursor/mcp.json in your project), then reload Cursor.': '把这段加到 ~/.cursor/mcp.json（或项目里的 .cursor/mcp.json），然后重新加载 Cursor。',
    'Run this once (it writes ~/.codex/config.toml for you).': '运行一次即可（会自动写入 ~/.codex/config.toml）。',
    'In the macOS menu bar: Claude → Settings… → Developer → Edit Config. Add this to claude_desktop_config.json, then quit and reopen Claude.': '在 macOS 菜单栏：Claude → 设置… → 开发者 → 编辑配置。把这段加到 claude_desktop_config.json，然后退出并重新打开 Claude。',
    'Any MCP client that runs stdio servers. Needs Node 18+.': '任何支持 stdio 服务器的 MCP 客户端都可以，需要 Node 18+。', 'Source on GitHub': 'GitHub 源码', 'Browse mechanics': '浏览手感组件',
    'Find recipes, mechanics and AI games from the web': '搜索配方、手感组件和网上的 AI 游戏', 'Prompt, mechanics, look, sound and source of a game': '一款游戏的提示词、机制、画风、音效和源码',
    'A game-feel part with a working reference implementation': '一个手感组件，附可运行的参考实现', 'Every recipe or mechanic, by genre or category': '全部配方或组件，按类型或分类',
    'Then just ask: “Add hit-stop to my game” · “Remake Neon Drift, but underwater” · “Find AI-made racing games for inspiration”.': '然后直接说：“给我的游戏加上打击停顿” · “把 Neon Drift 重做成水下版” · “找一些 AI 做的赛车游戏找灵感”。',
    'Popular': '热门', 'Playbook MCP': 'Playbook MCP',
    'Playbook Studio · early access': 'Playbook Studio · 抢先体验',
    'One sentence. A game-ready character.': '一句话，做出能直接用的游戏角色。',
    'Describe a character. Get it drawn, animated and given sound effects in one style, as files your game can load. Then publish the game on Playbook.': '描述一个角色，就能得到画风统一的立绘、动画和音效，是游戏能直接读取的文件。做完把游戏发布到 Playbook。',
    'Request early access': '申请抢先体验',
    'How making works': '了解怎么做游戏',
    'Examples': '示例',
    'Each one: the sentence, the sheet it made, and a small demo you can play.': '每个示例都有：那句话、生成的 sprite sheet，以及一个能玩的小 demo。',
    'Examples are being made': '示例正在制作中',
    'Real examples go here before this page is shared.': '公开这个页面之前，这里会放上真实生成的示例。',
    'Play the demo': '玩 demo',
    'What you get': '你会得到什么',
    'Drawn': '立绘',
    'A character in the style you describe, on a clean transparent background.': '按你描述的画风画出角色，透明背景。',
    'Animated': '动画',
    'Idle, run, jump and attack, cut into sprite sheets with frames that line up.': '待机、跑、跳、攻击，切成帧对齐的 sprite sheet。',
    'Voiced': '音效',
    'A matching set of sound effects: steps, jump, hit and a short victory sting.': '一套配套音效：脚步、跳跃、受击，还有一段胜利音效。',
    'Ready to load': '直接能用',
    'Files and a manifest that Phaser and three.js games can read as they are.': '附带清单文件，Phaser 和 three.js 游戏可以直接读取。',
    'Dropped into your project': '直接放进你的项目',
    'Your own agent pulls it in through the Playbook MCP, next to the game-feel parts.': '你自己的 agent 通过 Playbook MCP 把它放进项目，和手感组件放在一起。',
    'Price at launch': '上线后的价格',
    'Not on sale yet. Prepaid credits, no subscription.': '现在还不能买。预付 credits，不是订阅。',
    'Starter': '入门',
    'Creator': '创作者',
    '10 characters': '10 个角色',
    '40 characters': '40 个角色',
    'The first 100 people on the early-access list get 20 free characters at launch.': '抢先体验名单的前 100 位，上线时送 20 个免费角色。',
    'Email': '邮箱',
    'Which would you buy?': '你会买哪一档？',
    'Starter · $5': '入门 · $5',
    'Creator · $15': '创作者 · $15',
    'Just curious': '只是看看',
    'What are you making? (optional)': '你在做什么游戏？（选填）',
    'We only use your email to tell you when Studio opens. It is never shared, and you can ask us to delete it at any time.': '邮箱只用来通知你 Studio 上线，不会分享给任何人，你可以随时要求删除。',
    "You're on the list": '已加入名单',
    "We'll email you when Studio opens.": 'Studio 上线时我们会发邮件通知你。',
    'Early access is not open yet': '抢先体验还没开放',
    'Could not save. Please try again.': '保存失败，请再试一次。',
    'Need the art and sound too? Studio early access →': '还需要美术和音效？申请 Studio 抢先体验 →',
    'Studio': 'Studio',
    'Library': '游戏库',
    'Your library': '我的游戏库',
    'Games you played and saved, kept in this browser. No account needed.': '你玩过和收藏的游戏，保存在这个浏览器里，不需要账号。',
    'Recently played': '最近玩过',
    'Clear history': '清除记录',
    "Start with this week's picks": '从本周精选开始',
    'Continue playing': '继续玩',
    'Games you opened recently, kept in this browser.': '你最近打开过的游戏，保存在这个浏览器里。',
    'The home of vibe gaming': 'vibe gaming 的主场',
    'Hand-picked web games made with AI. Free, no download, and every one credited to the person who made it.': '人工精选的 AI 网页游戏。免费、不用下载，每一款都署上作者的名字。',
    'Play now': '开始玩',
    'Make one': '做一个',
    'All-time best': '历代最佳',
    'Details': '详情',
    'Open source': '开源',
    'Remix this game': 'Remix 这款游戏',
    'The creator published the source. Start from it in your own agent, keep their credit, and check the license in the repo.': '作者公开了源码。可以在你自己的 agent 里以它为起点改，保留原作者署名，并遵守仓库里的许可协议。',
    'View the source ↗': '查看源码 ↗',
    'Start from one sentence': '从一句话开始',
    'What do you want to make?': '你想做什么游戏？',
    "Describe your game. We write the prompt and pick the game-feel parts, and your own agent builds it, so there's nothing to pay us.": '描述你的游戏。我们来写提示词、挑好手感组件，由你自己的 agent 来做，所以不用付我们任何费用。',
    'Write my prompt': '帮我写提示词',
    'Connect the Playbook MCP first': '先接入 Playbook MCP',
    "No GitHub account? If we told you about this listing, just reply to that message and we'll take care of it.": '没有 GitHub 账号？如果我们联系过你，直接回复那条消息就行，我们来处理。',
    'Quality standards': '收录标准',
    'What makes the cut': '怎样才能被收录',
    'Playbook is picky on purpose. Every game here passes the same bar, and every weekly pick is chosen by a person.': 'Playbook 是故意挑剔的。这里的每款游戏都过了同一条门槛，每周精选都由真人挑选。',
    'Made mostly with AI': '主要由 AI 制作',
    'The creator says in public that AI wrote most of the code, and we link to where they said it.': '作者公开说明大部分代码由 AI 写成，我们会链接到他们说这句话的地方。',
    'Free to play in a browser': '浏览器里免费直接玩',
    'No download, no sign-in and no payment to start playing.': '不用下载、不用登录、不用付费，打开就能玩。',
    'An original game': '原创作品',
    "No clones of other people's games, characters or names. Inspired by is fine; copies are not.": '不收别人游戏、角色或名字的克隆。受启发可以，照抄不行。',
    'A real game': '真正的游戏',
    'Something you can play and win, lose or score in, not a tech demo, a tool or a screensaver.': '能玩、有输赢或分数，而不是技术演示、工具或屏保。',
    'Not a content farm': '不收批量农场',
    "We list a creator's best work, not hundreds of near-identical games.": '我们收录作者最好的作品，而不是几百款大同小异的游戏。',
    'Credited and respected': '署名并尊重作者',
    "We link to the creator's own page and show the image they publish. Nothing is copied or hosted here, and creators can claim or remove a listing at any time.": '我们链接作者自己的页面，展示作者公开发布的图片。不复制、不托管任何内容，作者可以随时认领或下架。',
    'How weekly picks are chosen': '每周精选怎么选',
    'Each week a person picks five games that stand out for how they look, how they feel to play, or what they try. Every pick says why.': '每周由真人挑出 5 款在画面、手感或创意上出彩的游戏，每一款都会写明为什么。',
    'Read the picks': '看每周精选',
    'Share kit': '分享工具包',
    "Made this game? Show it's on Playbook. Badges link back here.": '这是你做的游戏？放上徽章，让大家知道它在 Playbook 上，点击会回到这里。',
    'Our standards': '收录标准',
    'Dark': '深色',
    'Light': '浅色',
    'Weekly pick': '每周精选',
    'Weekly pick, dark': '每周精选 · 深色',
    'Copy post': '复制推文',
    'Save': '收藏', 'Saved': '已收藏', 'Removed from saved': '已取消收藏',     'Nothing saved yet': '还没有收藏', 'Tap ♡ on any game to save it here.': '点任意游戏上的 ♡，就能收藏到这里。', 'Three at random': '随机三款', 'Shuffle ↻': '换一批 ↻',
    'Not sure what to play? Let the arcade pick.': '不知道玩什么？让我们帮你挑。', 'Touch-friendly': '手机可玩', 'Touch': '触屏', 'Guides': '游戏指南', 'All guides': '全部指南',
    'Where to start': '从这里开始玩', 'Short lists of the vibe-coded games worth your time, picked by theme and kept up to date as new games arrive.': '按主题挑出值得一玩的 vibe 游戏，有新游戏时会自动更新。', 'Copy': '复制', 'Games': '游戏', 'Playbook original': 'Playbook 原创', 'Playbook remix': 'Playbook 改编',
    'Where it came from, where it went.': '它从哪来，又改编成了什么。', 'Open recipes to start from': '可以直接拿来改的开源配方', 'Ask your agent to remake one with get_recipe.': '让你的 agent 用 get_recipe 重做其中一款。', 'All recipes': '全部配方', 'Game feel to add by name': '报名字就能加的手感组件', 'Ask your agent to add one with get_mechanic.': '让你的 agent 用 get_mechanic 加上其中一个。', 'All mechanics': '全部手感组件',
    // jam / publish / 404
    'Pick any game on the wall, remake it in your agent, publish it as a link. Dates, rules and prizes will be announced here first.': '挑一款游戏，用你的编程助手重做，以链接发布。日期、规则和奖品会首先在这里公布。',
    'Start from one of these': '从这些开始', 'Publish': '发布', 'One file in. One link out.': '放进一个文件，拿到一个链接。',
    'Drop the HTML file your agent made. You get a game page, a share link and a spot on the charts.': '把你的编程助手做出的 HTML 文件拖进来，就能得到一个游戏页和一个分享链接。',
    '.html · up to 5 MB': '.html · 最大 5 MB', 'Drop your game here': '把游戏拖到这里', 'Publishing opens soon. For now this preview runs only in your browser tab; nothing is uploaded.': '发布功能即将开放。目前预览只在你的浏览器里运行，不会上传任何东西。',
    'or': '或', 'Choose file': '选择文件', 'Try with a sample': '用示例试试', 'Preview': '预览', 'Your game': '你的游戏',
    'When publishing opens, this link will work anywhere, embed in any site, and credit the game you remixed from.': '发布开放后，这个链接在哪里都能用，可以嵌入任何网站，并署名你改编的原作。',
    'Game over.': '游戏结束。', 'Respawn at home': '回到首页重生', 'Play all games': '玩全部游戏',
    // weekly
    'Copy link': '复制链接', 'Copy post for X': '复制 X 推文', 'Details': '详情', 'All issues': '全部期数', 'Every Monday': '每周一',
    'This week in vibe gaming ': '本周 vibe gaming 精选', 'This week in vibe gaming.': '本周 vibe gaming 精选',
    // search
    'From the web': '网上的游戏', 'Fresh from the web': '最新游戏', 'Playbook recipes': 'Playbook 配方', 'Pages': '页面', 'Open': '打开', 'Go': '前往',
    'Make: start here': '制作：从这里开始', 'Game feel (mechanics)': '手感组件', 'Connect Playbook MCP': '接入 Playbook MCP', 'Playbook Jam': 'Playbook Jam',
  };

  // patterns (text nodes, attributes and whole elements)
  const R = [
    [/^Issue #(\d+) · Week of (\w{3}) (\d+) · picked by hand from (\d+) games$/, (_, n, m, d, c) => `第 ${n} 期 · ${week(m, d)} · 从 ${c} 款游戏中人工精选`],
    [/^Week of (\w{3}) (\d+), (\d{4})$/, (_, m, d, y) => week(m, d, y)],
    [/^This week in vibe gaming · Issue #(\d+)$/, (_, n) => `本周 vibe gaming 精选 · 第 ${n} 期`],
    [/^Issue #(\d+)$/, (_, n) => `第 ${n} 期`],
    [/^Pick #(\d+)$/, (_, n) => `精选 #${n}`], [/^This week in vibe gaming · Pick #(\d+)$/, (_, n) => `本周 vibe gaming 精选 · #${n}`],
    [/^(\d+) played$/, (_, n) => `玩过 ${n} 款`], [/^(\d+) saved$/, (_, n) => `收藏 ${n} 款`], [/^Saved \((\d+)\)$/, (_, n) => `收藏（${n}）`], [/^Guide · (\d+) games$/, (_, n) => `指南 · ${n} 款游戏`], [/^← Issue #(\d+)$/, (_, n) => `← 第 ${n} 期`], [/^Issue #(\d+) →$/, (_, n) => `第 ${n} 期 →`],
    [/^(\d+) · Pick of the week$/, (_, n) => `${n} · 本周最佳`],
    [/^Five AI-made web games we think are worth your time, picked by hand each week and credited to the people who made them\. (\d+) issues? so far\.$/, (_, n) => `每周人工挑选 5 款值得一玩的 AI 网页游戏，并署上作者的名字。目前共 ${n} 期。`],
    [/^(\d+) vibe-coded games$/, (_, n) => `${n} 款 vibe 游戏`], [/^(\d+) creators$/, (_, n) => `${n} 位创作者`], [/^New: (.+)$/, (_, t) => `新：${t}`],
    [/^(\d+) game-feel parts for your agent$/, (_, n) => `${n} 个手感组件`],
    [/^(\d+) vibe-coded games, sorted the way you like to play\.$/, (_, n) => `${n} 款 vibe 游戏，按你喜欢的玩法分好类。`],
    [/^All (\d+) games$/, (_, n) => `全部 ${n} 款游戏`], [/^All (\d+)$/, (_, n) => `全部 ${n}`], [/^(\d+) games?$/, (_, n) => `${n} 款游戏`], [/^(\d+) parts$/, (_, n) => `${n} 个组件`],
    [/^(\d+) people$/, (_, n) => `${n} 人`], [/^(\d+) creators so far$/, (_, n) => `目前 ${n} 位创作者`], [/^(\d+) games? · (.+)$/, (_, n, t) => `${n} 款 · ${t}`],
    [/^(\d+) games people made with AI and shared in public, from X, game jams, itch and Hacker News\. Every card opens the creator's own page and credits the post where we found it\. Nothing is copied or rehosted\.$/,
      (_, n) => `${n} 款大家用 AI 做出来、公开分享的游戏，来自 X、Game Jam、itch.io 和 Hacker News。每张卡片都打开作者自己的页面，并注明我们在哪里发现它。不复制、不转存任何内容。`],
    [/^(\d+) of (\d+) games$/, (_, a, b) => `${a} / ${b} 款游戏`], [/^· (\d+) preview on hover$/, (_, n) => `· ${n} 款悬停可预览`],
    [/^Source · (.+) ↗$/, (_, p) => `来源 · ${P[p] || p} ↗`],
    [/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/, (_, m, y) => `${y}年${MON[m]}月`],
    [new RegExp(`^${GENRE_RX}( · .+)?$`), (_, a, rest = '') => g(a) + rest],
    [/^(Movement|Feel|Progression|Feedback|Camera|Combat|UI|Audio|Generation)$/, (_, a) => g(a)],
    [/^Playbook (original|remix) · (.+)$/, (_, k, a) => `Playbook ${k === 'original' ? '原创' : '改编'} · ${g(a)}`], [/^Playbook · (.+)$/, (_, a) => `Playbook · ${g(a)}`],
    [new RegExp(`^(.+?) · ${GENRE_RX}( · .+)?$`), (_, a, b, rest = '') => `${a} · ${g(b)}${rest}`],
    [/^(Game jam|Web)$/, (_, p) => P[p]],
    [/^Play on (.+) ↗$/, (_, h) => `在 ${h} 上玩 ↗`], [/^More from (.+)$/, (_, c) => `更多来自 ${c} 的作品`],
    [/^More (\w+) games$/, (_, a) => `更多${g(a[0].toUpperCase() + a.slice(1))}游戏`], [/^All (\w+)$/, (_, a) => `全部${g(a[0].toUpperCase() + a.slice(1))}`],
    [/^(\d+) games? on Playbook · found on (.+?)(?: · made with (.+))?$/, (_, n, f, m) => `Playbook 上有 ${n} 款 · 发现于 ${f.split(', ').map(x => P[x] || x).join('、')}${m ? ` · 使用 ${m}` : ''}`],
    [/^This opens a pre-filled issue on our GitHub repo\. Removal requests from the creator are acted on as soon as we see them\. Listed link: (.+)$/, (_, h) => `会在我们的 GitHub 仓库打开一个预填好的 issue。作者本人的下架请求，我们看到后会立即处理。收录的链接：${h}`],
    [/^(\d+) parts, each with a live demo and its key numbers\. Ask: “add hit-stop to my game”\.$/, (_, n) => `${n} 个组件，每个都有在线演示和关键数值。直接说：“给我的游戏加上打击停顿”。`],
    [/^(\d+) open games with prompt, mechanics and source\. Ask: “remake Neon Drift, but underwater”\.$/, (_, n) => `${n} 款开源游戏，附提示词、机制和源码。直接说：“把 Neon Drift 重做成水下版”。`],
    [/^(\d+) components · each one is a live demo$/, (_, n) => `${n} 个组件 · 每个都能在线玩`],
    [/^(\d+) games you can play right now, each a single HTML file with its prompt, mechanics and art direction open\. Pick one and remake it in your agent\.$/, (_, n) => `${n} 款现在就能玩的游戏，每款都是单个 HTML 文件，提示词、机制和美术方向全部公开。挑一款，用你的编程助手重做。`],
    [/^Every remake credits its source\. (.+) has (\d+) remakes? on Playbook so far\.$/, (_, t, n) => `每个重做版本都会注明原作。${t} 在 Playbook 上已有 ${n} 个重做版本。`],
    [/^(.+) by Playbook$/, (_, t) => `${t}（Playbook）`],
    [/^Remake · (.+)$/, (_, t) => `重做 · ${t}`], [/^Recipe (.+) · (\d+) files?$/, (_, e, n) => `配方 · ${e} · ${n} 个文件`], [/^(.+) · (\d+) file$/, (_, e, n) => `${e} · ${n} 个文件`],
    [/^Remake web games in (.+) with Playbook$/, (_, c) => `用 Playbook 在 ${c} 里<em>重做网页游戏</em>`], [/^One-click mechanics for (.+)$/, (_, c) => `一键安装手感组件（${c}）`],
    [/^This page doesn't exist, but this one does\. Jump around while you're here: it's (.+), one of our (\d+) game-feel parts\.$/, (_, m, n) => `这个页面不存在，但这个游戏是真的。来都来了，跳几下吧：这是 ${m}，我们 ${n} 个手感组件之一。`],
    [/^No games match “(.*)”\. Try a genre like racing or puzzle\.$/, (_, q) => `没有和“${q}”匹配的游戏。试试“racing”或“puzzle”这样的类型。`],
    [/^(.+): use the arrow keys to scroll$/, (_, t) => `${tr(t)}：用方向键滚动`], [/^(.+): details and play$/, (_, t) => `${t}：详情和游玩`],
    [/^Play (.+) on (.+) \(opens in a new tab\)$/, (_, t, h) => `在 ${h} 上玩 ${t}（新标签页打开）`],
    [/^(.+) — Playbook$/, (_, t) => `${tr(t)} — Playbook`], [/^Playbook — the home of vibe gaming$/, () => 'Playbook — vibe gaming 的主场'],
    [/^Week of (\w{3}) (\d+), (\d{4}) — Playbook$/, (_, m, d, y) => `${week(m, d, y)} — Playbook`],
  ];

  function tr(s) {
    if (lang !== 'zh' || !s) return s;
    const k = s.replace(/\s+/g, ' ').trim();
    if (D[k] !== undefined) return D[k].replace(/<\/?em>/g, '');
    for (const [rx, fn] of R) { const m = k.match(rx); if (m) return fn(...m).replace(/<\/?em>/g, ''); }
    return s;
  }
  function trHTML(k) {
    if (D[k] !== undefined) return D[k];
    for (const [rx, fn] of R) { const m = k.match(rx); if (m) return fn(...m); }
    return null;
  }

  // content we never translate: game titles, notes, creators, prompts, code
  const SKIP = '.ptitle,.dnote,.dmeta h3,.gmeta h3,.pick-meta h3,.pick-meta p,.crmeta b,.stk-c,.wkp-text h2,.wkp-text p,.gd-info h1,.gd-note,.prompt,.keys,.agent-log,.cmd code,.mcp-code pre,.reel-cap,.cl-item,'
    + '.chead2 h1,.pick-by,.gd-by,.wkp-by,.fbig-word,.cava,.mcard h3,.card h3,.brand,.cmdk-item b,.wkx-meta p,.wkp-head p,code,pre,iframe,script,style,svg,[data-noi18n]';
  const keyOf = el => { let s = ''; el.childNodes.forEach(n => { s += n.nodeType === 3 ? n.textContent : n.nodeType === 1 ? (n.tagName === 'BR' ? ' ' : keyOf(n)) : ''; }); return s; };

  function apply(root) {
    if (lang !== 'zh' || !root) return;
    root.querySelectorAll?.('option:not([value])').forEach(o => o.setAttribute('value', o.textContent));
    // 1. whole elements with links or emphasis inside (e.g. headings with <em>, notes with a link)
    root.querySelectorAll?.('h1,h2,h3,p,.lead,.note,.tag,label,dd,li,a,button,span,div.empty').forEach(el => {
      if (el.dataset.i18n || !el.children.length || el.closest(SKIP)) return;
      if (![...el.children].some(c => c.tagName === 'EM' || c.tagName === 'BR' || c.textContent.trim())) return;  // only icons inside: the text pass handles it
      if ([...el.children].some(c => !/^(EM|A|BR|B|SPAN|STRONG)$/.test(c.tagName) || c.children.length > 1)) return;
      const k = keyOf(el).replace(/\s+/g, ' ').trim(); if (!k || k.length > 400) return;
      const kids = [...el.children].filter(c => c.tagName !== 'BR' && c.tagName !== 'EM');
      const tpl = k.replace(new RegExp(kids.map(c => c.textContent.trim()).filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') || '(?!)', 'g'), m => `{${kids.findIndex(c => c.textContent.trim() === m)}}`);
      let out = trHTML(k) ?? (tpl !== k ? trHTML(tpl) : null);
      if (out == null) return;
      if (/\{\d\}/.test(out)) out = out.replace(/\{(\d)\}/g, (_, i) => kids[+i] ? kids[+i].outerHTML : '');
      el.innerHTML = out; el.dataset.i18n = '1';
    });
    // 2. text nodes
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; let n; while ((n = w.nextNode())) nodes.push(n);
    nodes.forEach(t => {
      const el = t.parentElement; if (!el || el.closest(SKIP)) return;
      const raw = t.textContent; const k = raw.replace(/\s+/g, ' ').trim(); if (!k || !/[A-Za-z]/.test(k)) return;
      const out = tr(k); if (out !== k) t.textContent = raw.replace(raw.trim(), out);
    });
    // 3. attributes; option values keep their English so forms send the same text
    root.querySelectorAll?.('[aria-label],[placeholder],[title]').forEach(el => {
      if (el.closest(SKIP) && !el.matches('[aria-label]')) return;
      ['aria-label', 'placeholder', 'title'].forEach(a => { const v = el.getAttribute(a); if (v) { const o = tr(v); if (o !== v) el.setAttribute(a, o); } });
    });
  }

  window.PB_I18N = { lang, tr, apply, zh: lang === 'zh' };
})();
