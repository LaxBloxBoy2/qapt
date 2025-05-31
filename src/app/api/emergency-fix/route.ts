import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
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
    // 1. Check if we have any properties
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, name, address")
      .limit(10);

    if (propertiesError) {
      return NextResponse.json(
        { error: "Failed to fetch properties", details: propertiesError.message },
        { status: 500 }
      );
    }

    // 2. Make sure Reinold AP property exists
    let reinoldProperty;
    const { data: existingReinold } = await supabase
      .from("properties")
      .select("*")
      .eq("id", "565a8c55-8af0-4ef5-a279-2ff0a2dd5c51")
      .single();

    if (!existingReinold) {
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

      reinoldProperty = newProperty;
    } else {
      reinoldProperty = existingReinold;
    }

    // 3. Fix the problematic inspections
    const { data: updatedInspections, error: updateError } = await supabase
      .from("inspections")
      .update({ property_id: "565a8c55-8af0-4ef5-a279-2ff0a2dd5c51" })
      .in("id", ["c4e10265-d302-415e-8b14-5c9192a29a96", "565a8c55-8af0-4ef5-a279-2ff0a2dd5c51"])
      .select();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update inspections", details: updateError.message },
        { status: 500 }
      );
    }

    // 4. Verify the fix
    const { data: verifyData, error: verifyError } = await supabase
      .from("inspections")
      .select(`
        id,
        property_id,
        properties:property_id (
          id,
          name,
          address
        )
      `)
      .in("id", ["c4e10265-d302-415e-8b14-5c9192a29a96", "565a8c55-8af0-4ef5-a279-2ff0a2dd5c51"]);

    if (verifyError) {
      return NextResponse.json(
        { error: "Failed to verify fix", details: verifyError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Emergency fix applied successfully",
      properties: properties,
      reinoldProperty: reinoldProperty,
      updatedInspections: updatedInspections,
      verifyData: verifyData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
