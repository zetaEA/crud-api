import json
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token

from .models import Conversation, Message


class ConversationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # parse conversation_id from URL route kwargs
        self.conversation_id = self.scope['url_route']['kwargs'].get('conversation_id')
        self.group_name = f"conversation_{self.conversation_id}"

        # Try authenticate via token query param: ?token=TOKEN
        query_string = self.scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token_key = params.get('token', [None])[0]
        self.user = AnonymousUser()
        if token_key:
            try:
                token = Token.objects.get(key=token_key)
                self.user = token.user
            except Token.DoesNotExist:
                self.user = AnonymousUser()

        # Check that user is participant
        try:
            conv = await self._get_conversation()
        except Conversation.DoesNotExist:
            await self.close(code=4001)
            return

        if self.user.is_anonymous or self.user not in conv.participants.all():
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        data = json.loads(text_data)
        text = data.get('text')
        if not text:
            return

        # Save message to DB
        conv = await self._get_conversation()
        message = Message.objects.create(conversation=conv, sender=self.user, text=text)

        # Broadcast to group
        payload = {
            'id': message.id,
            'conversation': conv.id,
            'sender_id': message.sender.id,
            'sender_username': message.sender.username,
            'text': message.text,
            'created_at': message.created_at.isoformat(),
        }
        await self.channel_layer.group_send(self.group_name, {
            'type': 'chat.message',
            'message': payload,
        })

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps(message))

    async def _get_conversation(self):
        conv = Conversation.objects.get(id=self.conversation_id)
        return conv
