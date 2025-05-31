"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";

function DebugLeasesPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const runTests = async () => {
      const testResults = [];

      try {
        // Test 1: Simple lease query
        console.log("Test 1: Simple lease query");
        const { data: simpleLeases, error: simpleError } = await supabase
          .from("leases")
          .select("*");

        testResults.push({
          test: "Simple lease query",
          data: simpleLeases,
          error: simpleError,
          count: simpleLeases?.length || 0
        });

        // Test 2: Lease with unit info
        console.log("Test 2: Lease with unit info");
        const { data: leasesWithUnits, error: unitsError } = await supabase
          .from("leases")
          .select(`
            *,
            unit:unit_id (
              id,
              name,
              property_id
            )
          `);

        testResults.push({
          test: "Leases with unit info",
          data: leasesWithUnits,
          error: unitsError,
          count: leasesWithUnits?.length || 0
        });

        // Test 3: Specific lease by ID
        const leaseId = "ac1fe54a-7f3a-4933-bee0-9afae57172a4";
        console.log("Test 3: Specific lease by ID:", leaseId);
        const { data: specificLease, error: specificError } = await supabase
          .from("leases")
          .select("*")
          .eq("id", leaseId)
          .maybeSingle();

        testResults.push({
          test: `Specific lease (${leaseId})`,
          data: specificLease,
          error: specificError,
          count: specificLease ? 1 : 0
        });

        // Test 4: Check auth
        console.log("Test 4: Check auth");
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        testResults.push({
          test: "Authentication",
          data: {
            session: session ? { user_id: session.user.id, email: session.user.email } : null,
            user: user ? { user_id: user.id, email: user.email } : null,
            sessionError: authError,
            userError: userError
          },
          error: authError || userError,
          count: session ? 1 : 0
        });

        // Test 5: Check properties
        console.log("Test 5: Check properties");
        const { data: properties, error: propertiesError } = await supabase
          .from("properties")
          .select("*");

        testResults.push({
          test: "Properties",
          data: properties,
          error: propertiesError,
          count: properties?.length || 0
        });

        // Test 6: Check units
        console.log("Test 6: Check units");
        const { data: units, error: unitsError2 } = await supabase
          .from("units")
          .select("*");

        testResults.push({
          test: "Units",
          data: units,
          error: unitsError2,
          count: units?.length || 0
        });

        // Test 7: Try to create a simple lease to test permissions
        console.log("Test 7: Test lease creation permissions");
        try {
          const { data: testLease, error: createError } = await supabase
            .from("leases")
            .insert({
              unit_id: "test-unit-id",
              start_date: "2024-01-01",
              end_date: "2024-12-31",
              rent_amount: 1000
            })
            .select()
            .single();

          // If successful, delete it immediately
          if (testLease) {
            await supabase.from("leases").delete().eq("id", testLease.id);
          }

          testResults.push({
            test: "Lease creation test",
            data: testLease ? "SUCCESS - Can create leases" : "FAILED",
            error: createError,
            count: testLease ? 1 : 0
          });
        } catch (error) {
          testResults.push({
            test: "Lease creation test",
            data: "FAILED",
            error: error,
            count: 0
          });
        }

      } catch (error) {
        testResults.push({
          test: "Unexpected error",
          data: null,
          error: error,
          count: 0
        });
      }

      setResults(testResults);
      setLoading(false);
    };

    runTests();
  }, [supabase]);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Debug Leases</h1>
          <p>Running tests...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Leases</h1>

        {results.map((result, index) => (
          <div key={index} className="mb-6 p-4 border rounded">
            <h3 className="text-lg font-semibold mb-2">{result.test}</h3>
            <p className="mb-2">Count: {result.count}</p>

            {result.error && (
              <div className="mb-2 p-2 bg-red-100 text-red-800 rounded">
                <strong>Error:</strong> {JSON.stringify(result.error, null, 2)}
              </div>
            )}

            <div className="bg-gray-100 p-2 rounded">
              <strong>Data:</strong>
              <pre className="text-sm overflow-auto max-h-40">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}

export default withAuth(DebugLeasesPage);
