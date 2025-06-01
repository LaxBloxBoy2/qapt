"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useMaintenanceMaterials, useUpdateMaintenanceMaterials } from "@/hooks/useMaintenance";

interface Material {
  id: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  supplier?: string;
  total: number;
}

interface MaintenanceMaterialsSectionProps {
  requestId: string;
}

export function MaintenanceMaterialsSection({ requestId }: MaintenanceMaterialsSectionProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    quantity: 1,
    pricePerUnit: 0,
    supplier: "",
  });

  // Use real database hooks
  const { data: materials = [], isLoading } = useMaintenanceMaterials(requestId);
  const updateMaterials = useUpdateMaintenanceMaterials();

  const handleAddMaterial = async () => {
    if (!newMaterial.name.trim()) {
      toast({
        title: "Invalid material",
        description: "Material name is required",
        variant: "destructive",
      });
      return;
    }

    const material: Material = {
      id: `material-${Date.now()}`,
      name: newMaterial.name.trim(),
      quantity: newMaterial.quantity,
      pricePerUnit: newMaterial.pricePerUnit,
      supplier: newMaterial.supplier.trim() || undefined,
      total: newMaterial.quantity * newMaterial.pricePerUnit,
    };

    try {
      await updateMaterials.mutateAsync({
        requestId,
        materials: [...materials, material]
      });

      setNewMaterial({
        name: "",
        quantity: 1,
        pricePerUnit: 0,
        supplier: "",
      });
      setShowAddDialog(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await updateMaterials.mutateAsync({
        requestId,
        materials: materials.filter((m: Material) => m.id !== materialId)
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleUpdateQuantity = async (materialId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await updateMaterials.mutateAsync({
        requestId,
        materials: materials.map((material: Material) =>
          material.id === materialId
            ? { ...material, quantity: newQuantity, total: newQuantity * material.pricePerUnit }
            : material
        )
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getTotalCost = () => {
    return materials.reduce((sum: number, material: Material) => sum + material.total, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Materials</span>
          <div className="flex items-center gap-2">
            {materials.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Total: {formatCurrency(getTotalCost())}
              </span>
            )}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <i className="ri-add-line mr-1 h-3 w-3" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Material</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="materialName">Item Name*</Label>
                    <Input
                      id="materialName"
                      placeholder="e.g., PVC Pipe, Screws, Paint"
                      value={newMaterial.name}
                      onChange={(e) =>
                        setNewMaterial(prev => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity*</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newMaterial.quantity}
                        onChange={(e) =>
                          setNewMaterial(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerUnit">Price per Unit</Label>
                      <Input
                        id="pricePerUnit"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={newMaterial.pricePerUnit}
                        onChange={(e) =>
                          setNewMaterial(prev => ({ ...prev, pricePerUnit: parseFloat(e.target.value) || 0 }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier (Optional)</Label>
                    <Input
                      id="supplier"
                      placeholder="e.g., Home Depot, Local Hardware Store"
                      value={newMaterial.supplier}
                      onChange={(e) =>
                        setNewMaterial(prev => ({ ...prev, supplier: e.target.value }))
                      }
                    />
                  </div>

                  {newMaterial.quantity > 0 && newMaterial.pricePerUnit > 0 && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        Total: {formatCurrency(newMaterial.quantity * newMaterial.pricePerUnit)}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddMaterial}>
                      Add Material
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {materials.length > 0 ? (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-20">Qty</TableHead>
                    <TableHead className="w-24">Price/Unit</TableHead>
                    <TableHead className="w-24">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material: Material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{material.name}</p>
                          {material.supplier && (
                            <p className="text-xs text-muted-foreground">
                              {material.supplier}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={material.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(material.id, parseInt(e.target.value) || 1)
                          }
                          className="w-16 h-8"
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCurrency(material.pricePerUnit)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(material.total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteMaterial(material.id)}
                        >
                          <i className="ri-delete-bin-line h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Total Summary */}
            <div className="flex justify-end">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">
                  Total Materials Cost: {formatCurrency(getTotalCost())}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <i className="ri-tools-line text-4xl mb-2 block" />
            <p className="text-sm">No materials added yet</p>
            <p className="text-xs">Click "Add Material" to track materials used</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
