try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("Warning: OpenAI package not installed.")

from django.conf import settings
from typing import Dict, Optional
import json

class ChatbotService:
    def __init__(self):
        self.inventory_service = None
        self.openai_client = None
        
        # Initialize OpenAI client if available
        if OPENAI_AVAILABLE and settings.OPENAI_API_KEY:
            try:
                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                print(f"Error initializing OpenAI client: {e}")
        
        # Initialize inventory service
        try:
            from apps.inventory.services import InventoryService
            self.inventory_service = InventoryService()
        except ImportError as e:
            print(f"Error importing InventoryService: {e}")
    
    def process_message(self, message: str, conversation_id: Optional[str] = None, user_id: Optional[int] = None) -> Dict:
        """Process user message and generate AI response"""
        
        # Get context from ERP
        context = self._get_erp_context()
        
        # Check if we can use OpenAI
        if not self.openai_client:
            # Fallback to rule-based responses
            return self._rule_based_response(message, context)
        
        # Build system prompt
        system_prompt = f"""
        You are an AI assistant for a comprehensive ERP system. You can help with:
        - Inventory management (check stock, products, low stock alerts)
        - Sales information (recent sales, revenue)
        - Customer queries
        - General ERP operations
        
        Current ERP Context:
        {json.dumps(context, indent=2)}
        
        Provide helpful, accurate responses based on the ERP data. Be concise and friendly.
        """
        
        try:
            # Call OpenAI API (new format)
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",  # Use gpt-3.5-turbo for cost efficiency, or gpt-4 if available
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            ai_message = response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI API Error: {e}")
            # Fallback to rule-based response
            return self._rule_based_response(message, context)
        
        return {
            'message': ai_message,
            'conversation_id': conversation_id,
            'context': context
        }
    
    def _rule_based_response(self, message: str, context: Dict) -> Dict:
        """Provide rule-based responses when OpenAI is not available"""
        message_lower = message.lower()
        
        # Stock-related queries
        if any(word in message_lower for word in ['stock', 'inventory', 'products']):
            return {
                'message': f"Current inventory status:\n- Total items: {context.get('total_items', 0)}\n- Low stock items: {context.get('low_stock_products', 0)}\n- Total inventory value: ${context.get('total_inventory_value', 0):,.2f}\n\nYou can view detailed inventory information in the Inventory section.",
                'conversation_id': None,
                'context': context
            }
        
        # Low stock queries
        if any(word in message_lower for word in ['low stock', 'out of stock', 'restock']):
            low_stock_count = context.get('low_stock_products', 0)
            return {
                'message': f"There are currently {low_stock_count} products with low stock levels. Please check the Inventory section for details and consider restocking these items.",
                'conversation_id': None,
                'context': context
            }
        
        # Sales queries
        if any(word in message_lower for word in ['sales', 'revenue', 'income']):
            return {
                'message': "Sales information is being processed. Please check the Sales section for detailed reports and analytics.",
                'conversation_id': None,
                'context': context
            }
        
        # Default response
        return {
            'message': f"I understand you're asking about '{message}'. I can help you with:\n- Inventory and stock levels\n- Product information\n- Sales data\n- Customer information\n\nPlease be more specific, or check the relevant section in the ERP system.",
            'conversation_id': None,
            'context': context
        }
    
    def _get_erp_context(self) -> Dict:
        """Get current ERP system context"""
        try:
            if self.inventory_service:
                low_stock = self.inventory_service.get_low_stock_products()
                inventory_value = self.inventory_service.get_inventory_value()
                
                return {
                    'low_stock_products': len(low_stock),
                    'total_inventory_value': float(inventory_value.get('total_value', 0)),
                    'total_items': inventory_value.get('total_items', 0)
                }
        except Exception as e:
            print(f"Error getting ERP context: {e}")
        
        return {
            'low_stock_products': 0,
            'total_inventory_value': 0,
            'total_items': 0
        }