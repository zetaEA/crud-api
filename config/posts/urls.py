from rest_framework import routers
from .views import PostViewSet
from django.urls import path, include

router = routers.DefaultRouter()
router.register(r'posts', PostViewSet)

urlpatterns = [
    path('', include(router.urls)),
]