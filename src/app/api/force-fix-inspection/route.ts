import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inspectionId = searchParams.get("inspectionId");

  if (!inspectionId) {
    return NextResponse.json({ error: "Missing inspectionId parameter" }, { status: 400 });
  }

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
    // First, check if the property exists
    const { data: existingProperty, error: propertyError } = await supabase
      .from("properties")
      .select("id")
      .eq("id", "565a8c55-8af0-4ef5-a279-2ff0a2dd5c51")
      .single();

    // If property doesn't exist, create it
    if (propertyError) {
      // Get the user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
      }

      // Create the property
      const { data: newProperty, error: createError } = await supabase
        .from("properties")
        .insert({
          id: "565a8c55-8af0-4ef5-a279-2ff0a2dd5c51",
          name: "Reinold AP",
          address: "128 city road",
          user_id: user.id,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: "Failed to create property", details: createError.message },
          { status: 500 }
        );
      }
    }

    // Update the inspection with the property ID
    const { data: updatedInspection, error: updateError } = await supabase
      .from("inspections")
      .update({ property_id: "565a8c55-8af0-4ef5-a279-2ff0a2dd5c51" })
      .eq("id", inspectionId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update inspection", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inspection fixed successfully",
      inspection: updatedInspection,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
