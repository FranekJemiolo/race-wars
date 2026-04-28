import React, {useState} from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Search, Book, Video, MessageCircle, ChevronRight} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  videoUrl?: string;
  relatedArticles?: string[];
}

const helpArticles: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Race Wars',
    category: 'Basics',
    content: `
      <h2>Welcome to Race Wars!</h2>
      <p>Race Wars is a GPS-based racing platform that allows you to participate in tracked racing sessions using your smartphone.</p>
      
      <h3>Quick Start</h3>
      <ol>
        <li>Create an account or sign in</li>
        <li>Add your car profile</li>
        <li>Browse available sessions</li>
        <li>Register for a session</li>
        <li>Start tracking during the race</li>
      </ol>
      
      <h3>Required Equipment</h3>
      <ul>
        <li>Smartphone with GPS</li>
        <li>Phone mount for your vehicle</li>
        <li>Stable internet connection</li>
      </ul>
    `,
  },
  {
    id: 'sessions',
    title: 'Understanding Sessions',
    category: 'Sessions',
    content: `
      <h2>Session Types</h2>
      <p>Race Wars supports several types of sessions:</p>
      
      <h3>Race</h3>
      <p>Competitive racing sessions with positions, lap times, and penalties.</p>
      
      <h3>Practice</h3>
      <p>Non-competitive sessions for learning tracks and improving lap times.</p>
      
      <h3>Qualifying</h3>
      <p>Time trial sessions to determine starting positions for races.</p>
      
      <h3>Hot Lap</h3>
      <p>Single-lap time attack sessions for setting personal bests.</p>
    `,
  },
  {
    id: 'gps-tracking',
    title: 'GPS Tracking Guide',
    category: 'Technical',
    content: `
      <h2>How GPS Tracking Works</h2>
      <p>Race Wars uses your phone's GPS to track your position in real-time during sessions.</p>
      
      <h3>Best Practices</h3>
      <ul>
        <li>Mount your phone with a clear view of the sky</li>
        <li>Keep the app open during sessions</li>
        <li>Ensure location services are enabled</li>
        <li>Use high accuracy mode for best results</li>
      </ul>
      
      <h3>Troubleshooting</h3>
      <p>If GPS accuracy is poor, try moving to an area with better sky visibility or restarting the app.</p>
    `,
  },
  {
    id: 'incidents',
    title: 'Understanding Incidents',
    category: 'Rules',
    content: `
      <h2>Incident Detection</h2>
      <p>Race Wars automatically detects certain incidents during sessions:</p>
      
      <h3>Off-Track</h3>
      <p>When your vehicle leaves the designated track boundaries.</p>
      
      <h3>Collision</h3>
      <p>Contact between vehicles detected via GPS proximity.</p>
      
      <h3>Spin</h3>
      <p>Rapid heading change indicating loss of control.</p>
      
      <h3>Stall</h3>
      <p>Vehicle stops unexpectedly on track.</p>
      
      <h3>Penalties</h3>
      <p>Incidents may result in time penalties, grid penalties, or points deductions depending on severity.</p>
    `,
  },
  {
    id: 'car-profiles',
    title: 'Managing Car Profiles',
    category: 'Account',
    content: `
      <h2>Car Profiles</h2>
      <p>Car profiles allow you to register your vehicle for racing sessions.</p>
      
      <h3>Adding a Car Profile</h3>
      <ol>
        <li>Go to Settings > My Cars</li>
        <li>Click "Add New Car"</li>
        <li>Enter your car details (make, model, year, color)</li>
        <li>Upload a photo (optional)</li>
        <li>Set as default if this is your primary car</li>
      </ol>
      
      <h3>Car Specifications</h3>
      <p>You can optionally add engine details, performance specs, and modifications to help with fair classification.</p>
    `,
  },
];

const categories = ['All', 'Basics', 'Sessions', 'Technical', 'Rules', 'Account'];

export function HelpSystem() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const filteredArticles = helpArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Book className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[600px]">
        <DialogHeader>
          <DialogTitle>Help Center</DialogTitle>
        </DialogHeader>
        <div className="flex h-full gap-4">
          {/* Sidebar */}
          <div className="w-64 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex flex-col gap-1">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'ghost'}
                  className="justify-start"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Article List */}
          {!selectedArticle ? (
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {filteredArticles.map((article) => (
                  <Button
                    key={article.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-medium">{article.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {article.category}
                      </span>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </Button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            /* Article Content */
            <ScrollArea className="flex-1">
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedArticle(null)}
                >
                  ← Back to articles
                </Button>
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedArticle.title}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {selectedArticle.category}
                  </span>
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{__html: selectedArticle.content}}
                />
                {selectedArticle.videoUrl && (
                  <Button variant="outline" className="gap-2">
                    <Video className="h-4 w-4" />
                    Watch Video Tutorial
                  </Button>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
