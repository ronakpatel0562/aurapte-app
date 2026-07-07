import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/plans";

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const ALLOWED_SCREENSHOT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

// Lets a user submit "I've paid" (reference + optional screenshot) without
// leaving the app, instead of the old mailto: flow. Lands as a pending row
// for an admin to approve at /admin/payments.
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const planId = form.get("planId");
  const monthsRaw = form.get("months");
  const reference = form.get("reference");
  const screenshot = form.get("screenshot");

  if (typeof planId !== "string" || !PLANS[planId as PlanId]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  if (typeof reference !== "string" || reference.trim().length < 3) {
    return NextResponse.json(
      { error: "Enter the payment reference / UTR number" },
      { status: 400 },
    );
  }
  const months = Number(monthsRaw);
  const safeMonths = Number.isFinite(months) && months > 0 && months <= 36 ? months : 1;

  let screenshotPath: string | null = null;
  if (screenshot instanceof File && screenshot.size > 0) {
    if (!ALLOWED_SCREENSHOT_TYPES.has(screenshot.type)) {
      return NextResponse.json(
        { error: "Screenshot must be a PNG, JPEG, or WebP image" },
        { status: 400 },
      );
    }
    if (screenshot.size > MAX_SCREENSHOT_BYTES) {
      return NextResponse.json({ error: "Screenshot must be under 5MB" }, { status: 400 });
    }
    const ext = screenshot.type === "image/png" ? "png" : screenshot.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, screenshot, { contentType: screenshot.type });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    screenshotPath = path;
  }

  const { data, error } = await supabase
    .from("payment_claims")
    .insert({
      user_id: user.id,
      plan_id: planId,
      months: safeMonths,
      reference: reference.trim(),
      screenshot_path: screenshotPath,
    })
    .select("id, status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claim: data });
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("payment_claims")
    .select("id, plan_id, months, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claims: data ?? [] });
}
