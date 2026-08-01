export type Role = 'ADMIN' | 'VERIFIER' | 'CONTRIBUTOR' | 'ENGINEER' | 'VIEWER';

export type Permission =
  | 'solution:view'
  | 'solution:create'
  | 'solution:edit'
  | 'solution:verify'
  | 'solution:delete'
  | 'problem:view'
  | 'problem:create'
  | 'problem:edit'
  | 'problem:delete'
  | 'organization:view'
  | 'organization:manage'
  | 'user:manage'
  | 'audit:view';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'solution:view',
    'solution:create',
    'solution:edit',
    'solution:verify',
    'solution:delete',
    'problem:view',
    'problem:create',
    'problem:edit',
    'problem:delete',
    'organization:view',
    'organization:manage',
    'user:manage',
    'audit:view',
  ],
  VERIFIER: [
    'solution:view',
    'solution:create',
    'solution:edit',
    'solution:verify',
    'problem:view',
    'problem:create',
    'problem:edit',
    'organization:view',
    'audit:view',
  ],
  CONTRIBUTOR: [
    'solution:view',
    'solution:create',
    'solution:edit',
    'problem:view',
    'problem:create',
    'problem:edit',
    'organization:view',
  ],
  ENGINEER: [
    'solution:view',
    'problem:view',
    'problem:create',
    'organization:view',
  ],
  VIEWER: [
    'solution:view',
    'problem:view',
    'organization:view',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function canVerifySolution(role: Role): boolean {
  return hasPermission(role, 'solution:verify');
}

export function canManageUsers(role: Role): boolean {
  return hasPermission(role, 'user:manage');
}

export function canCreateSolution(role: Role): boolean {
  return hasPermission(role, 'solution:create');
}
