from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny  # Add this
from .services import ChatbotService

class ChatbotView(APIView):
    permission_classes = [AllowAny]  # Add this for testing
    
    def post(self, request):
        user_message = request.data.get('message', '')
        conversation_id = request.data.get('conversation_id')
        
        if not user_message:
            return Response(
                {'error': 'Message is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            service = ChatbotService()
            response = service.process_message(
                message=user_message,
                conversation_id=conversation_id,
                user_id=request.user.id if request.user.is_authenticated else None
            )
            
            return Response(response, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )