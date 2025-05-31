import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { inspectionId, propertyId } = await request.json();

  if (!inspectionId) {
    return NextResponse.json({ error: "Missing inspectionId parameter" }, { status: 400 });
  }

  if (!propertyId) {
    return NextResponse.json({ error: "Missing propertyId parameter" }, { status: 400 });
  }

  // Create a Supabase client
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
    // Check if the property exists
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, name")
      .eq("id", propertyId)
      .single();

    if (propertyError) {
      return NextResponse.json(
        { error: "Property not found", details: propertyError.message },
        { status: 404 }
      );
    }

    // Update the inspection with the property_id
    const { data: updatedInspection, error: updateError } = await supabase
      .from("inspections")
      .update({ property_id: propertyId })
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
      message: `Inspection updated with property: ${property.name}`,
      inspection: updatedInspection,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
