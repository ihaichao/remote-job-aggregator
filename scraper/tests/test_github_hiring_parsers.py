"""Parser tests for the GitHub-hosted hiring threads (ruanyf/weekly, Rebase).

Run from scraper/: python -m pytest tests
"""

from scrapers.rebase_scraper import RebaseScraper
from scrapers.ruanyf_scraper import RuanyfScraper
from utils.github_hiring import clean_heading, extract_company, extract_region, mentions_remote


def comment(body, **extra):
    return {
        'id': 1,
        'body': body,
        'user': {'login': 'someone', 'type': 'User'},
        'html_url': 'https://github.com/ruanyf/weekly/issues/12009#issuecomment-1',
        'created_at': '2026-10-08T04:27:49Z',
        **extra,
    }


def issue(title, labels=(), **extra):
    return {
        'number': 7,
        'title': title,
        'body': '岗位职责：\n- 开发交易系统',
        'labels': [{'name': name} for name in labels],
        'html_url': 'https://github.com/rebase-network/who-is-hiring/issues/7',
        'created_at': '2026-10-20T08:00:00Z',
        **extra,
    }


def ruanyf():
    return RuanyfScraper.__new__(RuanyfScraper)  # parsing needs no AI client or DB


def rebase():
    return RebaseScraper.__new__(RebaseScraper)


# --- shared rules ---

def test_remote_detection_ignores_remote_interviews_and_negations():
    assert mentions_remote('【远程 / 全职】Developer Relations')
    assert mentions_remote('[Remote/HK] Rust 量化工程师')
    assert not mentions_remote('技术笔试/远程面试 → 终面')
    assert not mentions_remote('[广州][不支持远程] 高级全栈工程师')


def test_heading_cleanup_strips_markdown_and_emoji():
    assert clean_heading('# **🚀 酷睿程 (CARIZON) 急招！**') == '酷睿程 (CARIZON) 急招！'


def test_company_from_brackets_or_leading_segment():
    assert extract_company('【LinkSense】【远程 / 全职】Developer Relations') == 'LinkSense'
    assert extract_company('Alva（AI 投研 Agent 平台）| 上海 / 远程 | 量化交易系统') == 'Alva'
    assert extract_company('[远程] Web3 Labs 招聘｜Solidity 工程师') == 'Web3 Labs'
    assert extract_company('[远程] 高级后端工程师') == 'Unknown'
    assert extract_company('全球远程 / APAC] Oryon 诚聘 Web3 BD Lead') == 'Oryon'
    assert extract_company('[远程] CEX公司诚聘 技术架构师') == 'Unknown'


def test_region_defaults_to_cn():
    assert extract_region('[远程] Java 工程师') == 'CN'
    assert extract_region('全球远程 TOOBIT AI 应用开发工程师') == 'worldwide'
    assert extract_region('【芬兰赫尔辛基｜全职｜欧洲境内可远程】Senior Devops') == 'EU'


# --- ruanyf/weekly ---

def test_ruanyf_keeps_remote_heading():
    job = ruanyf()._parse_comment(comment('## Alva（AI 投研 Agent 平台）| 上海 / 远程 | 量化交易系统\n\n招聘后端工程师'))
    assert job['title'] == 'Alva（AI 投研 Agent 平台）| 上海 / 远程 | 量化交易系统'
    assert job['company'] == 'Alva'
    assert job['source_site'] == 'ruanyf'
    assert job['original_url'].endswith('#issuecomment-1')


def test_ruanyf_keeps_remote_work_mode_in_body():
    body = '# Web3 Labs 招聘｜Solidity 工程师\n\n- 支付方式： USDT\n- 工作方式： Remote / 远程'
    assert ruanyf()._parse_comment(comment(body))


def test_ruanyf_skips_onsite_resumes_and_quotes():
    assert ruanyf()._parse_comment(comment('# 滴滴出行｜北京｜高级研发工程师\n部门直招')) is None
    assert ruanyf()._parse_comment(comment('# 前端工程师求职\n期望工作方式：远程')) is None
    assert ruanyf()._parse_comment(comment('> 【远程】后端工程师\n\n有兴趣')) is None
    assert ruanyf()._parse_comment(comment('# 【远程】后端工程师', user={'type': 'Bot'})) is None


# --- rebase-network/who-is-hiring ---

def test_rebase_keeps_remote_tech_issue():
    job = rebase()._parse_issue(issue('[远程办公] Crypto 交易所诚聘 Android 开发工程师 薪水 4000U-6000U'))
    assert job['company'] == 'Unknown'  # "Crypto 交易所" is a description, not a name
    assert job['region_limit'] == 'CN'
    assert job['source_site'] == 'rebase'
    assert job['description'] == '岗位职责：\n- 开发交易系统'


def test_rebase_skips_onsite_non_tech_flagged_and_prs():
    assert rebase()._parse_issue(issue('[香港] Crypto量化 诚聘 Rust工程师')) is None
    assert rebase()._parse_issue(issue('[远程办公] Crypto 交易所诚聘 英语社群客服')) is None
    assert rebase()._parse_issue(issue('[远程办公] 诚聘 web3财经新闻主编（Tech / RWA 资产方向）')) is None
    assert rebase()._parse_issue(issue('[远程] Java 后端开发', labels=['needs-info'])) is None
    assert rebase()._parse_issue(issue('[远程] Java 后端开发', pull_request={})) is None
