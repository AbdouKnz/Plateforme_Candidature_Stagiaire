import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as TablerIcons from "@tabler/icons-react";

const iconFallback: Record<string, string> = {
  "IconLaptop": "IconDeviceLaptop",
};

import { IconEdit, IconPlus, IconEye } from "@tabler/icons-react";
import { Role, Module } from "@/models/role-model";
import { useCreateRole, useUpdateRole } from "@/hooks/use-roles";
import { DialogEnum, ModalMode } from "@/models/alert-model";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { usePermissions } from "@/hooks/use-permissions";
import { showSubmittedData } from "@/lib/show-submitted-data";

const formSchema = z.object({
  role_name: z
    .string()
    .nonempty({ message: "Role Name is required." })
    .min(3, { message: "Role must be at least 3 characters long." }),
  role_permissions: z.record(z.string(), z.string()),
});

type FormData = z.infer<typeof formSchema>;

interface RolesActionModalProps {
  role?: Role;
  modules: Module[];
  open: boolean;
  onClose: () => void;
  mode?: ModalMode;
  switchToEdit?: () => void;
}

export function RolesActionModal({
  role,
  modules,
  open,
  onClose,
  mode,
  switchToEdit,
}: RolesActionModalProps) {
  const { t } = useTranslation();
  const isEdit = mode === DialogEnum.EDIT;
  const isView = mode === DialogEnum.VIEW;
  const isAdd = mode === DialogEnum.ADD;

  const { modulePermissions } = usePermissions();
  const isSuperAdmin = role?.role_id === 1;
  const canUpdateRole = modulePermissions.roles.canUpdate;

  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole();

  const permissionModules = modules;

  const actions = ["view", "create", "edit", "delete"];
  const handleClose = () => {
    form.reset();
    onClose();
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role_name: role?.role_name || "",
      role_permissions: role?.role_permissions || {},
    },
  });

  // Single source of truth for getting permissions
  const getModulePermissions = (moduleName: string): string => {
    return form.watch("role_permissions")[moduleName] || "0000";
  };

  // Single function to set permissions
  const setModulePermissions = (moduleName: string, permissions: string) => {
    form.setValue("role_permissions", {
      ...form.getValues("role_permissions"),
      [moduleName]: permissions,
    });
  };

  // Build permission string from enabled permissions
  const buildPermissionString = (
    module: Module,
    shouldEnable: boolean,
  ): string => {
    let permissionString = "0000";

    if (shouldEnable) {
      actions.forEach((action, index) => {
        if (module.enabled_permissions.includes(action)) {
          permissionString =
            permissionString.substring(0, index) +
            "1" +
            permissionString.substring(index + 1);
        }
      });
    }

    return permissionString;
  };

  // Check if specific permission is checked
  const isPermissionChecked = (moduleName: string, action: string): boolean => {
    if (moduleName === "dashboard" && action === "view") {
      return true;
    }
    const perms = getModulePermissions(moduleName);
    const index = actions.indexOf(action);
    return perms[index] === "1";
  };

  // Check if all permissions for a module are checked
  const areAllPermissionsChecked = (moduleName: string): boolean => {
    const module = permissionModules.find((m) => m.module_name === moduleName);
    if (!module) return false;

    const perms = getModulePermissions(moduleName);

    return actions.every((action, index) => {
      if (module.enabled_permissions.includes(action)) {
        return perms[index] === "1";
      }
      return true;
    });
  };

  // Handle single checkbox change
  const handlePermissionChange = (
    moduleName: string,
    action: string,
    checked: boolean,
  ) => {
    if (isView) return;

    const current = getModulePermissions(moduleName);
    const index = actions.indexOf(action);

    // Convert the "0000" string to an array for easier index manipulation
    let updatedArray = current.split("");
    updatedArray[index] = checked ? "1" : "0";

    // Rule 1: If checking 'create', 'edit', or 'delete', auto-check 'view' (index 0)
    if (checked && action !== "view") {
      updatedArray[0] = "1";
    }

    // Rule 2: If unchecking 'view', auto-uncheck everything else
    if (!checked && action === "view") {
      updatedArray = ["0", "0", "0", "0"];
    }

    setModulePermissions(moduleName, updatedArray.join(""));
  };
  // Toggle all permissions for one module
  const handleToggleAllPermissions = (moduleName: string, checked: boolean) => {
    if (isView) return;

    const module = permissionModules.find((m) => m.module_name === moduleName);
    if (!module) return;

    const permissionString = buildPermissionString(module, checked);
    setModulePermissions(moduleName, permissionString);
  };

  // Toggle all permissions for ALL modules
  const handleToggleAllModules = (checked: boolean) => {
    if (isView) return;

    const allPermissions: Record<string, string> = {};

    permissionModules.forEach((module) => {
      allPermissions[module.module_name] = buildPermissionString(
        module,
        checked,
      );
    });

    form.setValue("role_permissions", allPermissions);
  };

  // Check if ALL permissions across ALL modules are checked
  const areAllModulesFullyChecked = (): boolean => {
    return permissionModules.every((module) => {
      const perms =
        form.watch("role_permissions")[module.module_name] || "0000";

      // Check if all enabled permissions for this module are checked
      return actions.every((action, index) => {
        if (module.enabled_permissions.includes(action)) {
          return perms[index] === "1";
        }
        return true; // Ignore disabled permissions
      });
    });
  };

  function onSubmit(data: FormData) {
    const allPermissions = permissionModules.reduce(
      (acc, mod) => {
        let permission = data.role_permissions?.[mod.module_name] || "0000";

        if (mod.module_name === "dashboard") {
          permission = "1" + permission.substring(1);
        }

        acc[mod.module_name] = permission;
        return acc;
      },
      {} as Record<string, string>,
    );

    const payload = {
      ...data,
      role_permissions: allPermissions,
    };

    if (isEdit && role) {
      updateRole(
        { id: role.role_id, data: payload },
        { onSuccess: handleClose },
      );
    } else if (isAdd) {
      createRole(payload, { onSuccess: handleClose });
    }
    //showSubmittedData(payload);
  }
  useEffect(() => {
    if (role) {
      // If a role is passed in (Edit/View mode), reset the form to its values
      form.reset({
        role_name: role.role_name || "",
        role_permissions: role.role_permissions || {},
      });
    } else {
      // If no role is passed (Add mode), clear the form entirely
      form.reset({
        role_name: "",
        role_permissions: {},
      });
    }
  }, [role, form]);

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onClose();
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[70vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              {isEdit ? (
                <IconEdit className="size-5" />
              ) : isView ? (
                <IconEye className="size-5" />
              ) : (
                <IconPlus className="size-5" />
              )}
            </div>

            {isEdit
              ? t("edit_role")
              : isView
                ? t("view_role")
                : t("add_new_role")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="role-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="role_name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right">
                    Role Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholder_role_name")}
                      className="col-span-4"
                      autoComplete="off"
                      disabled={isView}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        const capitalized =
                          value.charAt(0).toUpperCase() + value.slice(1);
                        field.onChange(capitalized);
                      }}
                    />
                  </FormControl>

                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role_permissions"
              render={() => (
                <FormItem>
                  <FormLabel>{t("permissions")}</FormLabel>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-32">{t("module")}</TableHead>
                          <TableHead className="text-center w-20">
                            View
                          </TableHead>
                          <TableHead className="text-center w-20">
                            Create
                          </TableHead>
                          <TableHead className="text-center w-20">
                            Edit
                          </TableHead>
                          <TableHead className="text-center w-20">
                            Delete
                          </TableHead>
                          <TableHead className="text-center w-20">
                            All
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {permissionModules.map((module) => (
                          <TableRow key={module.module_name}>
                            <TableCell className="font-medium capitalize flex items-center gap-2">
                              {(() => {
                                const iconName = iconFallback[module.module_icon] || module.module_icon;
                                const Icon = (TablerIcons as any)[iconName];
                                return Icon ? (
                                  <Icon className="w-4 h-4 text-muted-foreground" />
                                ) : null;
                              })()}
                              {module.module_name}
                            </TableCell>

                            {actions.map((action) => {
                              return (
                                <TableCell key={action} className="text-center">
                                  {module.enabled_permissions.includes(
                                    action,
                                  ) ? (
                                    <Checkbox
                                      checked={isPermissionChecked(
                                        module.module_name,
                                        action,
                                      )}
                                      onCheckedChange={(checked) => {
                                        handlePermissionChange(
                                          module.module_name,
                                          action,
                                          checked as boolean,
                                        );
                                      }}
                                    />
                                  ) : (
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                              );
                            })}

                            <TableCell className="text-center">
                              {module.module_name !== "dashboard" && (
                                <Switch
                                  checked={areAllPermissionsChecked(
                                    module.module_name,
                                  )}
                                  onCheckedChange={(checked) => {
                                    handleToggleAllPermissions(
                                      module.module_name,
                                      checked,
                                    );
                                  }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}

                        <TableRow>
                          <TableCell className="capitalize flex items-center gap-2">
                            <Switch
                              checked={areAllModulesFullyChecked()}
                              onCheckedChange={(checked) => {
                                handleToggleAllModules(checked);
                              }}
                            />
                            Select All
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                {t("cancel")}
              </Button>
              {isView && canUpdateRole && !isSuperAdmin && (
                <Button
                  form=""
                  onClick={() => {
                    if (switchToEdit) switchToEdit();
                  }}
                >
                  {t("edit")}
                </Button>
              )}

              {!isView && (
                <Button
                  type="submit"
                  form="role-form"
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? (
                    <>
                      <Spinner variant="circle" />
                      Submitting ...
                    </>
                  ) : (
                    t("submit")
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
