import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { OrderStatusSuggester } from "@/components/order-status-suggester";
import { TaskSuggester } from "@/components/task-suggester";

export default function FactoryPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Factory Dashboard</h2>
        <p className="text-muted-foreground">
          Use AI-powered tools to manage production status and workflow.
        </p>
      </div>
      <Separator />
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Order Status AI</TabsTrigger>
          <TabsTrigger value="tasks">Task Suggestion AI</TabsTrigger>
        </TabsList>
        <TabsContent value="status">
          <OrderStatusSuggester />
        </TabsContent>
        <TabsContent value="tasks">
          <TaskSuggester />
        </TabsContent>
      </Tabs>
    </div>
  );
}
