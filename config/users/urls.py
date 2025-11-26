from django.urls import path
from .views import RegisterUserView, CurrentUserView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
]

