import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id, otp_code } = req.body;

  if (!user_id || !otp_code || otp_code.length !== 6) {
    return res.status(400).json({ error: "Invalid request parameters." });
  }
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Recupera l'hash e la data di scadenza dal database
    const { data: otpData, error: dbError } = await supabase
      .from("otp")
      .select("otp_hash, expires_at")
      .eq("id", user_id) // Assumiamo che la colonna chiave sia 'id'
      .maybeSingle();

    if (dbError) throw dbError;

    if (!otpData) {
      return res
        .status(404)
        .json({ error: "OTP non trovato. Richiedine uno nuovo." });
    }

    const now = new Date();
    const expiryDate = new Date(otpData.expires_at);

    if (now > expiryDate) {
      await supabase.from("otp").delete().eq("id", user_id);
      return res
        .status(400)
        .json({ error: "OTP scaduto. Richiedine uno nuovo." });
    }

    const isMatch = await bcrypt.compare(otp_code, otpData.otp_hash);

    if (!isMatch) {
      return res.status(400).json({ error: "Codice OTP non valido." });
    }
    const { error: deleteError } = await supabase
      .from("otp")
      .delete()
      .eq("id", user_id);

    if (deleteError) {
      console.error("Failed to delete OTP:", deleteError);
    }

    const { error: activateUser } = await supabase
      .from("authors")
      .update({ verified: true })
      .eq("id", user_id);

    if (activateUser) {
      console.error("Failed to update user status:", activateUser);
    }

    return res.status(200).json({
      message:
        "OTP verificato con successo. Procedi con la registrazione/login.",
    });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
}
