# Deployment System Documentation

## Overview
The deployment system allows businesses to deploy their Conversa AI agents across multiple channels:
- **Web Widget**: Embeddable chat widget for websites
- **Phone**: Voice calls via phone numbers (Twilio integration)
- **API**: REST API access with authentication
- **SMS/WhatsApp**: Messaging channels (future)

## Database Schema

Run `deployments_schema.sql` in your Supabase SQL editor to create the `deployments` table.

## Backend Components

### 1. Deployment Service (`backend/services/deployment.py`)
- `create_web_deployment()` - Creates web widget deployment with embed code
- `create_phone_deployment()` - Provisions phone number (requires Twilio)
- `create_api_deployment()` - Generates API keys and secrets
- `generate_embed_code()` - Returns HTML/JS embed snippet
- `track_usage()` - Increments conversation counters
- `validate_domain()` - Checks CORS whitelist for web widgets

### 2. API Endpoints (`backend/routers/deployments.py`)
- `POST /api/agents/{agent_id}/deployments/web` - Create web widget
- `POST /api/agents/{agent_id}/deployments/phone` - Create phone deployment
- `POST /api/agents/{agent_id}/deployments/api` - Create API deployment
- `GET /api/agents/{agent_id}/deployments` - List all deployments
- `PUT /api/deployments/{id}` - Update deployment settings
- `DELETE /api/deployments/{id}` - Delete deployment
- `GET /api/deployments/{id}/stats` - Get usage analytics

### 3. Widget Endpoint (`backend/routers/widget.py`)
- `GET /widget.js?id={deployment_id}` - Serves widget JavaScript
- `POST /api/widget/{deployment_id}/message` - Handles widget messages
- `WebSocket /ws/widget/{deployment_id}` - Real-time chat (future)

## Frontend Components

### 1. Deployment Dashboard (`frontend/app/agents/[id]/deploy/page.tsx`)
Full-featured dashboard for:
- Creating deployments (web, phone, API)
- Viewing active deployments
- Copying embed codes
- Managing deployment settings
- Viewing usage statistics

### 2. Widget Preview (`frontend/components/WidgetPreview.tsx`)
Live preview component showing how the widget will appear on websites.

## Web Widget

### Embed Code
```html
<script>
  (function() {
    window.ConversaAI = {
      deploymentId: '{deployment_id}',
      config: {
        position: 'bottom-right',
        theme: 'dark',
        greeting: 'Hi! How can I help you today?'
      }
    };
    var s = document.createElement('script');
    s.src = 'https://your-api.com/widget.js?id={deployment_id}';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  })();
</script>
```

### Features
- Lightweight (< 50KB)
- Responsive (mobile + desktop)
- Customizable appearance
- Accessible (WCAG 2.1 AA)
- Real-time chat
- Message history
- Typing indicators

## Usage Tracking

Each deployment tracks:
- `total_conversations` - Lifetime count
- `monthly_conversations` - Resets monthly
- `last_conversation_at` - Timestamp

## Security

### Web Widget
- Domain whitelist (CORS validation)
- Deployment ID validation
- Rate limiting per deployment

### API
- Secure API keys (crypto.randomBytes)
- API secrets (shown only once)
- Rate limiting configurable per deployment
- Webhook URL for events

### Phone
- Twilio integration (requires API keys)
- Call recording settings
- Voicemail configuration
- Transfer numbers

## Setup Instructions

1. **Database**: Run `deployments_schema.sql` in Supabase
2. **Backend**: Ensure `httpx` is in `requirements.txt`
3. **Environment**: Set `API_BASE_URL` in backend `.env`
4. **Frontend**: Navigate to `/agents/{id}/deploy` to create deployments

## Next Steps

- [ ] Integrate Twilio for phone provisioning
- [ ] Add SMS/WhatsApp support
- [ ] Implement WebSocket for real-time widget chat
- [ ] Add usage analytics dashboard
- [ ] Implement rate limiting middleware
- [ ] Add webhook event system
- [ ] Create widget customization UI
- [ ] Add A/B testing for deployments
