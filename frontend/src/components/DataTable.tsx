import { useState, type ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Check, X, Database } from "lucide-react";
import { toast } from "sonner";
import type { DataPoint } from "./DataAnalyzer";

interface DataTableProps {
  data: DataPoint[];
  onDataChange: (data: DataPoint[]) => void;
}

export const DataTable = ({ data, onDataChange }: DataTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editX, setEditX] = useState("");
  const [editY, setEditY] = useState("");

  const startEdit = (index: number, point: DataPoint) => {
    setEditingIndex(index);
    setEditX(point.x.toString());
    setEditY(point.y.toString());
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditX("");
    setEditY("");
  };

  const saveEdit = (index: number) => {
    const x = parseFloat(editX);
    const y = parseFloat(editY);
    
    if (isNaN(x) || isNaN(y)) {
      toast.error("Please enter valid numbers");
      return;
    }

    const newData = [...data];
    newData[index] = { x, y };
    newData.sort((a, b) => a.x - b.x);
    
    onDataChange(newData);
    setEditingIndex(null);
    setEditX("");
    setEditY("");
    toast.success("Data point updated");
  };

  const deletePoint = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onDataChange(newData);
    toast.success("Data point deleted");
  };

  // Calculate statistics
  const stats = {
    count: data.length,
    meanX: data.length > 0 ? data.reduce((sum, p) => sum + p.x, 0) / data.length : 0,
    meanY: data.length > 0 ? data.reduce((sum, p) => sum + p.y, 0) / data.length : 0,
    minX: data.length > 0 ? Math.min(...data.map(p => p.x)) : 0,
    maxX: data.length > 0 ? Math.max(...data.map(p => p.x)) : 0,
    minY: data.length > 0 ? Math.min(...data.map(p => p.y)) : 0,
    maxY: data.length > 0 ? Math.max(...data.map(p => p.y)) : 0,
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data Table
          </CardTitle>
          <Badge variant="outline">{stats.count} points</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Mean X</div>
            <div className="font-mono text-sm">{stats.meanX.toFixed(3)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Mean Y</div>
            <div className="font-mono text-sm">{stats.meanY.toFixed(3)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">X Range</div>
            <div className="font-mono text-xs">{stats.minX.toFixed(2)} - {stats.maxX.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Y Range</div>
            <div className="font-mono text-xs">{stats.minY.toFixed(2)} - {stats.maxY.toFixed(2)}</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-md border max-h-64 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>X Value</TableHead>
                <TableHead>Y Value</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((point, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{index + 1}</TableCell>
                  <TableCell>
                    {editingIndex === index ? (
                      <Input
                        type="number"
                        step="any"
                        value={editX}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditX(e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      <span className="font-mono">{point.x.toFixed(4)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingIndex === index ? (
                      <Input
                        type="number"
                        step="any"
                        value={editY}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditY(e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      <span className="font-mono">{point.y.toFixed(4)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingIndex === index ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => saveEdit(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(index, point)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deletePoint(index)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
