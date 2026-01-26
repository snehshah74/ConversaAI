"""
Knowledge Base API Endpoints
Handles document uploads, URL scraping, FAQ management
"""

import logging
from typing import List, Dict, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from models.database import get_db, Agent
from models.schemas import ErrorResponse
from services.knowledge_base import KnowledgeBaseService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agents", tags=["knowledge"])


@router.post(
    "/{agent_id}/knowledge/upload",
    status_code=status.HTTP_201_CREATED,
    summary="Upload document to agent knowledge base",
    description="Upload PDF, DOCX, TXT, or CSV files to train the agent"
)
async def upload_document(
    agent_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Upload a document file to the agent's knowledge base.
    
    Supported formats: PDF, DOCX, TXT, CSV
    Max file size: 10MB
    """
    try:
        # Verify agent exists
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        # Validate file type
        allowed_extensions = {'.pdf', '.docx', '.doc', '.txt', '.csv'}
        filename = file.filename or ''
        file_ext = '.' + filename.split('.')[-1].lower() if '.' in filename else ''
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Validate file size (10MB max)
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 10MB limit"
            )
        
        # Process and store document
        kb_service = KnowledgeBaseService(str(agent_id))
        result = kb_service.upload_document(
            file_content=file_content,
            filename=filename,
            metadata={
                "original_filename": filename,
                "file_size": len(file_content),
                "file_type": file_ext[1:]  # Remove the dot
            }
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to process document")
            )
        
        logger.info(f"Document uploaded for agent {agent_id}: {filename}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while uploading document"
        )


@router.post(
    "/{agent_id}/knowledge/url",
    status_code=status.HTTP_201_CREATED,
    summary="Scrape URL and add to knowledge base",
    description="Scrape content from a website URL and add it to the agent's knowledge base"
)
async def scrape_url(
    agent_id: UUID,
    url: str = Form(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Scrape content from a URL and add it to the agent's knowledge base.
    """
    try:
        # Verify agent exists
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        # Validate URL format
        if not url.startswith(('http://', 'https://')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid URL format. Must start with http:// or https://"
            )
        
        # Scrape and store URL content
        kb_service = KnowledgeBaseService(str(agent_id))
        result = kb_service.scrape_url(
            url=url,
            metadata={
                "scraped_url": url,
                "content_type": "url"
            }
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to scrape URL")
            )
        
        logger.info(f"URL scraped for agent {agent_id}: {url}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scraping URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while scraping URL"
        )


@router.post(
    "/{agent_id}/knowledge/faq",
    status_code=status.HTTP_201_CREATED,
    summary="Add FAQ to knowledge base",
    description="Add a question-answer pair to the agent's knowledge base"
)
async def add_faq(
    agent_id: UUID,
    question: str = Form(...),
    answer: str = Form(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Add a FAQ (question-answer pair) to the agent's knowledge base.
    """
    try:
        # Verify agent exists
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        # Validate inputs
        if not question.strip() or not answer.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question and answer cannot be empty"
            )
        
        # Add FAQ
        kb_service = KnowledgeBaseService(str(agent_id))
        result = kb_service.add_faq(
            question=question.strip(),
            answer=answer.strip(),
            metadata={
                "content_type": "faq"
            }
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to add FAQ")
            )
        
        logger.info(f"FAQ added for agent {agent_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding FAQ: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while adding FAQ"
        )


@router.get(
    "/{agent_id}/knowledge",
    status_code=status.HTTP_200_OK,
    summary="List all knowledge sources",
    description="Get all knowledge sources (documents, URLs, FAQs) for an agent"
)
async def list_knowledge(
    agent_id: UUID,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    List all knowledge sources for an agent.
    """
    try:
        # Verify agent exists
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        # Get all knowledge
        kb_service = KnowledgeBaseService(str(agent_id))
        knowledge_sources = kb_service.get_all_knowledge(limit=limit)
        
        return {
            "agent_id": str(agent_id),
            "knowledge_sources": knowledge_sources,
            "total_sources": len(knowledge_sources)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing knowledge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while listing knowledge"
        )


@router.delete(
    "/{agent_id}/knowledge/{source_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete knowledge source",
    description="Delete a knowledge source (document, URL, or FAQ) from the agent's knowledge base"
)
async def delete_knowledge(
    agent_id: UUID,
    source_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Delete a knowledge source from the agent's knowledge base.
    
    source_id can be:
    - A source name (filename or URL) - deletes all chunks for that source
    - A document ID - deletes specific chunk
    """
    try:
        # Verify agent exists
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        # Delete knowledge
        kb_service = KnowledgeBaseService(str(agent_id))
        
        # Try deleting by ID first, then by source name
        success = kb_service.delete_knowledge_by_id(source_id)
        if not success:
            success = kb_service.delete_knowledge(source_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Knowledge source not found"
            )
        
        logger.info(f"Knowledge deleted for agent {agent_id}: {source_id}")
        return {
            "success": True,
            "message": "Knowledge source deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting knowledge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while deleting knowledge"
        )


@router.get(
    "/{agent_id}/knowledge/search",
    status_code=status.HTTP_200_OK,
    summary="Search knowledge base",
    description="Search the agent's knowledge base using semantic similarity"
)
async def search_knowledge(
    agent_id: UUID,
    query: str,
    top_k: int = 5,
    similarity_threshold: float = 0.3,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Search the agent's knowledge base using semantic similarity.
    """
    try:
        # Verify agent exists
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        # Search knowledge base
        kb_service = KnowledgeBaseService(str(agent_id))
        results = kb_service.search(
            query=query,
            top_k=top_k,
            similarity_threshold=similarity_threshold
        )
        
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching knowledge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while searching knowledge"
        )


@router.get(
    "/{agent_id}/knowledge/test",
    status_code=status.HTTP_200_OK,
    summary="Test knowledge base search",
    description="Test endpoint to verify knowledge search is working correctly"
)
async def test_knowledge_search(
    agent_id: UUID,
    query: str = "refund policy",
    top_k: int = 5,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Test endpoint to verify knowledge base search is working.
    
    Usage:
    GET /api/agents/{agent_id}/knowledge/test?query=refund+policy&top_k=3
    """
    try:
        # Verify agent exists
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        # Search knowledge base
        kb_service = KnowledgeBaseService(str(agent_id))
        
        # First, get all knowledge to verify it exists
        all_knowledge = kb_service.get_all_knowledge(limit=100)
        
        # Then search
        results = kb_service.search(
            query=query,
            top_k=top_k,
            similarity_threshold=0.2  # Lower threshold for testing
        )
        
        return {
            "agent_id": str(agent_id),
            "agent_name": agent.name,
            "query": query,
            "total_knowledge_items": len(all_knowledge),
            "knowledge_sources": [kb.get('source', 'Unknown') for kb in all_knowledge[:10]],
            "search_results_count": len(results),
            "results": results,
            "status": "success" if results else "no_results"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing knowledge search: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
