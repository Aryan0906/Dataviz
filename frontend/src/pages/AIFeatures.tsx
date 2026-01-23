import AppLayout from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const AIFeatures = () => {
  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle>AI Features</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon. This section will host AI-powered insights and automation.</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default AIFeatures;
