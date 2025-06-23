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
  SuggestWorkTasksInput,
  SuggestWorkTasksOutput,
  suggestWorkTasks,
} from "@/ai/flows/suggest-work-tasks";
import { Wand2, LoaderCircle, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";

export function TaskSuggester() {
  const [suggestion, setSuggestion] =
    useState<SuggestWorkTasksOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SuggestWorkTasksInput>({
    orderStatus: "",
    orderDetails: "",
  });
  const { toast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetSuggestion = async () => {
    if (!formData.orderStatus) {
      toast({
        title: "Missing Status",
        description: "Please provide an order status to get a suggestion.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await suggestWorkTasks(formData);
      setSuggestion(result);
    } catch (error)
    {
      console.error("Error getting suggestion:", error);
      toast({
        title: "An Error Occurred",
        description: "Failed to get an AI suggestion. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Work Task Suggestion</CardTitle>
        <CardDescription>
          Enter the current order status to get AI-powered suggestions for the
          next steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="orderStatus">Current Order Status</Label>
          <Input
            id="orderStatus"
            name="orderStatus"
            placeholder="e.g., 'In Production', 'Awaiting Materials', 'Design Complete'"
            value={formData.orderStatus}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="orderDetails">
            Additional Details (Optional)
          </Label>
          <Textarea
            id="orderDetails"
            name="orderDetails"
            placeholder="e.g., 'Customer requested a different leg style. Waiting on new hardware.'"
            rows={3}
            value={formData.orderDetails}
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
            <span>{isLoading ? "Generating..." : "Suggest Tasks"}</span>
          </Button>
        </div>

        {suggestion && (
          <div className="space-y-4 rounded-lg border bg-secondary/50 p-4 animate-in fade-in-50">
            <h3 className="font-semibold">AI Suggested Tasks</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Suggested Tasks</Label>
                <ul className="list-disc space-y-2 pl-5">
                  {suggestion.suggestedTasks.map((task, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ListChecks className="mt-1 h-4 w-4 text-primary" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Reasoning</Label>
                <p className="text-sm text-muted-foreground italic">
                  "{suggestion.reasoning}"
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
