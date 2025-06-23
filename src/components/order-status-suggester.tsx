"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SuggestOrderStatusInput,
  SuggestOrderStatusOutput,
  suggestOrderStatus,
} from "@/ai/flows/suggest-order-status";
import { Wand2, LoaderCircle, CheckCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { useToast } from "@/hooks/use-toast";

export function OrderStatusSuggester() {
  const [suggestion, setSuggestion] =
    useState<SuggestOrderStatusOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SuggestOrderStatusInput>({
    orderDetails: "",
    currentStatus: "",
  });
  const { toast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetSuggestion = async () => {
    if (!formData.orderDetails) {
      toast({
        title: "Missing Details",
        description: "Please provide order details to get a suggestion.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await suggestOrderStatus(formData);
      setSuggestion(result);
    } catch (error) {
      console.error("Error getting suggestion:", error);
      toast({
        title: "An Error Occurred",
        description:
          "Failed to get an AI suggestion. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = () => {
    toast({
      title: "Status Updated!",
      description: "The order status has been successfully updated.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Order Status Suggestion</CardTitle>
        <CardDescription>
          Provide order details and let our AI suggest the most likely
          production status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="orderDetails">Order Details</Label>
          <Textarea
            id="orderDetails"
            name="orderDetails"
            placeholder="e.g., 'Customer approved final design. All materials received. Awaiting assembly. Photos show wood cut and sanded.'"
            rows={5}
            value={formData.orderDetails}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentStatus">Current Status (Optional)</Label>
          <Input
            id="currentStatus"
            name="currentStatus"
            placeholder="e.g., 'Design Phase'"
            value={formData.currentStatus}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Button onClick={handleGetSuggestion} disabled={isLoading}>
            {isLoading ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Wand2 />
            )}
            <span>{isLoading ? "Analyzing..." : "Suggest Status"}</span>
          </Button>
        </div>
        {suggestion && (
          <div className="space-y-4 rounded-lg border bg-secondary/50 p-4 animate-in fade-in-50">
            <h3 className="font-semibold">AI Suggestion</h3>
            <div className="flex items-center gap-4">
              <p className="text-sm">
                Suggested Status:{" "}
                <Badge variant="default">{suggestion.suggestedStatus}</Badge>
              </p>
              <p className="text-sm">
                Confidence:{" "}
                <Badge variant="secondary">
                  {(suggestion.confidence * 100).toFixed(0)}%
                </Badge>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalStatus">Confirm or Set Final Status</Label>
              <div className="flex gap-2">
                <Input
                  id="finalStatus"
                  defaultValue={suggestion.suggestedStatus}
                />
                <Button onClick={handleStatusUpdate}>
                  <CheckCircle />
                  Update Status
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
