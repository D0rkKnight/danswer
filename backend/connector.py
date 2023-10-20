import html
import time
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


class CanvasConnector(LoadConnector):
    def __init__(
        self,
        batch_size: int = INDEX_BATCH_SIZE,
    ) -> None:
        self.batch_size = batch_size
        self.canvas_client: CanvasClient | None = None

    def load_credentials(self, credentials: dict[str, Any]) -> dict[str, Any] | None:
        self.canvas_client = CanvasClient(
            base_url=credentials["canvas_base_url"],
            api_key=credentials["canvas_api_key"],
        )
        return None

    def load_from_state(self) -> GenerateDocumentsOutput:
        if self.canvas_client is None:
            raise ConnectorMissingCredentialError("Canvas")

        files = self.canvas_client.get_course_files(48859)
        
        # Format into document
        docs = []
        
        i = 0
        
        for f in files:
            d = Document(
                id=f.id,
                sections=[f.url, f.get_contents()],
                source=DocumentSource.CANVAS,
                semantic_identifier=f.display_name,
                metadata={},
            )
            docs.append(d)
            
            i += 1
            if i == self.batch_size:
                yield docs
                docs = []
                i = 0
                
                time.sleep(0.2)
                
        # Yield last batch
        if i > 0:
            yield docs
        
if __name__ == "__main__":
    import time
    test_connector = CanvasConnector()
    test_connector.load_credentials({
        "canvas_base_url": "https://canvas.ucsd.edu",
        "canvas_api_key": "13171~uLfLwfSt9eIkNFaXnkCrxRvExJx0gfWHJLIFmwOQYYtd0nMEJQEUxNB72ozT3XY8"
    })
    all_docs = test_connector.load_from_state()
    
    for batch in all_docs:
        for doc in batch:
            print(doc)
    
    # current = time.time()
    # one_day_ago = current - 24 * 60 * 60  # 1 day
    # latest_docs = test_connector.poll_source(one_day_ago, current)