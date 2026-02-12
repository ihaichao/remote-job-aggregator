import os
import httpx
import json
import logging

class AIClassifier:
    """Classifies job postings using a local Ollama LLM"""

    client: httpx.AsyncClient = None

    def __init__(self, base_url: str = None, model: str = "qwen2.5:1.5b"):
        self.base_url = base_url or os.getenv('OLLAMA_BASE_URL', 'http://127.0.0.1:11434')
        self.model = model
        self.timeout = 30.0  # Increased timeout for slower local responses
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    async def _get_client(self):
        if self.client is None or self.client.is_closed:
            self.client = httpx.AsyncClient(timeout=self.timeout)
        return self.client

    async def is_job_posting(self, title: str, description: str) -> bool:
        """
        Determine if the content is a real job advertisement.
        Returns True if it's a job, False if it's a resume, story, or community discussion.
        """
        # Truncate description to save context
        desc_sample = description[:500]
        
        prompt = f"""你是一个智能招聘信息分类器。你的任务是判断给出的文本是“JOB_AD”（招聘启事）还是“OTHER”（其他非招聘内容）。

### 判定标准：
- **JOB_AD**: 只要是在“找人干活”、“招人”、“招聘”、“寻找合作伙伴/技术合伙人”且涉及报酬或项目合作，都属于招聘。
- **OTHER**: 个人求职简历、程序员故事分享、技术讨论、单纯的产品展示、没有报酬的兴趣小组、教程、新闻。

### 示例：
- “招聘 React 开发，时薪 200” -> JOB_AD
- “寻找初创团队技术合伙人” -> JOB_AD
- “兼职：需要一个设计做 2 天详情页” -> JOB_AD
- “【兼职/远程】AI 工程师” -> JOB_AD
- “分享一下我工作 10 年的心得” -> OTHER
- “我用 Golang 写了个开源工具” -> OTHER
- “5 年 Java 求职远程” -> OTHER（这是简历）

### 请判断以下内容：
标题: {title}
内容: {desc_sample}

回答要求：只输出一个单词（JOB_AD 或 OTHER），不要解释。
输出:"""

        try:
            client = await self._get_client()
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.1,
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                answer = result.get("response", "").strip().upper()
                self.logger.info(f"AI Classification for '{title[:30]}...': {answer}")
                return "JOB" in answer
            else:
                self.logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                return True  # Default to True on API error to avoid missing jobs
                    
        except Exception as e:
            self.logger.error(f"Failed to connect to Ollama ({self.base_url}): {repr(e)}")
            return True  # Fallback to true (let it pass rule-based filter)

    async def close(self):
        if self.client and not self.client.is_closed:
            await self.client.aclose()

if __name__ == "__main__":
    import asyncio
    
    async def test():
        classifier = AIClassifier()
        # Test cases
        cases = [
            ("招聘前后端开发", "我们公司正在寻找一名经验丰富的全栈工程师..."),
            ("10年老兵求职", "本人擅长Go语言，目前正在寻找远程机会..."),
            ("我开发了一个APP", "最近用Flutter写了个工具，分享一下心路历程..."),
        ]
        
        for title, desc in cases:
            res = await classifier.is_job_posting(title, desc)
            print(f"Title: {title} -> Is Job: {res}")

    asyncio.run(test())
