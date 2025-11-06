import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.ADMIN_SUPABASE_URL,
  process.env.ADMIN_SUPABASE_SERVICE_ROLE_KEY
);


// Controller logic for coupons

export const addCoupon = async (req, res) => {
  try {
    // 1. Validate user
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "Missing authorization header" });

    const token = authHeader.replace("Bearer ", "");

     // 2. Validate user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Invalid or expired token:", userError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // 2. Extract coupon fields
    const {
      code,
      discount_type,
      discount_value,
      max_uses,
      valid_from,
      valid_until,
    } = req.body;

    // if (public_key !== user.id)
    //   return res.status(403).json({ error: "Public key mismatch" });

    // 3. Validate fields
    if (!code || !discount_type || !discount_value)
      return res
        .status(400)
        .json({ error: "code, discount_type, and discount_value are required" });

    if (!["fixed", "percentage"].includes(discount_type))
      return res
        .status(400)
        .json({ error: "discount_type must be 'fixed' or 'percentage'" });

    // 4. Insert coupon into Supabase
    const { data, error: insertError } = await supabase
      .from("coupons")
      .insert([
        {
          code: code.trim().toUpperCase(),
          discount_type,
          discount_value: parseFloat(discount_value),
          max_uses: max_uses ? parseInt(max_uses) : null,
          valid_from: valid_from ? new Date(valid_from).toISOString() : new Date().toISOString(),
          valid_until: valid_until ? new Date(valid_until).toISOString() : null,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return res.status(400).json({ error: insertError.message });
    }

    // 5. Return success response
    return res
      .status(201)
      .json({ message: "Coupon created successfully", coupon: data });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


// fetch coupons controller 
export const getCoupons = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "Missing authorization header" });

    const token = authHeader.replace("Bearer ", "");

    // 2. Validate user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Invalid or expired token:", userError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase query error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ coupons: data });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};



// Apply Coupon Controller

export const applyCoupon = async (req, res) => {
  try {


    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "Missing authorization header" });

    const token = authHeader.replace("Bearer ", "");


    if (userError || !user) {
      console.error("Invalid or expired token:", userError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    // 1. Extract input
    const {  code, cart_total } = req.body;

    // if (!public_key || !code)
    //   return res
    //     .status(400)
    //     .json({ error: "public_key and code are required" });

     // 2. Validate user

    

    // 2. Look up coupon by both public_key and code
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select("*")
      .eq("user_id", user.id)
      .eq("code", code.trim().toUpperCase())
      .single();

    if (couponError || !coupon)
      return res
        .status(404)
        .json({ valid: false, message: "Invalid coupon code" });

    // 3. Check coupon validity
    const now = new Date();

    if (!coupon.is_active)
      return res.status(400).json({ valid: false, message: "Coupon is not active" });

    if (coupon.valid_from && new Date(coupon.valid_from) > now)
      return res.status(400).json({ valid: false, message: "Coupon is not yet valid" });

    if (coupon.valid_until && new Date(coupon.valid_until) < now)
      return res.status(400).json({ valid: false, message: "Coupon has expired" });

    if (coupon.max_uses && coupon.uses_count >= coupon.max_uses)
      return res.status(400).json({ valid: false, message: "Coupon usage limit reached" });

    // 4. Calculate discount (if cart_total provided)
    let discount = 0;
    let final_total = null;

    if (cart_total !== undefined) {
      const cartTotal = parseFloat(cart_total);

      if (coupon.discount_type === "fixed") {
        discount = parseFloat(coupon.discount_value);
      } else if (coupon.discount_type === "percentage") {
        discount = (cartTotal * parseFloat(coupon.discount_value)) / 100;
      }

      final_total = Math.max(cartTotal - discount, 0);
    }

    // 5. Increment usage count atomically
    const { error: updateError } = await supabase
      .from("coupons")
      .update({ uses_count: coupon.uses_count + 1, updated_at: new Date().toISOString() })
      .eq("id", coupon.id)
      .select();

    if (updateError) {
      console.error("Failed to update uses_count:", updateError);
      return res.status(500).json({ error: "Failed to track coupon usage" });
    }

    // 6. Return success response
    return res.status(200).json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      ...(cart_total !== undefined && {
        discount: discount.toFixed(2),
        final_total: final_total.toFixed(2),
      }),
      message:
        cart_total !== undefined
          ? "Coupon applied successfully"
          : "Coupon is valid and active",
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};



// Delete Coupon Controller

export const deleteCoupon = async (req, res) => {
  try {
    // 1. Validate Authorization Header
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "Missing authorization header" });

    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

   if (userError || !user) {
      console.error("Invalid or expired token:", userError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }


    // 2. Extract coupon ID or code from body
    const { id, code } = req.body;
    if (!id && !code)
      return res
        .status(400)
        .json({ error: "Coupon id or code is required to delete" });

    // 3. Fetch coupon
    const query = supabase.from("coupons").select("*").eq("user_id", user.id);

    if (id) query.eq("id", id);
    else query.eq("code", code.trim().toUpperCase());

    const { data: coupon, error: fetchError } = await query.single();

    if (fetchError || !coupon)
      return res.status(404).json({ error: "Coupon not found" });

    // 4. Delete coupon
    const { error: deleteError } = await supabase
      .from("coupons")
      .delete()
      .eq("id", coupon.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return res.status(500).json({ error: "Failed to delete coupon" });
    }

    return res.status(200).json({
      message: "Coupon deleted successfully",
      deleted_coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};



