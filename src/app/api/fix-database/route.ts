import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // First, get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Re-enable RLS and recreate policies
    await supabase.rpc('recreate_properties_rls_policies');

    // Check if the Reinold AP property exists
    const { data: existingProperty, error: propertyError } = await supabase
      .from("properties")
      .select("id, name, address, user_id")
      .eq("id", "565a8c55-8af0-4ef5-a279-2ff0a2dd5c51")
      .single();

    // If property doesn't exist or there was an error, create it
    if (propertyError || !existingProperty) {
      // Create the property
      const { error: createError } = await supabase
        .from("properties")
        .insert({
          id: "565a8c55-8af0-4ef5-a279-2ff0a2dd5c51",
          name: "Reinold AP",
          address: "128 city road",
          user_id: user.id,
          created_at: new Date().toISOString()
        });

      if (createError) {
        console.error("Error creating property:", createError);
        return NextResponse.json(
          { error: "Failed to create property" },
          { status: 500 }
        );
      }
    } else if (existingProperty.user_id !== user.id) {
      // Update property ownership if it exists but belongs to another user
      const { error: updateError } = await supabase
        .from("properties")
        .update({ user_id: user.id })
        .eq("id", "565a8c55-8af0-4ef5-a279-2ff0a2dd5c51");

      if (updateError) {
        console.error("Error updating property ownership:", updateError);
        return NextResponse.json(
          { error: "Failed to update property ownership" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: "Database fixed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
