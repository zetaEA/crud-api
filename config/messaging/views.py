from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from .permissions import IsParticipant, IsMessageSender


class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet для управления диалогами"""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated, IsParticipant]
    
    def get_queryset(self):
        # Показываем только диалоги, в которых участвует текущий пользователь
        return Conversation.objects.filter(participants=self.request.user)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def get_or_create(self, request):
        """Получить или создать диалог с пользователем"""
        other_user_id = request.data.get('user_id')
        
        if not other_user_id:
            return Response({'error': 'user_id is required'}, status=400)
        
        other_user = get_object_or_404(User, id=other_user_id)
        
        # Ищем существующий диалог
        conversations = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=other_user
        )
        
        if conversations.exists():
            conversation = conversations.first()
        else:
            # Создаём новый диалог
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, other_user)
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet для управления сообщениями"""
    serializer_class = MessageSerializer
    # Для создания/чтения достаточно быть аутентифицированным и участником разговора
    # Для удаления/редактирования дополнительно проверяем, что пользователь — отправитель
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id') or self.kwargs.get('conversation_pk') or self.kwargs.get('conversation')
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        # Проверяем что пользователь - участник
        if self.request.user not in conversation.participants.all():
            return Message.objects.none()
        
        return conversation.messages.all()
    
    def perform_create(self, serializer):
        conversation_id = self.kwargs.get('conversation_id') or self.kwargs.get('conversation_pk') or self.kwargs.get('conversation')
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        # Проверяем что пользователь - участник
        if self.request.user not in conversation.participants.all():
            raise PermissionDenied('Not a participant of this conversation')
        
        serializer.save(sender=self.request.user, conversation=conversation)

    def perform_destroy(self, instance):
        # Только отправитель может удалить сообщение
        if instance.sender != self.request.user:
            raise PermissionDenied('Only sender can delete this message')
        return super().perform_destroy(instance)
