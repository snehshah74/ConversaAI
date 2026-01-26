/**
 * Agent Template Types and Data
 * Pre-built templates for different industries and use cases
 */

export interface ConversationNode {
  userMessage: string;
  agentResponse: string;
  nextSteps?: string[];
}

export interface AgentTemplate {
  id: string;
  name: string;
  industry: string;
  category: string;
  description: string;
  icon: string;
  popularityScore: number;
  
  // Pre-configured settings
  personality: string[];
  greetingMessage: string;
  sampleKnowledgeBase: string;
  suggestedTools: string[];
  sampleConversationFlow: ConversationNode[];
  voiceSettings: {
    preferredVoice: string;
    speed: number;
    tone: string;
  };
  
  // Customization prompts
  requiredFields: string[];
  optionalFields: string[];
  
  // Success metrics for this template
  recommendedMetrics: string[];
  
  // UI metadata
  badges?: string[];
  previewUrl?: string;
  usedBy?: number;
  rating?: number;
}

// Template data for all industries
export const AGENT_TEMPLATES: AgentTemplate[] = [
  // Healthcare & Medical
  {
    id: "healthcare-appointment-scheduling",
    name: "Appointment Scheduling Assistant",
    industry: "Healthcare",
    category: "Appointment Scheduling",
    description: "Help patients schedule, reschedule, and manage medical appointments with ease",
    icon: "🏥",
    popularityScore: 95,
    personality: ["professional", "empathetic", "reassuring", "patient", "clear"],
    greetingMessage: "Hello! I'm here to help you schedule appointments or answer questions about our healthcare services. How may I assist you today?",
    sampleKnowledgeBase: "Our clinic offers appointments Monday-Friday 9am-5pm. We specialize in general practice, cardiology, and pediatrics. Emergency appointments available.",
    suggestedTools: ["schedule_appointment", "send_email"],
    sampleConversationFlow: [
      {
        userMessage: "I need to see Dr. Smith",
        agentResponse: "I'd be happy to help you schedule an appointment with Dr. Smith. What type of visit do you need?",
        nextSteps: ["Check availability", "Schedule appointment"]
      }
    ],
    voiceSettings: {
      preferredVoice: "female",
      speed: 0.9,
      tone: "professional"
    },
    requiredFields: ["company", "available_hours", "doctor_names"],
    optionalFields: ["specialties", "insurance_info", "location"],
    recommendedMetrics: ["appointments_scheduled", "patient_satisfaction", "no_show_rate"],
    badges: ["Popular", "Easy Setup"],
    usedBy: 1234,
    rating: 4.8
  },
  {
    id: "healthcare-prescription-refill",
    name: "Prescription Refill Assistant",
    industry: "Healthcare",
    category: "Prescription Management",
    description: "Automate prescription refill requests and medication reminders",
    icon: "💊",
    popularityScore: 78,
    personality: ["helpful", "precise", "caring", "professional"],
    greetingMessage: "Hi! I can help you refill prescriptions or answer questions about your medications. What do you need?",
    sampleKnowledgeBase: "Prescription refills require 48 hours notice. Controlled substances need doctor approval. We can deliver to your home.",
    suggestedTools: ["create_ticket", "send_email"],
    sampleConversationFlow: [
      {
        userMessage: "I need to refill my prescription",
        agentResponse: "I can help with that. What's the name of the medication you need refilled?",
        nextSteps: ["Verify prescription", "Process refill"]
      }
    ],
    voiceSettings: {
      preferredVoice: "female",
      speed: 0.95,
      tone: "caring"
    },
    requiredFields: ["pharmacy_info", "refill_policy"],
    optionalFields: ["delivery_options", "insurance_info"],
    recommendedMetrics: ["refills_processed", "response_time", "patient_satisfaction"],
    badges: ["Time Saver"],
    usedBy: 567,
    rating: 4.6
  },
  
  // E-commerce & Retail
  {
    id: "ecommerce-order-tracking",
    name: "Order Status & Tracking",
    industry: "E-commerce",
    category: "Order Management",
    description: "Help customers track orders, check shipping status, and get delivery updates",
    icon: "📦",
    popularityScore: 92,
    personality: ["friendly", "helpful", "efficient", "reassuring"],
    greetingMessage: "Hi! I'm here to help you track your order or answer questions about your purchase. How can I assist you?",
    sampleKnowledgeBase: "Orders typically ship within 1-2 business days. Free shipping on orders over $50. Track your order with the tracking number.",
    suggestedTools: ["lookup_order", "send_email"],
    sampleConversationFlow: [
      {
        userMessage: "Where is my order?",
        agentResponse: "I'd be happy to help you track your order. What's your order number?",
        nextSteps: ["Lookup order", "Provide tracking info"]
      }
    ],
    voiceSettings: {
      preferredVoice: "female",
      speed: 1.0,
      tone: "friendly"
    },
    requiredFields: ["company", "shipping_policy"],
    optionalFields: ["return_policy", "tracking_system"],
    recommendedMetrics: ["orders_tracked", "customer_satisfaction", "support_tickets_reduced"],
    badges: ["Popular", "Most Used"],
    usedBy: 2345,
    rating: 4.9
  },
  {
    id: "ecommerce-returns",
    name: "Returns & Exchanges Assistant",
    industry: "E-commerce",
    category: "Customer Service",
    description: "Streamline returns, exchanges, and refund requests",
    icon: "🔄",
    popularityScore: 85,
    personality: ["understanding", "helpful", "efficient", "accommodating"],
    greetingMessage: "Hello! I can help you with returns, exchanges, or refunds. What would you like to do?",
    sampleKnowledgeBase: "Returns accepted within 30 days. Items must be unworn with tags. Free return shipping for orders over $100.",
    suggestedTools: ["lookup_order", "create_ticket"],
    sampleConversationFlow: [
      {
        userMessage: "I want to return something",
        agentResponse: "I can help you process a return. Do you have your order number?",
        nextSteps: ["Verify order", "Process return"]
      }
    ],
    voiceSettings: {
      preferredVoice: "neutral",
      speed: 1.0,
      tone: "understanding"
    },
    requiredFields: ["return_policy", "refund_policy"],
    optionalFields: ["exchange_options", "return_shipping"],
    recommendedMetrics: ["returns_processed", "customer_satisfaction", "refund_time"],
    badges: ["Customer Favorite"],
    usedBy: 890,
    rating: 4.7
  },
  
  // Restaurants & Hospitality
  {
    id: "restaurant-reservation",
    name: "Table Reservation System",
    industry: "Hospitality",
    category: "Reservations",
    description: "Manage restaurant reservations, table availability, and special requests",
    icon: "🍽️",
    popularityScore: 88,
    personality: ["welcoming", "friendly", "accommodating", "enthusiastic"],
    greetingMessage: "Welcome! I can help you make a reservation or answer questions about our restaurant. How can I assist you?",
    sampleKnowledgeBase: "We're open Tuesday-Sunday 5pm-10pm. Reservations recommended for weekends. We accommodate dietary restrictions.",
    suggestedTools: ["schedule_appointment"],
    sampleConversationFlow: [
      {
        userMessage: "I'd like to make a reservation",
        agentResponse: "I'd be happy to help you make a reservation! What date and time are you looking for?",
        nextSteps: ["Check availability", "Confirm reservation"]
      }
    ],
    voiceSettings: {
      preferredVoice: "female",
      speed: 1.0,
      tone: "welcoming"
    },
    requiredFields: ["restaurant_name", "hours", "party_size_options"],
    optionalFields: ["special_menus", "dietary_options", "location"],
    recommendedMetrics: ["reservations_made", "no_show_rate", "customer_satisfaction"],
    badges: ["Popular", "Easy Setup"],
    usedBy: 1456,
    rating: 4.8
  },
  {
    id: "hotel-booking",
    name: "Hotel Booking Assistant",
    industry: "Hospitality",
    category: "Bookings",
    description: "Help guests book rooms, check availability, and answer hotel questions",
    icon: "🏨",
    popularityScore: 82,
    personality: ["welcoming", "professional", "helpful", "accommodating"],
    greetingMessage: "Welcome! I'm here to help you book a room or answer questions about our hotel. How can I assist you?",
    sampleKnowledgeBase: "We offer standard, deluxe, and suite rooms. Check-in is 3pm, check-out is 11am. Free WiFi and breakfast included.",
    suggestedTools: ["schedule_appointment", "send_email"],
    sampleConversationFlow: [
      {
        userMessage: "Do you have rooms available?",
        agentResponse: "I'd be happy to check availability for you. What dates are you looking for?",
        nextSteps: ["Check availability", "Book room"]
      }
    ],
    voiceSettings: {
      preferredVoice: "female",
      speed: 0.95,
      tone: "welcoming"
    },
    requiredFields: ["hotel_name", "room_types", "pricing"],
    optionalFields: ["amenities", "location", "policies"],
    recommendedMetrics: ["bookings_made", "occupancy_rate", "guest_satisfaction"],
    badges: ["Popular"],
    usedBy: 678,
    rating: 4.7
  },
  
  // Real Estate
  {
    id: "real-estate-showings",
    name: "Property Showing Scheduler",
    industry: "Real Estate",
    category: "Scheduling",
    description: "Schedule property viewings, answer questions, and qualify leads",
    icon: "🏠",
    popularityScore: 75,
    personality: ["professional", "knowledgeable", "helpful", "enthusiastic"],
    greetingMessage: "Hello! I can help you schedule a property viewing or answer questions about our listings. How can I assist you?",
    sampleKnowledgeBase: "We have properties available for viewing Monday-Saturday 10am-6pm. Virtual tours available. Pre-qualification required for financing.",
    suggestedTools: ["schedule_appointment", "send_email"],
    sampleConversationFlow: [
      {
        userMessage: "I want to see a property",
        agentResponse: "I'd be happy to schedule a viewing! Which property are you interested in?",
        nextSteps: ["Check availability", "Schedule showing"]
      }
    ],
    voiceSettings: {
      preferredVoice: "neutral",
      speed: 0.9,
      tone: "professional"
    },
    requiredFields: ["company", "property_listings", "available_times"],
    optionalFields: ["financing_info", "neighborhood_info"],
    recommendedMetrics: ["showings_scheduled", "lead_quality", "conversion_rate"],
    badges: ["Lead Generator"],
    usedBy: 423,
    rating: 4.5
  },
  
  // Sales & Lead Generation
  {
    id: "sales-demo-scheduling",
    name: "Demo Scheduling Assistant",
    industry: "Sales",
    category: "Lead Generation",
    description: "Schedule product demos, qualify leads, and follow up automatically",
    icon: "📞",
    popularityScore: 90,
    personality: ["professional", "enthusiastic", "persuasive", "friendly"],
    greetingMessage: "Hi! I can help you schedule a product demo or answer questions about our solutions. How can I assist you?",
    sampleKnowledgeBase: "We offer 30-minute demos Monday-Friday. Our product helps businesses automate workflows. Free trial available.",
    suggestedTools: ["schedule_appointment", "send_email", "create_ticket"],
    sampleConversationFlow: [
      {
        userMessage: "I'm interested in a demo",
        agentResponse: "Great! I'd be happy to schedule a demo for you. What's your company name and what challenges are you looking to solve?",
        nextSteps: ["Qualify lead", "Schedule demo"]
      }
    ],
    voiceSettings: {
      preferredVoice: "male",
      speed: 1.0,
      tone: "enthusiastic"
    },
    requiredFields: ["company", "product_info", "demo_times"],
    optionalFields: ["pricing_info", "case_studies"],
    recommendedMetrics: ["demos_scheduled", "lead_quality", "conversion_rate"],
    badges: ["Popular", "High Conversion"],
    usedBy: 1890,
    rating: 4.9
  },
  
  // Customer Support
  {
    id: "support-helpdesk",
    name: "24/7 Help Desk",
    industry: "Customer Support",
    category: "Support",
    description: "Provide round-the-clock customer support and technical assistance",
    icon: "🎧",
    popularityScore: 87,
    personality: ["helpful", "patient", "knowledgeable", "empathetic"],
    greetingMessage: "Hello! I'm here to help you with any questions or issues. How can I assist you today?",
    sampleKnowledgeBase: "Common issues: password reset, account access, billing questions. We offer live chat, email, and phone support.",
    suggestedTools: ["create_ticket", "lookup_order", "transfer_to_human"],
    sampleConversationFlow: [
      {
        userMessage: "I need help",
        agentResponse: "I'm here to help! What issue are you experiencing?",
        nextSteps: ["Troubleshoot", "Create ticket"]
      }
    ],
    voiceSettings: {
      preferredVoice: "neutral",
      speed: 0.95,
      tone: "helpful"
    },
    requiredFields: ["company", "support_hours", "common_issues"],
    optionalFields: ["escalation_rules", "knowledge_base"],
    recommendedMetrics: ["tickets_resolved", "response_time", "customer_satisfaction"],
    badges: ["24/7", "Popular"],
    usedBy: 2567,
    rating: 4.8
  },
  
  // Financial Services
  {
    id: "finance-payment-reminders",
    name: "Payment Reminder Assistant",
    industry: "Financial Services",
    category: "Collections",
    description: "Send payment reminders, answer billing questions, and process payments",
    icon: "💵",
    popularityScore: 73,
    personality: ["professional", "respectful", "clear", "helpful"],
    greetingMessage: "Hello! I can help you with payment questions or account inquiries. How can I assist you?",
    sampleKnowledgeBase: "Payments are due on the 1st of each month. We accept credit cards, ACH, and wire transfers. Late fees apply after 15 days.",
    suggestedTools: ["lookup_order", "send_email"],
    sampleConversationFlow: [
      {
        userMessage: "When is my payment due?",
        agentResponse: "I can check your account balance and payment due date. What's your account number?",
        nextSteps: ["Lookup account", "Provide payment info"]
      }
    ],
    voiceSettings: {
      preferredVoice: "neutral",
      speed: 0.9,
      tone: "professional"
    },
    requiredFields: ["company", "payment_methods", "billing_cycle"],
    optionalFields: ["late_fee_policy", "payment_plans"],
    recommendedMetrics: ["payments_collected", "response_rate", "customer_satisfaction"],
    badges: ["Compliance Ready"],
    usedBy: 345,
    rating: 4.4
  },
  
  // Education
  {
    id: "education-admissions",
    name: "Student Admissions Info",
    industry: "Education",
    category: "Admissions",
    description: "Answer admissions questions, schedule campus tours, and guide applicants",
    icon: "📚",
    popularityScore: 68,
    personality: ["welcoming", "informative", "encouraging", "professional"],
    greetingMessage: "Welcome! I can help you with admissions questions or schedule a campus tour. How can I assist you?",
    sampleKnowledgeBase: "Application deadline is January 15th. We require transcripts, test scores, and recommendation letters. Campus tours available Monday-Friday.",
    suggestedTools: ["schedule_appointment", "send_email"],
    sampleConversationFlow: [
      {
        userMessage: "I want to apply",
        agentResponse: "That's wonderful! I can help guide you through the application process. What program are you interested in?",
        nextSteps: ["Provide requirements", "Schedule tour"]
      }
    ],
    voiceSettings: {
      preferredVoice: "female",
      speed: 0.95,
      tone: "welcoming"
    },
    requiredFields: ["school_name", "programs", "admission_requirements"],
    optionalFields: ["financial_aid", "campus_info"],
    recommendedMetrics: ["tours_scheduled", "applications_started", "enrollment_rate"],
    badges: ["Student Friendly"],
    usedBy: 234,
    rating: 4.6
  },
  
  // HR & Recruitment
  {
    id: "hr-interview-scheduling",
    name: "Interview Scheduling Assistant",
    industry: "HR",
    category: "Recruitment",
    description: "Schedule interviews, send reminders, and answer candidate questions",
    icon: "👔",
    popularityScore: 81,
    personality: ["professional", "welcoming", "organized", "helpful"],
    greetingMessage: "Hello! I can help you schedule an interview or answer questions about the position. How can I assist you?",
    sampleKnowledgeBase: "Interviews are typically 30-60 minutes. We offer in-person, video, and phone interviews. Business casual dress code.",
    suggestedTools: ["schedule_appointment", "send_email"],
    sampleConversationFlow: [
      {
        userMessage: "I need to schedule an interview",
        agentResponse: "I'd be happy to help you schedule an interview. What position are you applying for?",
        nextSteps: ["Check availability", "Schedule interview"]
      }
    ],
    voiceSettings: {
      preferredVoice: "neutral",
      speed: 1.0,
      tone: "professional"
    },
    requiredFields: ["company", "position_titles", "interview_types"],
    optionalFields: ["company_info", "benefits"],
    recommendedMetrics: ["interviews_scheduled", "show_rate", "candidate_satisfaction"],
    badges: ["Time Saver"],
    usedBy: 567,
    rating: 4.7
  },
  
  // Legal & Professional Services
  {
    id: "legal-consultation",
    name: "Consultation Scheduling",
    industry: "Legal",
    category: "Scheduling",
    description: "Schedule legal consultations, answer initial questions, and collect client information",
    icon: "⚖️",
    popularityScore: 71,
    personality: ["professional", "confidential", "helpful", "respectful"],
    greetingMessage: "Hello. I can help you schedule a consultation or answer general questions. How can I assist you?",
    sampleKnowledgeBase: "Initial consultations are 30 minutes. We specialize in family law, business law, and estate planning. Confidentiality guaranteed.",
    suggestedTools: ["schedule_appointment", "create_ticket"],
    sampleConversationFlow: [
      {
        userMessage: "I need legal advice",
        agentResponse: "I can help you schedule a consultation with one of our attorneys. What type of legal matter do you need assistance with?",
        nextSteps: ["Qualify matter", "Schedule consultation"]
      }
    ],
    voiceSettings: {
      preferredVoice: "neutral",
      speed: 0.9,
      tone: "professional"
    },
    requiredFields: ["firm_name", "practice_areas", "consultation_fee"],
    optionalFields: ["attorney_bios", "location"],
    recommendedMetrics: ["consultations_scheduled", "client_satisfaction", "case_acceptance_rate"],
    badges: ["Confidential"],
    usedBy: 189,
    rating: 4.5
  }
];

