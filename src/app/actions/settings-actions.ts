"use server";

export type ContractorProfile = {
  company_name: string;
  license_number: string;
  phone: string;
  email: string;
};

function serializeError(e: unknown): string {
  if (e instanceof Error) {
    return JSON.stringify({ message: e.message, name: e.name, stack: e.stack });
  }
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export async function getContractorProfileAction(): Promise<
  { ok: true; profile: ContractorProfile | null } | { ok: false; error: string }
> {
  try {
    const { getSupabaseClient } = await import("@/lib/server/supabase");
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("contractor_profile")
      .select("company_name, license_number, phone, email")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return { ok: true, profile: data };
  } catch (e) {
    console.error("[Profile action full error]:", serializeError(e));
    return { ok: false, error: "Could not load contractor profile." };
  }
}

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";

export async function saveContractorProfileAction(
  profile: ContractorProfile,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { getSupabaseClient } = await import("@/lib/server/supabase");
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("contractor_profile")
      .upsert(
        {
          id: PROFILE_ID,
          company_name: profile.company_name,
          license_number: profile.license_number,
          phone: profile.phone,
          email: profile.email,
        },
        { onConflict: "id" },
      );
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.error("[Profile action full error]:", serializeError(e));
    return { ok: false, error: "Could not save contractor profile." };
  }
}
