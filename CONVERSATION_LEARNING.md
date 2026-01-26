# 🤖 Conversation Learning & Training System

## Overview

All conversations, transcripts, and messages are automatically saved to the database and used to train and improve your voice AI agents over time.

## How It Works

### 1. **Automatic Conversation Storage**
- ✅ Every user message is saved as a transcript
- ✅ Every agent response is saved
- ✅ Conversation metadata (sentiment, duration, status) is tracked
- ✅ All actions taken during conversations are logged

### 2. **Learning from Past Conversations**

The system automatically:
- Analyzes successful conversations (positive sentiment, completed)
- Extracts common questions and successful response patterns
- Identifies best practices from past interactions
- Updates agent knowledge base with learned patterns

### 3. **Training Endpoints**

#### Train an Agent
```bash
POST /api/training/agents/{agent_id}/train
```
- Analyzes all past conversations
- Extracts patterns and insights
- Updates agent's knowledge base automatically

#### Get Training Insights
```bash
GET /api/training/agents/{agent_id}/insights
```
Returns:
- Total conversations
- Positive/negative sentiment rates
- Completion rates
- Average messages per conversation
- Most common actions
- Recommendations for improvement

#### Find Similar Conversations
```bash
GET /api/training/agents/{agent_id}/similar?user_message=...
```
- Finds similar past conversations for context
- Used automatically during chat to improve responses

## What Gets Saved

### Database Tables

1. **conversations** - Each conversation session
   - Agent ID
   - Customer info (name, phone)
   - Status (active, completed, transferred)
   - Sentiment (positive, negative, neutral)
   - Duration and timestamps

2. **messages** - Every message in conversations
   - User transcripts (speech-to-text)
   - Agent responses
   - Timestamps
   - Metadata (entities, confidence, etc.)

3. **actions** - Actions taken during conversations
   - Action type (lookup_order, schedule_appointment, etc.)
   - Parameters and results
   - Status (completed, failed)

## Training Process

### Automatic Learning
1. **Pattern Extraction**: Analyzes successful conversations
2. **Question Analysis**: Identifies most common user questions
3. **Response Patterns**: Learns which responses work best
4. **Knowledge Base Update**: Adds learned patterns to agent knowledge

### Manual Training
Call the training endpoint to:
- Extract patterns from recent conversations
- Update agent knowledge base
- Get insights and recommendations

## Usage Examples

### Train Agent After Conversations
```python
import requests

# Train agent from past conversations
response = requests.post(
    f"http://localhost:8000/api/training/agents/{agent_id}/train"
)
result = response.json()
print(f"Patterns extracted: {result['patterns_extracted']}")
print(f"Knowledge base updated: {result['knowledge_base_updated']}")
```

### Get Insights
```python
# Get training insights
response = requests.get(
    f"http://localhost:8000/api/training/agents/{agent_id}/insights"
)
insights = response.json()
print(f"Positive sentiment: {insights['insights']['positive_sentiment_rate']}%")
print(f"Recommendations: {insights['insights']['recommendations']}")
```

## Benefits

1. **Continuous Improvement**: Agents get better over time
2. **Context Awareness**: Uses similar past conversations for better responses
3. **Pattern Recognition**: Learns what works and what doesn't
4. **Data-Driven**: All improvements based on actual conversation data

## Best Practices

1. **Regular Training**: Train agents after accumulating conversations
2. **Monitor Insights**: Check insights regularly to identify improvement areas
3. **Review Patterns**: Review extracted patterns to ensure quality
4. **Iterate**: Use recommendations to improve agent configuration

## Next Steps

- ✅ Conversations are automatically saved
- ✅ Training system is ready to use
- 🔄 Consider scheduling automatic training (e.g., daily/weekly)
- 🔄 Add frontend UI for training and insights
- 🔄 Implement feedback loop for user ratings
