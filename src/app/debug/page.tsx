"use client";

import { useState, useEffect } from "react";
import { useGetProperties } from "@/hooks/useProperties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function DebugPage() {
  const [inspectionId, setInspectionId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fixLoading, setFixLoading] = useState(false);
  const [emergencyFixLoading, setEmergencyFixLoading] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  const [emergencyFixResult, setEmergencyFixResult] = useState<any>(null);
  const { data: properties, isLoading: propertiesLoading } = useGetProperties();

  const fetchDebugData = async () => {
    if (!inspectionId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/debug?inspectionId=${inspectionId}`);
      const data = await response.json();
      setDebugData(data);

      // If property_id exists, set it as the selected property
      if (data.inspection?.property_id) {
        setPropertyId(data.inspection.property_id);
      }
    } catch (error) {
      console.error("Error fetching debug data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fixInspection = async () => {
    if (!inspectionId) return;

    // Force the property ID to be Reinold AP
    const forcePropertyId = "565a8c55-8af0-4ef5-a279-2ff0a2dd5c51";

    setFixLoading(true);
    try {
      const response = await fetch("/api/fix-inspection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inspectionId,
          propertyId: forcePropertyId
        }),
      });

      const result = await response.json();
      setFixResult(result);

      // Refresh debug data
      fetchDebugData();

      // Reload the page after 1.5 seconds
      if (result.success) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Error fixing inspection:", error);
      setFixResult({ error: "Failed to fix inspection" });
    } finally {
      setFixLoading(false);
    }
  };

  const runEmergencyFix = async () => {
    setEmergencyFixLoading(true);
    try {
      const response = await fetch("/api/emergency-fix");
      const result = await response.json();
      setEmergencyFixResult(result);

      // Refresh debug data if we have an inspection ID
      if (inspectionId) {
        fetchDebugData();
      }

      // Reload the page after 1.5 seconds
      if (result.success) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Error running emergency fix:", error);
      setEmergencyFixResult({ error: "Failed to run emergency fix" });
    } finally {
      setEmergencyFixLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Inspection Debug Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fetch Inspection Data</CardTitle>
            <CardDescription>
              Enter an inspection ID to fetch its data from the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inspectionId">Inspection ID</Label>
                <Input
                  id="inspectionId"
                  value={inspectionId}
                  onChange={(e) => setInspectionId(e.target.value)}
                  placeholder="Enter inspection ID"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={fetchDebugData} disabled={!inspectionId || loading}>
              {loading ? "Loading..." : "Fetch Data"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Fix</CardTitle>
            <CardDescription>
              Run emergency fix to restore properties and fix inspection issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-md bg-red-50 dark:bg-red-900/20">
                <p className="font-medium">WARNING: Emergency Fix</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                  This will:
                </p>
                <ul className="text-xs list-disc pl-4 mt-1 space-y-1">
                  <li>Restore any missing properties</li>
                  <li>Create the Reinold AP property if missing</li>
                  <li>Fix all problematic inspections</li>
                </ul>
                <p className="text-xs mt-2 text-red-500 dark:text-red-400 font-medium">
                  Use only in case of emergency!
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="destructive"
              onClick={runEmergencyFix}
              disabled={emergencyFixLoading}
            >
              {emergencyFixLoading ? "Running Emergency Fix..." : "Run Emergency Fix"}
            </Button>
          </CardFooter>
        </Card>

        {debugData && (
          <Card>
            <CardHeader>
              <CardTitle>Fix Inspection</CardTitle>
              <CardDescription>
                Update the property_id for this inspection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyId">Property</Label>
                  <div className="p-3 border rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                    <p className="font-medium">Reinold AP</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: 565a8c55-8af0-4ef5-a279-2ff0a2dd5c51</p>
                    <p className="text-xs mt-2 text-red-500 dark:text-red-400">
                      This will force-update the inspection to use the Reinold AP property
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={fixInspection} disabled={fixLoading}>
                {fixLoading ? "Fixing..." : "Fix Inspection"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      {debugData && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Debug Data</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-[500px]">
            <pre className="text-sm">{JSON.stringify(debugData, null, 2)}</pre>
          </div>
        </div>
      )}

      {fixResult && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Fix Result</h2>
          <div className={`p-4 rounded-lg ${fixResult.success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <p className="font-medium">{fixResult.success ? "Success!" : "Error"}</p>
            <p>{fixResult.message || fixResult.error}</p>
          </div>
        </div>
      )}

      {emergencyFixResult && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Emergency Fix Result</h2>
          <div className={`p-4 rounded-lg ${emergencyFixResult.success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <p className="font-medium">{emergencyFixResult.success ? "Emergency Fix Successful!" : "Emergency Fix Error"}</p>
            <p>{emergencyFixResult.message || emergencyFixResult.error}</p>

            {emergencyFixResult.success && (
              <div className="mt-4">
                <p className="font-medium text-sm">Details:</p>
                <ul className="list-disc pl-5 mt-2 text-sm">
                  <li>Properties found: {emergencyFixResult.properties?.length || 0}</li>
                  <li>Reinold AP property: {emergencyFixResult.reinoldProperty ? "Created/Updated" : "Not found"}</li>
                  <li>Inspections updated: {emergencyFixResult.updatedInspections?.length || 0}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
