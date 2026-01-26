"""
Conversation Learning Service
Uses past conversations to train and improve voice AI agents
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from models.database import Agent, Conversation, Message, Action

logger = logging.getLogger(__name__)


class ConversationLearningService:
    """Service for learning from past conversations to improve agents"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def extract_successful_patterns(self, agent_id: str, limit: int = 100) -> Dict[str, Any]:
        """
        Extract successful conversation patterns from past interactions
        
        Returns:
            Dict with patterns, common intents, successful responses, etc.
        """
        try:
            # Get successful conversations (positive sentiment, completed status)
            successful_conversations = self.db.query(Conversation).filter(
                and_(
                    Conversation.agent_id == agent_id,
                    Conversation.sentiment == 'positive',
                    Conversation.status == 'completed'
                )
            ).order_by(desc(Conversation.started_at)).limit(limit).all()
            
            patterns = {
                'common_user_intents': {},
                'successful_responses': [],
                'common_questions': [],
                'response_patterns': {},
                'action_patterns': {},
                'total_conversations': len(successful_conversations)
            }
            
            # Analyze messages from successful conversations
            for conv in successful_conversations:
                messages = self.db.query(Message).filter(
                    Message.conversation_id == conv.id
                ).order_by(Message.timestamp).all()
                
                # Extract user questions and agent responses
                for i, msg in enumerate(messages):
                    if msg.role == 'user':
                        # Track common user questions
                        content_lower = msg.content.lower().strip()
                        if len(content_lower) > 10:  # Only meaningful questions
                            patterns['common_questions'].append(content_lower)
                        
                        # Track successful response patterns
                        if i + 1 < len(messages) and messages[i + 1].role == 'agent':
                            agent_response = messages[i + 1].content
                            patterns['successful_responses'].append({
                                'user_question': msg.content,
                                'agent_response': agent_response,
                                'timestamp': msg.timestamp.isoformat()
                            })
            
            # Count common questions
            from collections import Counter
            question_counts = Counter(patterns['common_questions'])
            patterns['top_questions'] = [
                {'question': q, 'count': c} 
                for q, c in question_counts.most_common(10)
            ]
            
            logger.info(f"Extracted patterns from {len(successful_conversations)} successful conversations")
            return patterns
            
        except Exception as e:
            logger.error(f"Error extracting patterns: {e}")
            return {'error': str(e)}
    
    def generate_learning_insights(self, agent_id: str) -> Dict[str, Any]:
        """
        Generate insights from all conversations for an agent
        
        Returns:
            Dict with insights, metrics, and recommendations
        """
        try:
            # Get all conversations for this agent
            all_conversations = self.db.query(Conversation).filter(
                Conversation.agent_id == agent_id
            ).all()
            
            total_conversations = len(all_conversations)
            if total_conversations == 0:
                return {'message': 'No conversations found for this agent'}
            
            # Calculate metrics
            positive_count = sum(1 for c in all_conversations if c.sentiment == 'positive')
            negative_count = sum(1 for c in all_conversations if c.sentiment == 'negative')
            completed_count = sum(1 for c in all_conversations if c.status == 'completed')
            
            # Get average conversation length
            total_messages = self.db.query(func.count(Message.id)).filter(
                Message.conversation_id.in_([c.id for c in all_conversations])
            ).scalar() or 0
            
            avg_messages_per_conversation = total_messages / total_conversations if total_conversations > 0 else 0
            
            # Get most common actions
            actions = self.db.query(Action).filter(
                Action.conversation_id.in_([c.id for c in all_conversations])
            ).all()
            
            from collections import Counter
            action_counts = Counter([a.action_type for a in actions])
            
            insights = {
                'total_conversations': total_conversations,
                'positive_sentiment_rate': (positive_count / total_conversations * 100) if total_conversations > 0 else 0,
                'negative_sentiment_rate': (negative_count / total_conversations * 100) if total_conversations > 0 else 0,
                'completion_rate': (completed_count / total_conversations * 100) if total_conversations > 0 else 0,
                'avg_messages_per_conversation': round(avg_messages_per_conversation, 2),
                'most_common_actions': [
                    {'action': action, 'count': count}
                    for action, count in action_counts.most_common(5)
                ],
                'recommendations': []
            }
            
            # Generate recommendations
            if insights['positive_sentiment_rate'] < 60:
                insights['recommendations'].append(
                    "Consider improving response quality - positive sentiment rate is below 60%"
                )
            
            if insights['completion_rate'] < 70:
                insights['recommendations'].append(
                    "Many conversations are not completing - review conversation flow"
                )
            
            if avg_messages_per_conversation > 20:
                insights['recommendations'].append(
                    "Conversations are quite long - consider streamlining responses"
                )
            
            logger.info(f"Generated insights for agent {agent_id}")
            return insights
            
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return {'error': str(e)}
    
    def update_agent_knowledge_base(self, agent_id: str, learning_data: Dict[str, Any]) -> bool:
        """
        Update agent's knowledge base with learned patterns
        
        Args:
            agent_id: ID of the agent to update
            learning_data: Extracted patterns and insights
        
        Returns:
            True if successful, False otherwise
        """
        try:
            agent = self.db.query(Agent).filter(Agent.id == agent_id).first()
            if not agent:
                logger.error(f"Agent {agent_id} not found")
                return False
            
            # Get current knowledge base
            current_kb = agent.knowledge_base or ""
            
            # Add learned patterns to knowledge base
            learned_section = "\n\n## Learned from Past Conversations\n\n"
            
            # Add top questions and responses
            if 'top_questions' in learning_data and learning_data['top_questions']:
                learned_section += "### Common Questions and Best Responses:\n\n"
                for item in learning_data['top_questions'][:5]:
                    learned_section += f"Q: {item['question']}\n"
                    learned_section += f"Count: {item['count']} times\n\n"
            
            # Add successful response patterns
            if 'successful_responses' in learning_data and learning_data['successful_responses']:
                learned_section += "### Successful Response Patterns:\n\n"
                for pattern in learning_data['successful_responses'][:10]:
                    learned_section += f"User: {pattern['user_question']}\n"
                    learned_section += f"Agent: {pattern['agent_response']}\n\n"
            
            # Update knowledge base
            updated_kb = current_kb + learned_section
            
            # Only update if we have new learning data
            if learned_section.strip() != "## Learned from Past Conversations":
                agent.knowledge_base = updated_kb
                self.db.commit()
                logger.info(f"Updated knowledge base for agent {agent_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error updating knowledge base: {e}")
            self.db.rollback()
            return False
    
    def get_similar_past_conversations(
        self, 
        agent_id: str, 
        user_message: str, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve similar past conversations for context
        
        Args:
            agent_id: ID of the agent
            user_message: Current user message to find similar conversations for
            limit: Maximum number of similar conversations to return
        
        Returns:
            List of similar conversation snippets
        """
        try:
            # Get all user messages from past conversations
            user_messages = self.db.query(Message).join(Conversation).filter(
                and_(
                    Conversation.agent_id == agent_id,
                    Message.role == 'user',
                    Message.content.ilike(f'%{user_message[:50]}%')  # Simple similarity check
                )
            ).order_by(desc(Message.timestamp)).limit(limit * 2).all()
            
            similar_conversations = []
            
            for user_msg in user_messages:
                # Get the agent response for this user message
                agent_response = self.db.query(Message).filter(
                    and_(
                        Message.conversation_id == user_msg.conversation_id,
                        Message.role == 'agent',
                        Message.timestamp > user_msg.timestamp
                    )
                ).order_by(Message.timestamp).first()
                
                if agent_response:
                    similar_conversations.append({
                        'user_message': user_msg.content,
                        'agent_response': agent_response.content,
                        'conversation_id': str(user_msg.conversation_id),
                        'timestamp': user_msg.timestamp.isoformat(),
                        'sentiment': self.db.query(Conversation).filter(
                            Conversation.id == user_msg.conversation_id
                        ).first().sentiment if self.db.query(Conversation).filter(
                            Conversation.id == user_msg.conversation_id
                        ).first() else None
                    })
                    
                    if len(similar_conversations) >= limit:
                        break
            
            logger.info(f"Found {len(similar_conversations)} similar conversations")
            return similar_conversations
            
        except Exception as e:
            logger.error(f"Error finding similar conversations: {e}")
            return []
    
    def train_agent_from_conversations(self, agent_id: str) -> Dict[str, Any]:
        """
        Main training function - extracts patterns and updates agent
        
        Returns:
            Dict with training results
        """
        try:
            # Extract successful patterns
            patterns = self.extract_successful_patterns(agent_id)
            
            # Generate insights
            insights = self.generate_learning_insights(agent_id)
            
            # Update knowledge base
            update_success = self.update_agent_knowledge_base(agent_id, patterns)
            
            return {
                'success': True,
                'patterns_extracted': len(patterns.get('successful_responses', [])),
                'insights': insights,
                'knowledge_base_updated': update_success,
                'message': 'Agent training completed successfully'
            }
            
        except Exception as e:
            logger.error(f"Error training agent: {e}")
            return {
                'success': False,
                'error': str(e)
            }
