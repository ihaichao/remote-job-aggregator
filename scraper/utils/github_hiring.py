"""
Helpers for hiring threads hosted on GitHub issues

Shared by the ruanyf/weekly "谁在招人" scraper (one comment per post) and the
rebase-network/who-is-hiring scraper (one issue per post). Both are Chinese,
free-form Markdown posts, so remote / tech / region checks are rule-based.
"""

import os
import re
from typing import Dict

GITHUB_API = "https://api.github.com"

# Remote markers; 远程面试 / 远程控制 etc. are not about the job being remote
_REMOTE_RE = re.compile(r'远程|remote|wfh|居家办公|在家办公', re.I)
_NO_REMOTE_RE = re.compile(r'不支持远程|不接受远程|不可远程|非远程|无法远程|no\s+remote|not\s+remote', re.I)
_OTHER_REMOTE_RE = re.compile(r'远程面试|远程控制|远程诊断|远程协助|远程运维|远程办公补贴')

# Role words only: topic words (Web3, AI, 量化, 数据) also appear in BD / content / ops titles
_TECH_RE = re.compile(
    r'开发|工程师|程序员|架构|全栈|前端|后端|测试|运维|算法|研发|'
    r'developer|engineer|programmer|architect|devops|sre|dba|qa\b|'
    r'frontend|backend|full[\s-]?stack|java|golang|\bgo\b|rust|python|c\+\+|php|node\.?js|react|vue|'
    r'flutter|ios|android|solidity',
    re.I,
)

_ROLE_RE = re.compile(
    r'开发|工程师|程序员|架构师|设计师|经理|专家|负责人|实习|岗位|developer|engineer|programmer|architect|manager',
    re.I,
)

_WORLDWIDE_RE =re.compile(r'全球远程|全球可远程|不限地区|worldwide|anywhere|global\s+remote', re.I)
_EU_RE = re.compile(r'欧洲境内|欧盟境内|仅限欧洲|eu\s+only|europe\s+only', re.I)
_US_RE = re.compile(r'仅限美国|美国境内|us\s+only|usa\s+only', re.I)

# Markdown / emoji noise around a heading line
_HEADING_NOISE_RE = re.compile(r'^[\s#>*_`~-]+|[\s*_`~]+$')
_EMOJI_RE = re.compile('[\U0001F000-\U0001FAFF☀-➿️​]')


def github_headers() -> Dict[str, str]:
    """Headers for the GitHub REST API; GITHUB_TOKEN lifts the 60 req/hour limit"""
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "remotecn-job-aggregator",
    }
    token = os.getenv('GITHUB_TOKEN')
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def clean_heading(line: str) -> str:
    """Strip Markdown markers and emoji from a title line"""
    line = _EMOJI_RE.sub('', line)
    line = _HEADING_NOISE_RE.sub('', line)
    return re.sub(r'\s+', ' ', line.replace('**', '')).strip()


def mentions_remote(text: str) -> bool:
    """True when the text says the job is remote (and not that it is not)"""
    if _NO_REMOTE_RE.search(text):
        return False
    return bool(_REMOTE_RE.search(_OTHER_REMOTE_RE.sub('', text)))


def is_tech_role(text: str) -> bool:
    return bool(_TECH_RE.search(text))


def extract_region(text: str) -> str:
    """Region for a Chinese hiring post: CN unless it says otherwise"""
    if _EU_RE.search(text):
        return 'EU'
    if _US_RE.search(text):
        return 'US'
    if _WORLDWIDE_RE.search(text):
        return 'worldwide'
    return 'CN'


def extract_work_type(text: str) -> str:
    if re.search(r'兼职|实习|part[\s-]?time|intern', text, re.I):
        return 'parttime'
    return 'fulltime'


def extract_company(title: str) -> str:
    """Best-effort company name from a hiring post title, else 'Unknown'"""
    skip = re.compile(r'远程|remote|全职|兼职|招聘|内推|直招|急招|hiring|办公|base|[省市区]$', re.I)
    for content in re.findall(r'[【\[]([^】\]]+)[】\]]', title):
        content = content.strip(' *')
        if 2 <= len(content) <= 30 and not skip.search(content) and not _looks_like_place(content):
            return content

    rest = re.sub(r'[【\[][^】\]]*[】\]]', '', title)
    # Drop an unbalanced leading tag: "全球远程 / APAC] Oryon 诚聘 ..."
    rest = re.sub(r'^[^【\[]*[】\]]', '', rest).strip()
    # "Alva（AI 投研 Agent 平台）| 上海 / Remote | ..." -> "Alva"
    first = re.split(r'[｜|丨，,。]', rest)[0]
    first = re.split(r'诚聘|招聘|直招|急招|诚招|hiring', first, flags=re.I)[0]
    first = re.sub(r'[（(][^）)]*[）)]', '', first).strip(' -—:：,，*')
    # A job title ("高级后端工程师") is not a company; tech words like "Web3" can be
    generic = re.search(r'(公司|交易所|团队)$', first) and len(first) <= 12  # "CEX公司", "Crypto 交易所"
    if 2 <= len(first) <= 30 and not generic and not _ROLE_RE.search(first) and not _looks_like_place(first):
        return first
    return 'Unknown'


_PLACES = (
    '北京|上海|广州|深圳|杭州|成都|武汉|南京|苏州|西安|重庆|长沙|郑州|天津|厦门|合肥|'
    '香港|台湾|新加坡|马来西亚|曼谷|迪拜|东京|日本|美国|欧洲|全球|海外|国内'
)


def _looks_like_place(text: str) -> bool:
    return bool(re.search(_PLACES, text)) and len(text) <= 12
