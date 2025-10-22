# 🎙️ Voice AI Agents Platform

A production-ready platform for creating and managing AI-powered voice agents using Google Gemini and LangGraph. Build intelligent conversational agents for customer support, sales, appointments, and more.

## ✨ Features

- **🤖 Intelligent Voice Agents**: Create custom AI agents with specific personalities and knowledge bases
- **🔧 Built-in Tools**: Order lookup, appointment scheduling, email sending, ticket creation, and human transfer
- **💬 Conversational AI**: Powered by Google Gemini 2.0 Flash for natural, context-aware conversations
- **🔄 LangGraph Workflows**: Robust agentic workflows with intent understanding, action planning, and execution
- **📊 Database Integration**: PostgreSQL/SQLite support with conversation history and analytics
- **🎨 Modern UI**: Next.js 15 frontend with React 19 and Tailwind CSS
- **📈 Real-time Processing**: Track conversations, messages, and actions in real-time
- **🧪 Comprehensive Testing**: Unit, integration, and end-to-end tests

## 🏗️ Architecture

```
voice-ai-agents/
├── backend/              # FastAPI backend
│   ├── agents/          # Voice agent implementations
│   ├── routers/         # API endpoints
│   ├── models/          # Database models and schemas
│   ├── tools/           # Custom tools and executors
│   └── tests/           # Test suite
└── frontend/            # Next.js frontend
    ├── src/app/         # Pages and layouts
    ├── src/components/  # React components
    └── src/lib/         # Utilities and API client
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+ (backend)
- Node.js 18+ (frontend)
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- PostgreSQL or SQLite (database)

### Backend Setup

1. **Clone and navigate to the project:**
   ```bash
   cd voice-ai-agents/backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp ../env.example .env
   # Edit .env and add your GOOGLE_API_KEY
   ```

5. **Initialize database:**
   ```bash
   python -c "from models.database import init_db, create_sample_data; init_db(); create_sample_data()"
   ```

6. **Run the backend:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/`

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## 📖 Usage

### Creating an Agent

1. Navigate to `http://localhost:3000/agents/create`
2. Fill in the agent details:
   - **Name**: Your agent's name
   - **Company**: Company name
   - **Industry**: Industry type (Technology, Healthcare, etc.)
   - **Role**: Agent's role (Customer Support, Sales, etc.)
   - **Personality**: Describe the agent's personality traits
   - **Knowledge Base**: Domain-specific knowledge
   - **Greeting**: Welcome message
3. Click "Create Agent"

### Testing an Agent

1. Go to `http://localhost:3000/test/[agentId]`
2. Type or speak your message
3. The agent will respond using its configured personality and knowledge
4. The agent can execute tools like:
   - Looking up orders
   - Scheduling appointments
   - Creating support tickets
   - Transferring to human agents

### API Endpoints

#### Agents
- `POST /api/agents` - Create a new agent
- `GET /api/agents` - List all agents
- `GET /api/agents/{id}` - Get agent by ID
- `PUT /api/agents/{id}` - Update agent
- `DELETE /api/agents/{id}` - Delete agent
- `PATCH /api/agents/{id}/activate` - Activate agent
- `PATCH /api/agents/{id}/deactivate` - Deactivate agent

#### Conversations
- `POST /api/chat` - Send a message to an agent
- `POST /api/conversations/start` - Start a new conversation
- `GET /api/conversations/{id}` - Get conversation with messages

#### Health
- `GET /` - Health check
- `GET /api/health` - API health check

## 🧪 Testing

### Run All Tests
```bash
cd backend
python run_tests.py --verbose
```

### Run Specific Test Types
```bash
# Unit tests only
python run_tests.py --unit

# Integration tests only
python run_tests.py --integration

# With coverage report
python run_tests.py --coverage
```

### Test Structure
- `tests/test_unit.py` - Unit tests for tools and models
- `tests/test_integration.py` - Integration tests for API endpoints
- `tests/test_simple.py` - Simple smoke tests

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory (see `env.example` for reference):

```env
# Required
GOOGLE_API_KEY=your_api_key_here

# Database
DATABASE_URL=sqlite:///./voice_ai.db  # or PostgreSQL URL

# Optional
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
```

### Database Options

**SQLite (Development):**
```env
DATABASE_URL=sqlite:///./voice_ai.db
```

**PostgreSQL (Production):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/voice_ai_db
```

**Supabase:**
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
```

## 🎨 Frontend Features

- **Agent Creator**: Intuitive form to create custom agents
- **Agent Dashboard**: View and manage all your agents
- **Voice Chat Interface**: Test agents with text or voice input
- **Conversation History**: View past conversations and messages
- **Real-time Updates**: Live conversation updates

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Google Gemini 2.0 Flash** - State-of-the-art LLM
- **LangGraph** - Agentic workflow orchestration
- **SQLAlchemy** - ORM for database management
- **Pydantic** - Data validation
- **PostgreSQL/SQLite** - Database

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons

## 📚 Agent Capabilities

### Built-in Tools

1. **lookup_order**: Look up order information by order number
2. **schedule_appointment**: Schedule appointments for customers
3. **send_email**: Send emails to customers
4. **create_ticket**: Create support tickets
5. **transfer_to_human**: Transfer conversation to human agent

### Intent Understanding

The agent automatically understands user intents:
- Order inquiries
- Appointment requests
- Support issues
- Information requests
- Transfer requests

### Entity Extraction

Automatically extracts:
- Order numbers
- Dates and times
- Email addresses
- Phone numbers
- Customer names

## 🔐 Security

- Environment variable configuration for sensitive data
- Input validation with Pydantic schemas
- CORS configuration for frontend-backend communication
- SQL injection protection with SQLAlchemy ORM
- Error handling and logging

## 📈 Production Deployment

### Backend (FastAPI)

**Using Uvicorn:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Using Docker:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend (Next.js)

**Build:**
```bash
npm run build
```

**Start:**
```bash
npm start
```

**Deploy to Vercel:**
```bash
vercel deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Check that `GOOGLE_API_KEY` is set in `.env`
- Ensure Python 3.11+ is installed
- Verify all dependencies are installed: `pip install -r requirements.txt`

**Database connection errors:**
- For SQLite, check file permissions
- For PostgreSQL, verify connection string and credentials
- Ensure database exists: `python -c "from models.database import init_db; init_db()"`

**Frontend can't connect to backend:**
- Verify backend is running on `http://localhost:8000`
- Check CORS settings in `backend/main.py`
- Ensure `FRONTEND_URL` is correct in backend `.env`

**Tests failing:**
- Set `ENVIRONMENT=test` in environment
- Install test dependencies: `pip install pytest pytest-asyncio httpx`
- Check that test database is accessible

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the documentation at `http://localhost:8000/docs`
- Review the API examples in `tests/`

## 🎯 Roadmap

- [ ] Voice input/output integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Custom tool creation UI
- [ ] Webhook integrations
- [ ] Rate limiting and authentication
- [ ] Agent training interface
- [ ] Conversation templates

## 🌟 Credits

Built with:
- [Google Gemini](https://deepmind.google/technologies/gemini/)
- [LangGraph](https://github.com/langchain-ai/langgraph)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Next.js](https://nextjs.org/)

---

Made with ❤️ for building amazing voice AI experiences

