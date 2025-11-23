export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

const handleLogin = async (e) => {
  e.preventDefault();
  setMessage("");

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Errore: ${error.message}`);
    } else {
      setMessage("Login avvenuto con successo!");
    }
  } catch (err) {
    setMessage(`Errore: ${err.message}`);
  }
};
