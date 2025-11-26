from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Post
        fields = ('id', 'author', 'title', 'content', 'created_at')
        read_only_fields = ('author', 'created_at')
