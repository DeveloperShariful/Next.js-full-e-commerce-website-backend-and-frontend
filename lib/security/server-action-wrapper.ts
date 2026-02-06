// File: lib/server-action-wrapper.ts

import { security } from "@/lib/security/security";
import { auditService } from "@/lib/services/audit-service";
import { ZodSchema } from "zod";

type ActionOptions<T> = {
  actionName: string;
  auditEntity?: string; 
  idExtractor?: (data: any) => string; 
  schema?: ZodSchema<T>; 
  role?: "ADMIN" | "USER" | "PUBLIC"; 
  rateLimitKey?: string; 
};

export async function secureAction<Input, Output>(
  input: Input,
  options: ActionOptions<Input>,
  handler: (validatedInput: Input, user: any) => Promise<{ success: boolean; data?: any; error?: string, oldData?: any }>
) {
  const { actionName, auditEntity, idExtractor, schema, role = "ADMIN", rateLimitKey } = options;
  let user: any = null;

  try {
    if (role === "ADMIN") {
      user = await security.assertAdmin();
    } else if (role === "USER") {
      user = await security.getCurrentUser();
      if (!user) throw new Error("UNAUTHORIZED");
    }

    if (rateLimitKey && user) {
      security.checkRateLimit(`${rateLimitKey}_${user.id}`);
    }
    let safeInput = input;
    if (schema) {
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
      }
      safeInput = parsed.data;
    }
    const result = await handler(safeInput, user);

    if (!result.success) {
      throw new Error(result.error || "Action failed");
    }
    if (auditEntity && user) {

      const entityId = idExtractor 
        ? idExtractor(result.data || safeInput) 
        : (safeInput as any)?.id || (result.data as any)?.id || "UNKNOWN";
      if (result.oldData) {
        await auditService.log({
          userId: user.id,
          action: actionName,
          entity: auditEntity,
          entityId: entityId,
          oldData: result.oldData,
          newData: result.data 
        });
      } else {
        await auditService.log({
          userId: user.id,
          action: actionName,
          entity: auditEntity,
          entityId: entityId,
          newData: result.data
        });
      }
    }

    return { success: true, data: result.data, message: result.data?.message };

  } catch (error: any) {
    console.error(`[ACTION_FAIL] ${actionName}:`, error.message);
    await auditService.systemLog("ERROR", actionName, error.message, { input });

    return { 
      success: false, 
      error: error.message || "Internal System Error" 
    };
  }
}