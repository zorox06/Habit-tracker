import { useState } from 'react';
import { useMyRooms, useCreateRoom, useJoinRoom } from '@/hooks/useRooms';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, LogIn, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const RoomsPage = () => {
  const { data: rooms = [], isLoading } = useMyRooms();
  const { setCurrentPage, setCurrentRoomId } = useNavigation();
  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();

  const [createName, setCreateName] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const [joinCode, setJoinCode] = useState('');
  const [joinDisplayName, setJoinDisplayName] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createDisplayName) return;
    await createRoom.mutateAsync({ name: createName, displayName: createDisplayName });
    setCreateOpen(false);
    setCreateName('');
    setCreateDisplayName('');
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode || !joinDisplayName) return;
    await joinRoom.mutateAsync({ code: joinCode, displayName: joinDisplayName });
    setJoinOpen(false);
    setJoinCode('');
    setJoinDisplayName('');
  };

  const openRoom = (id: string) => {
    setCurrentRoomId(id);
    setCurrentPage('room_detail');
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Rooms</h1>
          <p className="text-sm text-muted-foreground mt-1">Join friends and track habits together.</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border hover:bg-surface-2 text-sm">
                <LogIn className="w-4 h-4 mr-2" />
                Join Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Join a Room</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleJoin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Room Code</label>
                  <Input 
                    placeholder="Enter 6-character code" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Display Name in this Room</label>
                  <Input 
                    placeholder="e.g. Alex" 
                    value={joinDisplayName}
                    onChange={(e) => setJoinDisplayName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={joinRoom.isPending}>
                  {joinRoom.isPending ? 'Joining...' : 'Join Room'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create a Room</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Room Name</label>
                  <Input 
                    placeholder="e.g. Morning Study Group" 
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Display Name in this Room</label>
                  <Input 
                    placeholder="e.g. Alex" 
                    value={createDisplayName}
                    onChange={(e) => setCreateDisplayName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createRoom.isPending}>
                  {createRoom.isPending ? 'Creating...' : 'Create Room'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-surface-1 border border-border">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Rooms Yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            You haven't joined any rooms. Create a new room to invite friends, or enter a code to join an existing one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {rooms.map((room) => (
            <div 
              key={room.id}
              onClick={() => openRoom(room.id)}
              className="p-5 rounded-xl bg-surface-1 border border-border hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center border border-border">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="px-2 py-1 rounded bg-surface-2 text-xs font-mono text-muted-foreground border border-border">
                  Code: {room.code}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {room.name}
              </h3>
              <div className="flex items-center text-sm text-muted-foreground mt-4 justify-between">
                <span>{room.members?.length || 0} Members</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomsPage;
