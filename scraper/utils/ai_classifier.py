import os
import httpx
import json
import logging
from typing import List

# Valid category keys
CATEGORY_KEYS = [
    "frontend", "backend", "fullstack", "mobile", "game",
    "devops", "ai", "blockchain", "quant", "security",
    "testing", "data", "embedded", "other",
]

class AIClassifier:
    """Classifies job postings using LLM (OpenRouter API or local Ollama)"""

    client: httpx.AsyncClient = None

    def __init__(self, base_url: str = None, model: str = None):
        self.api_key = os.getenv('OPENROUTER_API_KEY', '')
        self.timeout = 60.0
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

        if self.api_key:
            # Use OpenRouter (OpenAI-compatible API)
            self.backend = 'openrouter'
            self.base_url = base_url or os.getenv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
            self.model = model or os.getenv('OPENROUTER_MODEL', 'qwen/qwen3-4b:free')
        else:
            # Fallback to local Ollama
            self.backend = 'ollama'
            self.base_url = base_url or os.getenv('OLLAMA_BASE_URL', 'http://127.0.0.1:11434')
            self.model = model or os.getenv('OLLAMA_MODEL', 'qwen2.5:3b')
            self.timeout = 120.0

    async def _get_client(self):
        if self.client is None or self.client.is_closed:
            self.client = httpx.AsyncClient(timeout=self.timeout)
        return self.client

    async def _call_llm(self, prompt: str, temperature: float = 0.1) -> str:
        """Unified LLM call that works with both OpenRouter and Ollama."""
        client = await self._get_client()

        if self.backend == 'openrouter':
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": temperature,
                    "top_p": 0.1,
                }
            )
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"].strip()
                # qwen3 may wrap answer in <think>...</think> tags, strip them
                if '</think>' in content:
                    content = content.split('</think>')[-1].strip()
                return content
            else:
                raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")
        else:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "top_p": 0.1,
                    }
                }
            )
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "").strip()
            else:
                raise Exception(f"Ollama API error: {response.status_code} - {response.text}")

    async def is_job_posting(self, title: str, description: str) -> bool:
        """
        Determine if the content is a real job advertisement.
        Returns True if it's a job, False if it's a resume, story, or community discussion.
        """
        # Truncate description to save context
        desc_sample = description[:500]

        prompt = f"""你是一个智能招聘信息分类器。你的任务是判断给出的文本是"JOB_AD"（招聘启事）还是"OTHER"（其他非招聘内容）。

### 判定标准：
- **JOB_AD**: 只要是在"找人干活"、"招人"、"招聘"、"寻找合作伙伴/技术合伙人"且涉及报酬或项目合作，都属于招聘。
- **OTHER**: 个人求职简历、程序员故事分享、技术讨论、单纯的产品展示、没有报酬的兴趣小组、教程、新闻。

### 示例：
- "招聘 React 开发，时薪 200" -> JOB_AD
- "寻找初创团队技术合伙人" -> JOB_AD
- "兼职：需要一个设计做 2 天详情页" -> JOB_AD
- "【兼职/远程】AI 工程师" -> JOB_AD
- "分享一下我工作 10 年的心得" -> OTHER
- "我用 Golang 写了个开源工具" -> OTHER
- "5 年 Java 求职远程" -> OTHER（这是简历）

### 请判断以下内容：
标题: {title}
内容: {desc_sample}

回答要求：只输出一个单词（JOB_AD 或 OTHER），不要解释。
输出:"""

        try:
            answer = await self._call_llm(prompt)
            answer = answer.upper()
            self.logger.info(f"AI Classification for '{title[:30]}...': {answer}")
            return "JOB" in answer
        except Exception as e:
            self.logger.error(f"LLM call failed ({self.backend}): {repr(e)}")
            return True  # Fallback to true (let it pass rule-based filter)

    @staticmethod
    def _enforce_category_rules(title: str, categories: List[str]) -> List[str]:
        """
        Post-processing rules to fix common LLM misclassifications.
        The small model (1.5b) often ignores prompt instructions,
        so we enforce keyword-based rules programmatically.
        """
        t = title.lower()

        # fullstack: title must contain fullstack/全栈 keywords
        fullstack_kw = ['全栈', 'fullstack', 'full-stack', 'full stack']
        if 'fullstack' in categories and not any(k in t for k in fullstack_kw):
            categories = [c for c in categories if c != 'fullstack']

        # testing: title must contain testing/QA keywords
        testing_kw = ['测试', 'qa', 'test', 'quality', 'sdet']
        if 'testing' in categories and not any(k in t for k in testing_kw):
            categories = [c for c in categories if c != 'testing']

        # ai: title must contain AI/ML keywords
        ai_kw = ['ai', 'ml', '算法', '机器学习', 'machine learning', 'deep learning',
                 '深度学习', 'nlp', 'data scien', '人工智能', 'llm', 'gpt', '大模型']
        if 'ai' in categories and not any(k in t for k in ai_kw):
            categories = [c for c in categories if c != 'ai']

        # mobile: if title contains mobile keywords, remove backend/frontend
        mobile_kw = ['android', 'ios', 'flutter', 'react native', 'swift',
                      'kotlin', '移动', 'mobile', 'app开发', 'app 开发',
                      '安卓', '鸿蒙', 'harmonyos']
        if any(k in t for k in mobile_kw):
            # Ensure mobile is included
            if 'mobile' not in categories:
                categories.append('mobile')
            # Remove backend/frontend unless title also has those keywords
            backend_kw = ['后端', 'backend', 'server', '服务端', 'java', 'python',
                          'golang', 'go ', 'node', 'php', 'ruby', 'rust', 'c++']
            frontend_kw = ['前端', 'frontend', 'front-end', 'react', 'vue', 'angular', 'css']
            if 'backend' in categories and not any(k in t for k in backend_kw):
                categories = [c for c in categories if c != 'backend']
            if 'frontend' in categories and not any(k in t for k in frontend_kw):
                categories = [c for c in categories if c != 'frontend']

        # game: if title contains game engine/dev keywords, remove backend/frontend
        game_kw = ['unity', 'unreal', 'cocos', '游戏', 'game', 'u3d', 'ue4', 'ue5',
                   'godot', 'cryengine', 'mmorpg', 'rpg']
        if any(k in t for k in game_kw):
            if 'game' not in categories:
                categories.append('game')
            backend_kw_game = ['后端', 'backend', 'server', '服务端', '服务器']
            frontend_kw_game = ['前端', 'frontend', 'front-end', 'web']
            if 'backend' in categories and not any(k in t for k in backend_kw_game):
                categories = [c for c in categories if c != 'backend']
            if 'frontend' in categories and not any(k in t for k in frontend_kw_game):
                categories = [c for c in categories if c != 'frontend']

        # blockchain: title must contain blockchain/web3/crypto keywords
        blockchain_kw = ['区块链', 'blockchain', 'web3', 'solidity', '智能合约',
                         'smart contract', 'crypto', 'defi', 'nft', 'dex', 'cex',
                         '交易所', 'solana', 'ethereum', 'eth', 'token']
        if 'blockchain' in categories and not any(k in t for k in blockchain_kw):
            categories = [c for c in categories if c != 'blockchain']

        # Non-dev roles -> other
        non_dev_kw = ['customer success', 'sales engineer', 'solutions engineer',
                      'account manager', 'account executive', 'business development']
        if any(k in t for k in non_dev_kw):
            categories = ['other']

        # Fallback if all categories were removed
        if not categories:
            categories = ['other']

        return categories

    async def classify_category(self, title: str, description: str) -> List[str]:
        """
        Classify a job posting into 1-3 categories using LLM.
        Returns a list of category keys, e.g. ["frontend", "ai"].
        Falls back to ["other"] on error.
        """
        category_list = """
- frontend: 前端开发（React/Vue/Angular/CSS/HTML）
- backend: 后端开发（Java/Python/Go/Node/PHP/Ruby/Rust/C++/服务端/架构师）
- fullstack: 全栈开发
- mobile: 移动端开发（iOS/Android/Flutter/React Native）
- game: 游戏开发（Unity/Unreal/Cocos/游戏引擎）
- devops: 运维/DevOps/SRE/云原生/Kubernetes
- ai: AI/机器学习/深度学习/NLP/算法/数据科学
- blockchain: 区块链/Web3/Solidity/智能合约
- quant: 量化交易/风控开发
- security: 安全/渗透测试/攻防
- testing: 测试/QA/自动化测试
- data: 大数据/数据工程/ETL/数据仓库
- embedded: 嵌入式/IoT/固件/驱动开发
- other: 不属于以上任何类别"""

        prompt = f"""你是一个职位分类器。根据职位标题，判断这个岗位属于哪个技术方向。

### 类别列表：
{category_list}

### 规则（严格遵守）：
1. 只输出类别的英文 key，用逗号分隔，不要解释
2. 只根据职位标题判断类别，忽略描述内容
3. 大多数职位只属于 1 个类别，最多选 2 个
4. fullstack：标题必须包含"全栈/fullstack/full-stack"才能选，否则不选
5. testing：标题必须包含"测试/QA/test/quality"才能选，否则不选
6. ai：标题必须包含"AI/ML/算法/机器学习/data scientist"才能选
7. Customer Success/Sales/Solutions Engineer 等非开发岗位选 other
8. 标题说"前端开发"就选 frontend，不要加 fullstack
9. 标题说"后端开发"就选 backend，不要加 fullstack

### 示例：
- "Senior Full Stack Developer with React" -> fullstack
- "前端工程师" -> frontend
- "重构电商前端项目，需要找前端高级开发" -> frontend
- "后端 Go 开发" -> backend
- "高级 Java 开发" -> backend
- "全栈AI工程师" -> fullstack,ai
- "AI Data Engineer" -> ai,data
- "iOS 开发工程师" -> mobile
- "Flutter 跨平台开发" -> mobile
- "Web3 测试工程师" -> testing,blockchain
- "DevOps 工程师" -> devops
- "区块链智能合约工程师" -> blockchain
- "Customer Success Engineer" -> other
- "Solutions Engineer" -> other
- "Sales Engineer" -> other

### 职位标题：
{title}

### 输出（只输出英文 key，逗号分隔）:"""

        try:
            answer = await self._call_llm(prompt)
            answer = answer.lower()
            # Parse comma-separated keys and validate
            raw_keys = [k.strip() for k in answer.split(",")]
            categories = [k for k in raw_keys if k in CATEGORY_KEYS]
            if not categories:
                categories = ["other"]
            # Hard rules: enforce keyword requirements the LLM often ignores
            categories = self._enforce_category_rules(title, categories)
            # Remove "other" if there are real categories alongside it
            if len(categories) > 1 and "other" in categories:
                categories = [c for c in categories if c != "other"]
            self.logger.info(f"AI Category for '{title[:30]}...': {categories}")
            return categories
        except Exception as e:
            self.logger.error(f"Failed to classify category ({self.backend}): {repr(e)}")
            return ["other"]

    async def close(self):
        if self.client and not self.client.is_closed:
            await self.client.aclose()

if __name__ == "__main__":
    import asyncio

    async def test():
        classifier = AIClassifier()
        print(f"Backend: {classifier.backend}, Model: {classifier.model}")
        # Test cases
        cases = [
            ("招聘前后端开发", "我们公司正在寻找一名经验丰富的全栈工程师..."),
            ("10年老兵求职", "本人擅长Go语言，目前正在寻找远程机会..."),
            ("Senior Backend Engineer (API)", "Building scalable APIs..."),
            ("[海外100%远程] 全栈+AI LLM 创始工程师", "寻找顶尖 Builder..."),
        ]

        for title, desc in cases:
            is_job = await classifier.is_job_posting(title, desc)
            cats = await classifier.classify_category(title, desc)
            print(f"Title: {title[:40]} -> Job: {is_job}, Category: {cats}")

        await classifier.close()

    asyncio.run(test())
