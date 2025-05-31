"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export default function TestStoragePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [user, setUser] = useState<any>(null);

  // Check authentication
  const checkAuth = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    setUser(user);
    setResult(user ? `Logged in as: ${user.email}` : "Not logged in");
  };

  // Test bucket access
  const testBucket = async () => {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        setResult(`Bucket error: ${error.message}`);
      } else {
        const buckets = data.map(b => `${b.name} (${b.public ? 'public' : 'private'})`).join(', ');
        setResult(`Available buckets: ${buckets}`);
      }
    } catch (err) {
      setResult(`Exception: ${err}`);
    }
  };

  // Test simple upload
  const testUpload = async () => {
    if (!file) {
      setResult("Please select a file first");
      return;
    }

    setUploading(true);
    setResult("Starting upload...");

    try {
      // Simple filename
      const fileName = `test-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `test/${fileName}`;

      setResult(`Uploading ${file.name} as ${filePath}...`);

      // Try upload
      const { data, error } = await supabase.storage
        .from('document-files')
        .upload(filePath, file);

      if (error) {
        setResult(`Upload failed: ${error.message}`);
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('document-files')
          .getPublicUrl(filePath);

        setResult(`Upload successful! 
File: ${data.path}
URL: ${urlData.publicUrl}
Size: ${file.size} bytes`);
      }
    } catch (err) {
      setResult(`Exception during upload: ${err}`);
    } finally {
      setUploading(false);
    }
  };

  // Test with existing bucket
  const testExistingBucket = async () => {
    if (!file) {
      setResult("Please select a file first");
      return;
    }

    setUploading(true);
    const buckets = ['image_url', 'appliance-files', 'document-files'];

    for (const bucket of buckets) {
      try {
        setResult(`Trying bucket: ${bucket}...`);
        
        const fileName = `test-${Date.now()}.${file.name.split('.').pop()}`;
        const filePath = `test/${fileName}`;

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (!error) {
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          setResult(`SUCCESS with bucket: ${bucket}
File: ${data.path}
URL: ${urlData.publicUrl}`);
          setUploading(false);
          return;
        } else {
          setResult(prev => prev + `\n${bucket}: ${error.message}`);
        }
      } catch (err) {
        setResult(prev => prev + `\n${bucket}: Exception - ${err}`);
      }
    }

    setResult(prev => prev + "\nAll buckets failed!");
    setUploading(false);
  };

  // Create document record only (no file)
  const testDocumentRecord = async () => {
    try {
      setResult("Creating document record...");

      const { data, error } = await supabase
        .from('documents')
        .insert([{
          name: 'Test Document',
          category: 'other',
          description: 'Test document created from test page',
          file_url: 'https://via.placeholder.com/400x300/blue/white?text=Test',
          file_size: 1024,
          file_type: 'text/plain',
          status: 'active',
          storage_path: 'test/placeholder.txt'
        }])
        .select()
        .single();

      if (error) {
        setResult(`Database error: ${error.message}`);
      } else {
        setResult(`Document record created successfully!
ID: ${data.id}
Name: ${data.name}
URL: ${data.file_url}`);
      }
    } catch (err) {
      setResult(`Exception: ${err}`);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Storage & Documents Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Test File:</label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mb-2"
            />
            {file && (
              <p className="text-sm text-gray-600">
                Selected: {file.name} ({file.size} bytes)
              </p>
            )}
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={checkAuth} variant="outline">
              Check Authentication
            </Button>
            
            <Button onClick={testBucket} variant="outline">
              Test Bucket Access
            </Button>
            
            <Button 
              onClick={testUpload} 
              disabled={!file || uploading}
              variant="default"
            >
              {uploading ? "Uploading..." : "Test Upload (document-files)"}
            </Button>
            
            <Button 
              onClick={testExistingBucket} 
              disabled={!file || uploading}
              variant="secondary"
            >
              {uploading ? "Testing..." : "Try Existing Buckets"}
            </Button>
            
            <Button onClick={testDocumentRecord} variant="outline">
              Test Document Record Only
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/documents'} 
              variant="outline"
            >
              Go to Documents Page
            </Button>
          </div>

          {/* Results */}
          <div>
            <label className="block text-sm font-medium mb-2">Test Results:</label>
            <div className="bg-gray-100 p-4 rounded-lg min-h-[200px] font-mono text-sm whitespace-pre-wrap">
              {result || "Click a test button to see results..."}
            </div>
          </div>

          {/* Quick Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Quick Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>First click "Check Authentication" - you should be logged in</li>
              <li>Click "Test Bucket Access" - should show available buckets</li>
              <li>Select a small file (image, text, etc.)</li>
              <li>Try "Test Upload" first - if it fails, try "Try Existing Buckets"</li>
              <li>If uploads fail, try "Test Document Record Only" to test database</li>
              <li>Once working, go back to Documents page</li>
            </ol>
          </div>

          {/* SQL Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">If Upload Fails - Run This SQL:</h3>
            <div className="bg-white p-3 rounded border font-mono text-xs">
              {`-- Run each line separately in Supabase SQL Editor:

INSERT INTO storage.buckets (id, name, public)
VALUES ('document-files', 'document-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "docs_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'document-files');

CREATE POLICY "docs_read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'document-files');`}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
