import { useStorytelling } from "@/context/StorytellingContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Target, Award, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const ProgressTracker = ({ compact = false }) => {
    const {
        journeyProgress,
        achievements,
        visitedPages,
        totalSteps,
        getNextSuggestedPage,
    } = useStorytelling();
    const navigate = useNavigate();

    const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
    const nextPage = getNextSuggestedPage();

    if (compact) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                            <div className="flex items-center gap-2">
                                <Progress value={journeyProgress} className="w-20 h-2" />
                                <span className="text-sm font-medium">{Math.round(journeyProgress)}%</span>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="w-64">
                        <div className="space-y-2">
                            <div className="font-semibold">Your Progress</div>
                            <div className="text-xs text-muted-foreground">
                                {visitedPages.length} of {totalSteps} pages explored
                            </div>
                            <div className="text-xs">
                                🏆 {achievements.length} achievements • {totalPoints} points
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardContent className="pt-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Your Journey</h3>
                            <p className="text-xs text-muted-foreground">Track your progress</p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                        <Award className="h-3 w-3" />
                        {totalPoints} pts
                    </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="font-semibold">{Math.round(journeyProgress)}%</span>
                    </div>
                    <Progress value={journeyProgress} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{visitedPages.length} pages explored</span>
                        <span>{totalSteps - visitedPages.length} to go</span>
                    </div>
                </div>

                {/* Achievements Preview */}
                {achievements.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Target className="h-4 w-4 text-purple-600" />
                            <span>Recent Achievements</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {achievements.slice(-3).reverse().map((achievement) => (
                                <TooltipProvider key={achievement.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge
                                                variant="outline"
                                                className="gap-1 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800"
                                            >
                                                <span>{achievement.icon}</span>
                                                <span className="text-xs">{achievement.title}</span>
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="space-y-1">
                                                <div className="font-semibold">{achievement.title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {achievement.description}
                                                </div>
                                                <div className="text-xs text-yellow-600">
                                                    +{achievement.points} points
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </div>
                )}

                {/* Next Suggestion */}
                {nextPage && (
                    <div className="pt-3 border-t">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                <div>
                                    <div className="text-sm font-medium">Next Step</div>
                                    <div className="text-xs text-muted-foreground">
                                        {nextPage.title}
                                    </div>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(nextPage.path)}
                                className="gap-1"
                            >
                                Go
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ProgressTracker;
