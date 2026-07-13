import { ModuleEnum } from "@/models/module-model";
import { useAuthStore } from "@/stores/auth-store";
import {
  hasPermission,
  getModulePermissions,
  PermissionType,
  type Permissions,
} from "@/lib/permissions";

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const permissions: Permissions | undefined = user?.permissions;

  // Standard helpers
  const helpers = {
    hasPermission: (module: string, action: PermissionType) =>
      hasPermission(permissions, module, action),

    getPermissions: (module: string) =>
      getModulePermissions(permissions, module),

    canAccess: (module: string) =>
      hasPermission(permissions, module, PermissionType.VIEW),

    canCreate: (module: string) =>
      hasPermission(permissions, module, PermissionType.CREATE),

    canUpdate: (module: string) =>
      hasPermission(permissions, module, PermissionType.EDIT),

    canDelete: (module: string) =>
      hasPermission(permissions, module, PermissionType.DELETE),
  };

  const modulePermissions = {
    roles: {
      canView: helpers.canAccess(ModuleEnum.Roles),
      canCreate: helpers.canCreate(ModuleEnum.Roles),
      canUpdate: helpers.canUpdate(ModuleEnum.Roles),
      canDelete: helpers.canDelete(ModuleEnum.Roles),
    },
    users: {
      canView: helpers.canAccess(ModuleEnum.Users),
      canCreate: helpers.canCreate(ModuleEnum.Users),
      canUpdate: helpers.canUpdate(ModuleEnum.Users),
      canDelete: helpers.canDelete(ModuleEnum.Users),
    },
    cashiers: {
      canView: helpers.canAccess("cashiers"),
      canCreate: helpers.canCreate("cashiers"),
      canUpdate: helpers.canUpdate("cashiers"),
      canDelete: helpers.canDelete("cashiers"),
    },
    audits: {
      canView: helpers.canAccess(ModuleEnum.Audits),
      canCreate: helpers.canCreate(ModuleEnum.Audits),
      canUpdate: helpers.canUpdate(ModuleEnum.Audits),
      canDelete: helpers.canDelete(ModuleEnum.Audits),
    },
    events: {
      canView: helpers.canAccess("events"),
      canCreate: helpers.canCreate("events"),
      canUpdate: helpers.canUpdate("events"),
      canDelete: helpers.canDelete("events"),
    },
    subEvents: {
      canView: helpers.canAccess("events"),
      canCreate: helpers.canCreate("events"),
      canUpdate: helpers.canUpdate("events"),
      canDelete: helpers.canDelete("events"),
    },
    subscribers: {
      canView: helpers.canAccess("subscribers"),
      canCreate: helpers.canCreate("subscribers"),
      canUpdate: helpers.canUpdate("subscribers"),
      canDelete: helpers.canDelete("subscribers"),
    },
    vouchers: {
      canView: helpers.canAccess("vouchers"),
      canCreate: helpers.canCreate("vouchers"),
      canUpdate: helpers.canUpdate("vouchers"),
      canDelete: helpers.canDelete("vouchers"),
    },
    mouvements: {
      canView: helpers.canAccess("mouvements"),
      canCreate: helpers.canCreate("mouvements"),
      canUpdate: helpers.canUpdate("mouvements"),
      canDelete: helpers.canDelete("mouvements"),
    },
    gates: {
      canView: helpers.canAccess("gates"),
      canCreate: helpers.canCreate("gates"),
      canUpdate: helpers.canUpdate("gates"),
      canDelete: helpers.canDelete("gates"),
    },
    zones: {
      canView: helpers.canAccess("zones"),
      canCreate: helpers.canCreate("zones"),
      canUpdate: helpers.canUpdate("zones"),
      canDelete: helpers.canDelete("zones"),
    },
    alarms: {
      canView: helpers.canAccess("alarms"),
      canCreate: helpers.canCreate("alarms"),
      canUpdate: helpers.canUpdate("alarms"),
      canDelete: helpers.canDelete("alarms"),
    },
    shifts: {
      canView: helpers.canAccess("shifts"),
      canCreate: helpers.canCreate("shifts"),
      canUpdate: helpers.canUpdate("shifts"),
      canDelete: helpers.canDelete("shifts"),
    },
        payments: {
      canView: helpers.canAccess("payments"),
      canCreate: helpers.canCreate("payments"),
      canUpdate: helpers.canUpdate("payments"),
      canDelete: helpers.canDelete("payments"),
    },
    degrees: {
      canView: helpers.canAccess(ModuleEnum.Degrees),
      canCreate: helpers.canCreate(ModuleEnum.Degrees),
      canUpdate: helpers.canUpdate(ModuleEnum.Degrees),
      canDelete: helpers.canDelete(ModuleEnum.Degrees),
    },
    technologies: {
      canView: helpers.canAccess(ModuleEnum.Technologies),
      canCreate: helpers.canCreate(ModuleEnum.Technologies),
      canUpdate: helpers.canUpdate(ModuleEnum.Technologies),
      canDelete: helpers.canDelete(ModuleEnum.Technologies),
    },
    profiles: {
      canView: helpers.canAccess(ModuleEnum.Profiles),
      canCreate: helpers.canCreate(ModuleEnum.Profiles),
      canUpdate: helpers.canUpdate(ModuleEnum.Profiles),
      canDelete: helpers.canDelete(ModuleEnum.Profiles),
    },
    durations: {
      canView: helpers.canAccess(ModuleEnum.Durations),
      canCreate: helpers.canCreate(ModuleEnum.Durations),
      canUpdate: helpers.canUpdate(ModuleEnum.Durations),
      canDelete: helpers.canDelete(ModuleEnum.Durations),
    },
    types: {
      canView: helpers.canAccess(ModuleEnum.Types),
      canCreate: helpers.canCreate(ModuleEnum.Types),
      canUpdate: helpers.canUpdate(ModuleEnum.Types),
      canDelete: helpers.canDelete(ModuleEnum.Types),
    },
    subjects: {
      canView: helpers.canAccess(ModuleEnum.Subjects),
      canCreate: helpers.canCreate(ModuleEnum.Subjects),
      canUpdate: helpers.canUpdate(ModuleEnum.Subjects),
      canDelete: helpers.canDelete(ModuleEnum.Subjects),
    },
    candidatures: {
      canView: helpers.canAccess(ModuleEnum.Candidatures),
      canCreate: helpers.canCreate(ModuleEnum.Candidatures),
      canUpdate: helpers.canUpdate(ModuleEnum.Candidatures),
      canDelete: helpers.canDelete(ModuleEnum.Candidatures),
    },
    email_templates: {
      canView: helpers.canAccess(ModuleEnum.EmailTemplates),
      canCreate: helpers.canCreate(ModuleEnum.EmailTemplates),
      canUpdate: helpers.canUpdate(ModuleEnum.EmailTemplates),
      canDelete: helpers.canDelete(ModuleEnum.EmailTemplates),
    },
    settings: {
      canView: helpers.canAccess(ModuleEnum.Settings),
      canCreate: helpers.canCreate(ModuleEnum.Settings),
      canUpdate: helpers.canUpdate(ModuleEnum.Settings),
      canDelete: helpers.canDelete(ModuleEnum.Settings),
    },
    frontOfficeMessages: {
      canView: helpers.canAccess(ModuleEnum.FrontOfficeMessages),
      canCreate: helpers.canCreate(ModuleEnum.FrontOfficeMessages),
      canUpdate: helpers.canUpdate(ModuleEnum.FrontOfficeMessages),
      canDelete: helpers.canDelete(ModuleEnum.FrontOfficeMessages),
    },
     pos: {
      canView: helpers.canAccess("pos"),
      canCreate: helpers.canCreate("pos"),
      canUpdate: helpers.canUpdate("pos"),
      canDelete: helpers.canDelete("pos"),
    },
    park: {
      canView: helpers.canAccess("park"),
      canCreate: helpers.canCreate("park"),
      canUpdate: helpers.canUpdate("park"),
      canDelete: helpers.canDelete("park"),
    },
    zatpark:{
      canView: helpers.canAccess("zatpark"),
      canCreate: helpers.canCreate("zatpark"),
      canUpdate: helpers.canUpdate("zatpark"),
      canDelete: helpers.canDelete("zatpark"),
    },
    

  };

  return {
    permissions,
    ...helpers,
    modulePermissions,
  };
}
