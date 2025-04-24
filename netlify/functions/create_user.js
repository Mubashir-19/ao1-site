// api/create_user.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    let { email, inviterEmail } = req.body;

    inviterEmail = email === inviterEmail ? '' : inviterEmail;

    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
    }

    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([{ email, referredBy: inviterEmail }]);

      if (insertError) {
        console.error('Error inserting user:', insertError);
      }
    }

    return res.status(200).send("user exists or created");
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
