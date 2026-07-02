from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from .models import Workspace, WorkspaceMembership
from .views import _require_auth


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def workspaces(request):
    user_id, err = _require_auth(request)
    if err:
        return err
        
    if request.method == 'GET':
        memberships = WorkspaceMembership.objects.filter(user_id=user_id).select_related('workspace')
        
        # Auto-provision a default workspace if user has no memberships
        if not memberships.exists():
            default_ws = Workspace.objects.create(name="Personal Workspace")
            WorkspaceMembership.objects.create(user_id=user_id, workspace=default_ws, role='owner')
            memberships = WorkspaceMembership.objects.filter(user_id=user_id).select_related('workspace')
        
        data = [
            {
                'id': m.workspace.id,
                'name': m.workspace.name,
                'role': m.role,
                'created_at': m.workspace.created_at
            }
            for m in memberships
        ]
        return Response(data)
        
    elif request.method == 'POST':
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Workspace name is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        workspace = Workspace.objects.create(name=name)
        WorkspaceMembership.objects.create(user_id=user_id, workspace=workspace, role='owner')
        
        return Response({
            'id': workspace.id,
            'name': workspace.name,
            'role': 'owner',
            'created_at': workspace.created_at
        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def invite_to_workspace(request, workspace_id):
    user_id, err = _require_auth(request)
    if err:
        return err
        
    try:
        membership = WorkspaceMembership.objects.get(user_id=user_id, workspace_id=workspace_id, role='owner')
    except WorkspaceMembership.DoesNotExist:
        return Response({'error': 'You do not have permission to invite users to this workspace'}, status=status.HTTP_403_FORBIDDEN)
        
    email = request.data.get('email')
    role = request.data.get('role', 'editor')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    # In a real app, we would create an invitation token and send a link.
    # For now, we simulate sending the email using Django's send_mail.
    try:
        send_mail(
            subject=f'Invitation to join workspace {membership.workspace.name}',
            message=f'You have been invited to join the workspace {membership.workspace.name} as an {role}.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'message': f'Invitation sent to {email}'})
    except Exception as e:
        return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

