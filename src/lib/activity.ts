import { supabase } from "@/integrations/supabase/client";

export type ActivityAction =
  | "login" | "logout" | "signup"
  | "task_created" | "task_updated" | "task_deleted" | "task_status_changed"
  | "user_activated" | "user_deactivated" | "role_changed";

export async function logActivity(
  action: ActivityAction,
  entity?: { type?: string; id?: string },
  metadata: Record<string, unknown> = {},
) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("activity_logs").insert({
      user_id: data.user.id,
      action,
      entity_type: entity?.type ?? null,
      entity_id: entity?.id ?? null,
      metadata: metadata as any,
    });
  } catch {}
}