// Helper functions
export function getTemplatesByIndustry(industry: string): AgentTemplate[] {
  return AGENT_TEMPLATES.filter(t => t.industry === industry);
}

export function getTemplatesByCategory(category: string): AgentTemplate[] {
  return AGENT_TEMPLATES.filter(t => t.category === category);
}

export function getPopularTemplates(limit: number = 10): AgentTemplate[] {
  return [...AGENT_TEMPLATES]
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit);
}

export function getTemplateById(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find(t => t.id === id);
}

export function searchTemplates(query: string): AgentTemplate[] {
  const lowerQuery = query.toLowerCase();
  return AGENT_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.industry.toLowerCase().includes(lowerQuery) ||
    t.category.toLowerCase().includes(lowerQuery)
  );
}

// Industry list
export const INDUSTRIES = [
  "Healthcare",
  "E-commerce",
  "Hospitality",
  "Real Estate",
  "Sales",
  "Customer Support",
  "Financial Services",
  "Education",
  "HR",
  "Legal"
];

// Category list
export const CATEGORIES = [
  "Appointment Scheduling",
  "Order Management",
  "Customer Service",
  "Reservations",
  "Bookings",
  "Scheduling",
  "Lead Generation",
  "Support",
  "Collections",
  "Admissions",
  "Recruitment"
];
