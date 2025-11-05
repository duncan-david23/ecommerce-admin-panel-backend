import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Multer (in-memory)
const upload = multer({ storage: multer.memoryStorage() });
export const uploadProfileMiddleware = upload.single("profile_image");

const supabase = createClient(
  process.env.ADMIN_SUPABASE_URL,
  process.env.ADMIN_SUPABASE_SERVICE_ROLE_KEY
);



// ✅ Update or Create Profile
export const updateProfile = async (req, res) => {
  try {
    // 1. Auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing authorization header" });

    const token = authHeader.replace("Bearer ", "");
  

    // 2. Validate user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Invalid or expired token:", userError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // 3. Extract profile fields
    const { display_name, phone_number, email } = req.body;

    // 4. Upload new profile image if provided
    let profileImageUrl = null;
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `profiles/${user.id}` },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      profileImageUrl = uploadResult.secure_url;
    }

    // 5. Upsert profile in Supabase
    const { data, error } = await supabase
      .from("account_settings")
      .upsert(
        {
         user_id: user.id,
          display_name,
          phone_number,
          email,
          profile_image_url: profileImageUrl, // replaces old image if new uploaded
          updated_at: new Date(),
        }, { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase profile update error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: "✅ Profile updated successfully", profile: data });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};



// ✅ Fetch Profile
export const fetchProfile = async (req, res) => {
  try {
    // 1. Auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing authorization header" });

    const token = authHeader.replace("Bearer ", "");
    

    // 2. Validate user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Invalid or expired token:", userError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // 3. Fetch profile from Supabase
    const { data, error } = await supabase
      .from("account_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Supabase fetch profile error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.json({  data });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};