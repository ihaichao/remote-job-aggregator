import hashlib
import psycopg2
from datetime import datetime
from typing import Dict, Optional

class DatabaseClient:
    def __init__(self, connection_string: str):
        self.conn = psycopg2.connect(connection_string)
        self.cursor = self.conn.cursor()

    def insert_job(self, job_data: Dict) -> Optional[int]:
        """插入职位数据，返回 job_id"""
        content_hash = self._generate_hash(job_data)

        # 检查是否已存在
        self.cursor.execute("SELECT id FROM jobs WHERE content_hash = %s", (content_hash,))
        if self.cursor.fetchone():
            return None

        query = """
        INSERT INTO jobs (
            title, company, category, region_limit, work_type,
            source_site, original_url, content_hash, description, date_posted
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """

        self.cursor.execute(query, (
            job_data['title'],
            job_data['company'],
            job_data.get('category', 'unknown'),
            job_data.get('region_limit', 'worldwide'),
            job_data.get('work_type', 'fulltime'),
            job_data['source_site'],
            job_data['original_url'],
            content_hash,
            job_data.get('description', ''),
            job_data.get('date_posted', datetime.now())
        ))

        self.conn.commit()
        return self.cursor.fetchone()[0]

    def _generate_hash(self, job_data: Dict) -> str:
        """生成内容哈希用于去重"""
        content = f"{job_data['title']}{job_data['company']}{job_data.get('description', '')}"
        return hashlib.sha256(content.encode()).hexdigest()

    def close(self):
        self.cursor.close()
        self.conn.close()
