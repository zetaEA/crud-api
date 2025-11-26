from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token


urlpatterns = [
    path('api/', include('posts.urls')),
    path('api/users/', include('users.urls')),
    path('api/messaging/', include('messaging.urls')),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    path('admin/', admin.site.urls),
]
