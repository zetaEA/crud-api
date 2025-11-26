from rest_framework import permissions


class IsParticipant(permissions.BasePermission):
    """Только участник диалога может читать/писать сообщения"""
    
    def has_object_permission(self, request, view, obj):
        return request.user in obj.participants.all()


class IsMessageSender(permissions.BasePermission):
    """Только отправитель может удалить сообщение"""
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user in obj.conversation.participants.all()
        return obj.sender == request.user
