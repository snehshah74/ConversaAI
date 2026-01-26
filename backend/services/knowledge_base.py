"""
Enhanced Knowledge Base Service with Document Processing
Handles PDF, DOCX, TXT, CSV files with chunking and embeddings
"""

import os
import logging
import json
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from io import BytesIO

# Document processing libraries
try:
    import PyPDF2  # type: ignore
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logging.warning("PyPDF2 not available. Install with: pip install PyPDF2")

try:
    from docx import Document as DocxDocument  # type: ignore
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    logging.warning("python-docx not available. Install with: pip install python-docx")

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logging.warning("requests not available. Install with: pip install requests")

try:
    from bs4 import BeautifulSoup  # type: ignore
    BEAUTIFULSOUP_AVAILABLE = True
except ImportError:
    BEAUTIFULSOUP_AVAILABLE = False
    logging.warning("beautifulsoup4 not available. Install with: pip install beautifulsoup4")

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logging.warning("Supabase client not available. Install with: pip install supabase")

try:
    from sentence_transformers import SentenceTransformer  # type: ignore
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logging.warning("sentence-transformers not available. Install with: pip install sentence-transformers")

logger = logging.getLogger(__name__)

# Global embedding model cache - loaded once and reused across all instances
_embedding_model_cache = None
_embedding_model_lock = None

def get_embedding_model():
    """Get or create embedding model (singleton pattern with thread safety)"""
    global _embedding_model_cache, _embedding_model_lock
    
    if _embedding_model_cache is None:
        import threading
        if _embedding_model_lock is None:
            _embedding_model_lock = threading.Lock()
        
        with _embedding_model_lock:
            # Double-check pattern
            if _embedding_model_cache is None:
                if not SENTENCE_TRANSFORMERS_AVAILABLE:
                    logger.warning("sentence-transformers not available, cannot create embedding model")
                    return None
                
                import time
                model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
                logger.info(f"🔄 Loading embedding model '{model_name}' (one-time operation)...")
                start = time.time()
                try:
                    _embedding_model_cache = SentenceTransformer(model_name)
                    elapsed = time.time() - start
                    logger.info(f"✅ Embedding model loaded in {elapsed:.2f}s - will be reused for all requests")
                except Exception as e:
                    logger.error(f"❌ Failed to load embedding model: {e}")
                    return None
    
    return _embedding_model_cache


class DocumentProcessor:
    """Process various document types and extract text"""
    
    @staticmethod
    def extract_text_from_pdf(file_content: bytes) -> str:
        """Extract text from PDF file"""
        if not PDF_AVAILABLE:
            raise ValueError("PyPDF2 not installed. Cannot process PDF files.")
        
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise
    
    @staticmethod
    def extract_text_from_docx(file_content: bytes) -> str:
        """Extract text from DOCX file"""
        if not DOCX_AVAILABLE:
            raise ValueError("python-docx not installed. Cannot process DOCX files.")
        
        try:
            docx_file = BytesIO(file_content)
            doc = DocxDocument(docx_file)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {e}")
            raise
    
    @staticmethod
    def extract_text_from_txt(file_content: bytes) -> str:
        """Extract text from TXT file"""
        try:
            # Try UTF-8 first
            try:
                return file_content.decode('utf-8').strip()
            except UnicodeDecodeError:
                # Fallback to latin-1
                return file_content.decode('latin-1').strip()
        except Exception as e:
            logger.error(f"Error extracting text from TXT: {e}")
            raise
    
    @staticmethod
    def extract_text_from_csv(file_content: bytes) -> str:
        """Extract text from CSV file"""
        try:
            import csv
            text = file_content.decode('utf-8')
            reader = csv.reader(text.splitlines())
            rows = []
            for row in reader:
                rows.append(" | ".join(row))
            return "\n".join(rows)
        except Exception as e:
            logger.error(f"Error extracting text from CSV: {e}")
            raise
    
    @staticmethod
    def extract_text_from_url(url: str) -> str:
        """Scrape text content from URL"""
        if not REQUESTS_AVAILABLE:
            raise ValueError("requests not installed. Cannot scrape URLs.")
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            if BEAUTIFULSOUP_AVAILABLE:
                soup = BeautifulSoup(response.content, 'html.parser')
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                text = soup.get_text()
                # Clean up whitespace
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = '\n'.join(chunk for chunk in chunks if chunk)
            else:
                text = response.text
            
            return text.strip()
        except Exception as e:
            logger.error(f"Error scraping URL {url}: {e}")
            raise
    
    @staticmethod
    def process_file(file_content: bytes, filename: str) -> str:
        """Process file based on extension"""
        ext = filename.lower().split('.')[-1]
        
        if ext == 'pdf':
            return DocumentProcessor.extract_text_from_pdf(file_content)
        elif ext in ['docx', 'doc']:
            return DocumentProcessor.extract_text_from_docx(file_content)
        elif ext == 'txt':
            return DocumentProcessor.extract_text_from_txt(file_content)
        elif ext == 'csv':
            return DocumentProcessor.extract_text_from_csv(file_content)
        else:
            raise ValueError(f"Unsupported file type: {ext}")


