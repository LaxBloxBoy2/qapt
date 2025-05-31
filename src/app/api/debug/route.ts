import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const inspectionId = url.searchParams.get("inspectionId");

  if (!inspectionId) {
    return NextResponse.json({ error: "Missing inspectionId parameter" }, { status: 400 });
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
    // Get the inspection
    const { data: inspection, error: inspectionError } = await supabase
      .from("inspections")
      .select("*")
      .eq("id", inspectionId)
      .single();

    if (inspectionError) {
      return NextResponse.json({ error: inspectionError.message }, { status: 500 });
    }

    // Get the property
    let property = null;
    if (inspection.property_id) {
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", inspection.property_id)
        .single();

      if (propertyError) {
        return NextResponse.json(
          { 
            error: "Error fetching property", 
            details: propertyError.message,
            inspection
          }, 
          { status: 500 }
        );
      }

      property = propertyData;
    }

    // Get the sections
    const { data: sections, error: sectionsError } = await supabase
      .from("inspection_sections")
      .select("*")
      .eq("inspection_id", inspectionId);

    if (sectionsError) {
      return NextResponse.json({ error: sectionsError.message }, { status: 500 });
    }

    // Return all the data
    return NextResponse.json({
      inspection,
      property,
      sections,
      debug: {
        property_id: inspection.property_id,
        property_exists: !!property,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
