export type PermissionLevel = '0' | '1';
export type PermissionString = string; // e.g., "1111", "1011", "0000"

export enum PermissionType {
  VIEW = 0,    // first digit
  CREATE = 1,  // second digit
  EDIT = 2,  // third digit
  DELETE = 3,  // fourth digit
}

export type Permissions = Record<string, PermissionString>;

/**
 * Check if user has a specific permission for a module
 * @param permissions - User's permissions object
 * @param module - Module name (e.g., 'users', 'roles')
 * @param action - Permission type (VIEW, CREATE, UPDATE, DELETE)
 * @returns boolean
 */
export function hasPermission(
  permissions: Permissions | undefined,
  module: string,
  action: PermissionType
): boolean {
  if (!permissions || !permissions[module]) return false;

  const modulePermissions = permissions[module];
  if (modulePermissions.length <= action) return false;

  return modulePermissions[action] === '1';
}

/**
 * Check if user can view a module (first digit = VIEW)
 */
export function canAccessModule(
  permissions: Permissions | undefined,
  module: string
): boolean {
  return hasPermission(permissions, module, PermissionType.VIEW);
}

/**
 * Check if user can perform any action on a module
 */
export function hasAnyPermission(
  permissions: Permissions | undefined,
  module: string
): boolean {
  if (!permissions || !permissions[module]) return false;
  return permissions[module].includes('1');
}

/**
 * Get all permissions for a module
 */
export function getModulePermissions(
  permissions: Permissions | undefined,
  module: string
) {
  if (!permissions || !permissions[module]) {
    return { view: false, create: false, update: false, delete: false };
  }

  const perms = permissions[module];
  return {
    view: perms[0] === '1',
    create: perms[1] === '1',
    edit: perms[2] === '1',
    delete: perms[3] === '1',
  };
}
