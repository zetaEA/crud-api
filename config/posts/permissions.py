from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission для редактирования только своих постов.
    Все могут читать, только автор может редактировать/удалять.
    """

    def has_object_permission(self, request, view, obj):
        # Все могут читать
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Только автор может редактировать/удалять
        return obj.author == request.user
