import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Player {
  id: string;
  name: string;
  bet: number;
  color: string;
}

interface GameHistory {
  id: string;
  winner: Player;
  players: Player[];
  timestamp: Date;
}

const COLORS = [
  '#8B5CF6', '#D946EF', '#F97316', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
];

export default function Index() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [playerBet, setPlayerBet] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Player | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    spinAudioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiP1/POfS0GKXzN8dyTRAwYbL3r7Z1RCQxNo+TzwXEjBjiR1/PM' );
    winAudioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiP1/POfS0GKXzN8dyTRAwYbL3r7Z1RCQxNo+TzwXEjBjiR1/PM');
  }, []);

  const addPlayer = () => {
    if (!playerName.trim() || !playerBet || parseFloat(playerBet) <= 0) {
      toast.error('Введите имя и ставку игрока');
      return;
    }

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: playerName.trim(),
      bet: parseFloat(playerBet),
      color: COLORS[players.length % COLORS.length]
    };

    setPlayers([...players, newPlayer]);
    setPlayerName('');
    setPlayerBet('');
    toast.success(`${newPlayer.name} добавлен в игру!`);
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const spinWheel = () => {
    if (players.length < 2) {
      toast.error('Добавьте минимум 2 игрока');
      return;
    }

    setSpinning(true);
    setWinner(null);
    
    if (spinAudioRef.current) {
      spinAudioRef.current.currentTime = 0;
      spinAudioRef.current.play().catch(() => {});
    }

    const totalBets = players.reduce((sum, p) => sum + p.bet, 0);
    const random = Math.random() * totalBets;
    let cumulative = 0;
    let selectedPlayer = players[0];

    for (const player of players) {
      cumulative += player.bet;
      if (random <= cumulative) {
        selectedPlayer = player;
        break;
      }
    }

    const winnerIndex = players.indexOf(selectedPlayer);
    const segmentAngle = 360 / players.length;
    const targetAngle = (winnerIndex * segmentAngle) + (segmentAngle / 2);
    const spins = 5;
    const finalRotation = (spins * 360) + (360 - targetAngle) + rotation;

    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      setWinner(selectedPlayer);
      
      if (winAudioRef.current) {
        winAudioRef.current.currentTime = 0;
        winAudioRef.current.play().catch(() => {});
      }

      const newHistory: GameHistory = {
        id: Date.now().toString(),
        winner: selectedPlayer,
        players: [...players],
        timestamp: new Date()
      };
      setGameHistory([newHistory, ...gameHistory]);

      toast.success(`🎉 ${selectedPlayer.name} победил!`, {
        duration: 5000,
      });
    }, 4000);
  };

  const totalBets = players.reduce((sum, p) => sum + p.bet, 0);

  const leaderboard = [...gameHistory.reduce((acc, game) => {
    const existing = acc.get(game.winner.name);
    if (existing) {
      existing.wins += 1;
      existing.totalWon += game.winner.bet;
    } else {
      acc.set(game.winner.name, {
        name: game.winner.name,
        wins: 1,
        totalWon: game.winner.bet
      });
    }
    return acc;
  }, new Map()).values()].sort((a, b) => b.wins - a.wins);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-950/50 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-float">
            🎰 РУЛЕТКА
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Добавляйте игроков, делайте ставки, крутите колесо!
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">Колесо фортуны</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative mb-8">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-accent drop-shadow-lg" />
                  </div>
                  
                  <div
                    ref={wheelRef}
                    className="relative w-80 h-80 md:w-96 md:h-96 rounded-full border-8 border-primary shadow-2xl"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                      background: players.length > 0
                        ? `conic-gradient(${players.map((p, i) => {
                            const start = (i / players.length) * 100;
                            const end = ((i + 1) / players.length) * 100;
                            return `${p.color} ${start}%, ${p.color} ${end}%`;
                          }).join(', ')})`
                        : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))'
                    }}
                  >
                    {players.map((player, index) => {
                      const angle = (index / players.length) * 360 + (360 / players.length / 2);
                      const radius = 140;
                      const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
                      const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
                      
                      return (
                        <div
                          key={player.id}
                          className="absolute top-1/2 left-1/2 text-white font-bold text-sm md:text-base drop-shadow-lg"
                          style={{
                            transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle}deg)`,
                          }}
                        >
                          <div className="rotate-90">
                            {player.name}
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-background rounded-full border-4 border-primary flex items-center justify-center">
                      <Icon name="Sparkles" className="text-primary" size={32} />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={spinWheel}
                  disabled={spinning || players.length < 2}
                  size="lg"
                  className="text-xl px-12 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 animate-pulse-glow"
                >
                  {spinning ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" />
                      Крутим...
                    </>
                  ) : (
                    <>
                      <Icon name="PlayCircle" className="mr-2" />
                      КРУТИТЬ!
                    </>
                  )}
                </Button>

                {winner && (
                  <div className="mt-8 text-center">
                    <div className="text-4xl mb-2 animate-bounce">🏆</div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                      Победитель: {winner.name}!
                    </h3>
                    <p className="text-xl text-muted-foreground mt-2">
                      Выигрыш: {totalBets.toFixed(2)} 💰
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-2 border-secondary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Добавить игрока</CardTitle>
                <CardDescription>Укажите имя и ставку</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="playerName">Имя игрока</Label>
                  <Input
                    id="playerName"
                    placeholder="Введите имя"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="playerBet">Ставка</Label>
                  <Input
                    id="playerBet"
                    type="number"
                    placeholder="0"
                    value={playerBet}
                    onChange={(e) => setPlayerBet(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                    className="mt-2"
                    step="0.01"
                    min="0"
                  />
                </div>

                <Button onClick={addPlayer} className="w-full" size="lg">
                  <Icon name="UserPlus" className="mr-2" />
                  Добавить
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3 flex items-center justify-between">
                    <span>Игроки ({players.length})</span>
                    <span className="text-sm text-muted-foreground">Банк: {totalBets.toFixed(2)}</span>
                  </h4>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {players.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Добавьте игроков для начала
                      </p>
                    ) : (
                      players.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                          style={{ borderColor: player.color, backgroundColor: `${player.color}20` }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: player.color }}
                            />
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Ставка: {player.bet.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePlayer(player.id)}
                            disabled={spinning}
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="history">
              <Icon name="History" className="mr-2" size={18} />
              История игр
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Icon name="Trophy" className="mr-2" size={18} />
              Рейтинг
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="mt-6">
            <Card className="border-2 border-accent/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>История игр</CardTitle>
                <CardDescription>Последние розыгрыши</CardDescription>
              </CardHeader>
              <CardContent>
                {gameHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    История игр пуста. Сыграйте первую игру!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {gameHistory.slice(0, 10).map((game) => (
                      <div
                        key={game.id}
                        className="p-4 rounded-lg border border-primary/20 bg-muted/20 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon name="Trophy" className="text-accent" size={20} />
                            <span className="font-bold text-lg">{game.winner.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {game.timestamp.toLocaleTimeString('ru-RU')}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Участники: {game.players.map(p => p.name).join(', ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Банк: {game.players.reduce((sum, p) => sum + p.bet, 0).toFixed(2)} 💰
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-6">
            <Card className="border-2 border-secondary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Рейтинг игроков</CardTitle>
                <CardDescription>Топ победителей</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Рейтинг пуст. Начните играть!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((player, index) => (
                      <div
                        key={player.name}
                        className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-muted/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl font-black text-primary">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-lg">{player.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {player.wins} {player.wins === 1 ? 'победа' : 'побед'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-accent">
                            {player.totalWon.toFixed(2)} 💰
                          </div>
                          <div className="text-xs text-muted-foreground">
                            выиграно
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="text-center mt-12 text-muted-foreground">
          <p className="text-sm">
            Удачи! 🍀 Играйте ответственно
          </p>
        </footer>
      </div>
    </div>
  );
}
