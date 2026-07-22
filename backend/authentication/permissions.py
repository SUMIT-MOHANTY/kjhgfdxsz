from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsLibrarian(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'librarian']

class IsMember(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'librarian', 'member']

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return obj == request.user

class RoleBasedPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        required_permissions = getattr(view, 'required_permissions', [])
        user_role = request.user.role
        
        role_permissions = {
            'admin': ['create_user', 'delete_user', 'manage_books', 'manage_loans', 'view_reports'],
            'librarian': ['manage_books', 'manage_loans', 'view_reports'],
            'member': ['view_books', 'borrow_books']
        }
        
        user_permissions = role_permissions.get(user_role, [])
        return all(perm in user_permissions for perm in required_permissions)