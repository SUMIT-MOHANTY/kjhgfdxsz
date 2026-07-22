from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import BuildUserAuthenticationUiComponents

class BuildUserAuthenticationUiComponentsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        items = BuildUserAuthenticationUiComponents.objects.all()
        data = [{"id": i.id, "title": i.title, "status": i.status} for i in items]
        return Response({"success": True, "task_id": "TODO-05", "count": len(data), "data": data})

    def post(self, request):
        title = request.data.get('title')
        if not title:
            return Response({"error": "title is required"}, status=status.HTTP_400_BAD_REQUEST)
        item = BuildUserAuthenticationUiComponents.objects.create(title=title)
        return Response({"success": True, "id": item.id, "title": item.title}, status=status.HTTP_201_CREATED)
