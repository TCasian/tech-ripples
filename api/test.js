export default function handler(req, res) {
  const supabasePassword = process.env.SUPABASE_PASSWORD || "NON TROVATA";

  console.log("SUPABASE_PASSWORD:", supabasePassword); // solo in locale / log Vercel

  res.status(200).json({
    supabase_password: supabasePassword,
  });
}
