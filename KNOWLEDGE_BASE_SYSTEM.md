# 🧠 Knowledge Base Training System - Complete Implementation

## Overview

Complete agent training system that allows users to upload documents, scrape URLs, and add FAQs to train their voice AI agents with knowledge. Uses vector embeddings for semantic search.

## 📁 Files Created/Modified

### Backend Files

1. **`backend/services/knowledge_base.py`** (Enhanced)
   - Document processing (PDF, DOCX, TXT, CSV)
   - Text chunking (500-token chunks with overlap)
   - Embedding generation (sentence-transformers)
   - Vector storage in Supabase pgvector
   - Semantic search functionality

2. **`backend/routers/knowledge.py`** (New)
   - `POST /api/agents/{agent_id}/knowledge/upload` - Upload documents
   - `POST /api/agents/{agent_id}/knowledge/url` - Scrape URL content
   - `POST /api/agents/{agent_id}/knowledge/faq` - Add FAQ pairs
   - `GET /api/agents/{agent_id}/knowledge` - List all knowledge sources
   - `DELETE /api/agents/{agent_id}/knowledge/{id}` - Remove knowledge
   - `GET /api/agents/{agent_id}/knowledge/search` - Semantic search

3. **`backend/main.py`** (Modified)
   - Added knowledge router

4. **`backend/requirements.txt`** (Modified)
   - Added: PyPDF2, python-docx, beautifulsoup4, lxml

### Database Files

5. **`knowledge_base_schema.sql`** (New)
   - Complete schema for knowledge_base table
   - pgvector extension setup
   - Vector similarity search function
   - RLS policies
   - Indexes for performance

### Frontend Files

6. **`frontend/src/components/KnowledgeUploader.tsx`** (New)
   - Drag-and-drop file upload
   - URL input for website scraping
   - FAQ builder (question/answer pairs)
   - List of uploaded knowledge with delete option
   - Upload progress indicator
   - Dark theme with purple accents

7. **`frontend/src/app/agents/create/page.tsx`** (Modified)
   - Integrated KnowledgeUploader component
   - Shows knowledge upload after agent creation
   - Knowledge count display

## 🚀 Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
source venv/bin/activate
pip install PyPDF2 python-docx beautifulsoup4 lxml
```

### 2. Run Database Migration

1. Open Supabase SQL Editor
2. Run `knowledge_base_schema.sql`
3. This creates the `knowledge_base` table with pgvector support

### 3. Restart Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Frontend (Already Integrated)

The KnowledgeUploader component is already integrated into the agent creation flow.

## 📊 Database Schema

```sql
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY,
    agent_id UUID NOT NULL,
    content_type VARCHAR(50), -- 'document', 'url', 'faq'
    title VARCHAR(255),
    content TEXT NOT NULL,
    source VARCHAR(255) NOT NULL,
    embedding vector(384), -- For semantic search
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Features

### Document Processing
- ✅ PDF extraction (PyPDF2)
- ✅ DOCX extraction (python-docx)
- ✅ TXT files
- ✅ CSV files
- ✅ Automatic text chunking (500 tokens per chunk)
- ✅ File size validation (10MB max)

### URL Scraping
- ✅ Web scraping with BeautifulSoup
- ✅ Content extraction and cleaning
- ✅ Automatic chunking

### FAQ Management
- ✅ Question-answer pairs
- ✅ Easy addition interface
- ✅ Stored as knowledge chunks

### Semantic Search
- ✅ Vector embeddings (sentence-transformers)
- ✅ Cosine similarity search
- ✅ Configurable similarity threshold
- ✅ Top-K results

## 🔧 API Endpoints

### Upload Document
```bash
POST /api/agents/{agent_id}/knowledge/upload
Content-Type: multipart/form-data
Body: file (PDF, DOCX, TXT, CSV)
```

### Scrape URL
```bash
POST /api/agents/{agent_id}/knowledge/url
Content-Type: application/x-www-form-urlencoded
Body: url=https://example.com
```

### Add FAQ
```bash
POST /api/agents/{agent_id}/knowledge/faq
Content-Type: application/x-www-form-urlencoded
Body: question=...&answer=...
```

### List Knowledge
```bash
GET /api/agents/{agent_id}/knowledge?limit=100
```

### Delete Knowledge
```bash
DELETE /api/agents/{agent_id}/knowledge/{source_id}
```

### Search Knowledge
```bash
GET /api/agents/{agent_id}/knowledge/search?query=...&top_k=5&similarity_threshold=0.7
```

## 🎨 Frontend Component

The `KnowledgeUploader` component provides:
- **Tabbed Interface**: Documents, URLs, FAQs
- **Drag & Drop**: Easy file uploads
- **Progress Indicators**: Real-time upload feedback
- **Knowledge List**: View all uploaded sources
- **Delete Functionality**: Remove knowledge sources
- **Dark Theme**: Matches your existing design

## 💡 Usage Flow

1. **Create Agent**: Fill in agent details
2. **Click "Create Agent"**: Agent is created
3. **Upload Knowledge**: 
   - Drag & drop documents
   - Paste URLs to scrape
   - Add FAQ pairs
4. **Agent Trained**: Knowledge is automatically chunked and embedded
5. **Use Agent**: Agent uses knowledge for better responses

## 🔍 How It Works

1. **Document Upload**:
   - File is validated (type, size)
   - Text is extracted based on file type
   - Text is chunked into 500-token pieces
   - Each chunk is embedded and stored

2. **URL Scraping**:
   - URL is fetched
   - HTML is parsed and cleaned
   - Text is extracted and chunked
   - Chunks are embedded and stored

3. **FAQ Addition**:
   - Question-answer pair is combined
   - Embedded and stored as single chunk

4. **Semantic Search**:
   - Query is embedded
   - Vector similarity search finds relevant chunks
   - Top-K results returned

## 🎯 Integration with Agent

The knowledge base is automatically used when:
- Agent processes user messages
- Similar past conversations are found
- Context is needed for responses

## 📝 Notes

- **Free Embeddings**: Uses sentence-transformers (all-MiniLM-L6-v2) - no API costs
- **Chunking**: Documents are split into manageable chunks for better search
- **Metadata**: Stores filename, upload date, source type, etc.
- **RLS**: Row-level security ensures users only see their own agents' knowledge

## ✅ Testing

1. Create an agent
2. Upload a PDF document
3. Scrape a website URL
4. Add a FAQ
5. Check knowledge list shows all sources
6. Test semantic search endpoint

## 🚨 Important

- Make sure Supabase pgvector extension is enabled
- Run the SQL migration before using
- Install all backend dependencies
- Knowledge base uses agent_id from your agents table
