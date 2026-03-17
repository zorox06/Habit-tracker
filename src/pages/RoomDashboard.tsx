import { useState } from 'react';
import { useRoom, useRoomChat, useLeaveRoom, useRoomActivity } from '@/hooks/useRooms';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, ArrowLeft, LogOut, MessageSquare, Send, Users, Plus, Target } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useHabits, useDailyStats, useDeleteHabit } from '@/hooks/useHabits';
import { HabitCard } from '@/components/dashboard/HabitCard';
import { AddHabitModal } from '@/components/modals/AddHabitModal';
import { calculateProgress, formatMinutes } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { iconMap } from '@/pages/Dashboard'; // Import if needed or duplicate

// Simple icon map fallback
const localIconMap: Record<string, any> = {
  code2: <Target className="w-5 h-5" />, // Fallback
};

const RoomDashboard = () => {
  const { currentRoomId, setCurrentPage, setCurrentRoomId } = useNavigation();
  const { user } = useAuth();
  
  const { data: room, isLoading } = useRoom(currentRoomId || '');
  const { messages, sendMessage } = useRoomChat(currentRoomId || '');
  const { data: habits = [] } = useHabits(currentRoomId || undefined);
  const { data: dailyStats } = useDailyStats() as any;
  const leaveRoom = useLeaveRoom();
  const { data: recentActivity = [] } = useRoomActivity(currentRoomId || '');
  const deleteHabit = useDeleteHabit();
  const isOwner = room?.owner_id === user?.id;

  const [chatInput, setChatInput] = useState('');
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // Fetch selected member's personal data
  const { data: memberHabits = [], isLoading: memberHabitsLoading } = useHabits(undefined, selectedMember?.user_id);
  const { data: memberStats } = useDailyStats(undefined, selectedMember?.user_id) as any;

  if (!currentRoomId) return null;

  const handleBack = () => {
    setCurrentRoomId(null);
    setCurrentPage('rooms');
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    await sendMessage.mutateAsync(chatInput);
    setChatInput('');
  };

  const handleLeave = async () => {
    if (confirm("Are you sure you want to leave this room?")) {
      await leaveRoom.mutateAsync(currentRoomId);
      handleBack();
    }
  };

  if (isLoading || !room) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Find current user's role/display name. Assuming we have user from auth, but we can just show the list for now.
  
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between bg-surface-1 p-4 rounded-xl border border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack} className="hover:bg-surface-2 text-muted-foreground mr-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center border border-border">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{room.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-surface-2 text-muted-foreground px-2 py-0.5 rounded border border-border font-mono">
                Code: {room.code}
              </span>
              <span className="text-sm text-muted-foreground">
                • {room.members?.length || 0} members
              </span>
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={handleLeave} className="border-border hover:bg-destructive hover:text-destructive-foreground">
          <LogOut className="w-4 h-4 mr-2" />
          Leave Room
        </Button>
      </div>

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-surface-1 border border-border p-1 rounded-lg h-auto">
          <TabsTrigger value="progress" className="py-2.5 data-[state=active]:bg-surface-2 data-[state=active]:text-foreground">
            <Activity className="w-4 h-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="habits" className="py-2.5 data-[state=active]:bg-surface-2 data-[state=active]:text-foreground">
            <Users className="w-4 h-4 mr-2" />
            Shared Habits
          </TabsTrigger>
          <TabsTrigger value="chat" className="py-2.5 data-[state=active]:bg-surface-2 data-[state=active]:text-foreground">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat Room
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-surface-1 p-6 rounded-xl border border-border">
              <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                Top Members
              </h2>
              <div className="space-y-4">
                {[...(room.members || [])] // Create a copy to sort safely
                  .sort((a, b) => (b.top_streak || 0) - (a.top_streak || 0)) // Sort by highest streak
                  .map((member, i) => (
                  <div 
                    key={member.user_id} 
                    onClick={() => setSelectedMember(member)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-surface-2 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-2 group-hover:bg-primary/20 flex items-center justify-center text-xs font-bold font-mono transition-colors">
                        {i + 1}
                      </div>
                      <span className="font-medium group-hover:text-primary transition-colors">{member.display_name}</span>
                      {member.role === 'owner' && (
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold">Host</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-11 sm:ml-0">
                      <div className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-xs font-bold flex items-center border border-orange-500/20">
                        🔥 {member.top_streak || 0} day streak
                      </div>
                      <div className="text-xs text-muted-foreground hidden sm:block">View details</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-surface-1 p-6 rounded-xl border border-border">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, i) => (
                    <div key={activity.id || i} className="text-sm p-3 bg-background rounded-lg border border-border flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{activity.display_name}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(activity.logged_at), 'MMM d, h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Target className={`w-3.5 h-3.5 ${activity.is_completed ? 'text-green-500' : 'text-primary'}`} />
                        <span className="text-muted-foreground">
                          Logged {activity.duration_minutes}m on <span className="text-foreground font-medium">{activity.habit_name}</span>
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm p-4 text-center rounded-lg border border-dashed border-border text-muted-foreground">
                    No recent activity yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="habits" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Shared Habits
            </h2>
            <Button onClick={() => setIsAddHabitModalOpen(true)} className="bg-primary text-primary-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Room Habit
            </Button>
          </div>

          {habits.length === 0 ? (
            <div className="bg-surface-1 p-8 rounded-xl border border-border text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Shared Habits</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create a habit and assign it to this room to track your progress together.
              </p>
              <Button onClick={() => setIsAddHabitModalOpen(true)} className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Create First Shared Habit
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
              {habits.map((habit) => {
                const targetMinutes = habit.target_duration_minutes || 60;
                const timeSpentMinutes = dailyStats?.habitTimeSpent?.[habit.id] || 0;
                const progress = calculateProgress(timeSpentMinutes, targetMinutes);
                
                return (
                  <HabitCard
                    key={habit.id}
                    habitId={habit.id}
                    title={habit.name}
                    category={habit.category}
                    progress={progress}
                    timeSpent={formatMinutes(timeSpentMinutes)}
                    timeSpentMinutes={timeSpentMinutes}
                    targetTime={targetMinutes}
                    streakCount={dailyStats?.habitStreaks?.[habit.id] || 0}
                    color={habit.color as "cyan" | "green" | "orange" | "purple"}
                    icon={localIconMap[habit.icon || 'code2'] || <Target className="w-5 h-5" />}
                    onDelete={isOwner ? () => {
                      if (confirm(`Are you sure you want to delete the shared habit "${habit.name}"?`)) {
                        deleteHabit.mutate(habit.id);
                      }
                    } : undefined}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <div className="bg-surface-1 rounded-xl border border-border flex flex-col h-[600px] overflow-hidden">
            <div className="bg-surface-2 px-4 py-3 border-b border-border text-xs text-muted-foreground text-center">
              Messages older than 30 days are automatically deleted to save space. (No images/URLs allowed).
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                  No messages yet. Say hello!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.user_id === user?.id;
                  const member = room.members.find(m => m.user_id === msg.user_id);
                  const senderName = member ? member.display_name : 'Left Room';

                  return (
                    <div key={msg.id} className={`flex flex-col gap-1 w-full ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 px-1">
                        {!isMe && <span className="text-xs font-bold text-foreground">{senderName}</span>}
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                        </span>
                        {isMe && <span className="text-xs font-bold text-foreground ml-1">You</span>}
                      </div>
                      <div className={`text-foreground px-3 py-2 rounded-2xl text-sm border max-w-[80%] inline-block ${
                        isMe 
                          ? 'bg-primary/10 border-primary/20 rounded-tr-sm text-primary-foreground' 
                          : 'bg-surface-2 border-border rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-4 bg-background border-t border-border">
              <form onSubmit={handleSendChat} className="flex items-center gap-2">
                <Input 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type a message... (max 500 chars)"
                  className="flex-1 bg-surface-1"
                  maxLength={500}
                />
                <Button type="submit" size="icon" disabled={!chatInput.trim() || sendMessage.isPending}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AddHabitModal
        isOpen={isAddHabitModalOpen}
        onClose={() => setIsAddHabitModalOpen(false)}
        roomId={currentRoomId}
      />

      {/* Member Profile Modal */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="sm:max-w-[500px] bg-surface-1 border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                {selectedMember?.display_name?.charAt(0).toUpperCase()}
              </div>
              {selectedMember?.display_name}'s Profile
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-background border border-border flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-display font-bold text-orange-400 mb-1">
                  🔥 {selectedMember?.top_streak || 0}
                </span>
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Top Streak</span>
              </div>
              <div className="p-4 rounded-xl bg-background border border-border flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-display font-bold text-primary mb-1">
                  {formatMinutes(memberStats?.totalTime || 0)}
                </span>
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Time</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground border-b border-border pb-2">Recent Habit Activity</h3>
              <div className="space-y-2">
                {memberHabitsLoading ? (
                  <div className="text-center text-sm text-muted-foreground py-4">Loading habits...</div>
                ) : memberHabits.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">No personal habits.</div>
                ) : (
                  memberHabits.slice(0, 5).map((habit: any) => {
                    const timeSpent = memberStats?.habitTimeSpent?.[habit.id] || 0;
                    if (timeSpent === 0) return null;
                    return (
                      <div key={habit.id} className="p-3 bg-surface-2 rounded-lg text-sm border border-border flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          {habit.name}
                        </span>
                        <span className="text-green-500 font-bold text-xs uppercase">+{timeSpent} min</span>
                      </div>
                    );
                  })
                )}
                {!memberHabitsLoading && memberHabits.length > 0 && memberHabits.every((h: any) => (memberStats?.habitTimeSpent?.[h.id] || 0) === 0) && (
                   <div className="text-center text-sm text-muted-foreground py-4">No logged time today.</div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomDashboard;
