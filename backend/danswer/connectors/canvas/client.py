from typing import Any

import requests
import io
import pypdf
from canvasapi import Canvas

FILE_SIZE_LIMIT = 5000000

class FileTooLargeError(Exception):
    def __init__(self, message):
        super().__init__(message)

class CanvasClient:
    
    def __init__(
        self,
        base_url,
        api_key         
        ) -> None:
        self.client = Canvas(base_url, api_key)
        pass
    
    def get_course_files(self, course_id):
        course = self.client.get_course(course_id)
        files = course.get_files()
        
        out = []
        for f in files:
            name = f.display_name
            if name[-4:] == ".pdf" or name[-4:] == ".txt":
                out.append(f)
        
        return out
    
    def parse_file_contents(self, file):
        
        # if file.size > 10mb:
        if file.size > FILE_SIZE_LIMIT:
            exception = FileTooLargeError("File too large: " + file.display_name + " (" + str(file.size) + ")")
            raise exception
        
        if file.display_name[-4:] == ".pdf":
            return self.parse_pdf(file)
        
        if file.display_name[-4:] == ".txt":
            return self.parse_txt(file)
        
        exception = Exception("File type not supported")
        raise exception
    
    
    def parse_pdf(self, file):
        raw = file.get_contents(binary=True)
        pdf_bytes = io.BytesIO(raw)
        
        reader = pypdf.PdfReader(pdf_bytes)
        text = ""
        
        for page in reader.pages:
            text += page.extract_text()
            
        return text
    
    def parse_txt(self, file):
        return file.get_contents()