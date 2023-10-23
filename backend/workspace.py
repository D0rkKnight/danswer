import html
import time
import os
from collections.abc import Callable
from datetime import datetime
from typing import Any

from danswer.configs.app_configs import INDEX_BATCH_SIZE
from danswer.configs.constants import DocumentSource
from danswer.connectors.canvas.client import CanvasClient
from danswer.connectors.cross_connector_utils.html_utils import parse_html_page_basic
from danswer.connectors.interfaces import GenerateDocumentsOutput
from danswer.connectors.interfaces import LoadConnector
from danswer.connectors.interfaces import PollConnector
from danswer.connectors.interfaces import SecondsSinceUnixEpoch
from danswer.connectors.models import ConnectorMissingCredentialError
from danswer.connectors.models import Document
from danswer.connectors.models import Section
from danswer.connectors.canvas.connector import CanvasConnector

if __name__ == "__main__":
    import time
    test_connector = CanvasConnector()
    test_connector.load_credentials({
        "canvas_base_url": os.getenv("CANVAS_BASE_URL"),
        "canvas_api_key": os.getenv("CANVAS_API_KEY")
    })
    all_docs = test_connector.load_from_state()
    
    for batch in all_docs:
        for doc in batch:
            print(doc)
    
    print("done")
    # current = time.time()
    # one_day_ago = current - 24 * 60 * 60  # 1 day
    # latest_docs = test_connector.poll_source(one_day_ago, current)