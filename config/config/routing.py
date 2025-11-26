from django.urls import re_path
from messaging import consumers

websocket_urlpatterns = [
    # WebSocket endpoint for a conversation
    re_path(r"ws/messaging/conversations/(?P<conversation_id>\d+)/$", consumers.ConversationConsumer.as_asgi()),
]