class TextChunker:
    """Split text into chunks for embedding"""
    
    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        """
        Args:
            chunk_size: Target chunk size in tokens (approximate)
            overlap: Number of tokens to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.overlap = overlap
    
    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into chunks
        
        Uses approximate token counting (1 token ≈ 4 characters)
        """
        # Approximate tokens: 1 token ≈ 4 characters
        char_size = self.chunk_size * 4
        overlap_chars = self.overlap * 4
        
        # Split by sentences first for better chunking
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence_length = len(sentence)
            
            if current_length + sentence_length > char_size and current_chunk:
                # Save current chunk
                chunk_text = ' '.join(current_chunk)
                chunks.append(chunk_text)
                
                # Start new chunk with overlap
                if overlap_chars > 0:
                    overlap_text = chunk_text[-overlap_chars:]
                    current_chunk = [overlap_text, sentence]
                    current_length = len(overlap_text) + sentence_length
                else:
                    current_chunk = [sentence]
                    current_length = sentence_length
            else:
                current_chunk.append(sentence)
                current_length += sentence_length
        
        # Add remaining chunk
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks if chunks else [text]


class KnowledgeBaseService:
    """
    Enhanced Knowledge Base Service with Document Processing
    
    Features:
    - Document upload and processing (PDF, DOCX, TXT, CSV)
    - URL scraping
    - FAQ management
    - Text chunking for large documents
    - Vector embeddings for semantic search
    - Supabase pgvector integration
    """
    
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.embedding_model = None
        self.supabase_client = None
        self.chunker = TextChunker(chunk_size=500, overlap=50)
        # Fallback in-memory storage
        self._fallback_storage: List[Dict[str, Any]] = []
        
        # Initialize embedding model
        self._initialize_embedding_model()
        
        # Initialize Supabase client
        self._initialize_supabase()
    
    def _initialize_embedding_model(self):
        """Initialize sentence transformer model for embeddings - uses cached model"""
        # Use global cached model instead of creating new one
        self.embedding_model = get_embedding_model()
        if self.embedding_model:
            logger.info(f"✅ Using cached embedding model (no reload needed)")
        else:
            logger.warning("Embedding model not available, using fallback")
    
    def _initialize_supabase(self):
        """Initialize Supabase client"""
        if not SUPABASE_AVAILABLE:
            logger.warning("Supabase not available, KB will use in-memory storage")
            return
        
        try:
            supabase_url = os.getenv("SUPABASE_URL", "").strip()
            supabase_key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")).strip()
            
            if not supabase_url or not supabase_key:
                logger.warning("Supabase credentials not found, KB will use in-memory storage")
                return
            
            # Ensure URL has proper format
            if not supabase_url.startswith(('http://', 'https://')):
                logger.error(f"Invalid Supabase URL format: {supabase_url} (must start with http:// or https://)")
                return
            
            # Remove trailing slash if present
            supabase_url = supabase_url.rstrip('/')
            
            # Validate URL format
            if '.supabase.co' not in supabase_url:
                logger.error(f"Invalid Supabase URL format: {supabase_url} (should contain .supabase.co)")
                return
            
            logger.info(f"Initializing Supabase client with URL: {supabase_url}")
            
            # Create client with explicit options
            try:
                self.supabase_client = create_client(supabase_url, supabase_key)
                logger.info("Supabase client created successfully")
            except Exception as client_error:
                logger.error(f"Failed to create Supabase client: {client_error}", exc_info=True)
                self.supabase_client = None
                return
            
            # Test connection with a simple query
            try:
                logger.debug("Testing Supabase connection...")
                
                # First, test if we can reach Supabase at all using requests
                if REQUESTS_AVAILABLE:
                    try:
                        import requests
                        test_url = f"{supabase_url}/rest/v1/"
                        response = requests.get(test_url, headers={"apikey": supabase_key}, timeout=5)
                        logger.info(f"Direct connection test: {response.status_code}")
                    except Exception as direct_test_error:
                        logger.warning(f"Direct connection test failed: {direct_test_error}")
                
                test_result = self.supabase_client.table("knowledge_base").select("id").limit(1).execute()
                logger.info("✅ Supabase client initialized and connection verified")
            except Exception as test_error:
                error_str = str(test_error).lower()
                if "nodename" in error_str or "servname" in error_str or "dns" in error_str:
                    logger.error("🔍 DNS resolution error during connection test!")
                    logger.error(f"Check SUPABASE_URL: {supabase_url}")
                    logger.error("Possible issues: 1) Wrong URL format 2) Network issue 3) Firewall blocking")
                else:
                    logger.warning(f"⚠️ Supabase connection test failed: {test_error}")
                logger.warning("Will attempt operations anyway - might work for some operations")
                # Keep the client - might work for some operations
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize Supabase: {e}", exc_info=True)
            self.supabase_client = None
    
    def create_embedding(self, text: str) -> List[float]:
        """Create embedding for text"""
        if not self.embedding_model:
            logger.warning("Embedding model not available, returning empty embedding")
            return []
        
        try:
            embedding = self.embedding_model.encode(text, convert_to_numpy=True).tolist()
            return embedding
        except Exception as e:
            logger.error(f"Error creating embedding: {e}")
            return []
    
    def upload_document(
        self,
        file_content: bytes,
        filename: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Upload and process a document
        
        Returns:
            Dict with upload results (chunks_created, document_ids, etc.)
        """
        try:
            # Extract text from file
            text = DocumentProcessor.process_file(file_content, filename)
            
            if not text or len(text.strip()) == 0:
                raise ValueError("No text extracted from document")
            
            # Chunk the text
            chunks = self.chunker.chunk_text(text)
            logger.info(f"Document {filename} split into {len(chunks)} chunks")
            
            # Store each chunk
            document_ids = []
            for i, chunk in enumerate(chunks):
                chunk_metadata = {
                    **(metadata or {}),
                    "filename": filename,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "content_type": "document"
                }
                
                doc_id = self._store_chunk(
                    content=chunk,
                    source=filename,
                    content_type="document",
                    metadata=chunk_metadata
                )
                
                if doc_id:
                    document_ids.append(doc_id)
            
            # Check if any chunks were stored
            if len(document_ids) == 0:
                logger.error(f"No chunks were stored for document {filename}. Check Supabase connection.")
                return {
                    "success": False,
                    "error": "Failed to store document chunks. Check Supabase connection and logs.",
                    "filename": filename,
                    "chunks_created": 0
                }
            
            # Immediately fetch and return the stored knowledge for this source
            stored_sources = []
            try:
                if self.supabase_client:
                    # Query immediately after insert to verify storage
                    result = self.supabase_client.table("knowledge_base")\
                        .select("*")\
                        .eq("agent_id", str(self.agent_id))\
                        .eq("source", filename)\
                        .execute()
                    
                    if result.data:
                        # Group by source
                        sources = {}
                        for item in result.data:
                            source = item.get("source") or filename
                            if source not in sources:
                                sources[source] = {
                                    "id": item.get("id"),
                                    "source": source,
                                    "content_type": item.get("content_type", "document"),
                                    "metadata": json.loads(item.get("metadata", "{}")) if isinstance(item.get("metadata"), str) else (item.get("metadata") or {}),
                                    "created_at": item.get("created_at"),
                                    "chunk_count": 0,
                                    "preview": (item.get("content", "") or "")[:200]
                                }
                            sources[source]["chunk_count"] += 1
                        stored_sources = list(sources.values())
                        logger.info(f"✅ Verified {len(stored_sources)} sources stored for {filename}")
            except Exception as verify_error:
                logger.warning(f"Could not verify stored sources: {verify_error}")
            
            return {
                "success": True,
                "filename": filename,
                "chunks_created": len(document_ids),
                "document_ids": document_ids,
                "total_chars": len(text),
                "stored_sources": stored_sources  # Return immediately stored sources
            }
            
        except Exception as e:
            logger.error(f"Error uploading document {filename}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def scrape_url(self, url: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Scrape content from URL and add to knowledge base
        
        Returns:
            Dict with scrape results
        """
        try:
            # Scrape text from URL
            text = DocumentProcessor.extract_text_from_url(url)
            
            if not text or len(text.strip()) == 0:
                raise ValueError("No text extracted from URL")
            
            # Chunk the text
            chunks = self.chunker.chunk_text(text)
            logger.info(f"URL {url} scraped and split into {len(chunks)} chunks")
            
            # Store each chunk
            url_chunk_ids = []
            for i, chunk in enumerate(chunks):
                chunk_metadata = {
                    **(metadata or {}),
                    "url": url,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "content_type": "url"
                }
                
                chunk_id = self._store_chunk(
                    content=chunk,
                    source=url,
                    content_type="url",
                    metadata=chunk_metadata
                )
                
                if chunk_id:
                    url_chunk_ids.append(chunk_id)
            
            # Check if any chunks were stored
            if len(url_chunk_ids) == 0:
                logger.error(f"No chunks were stored for URL {url}. Check Supabase connection.")
                return {
                    "success": False,
                    "error": "Failed to store URL chunks. Check Supabase connection and logs.",
                    "url": url,
                    "chunks_created": 0
                }
            
            return {
                "success": True,
                "url": url,
                "chunks_created": len(url_chunk_ids),
                "chunk_ids": url_chunk_ids,
                "total_chars": len(text)
            }
            
        except Exception as e:
            logger.error(f"Error scraping URL {url}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def add_faq(self, question: str, answer: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Add FAQ pair to knowledge base
        
        Returns:
            Dict with FAQ addition results
        """
        try:
            # Combine question and answer
            content = f"Q: {question}\nA: {answer}"
            
            faq_metadata = {
                **(metadata or {}),
                "question": question,
                "answer": answer,
                "content_type": "faq"
            }
            
            doc_id = self._store_chunk(
                content=content,
                source=f"FAQ: {question[:50]}",
                content_type="faq",
                metadata=faq_metadata
            )
            
            if doc_id:
                return {
                    "success": True,
                    "faq_id": doc_id,
                    "question": question
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to store FAQ"
                }
                
        except Exception as e:
            logger.error(f"Error adding FAQ: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _store_chunk(
        self,
        content: str,
        source: str,
        content_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """Store a text chunk in the knowledge base"""
        try:
            # Create embedding
            embedding = self.create_embedding(content)
            
            if not embedding:
                logger.warning("Could not create embedding, chunk added without vector")
            
            # Prepare document data
            doc_data = {
                "agent_id": str(self.agent_id),  # Ensure it's a string
                "content": content,
                "source": source,
                "content_type": content_type,
                "metadata": json.dumps(metadata or {}),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            if self.supabase_client:
                # Add embedding if available (for vector search)
                if embedding:
                    doc_data["embedding"] = embedding
                
                # Insert into Supabase (even without embedding for text search fallback)
                try:
                    logger.debug(f"Inserting chunk: agent_id={self.agent_id}, source={source}")
                    
                    # Ensure we have a valid client before inserting
                    if not self.supabase_client:
                        logger.error("Supabase client is None, cannot insert")
                        return None
                    
                    result = self.supabase_client.table("knowledge_base").insert(doc_data).execute()
                    
                    if result.data:
                        doc_id = result.data[0].get("id")
                        stored_agent_id = result.data[0].get("agent_id")
                        logger.info(f"✅ Chunk stored in KB: {doc_id} (source: {source}, agent_id: {stored_agent_id}, embedding: {'yes' if embedding else 'no'})")
                        return doc_id
                    else:
                        logger.warning(f"⚠️ No data returned from Supabase insert for source: {source}")
                        logger.debug(f"Insert response: {result}")
                        # Try fallback storage
                        return self._store_in_fallback(doc_data)
                except Exception as insert_error:
                    logger.error(f"❌ Error inserting into Supabase: {insert_error}", exc_info=True)
                    error_msg = str(insert_error).lower()
                    if "nodename" in error_msg or "servname" in error_msg or "dns" in error_msg:
                        logger.error("🔍 DNS resolution error detected!")
                        logger.error(f"Current SUPABASE_URL: {os.getenv('SUPABASE_URL', 'NOT SET')}")
                        logger.error("Using fallback storage. Fix Supabase connection to enable persistent storage.")
                    # Use fallback storage
                    return self._store_in_fallback(doc_data)
            else:
                logger.warning("Supabase client not available, using fallback storage")
                return self._store_in_fallback(doc_data)
            
            return None
            
        except Exception as e:
            logger.error(f"Error storing chunk: {e}")
            return None
    
    def _store_in_fallback(self, doc_data: Dict[str, Any]) -> str:
        """Store chunk in fallback in-memory storage"""
        import uuid
        doc_id = str(uuid.uuid4())
        doc_data["id"] = doc_id
        doc_data["stored_in"] = "fallback"
        self._fallback_storage.append(doc_data)
        logger.warning(f"⚠️ Stored in fallback storage: {doc_id} (source: {doc_data.get('source')})")
        logger.warning("⚠️ Fallback storage is temporary. Fix Supabase connection for persistent storage.")
        return doc_id
    
    def _get_from_fallback(self) -> List[Dict[str, Any]]:
        """Get knowledge from fallback storage for this agent"""
        return [item for item in self._fallback_storage if item.get("agent_id") == self.agent_id]
    
    def search(
        self,
        query: str,
        top_k: int = 5,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Search knowledge base using semantic similarity"""
        try:
            if not self.embedding_model or not self.supabase_client:
                return self._fallback_text_search(query, top_k)
            
            # Create query embedding
            query_embedding = self.create_embedding(query)
            
            if not query_embedding:
                return self._fallback_text_search(query, top_k)
            
            # Vector similarity search
            try:
                # Ensure agent_id is a UUID string (Supabase expects UUID)
                import uuid
                try:
                    # Try to convert to UUID to validate format
                    agent_uuid = uuid.UUID(str(self.agent_id))
                    agent_id_str = str(agent_uuid)
                except (ValueError, AttributeError):
                    # If not a valid UUID, use as-is (might be a string ID)
                    agent_id_str = str(self.agent_id)
                    logger.warning(f"⚠️ Agent ID '{agent_id_str}' is not a valid UUID format")
                
                logger.info(f"🔍 Vector search: agent_id={agent_id_str}, query='{query[:50]}', threshold={similarity_threshold}")
                
                result = self.supabase_client.rpc(
                    "search_knowledge_base",
                    {
                        "query_embedding": query_embedding,
                        "match_agent_id": agent_id_str,  # Pass as string, Supabase will convert
                        "match_threshold": similarity_threshold,
                        "match_count": top_k
                    }
                ).execute()
                
                logger.info(f"📊 Vector search returned {len(result.data) if result.data else 0} results")
                
                if result.data:
                    return [
                        {
                            "id": item.get("id"),
                            "content": item.get("content"),
                            "source": item.get("source"),
                            "content_type": item.get("content_type"),
                            "metadata": json.loads(item.get("metadata", "{}")) if isinstance(item.get("metadata"), str) else (item.get("metadata") or {}),
                            "similarity": 1 - item.get("distance", 1.0)
                        }
                        for item in result.data
                    ]
                else:
                    logger.warning(f"⚠️ Vector search returned no results, trying text search fallback")
                    return self._fallback_text_search(query, top_k)
                    
            except Exception as e:
                logger.warning(f"Vector search failed: {e}", exc_info=True)
                logger.info("🔄 Falling back to text search...")
                return self._fallback_text_search(query, top_k)
                
        except Exception as e:
            logger.error(f"Error searching KB: {e}")
            return []
    
    def _fallback_text_search(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Fallback text search if vector search is unavailable"""
        try:
            if not self.supabase_client:
                logger.warning("No Supabase client for text search")
                return []
            
            # Extract ALL keywords from query for better matching
            query_lower = query.lower()
            # Remove common stop words but keep important ones
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must'}
            keywords = [word for word in query_lower.split() if len(word) > 2 and word not in stop_words]
            
            # If no keywords after filtering, use all words > 2 chars
            if not keywords:
                keywords = [word for word in query_lower.split() if len(word) > 2]
            
            logger.info(f"🔍 Text search: Query='{query[:50]}', Keywords={keywords[:5]}")
            
            # Try multiple search strategies
            all_results = []
            
            # Strategy 1: Search for each keyword individually and combine
            for keyword in keywords[:5]:  # Limit to top 5 keywords
                try:
                    result = self.supabase_client.table("knowledge_base")\
                        .select("*")\
                        .eq("agent_id", str(self.agent_id))\
                        .ilike("content", f"%{keyword}%")\
                        .limit(top_k * 3)\
                        .execute()
                    
                    if result.data:
                        all_results.extend(result.data)
                except Exception as e:
                    logger.warning(f"Error searching for keyword '{keyword}': {e}")
            
            # Strategy 2: Search for full query phrase
            if len(query_lower) > 5:
                try:
                    result = self.supabase_client.table("knowledge_base")\
                        .select("*")\
                        .eq("agent_id", str(self.agent_id))\
                        .ilike("content", f"%{query_lower[:50]}%")\
                        .limit(top_k)\
                        .execute()
                    
                    if result.data:
                        all_results.extend(result.data)
                except Exception as e:
                    logger.warning(f"Error searching for full query: {e}")
            
            # Remove duplicates by ID
            seen_ids = set()
            unique_results = []
            for item in all_results:
                item_id = item.get("id")
                if item_id and item_id not in seen_ids:
                    seen_ids.add(item_id)
                    unique_results.append(item)
            
            logger.info(f"📚 Text search found {len(unique_results)} unique results")
            
            if unique_results:
                # Score results by keyword matches and relevance
                scored_results = []
                for item in unique_results:
                    content_lower = (item.get("content", "") or "").lower()
                    score = 0
                    
                    # Count keyword matches (weighted by keyword importance)
                    for keyword in keywords:
                        if keyword in content_lower:
                            score += 2  # Increased weight
                    
                    # Boost score if query words appear together (phrase match)
                    if query_lower in content_lower:
                        score += 10  # Strong boost for exact phrase
                    
                    # Boost score if multiple keywords appear close together
                    keyword_positions = [content_lower.find(kw) for kw in keywords if kw in content_lower]
                    if len(keyword_positions) > 1:
                        # Check if keywords are close together (within 100 chars)
                        for i in range(len(keyword_positions) - 1):
                            if abs(keyword_positions[i] - keyword_positions[i+1]) < 100:
                                score += 3
                    
                    if score > 0:
                        # Normalize similarity score (0.4 to 0.95 range)
                        similarity = min(0.95, 0.4 + (score / 20))
                        scored_results.append({
                            "id": item.get("id"),
                            "content": item.get("content"),
                            "source": item.get("source") or item.get("title") or "Unknown",
                            "content_type": item.get("content_type"),
                            "metadata": json.loads(item.get("metadata", "{}")) if isinstance(item.get("metadata"), str) else (item.get("metadata") or {}),
                            "similarity": similarity
                        })
                
                # Sort by score and return top_k
                scored_results.sort(key=lambda x: x.get("similarity", 0), reverse=True)
                logger.info(f"✅ Text search returning {len(scored_results[:top_k])} results (top score: {scored_results[0].get('similarity', 0):.3f if scored_results else 0})")
                return scored_results[:top_k]
            
            logger.warning(f"⚠️ No text search results found for query: '{query[:50]}'")
            return []
        except Exception as e:
            logger.error(f"Fallback text search failed: {e}", exc_info=True)
            return []
    
    def get_all_knowledge(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all knowledge sources for this agent"""
        try:
            results = []
            
            # Try Supabase first
            if self.supabase_client:
                try:
                    logger.info(f"🔍 Querying knowledge_base for agent_id: {self.agent_id} (type: {type(self.agent_id)})")
                    
                    # Convert agent_id to string if needed
                    agent_id_str = str(self.agent_id)
                    
                    # Try both UUID format and string format
                    result = self.supabase_client.table("knowledge_base")\
                        .select("*")\
                        .eq("agent_id", agent_id_str)\
                        .order("created_at", desc=True)\
                        .limit(limit)\
                        .execute()
                    
                    logger.info(f"📊 Query result: {len(result.data) if result.data else 0} rows returned")
                    
                    # If no results, try with UUID conversion
                    if not result.data:
                        try:
                            import uuid
                            agent_uuid = uuid.UUID(agent_id_str)
                            logger.info(f"🔄 Retrying with UUID format: {agent_uuid}")
                            result = self.supabase_client.table("knowledge_base")\
                                .select("*")\
                                .eq("agent_id", str(agent_uuid))\
                                .order("created_at", desc=True)\
                                .limit(limit)\
                                .execute()
                            logger.info(f"📊 UUID query result: {len(result.data) if result.data else 0} rows returned")
                        except (ValueError, AttributeError):
                            logger.warning(f"⚠️ Agent ID '{agent_id_str}' is not a valid UUID")
                    
                    if result.data:
                        logger.debug(f"📋 First few rows: {result.data[:3] if len(result.data) > 3 else result.data}")
                        
                        # Group by source for better display
                        sources = {}
                        for item in result.data:
                            source = item.get("source") or item.get("title") or "Unknown"
                            source_id = item.get("id")
                            
                            # Use source as key, but keep track of all IDs
                            if source not in sources:
                                sources[source] = {
                                    "id": source_id,  # Use first chunk's ID as primary ID
                                    "source": source,
                                    "content_type": item.get("content_type", "document"),
                                    "metadata": json.loads(item.get("metadata", "{}")) if isinstance(item.get("metadata"), str) else (item.get("metadata") or {}),
                                    "created_at": item.get("created_at"),
                                    "chunk_count": 0,
                                    "preview": (item.get("content", "") or "")[:200]
                                }
                            sources[source]["chunk_count"] += 1
                        
                        results.extend(list(sources.values()))
                        logger.info(f"✅ Retrieved {len(sources)} unique knowledge sources from Supabase")
                    result = self.supabase_client.table("knowledge_base")\
                        .select("*")\
                        .eq("agent_id", agent_id_str)\
                        .order("created_at", desc=True)\
                        .limit(limit)\
                        .execute()
                    
                    logger.info(f"📊 Query result: {len(result.data) if result.data else 0} rows returned")
                    
                    # Debug: Also try querying without agent_id filter to see if any records exist
                    if not result.data or len(result.data) == 0:
                        logger.warning(f"⚠️ No records found for agent_id: {agent_id_str}")
                        # Try a broader query to see what's in the table
                        try:
                            all_records = self.supabase_client.table("knowledge_base")\
                                .select("agent_id, source, id, created_at")\
                                .limit(10)\
                                .execute()
                            if all_records.data:
                                logger.info(f"🔍 Found {len(all_records.data)} total records in knowledge_base table")
                                logger.info(f"🔍 Sample agent_ids in DB: {[r.get('agent_id') for r in all_records.data[:5]]}")
                                logger.info(f"🔍 Looking for agent_id: {agent_id_str} (type: {type(agent_id_str)})")
                            else:
                                logger.warning("⚠️ No records found in knowledge_base table at all")
                        except Exception as debug_error:
                            logger.error(f"Error in debug query: {debug_error}")
                    
                    if result.data:
                        logger.debug(f"📋 First few rows: {result.data[:3] if len(result.data) > 3 else result.data}")
                        
                        # Group by source for better display
                        sources = {}
                        for item in result.data:
                            source = item.get("source") or item.get("title") or "Unknown"
                            source_id = item.get("id")
                            
                            # Use source as key, but keep track of all IDs
                            if source not in sources:
                                sources[source] = {
                                    "id": source_id,  # Use first chunk's ID as primary ID
                                    "source": source,
                                    "content_type": item.get("content_type", "document"),
                                    "metadata": json.loads(item.get("metadata", "{}")) if isinstance(item.get("metadata"), str) else (item.get("metadata") or {}),
                                    "created_at": item.get("created_at"),
                                    "chunk_count": 0,
                                    "preview": (item.get("content", "") or "")[:200]
                                }
                            sources[source]["chunk_count"] += 1
                        
                        results.extend(list(sources.values()))
                        logger.info(f"✅ Retrieved {len(sources)} unique knowledge sources from Supabase")
                except Exception as e:
                    logger.error(f"❌ Error querying Supabase: {e}", exc_info=True)
            
            # Add fallback storage results
            fallback_items = self._get_from_fallback()
            if fallback_items:
                fallback_sources = {}
                for item in fallback_items:
                    source = item.get("source")
                    if source not in fallback_sources:
                        fallback_sources[source] = {
                            "id": item.get("id"),
                            "source": source,
                            "content_type": item.get("content_type"),
                            "metadata": json.loads(item.get("metadata", "{}")) if isinstance(item.get("metadata"), str) else item.get("metadata", {}),
                            "created_at": item.get("created_at"),
                            "chunk_count": 0,
                            "preview": item.get("content", "")[:200] if isinstance(item.get("content"), str) else ""
                        }
                    fallback_sources[source]["chunk_count"] += 1
                
                results.extend(list(fallback_sources.values()))
                logger.info(f"Added {len(fallback_sources)} sources from fallback storage")
            
            logger.info(f"📦 Returning {len(results)} total knowledge sources")
            return results
        except Exception as e:
            logger.error(f"Error getting knowledge: {e}", exc_info=True)
            # Return fallback storage if available
            return self._get_from_fallback()
    
    def delete_knowledge(self, source: str) -> bool:
        """Delete all chunks for a knowledge source"""
        try:
            if not self.supabase_client:
                return False
            
            result = self.supabase_client.table("knowledge_base")\
                .delete()\
                .eq("agent_id", self.agent_id)\
                .eq("source", source)\
                .execute()
            
            logger.info(f"Deleted knowledge source: {source}")
            return True
        except Exception as e:
            logger.error(f"Error deleting knowledge: {e}")
            return False
    
    def delete_knowledge_by_id(self, doc_id: str) -> bool:
        """Delete a specific knowledge entry by ID"""
        try:
            if not self.supabase_client:
                return False
            
            result = self.supabase_client.table("knowledge_base")\
                .delete()\
                .eq("id", doc_id)\
                .eq("agent_id", self.agent_id)\
                .execute()
            
            return True
        except Exception as e:
            logger.error(f"Error deleting knowledge by ID: {e}")
            return False


# Convenience function
def get_knowledge_base(agent_id: str) -> KnowledgeBaseService:
    """Get knowledge base service for an agent"""
    return KnowledgeBaseService(agent_id)
