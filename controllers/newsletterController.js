import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";


const supabase = createClient(
  process.env.ADMIN_SUPABASE_URL,
  process.env.ADMIN_SUPABASE_SERVICE_ROLE_KEY
);


export const addNewsletter = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const adminIdKey = process.env.USER_ID_KEY;

    // 1. Prevent duplicate emails
    const { data: existing } = await supabase
      .from("newsletters")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Email already subscribed" });
    }

    // 2. Prepare data with defaults
    const newSubscriber = {
      email,
      name: name || null,
      status: "Subscribed",
      subscribed_date: new Date().toISOString(), // store the date in ISO format
      user_id: adminIdKey,
    };

    // 3. Insert new newsletter record
    const { data, error } = await supabase
      .from("newsletters")
      .insert([newSubscriber])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: "✅ Newsletter added successfully",
    });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};



// GET /api/newsletter
export const getNewsletter = async (req, res) => {
  try {
    // 1. Auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    // 2. Validate user token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // 3. Fetch ALL newsletters belonging to this user
    const { data, error } = await supabase
      .from("newsletters")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Supabase fetch error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: "✅ Newsletters fetched successfully",
      count: data.length,
      newsletters: data,
    });

  } catch (err) {
    console.error("❌ Error fetching newsletters:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

