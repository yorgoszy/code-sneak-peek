// Shared helper: turn an approved trial request into a real booking session
// so it shows up in /dashboard/online-booking (Επισκόπηση, Κρατήσεις, κ.λπ.)

export async function createTrialBooking(supabase: any, tr: any) {
  if (!tr?.preferred_date || !tr?.preferred_time) {
    console.log("trialBooking: missing date/time, skipping");
    return null;
  }

  const email = String(tr.email || "").trim().toLowerCase();
  if (!email) return null;

  // 1) Find or create the app user
  let userId: string | null = null;
  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existing?.id) {
    userId = existing.id;
  } else {
    const { data: created, error: createErr } = await supabase
      .from("app_users")
      .insert({
        name: tr.name || email,
        email,
        phone: tr.phone || null,
        role: "general",
        category: "general",
        user_status: "active",
        subscription_status: "inactive",
        notes: "Δημιουργήθηκε από αίτημα δοκιμαστικού μαθήματος",
      })
      .select("id")
      .maybeSingle();
    if (createErr) {
      console.error("trialBooking: app_user create failed", createErr);
      return null;
    }
    userId = created?.id ?? null;
  }
  if (!userId) return null;

  // 2) Resolve the section (fallback to a general one if the request has none)
  let sectionId: string | null = tr.section_id ?? null;
  if (!sectionId) {
    const { data: section } = await supabase
      .from("booking_sections")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    sectionId = section?.id ?? null;
  }
  if (!sectionId) {
    console.error("trialBooking: no section available");
    return null;
  }

  const bookingTime = String(tr.preferred_time).slice(0, 8);

  // 3) Avoid duplicates
  const { data: dup } = await supabase
    .from("booking_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("booking_date", tr.preferred_date)
    .eq("booking_time", bookingTime)
    .neq("status", "cancelled")
    .maybeSingle();
  if (dup?.id) return dup.id;

  const { data: booking, error: bookErr } = await supabase
    .from("booking_sessions")
    .insert({
      user_id: userId,
      section_id: sectionId,
      booking_date: tr.preferred_date,
      booking_time: bookingTime,
      booking_type: "gym_visit",
      status: "confirmed",
      notes: `Δοκιμαστικό μάθημα${tr.message ? ` — ${tr.message}` : ""}`,
    })
    .select("id")
    .maybeSingle();

  if (bookErr) {
    console.error("trialBooking: booking insert failed", bookErr);
    return null;
  }
  return booking?.id ?? null;
}
