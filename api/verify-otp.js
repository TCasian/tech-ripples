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
      .select("hashed_code, expires_at")
      .eq("id", user_id) // Assumiamo che la colonna chiave sia 'id'
      .maybeSingle();

    if (dbError) throw dbError;

    if (!otpData) {
      // L'OTP non esiste per questo utente
      return res
        .status(404)
        .json({ error: "OTP non trovato. Richiedine uno nuovo." });
    }

    // 2. Verifica la scadenza
    const now = new Date();
    const expiryDate = new Date(otpData.expires_at);

    if (now > expiryDate) {
      // L'OTP è scaduto. Eliminiamo il record per pulizia.
      await supabase.from("otps").delete().eq("id", user_id);
      return res
        .status(400)
        .json({ error: "OTP scaduto. Richiedine uno nuovo." });
    }

    // 3. Confronta l'OTP in chiaro con l'hash salvato
    const isMatch = await bcrypt.compare(otp_code, otpData.hashed_code);

    if (!isMatch) {
      // L'OTP non è valido. Non eliminiamo il record per permettere altri tentativi.
      return res.status(400).json({ error: "Codice OTP non valido." });
    }

    // Passo Finale: Eliminazione dell'OTP per impedirne il riutilizzo
    const { error: deleteError } = await supabase
      .from("otps")
      .delete()
      .eq("id", user_id);

    if (deleteError) {
      console.error("Failed to delete OTP:", deleteError);
      // Non blocchiamo la risposta di successo, ma logghiamo l'errore
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
