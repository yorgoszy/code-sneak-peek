import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Target, Shield, Clock, TrendingUp, Users, Swords, Plus, Settings, Activity, Film } from 'lucide-react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';
import { useVideoAnalysisStats } from '@/hooks/useVideoAnalysisStats';
import { FightRecordingDialog } from './FightRecordingDialog';
import { StrikeTypesDialog } from './StrikeTypesDialog';
import { VideoEditorTab } from './VideoEditorTab';
import { FightsHistoryTab } from './FightsHistoryTab';

export const AdminVideoAnalysisOverview = () => {
  const { userProfile } = useRoleCheck();
  const adminId = userProfile?.id; // Admin uses their own ID
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  const [isStrikeTypesOpen, setIsStrikeTypesOpen] = useState(false);
  
  const { stats, loading } = useVideoAnalysisStats(selectedUserId);

  const statCards = [
    {
      title: 'Συνολικά Χτυπήματα',
      value: stats?.totalStrikes || 0,
      subtitle: `${stats?.landedStrikes || 0} επιτυχημένα`,
      icon: Target,
      color: 'text-[#00ffba]',
      bgColor: 'bg-[#00ffba]/10',
    },
    {
      title: 'Ακρίβεια',
      value: `${stats?.accuracy || 0}%`,
      subtitle: 'Strike Accuracy',
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Ορθότητα',
      value: `${stats?.correctnessRate || 0}%`,
      subtitle: `${stats?.correctStrikes || 0} σωστά τεχνικά`,
      icon: Activity,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Χτ. που Δέχτηκε',
      value: stats?.totalHitsReceived || 0,
      subtitle: `${stats?.avgHitsReceivedPerRound || 0} ανά γύρο`,
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Άμυνες',
      value: stats?.totalDefenses || 0,
      subtitle: `${stats?.successfulDefenses || 0} επιτυχημένες`,
      icon: Shield,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Χρόνος Δράσης',
      value: `${stats?.actionTimeMinutes || 0}'`,
      subtitle: 'Ενεργός χρόνος',
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const styleInfo = {
    aggressive: { label: 'Επιθετικός', color: 'bg-red-500' },
    defensive: { label: 'Αμυντικός', color: 'bg-blue-500' },
    balanced: { label: 'Ισορροπημένος', color: 'bg-green-500' },
  };

  const currentStyle = stats?.fightStyle || 'balanced';

  return (
    <div className="space-y-4 p-3 md:p-4">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Button
            onClick={() => setIsStrikeTypesOpen(true)}
            variant="outline"
            size="sm"
            className="rounded-none h-9"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <div className="flex-1 max-w-xs">
            <UserSearchCombobox
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              placeholder="Επιλέξτε χρήστη..."
              coachId={adminId}
            />
          </div>
        </div>
      </div>

      {!selectedUserId ? (
        <Card className="rounded-none">
          <CardContent className="py-8 text-center">
            <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">Επιλέξτε χρήστη</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-none animate-pulse">
              <CardContent className="py-4">
                <div className="h-12 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Compact Stats Cards - 2 rows of 3 */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {statCards.map((card, index) => (
              <Card key={index} className="rounded-none">
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 ${card.bgColor} rounded-none`}>
                      <card.icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-lg font-bold ${card.color} leading-tight`}>{card.value}</p>
                      <p className="text-[10px] text-gray-500 truncate">{card.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Compact Fight Style */}
          <div className="flex items-center gap-3 px-2">
            <Swords className="w-4 h-4 text-gray-400" />
            <div className={`px-3 py-1 ${styleInfo[currentStyle as keyof typeof styleInfo].color} text-white text-sm font-medium rounded-none`}>
              {styleInfo[currentStyle as keyof typeof styleInfo].label}
            </div>
            <span className="text-xs text-gray-500">
              Επ/Άμ: {stats?.attackDefenseRatio?.toFixed(2) || '1.00'}
            </span>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="editor" className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="flex w-max sm:grid sm:w-full sm:grid-cols-5 rounded-none h-8 gap-0.5">
                <TabsTrigger value="editor" className="rounded-none text-xs py-1.5 px-3 whitespace-nowrap flex items-center gap-1">
                  <Film className="w-3 h-3" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="strikes" className="rounded-none text-xs py-1.5 px-3 whitespace-nowrap">Χτυπήματα</TabsTrigger>
                <TabsTrigger value="defense" className="rounded-none text-xs py-1.5 px-3 whitespace-nowrap">Άμυνα</TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-none text-xs py-1.5 px-3 whitespace-nowrap">Χρονική</TabsTrigger>
                <TabsTrigger value="fights" className="rounded-none text-xs py-1.5 px-3 whitespace-nowrap">Αγώνες</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="strikes" className="mt-4">
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle>Ανάλυση Χτυπημάτων</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { type: 'Γροθιές', landed: stats?.punchesLanded || 0, total: stats?.punchesTotal || 0 },
                      { type: 'Κλωτσιές', landed: stats?.kicksLanded || 0, total: stats?.kicksTotal || 0 },
                      { type: 'Γόνατα', landed: stats?.kneesLanded || 0, total: stats?.kneesTotal || 0 },
                      { type: 'Αγκώνες', landed: stats?.elbowsLanded || 0, total: stats?.elbowsTotal || 0 },
                    ].map((item, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-none text-center">
                        <p className="text-sm text-gray-500">{item.type}</p>
                        <p className="text-2xl font-bold text-[#00ffba]">{item.landed}</p>
                        <p className="text-xs text-gray-400">από {item.total}</p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-none">
                          <div 
                            className="h-full bg-[#00ffba] rounded-none" 
                            style={{ width: `${item.total > 0 ? (item.landed / item.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Side Distribution */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-none text-center">
                      <p className="text-sm text-gray-500">Αριστερό</p>
                      <p className="text-2xl font-bold text-blue-500">{stats?.leftSideStrikes || 0}</p>
                      <p className="text-xs text-gray-400">{stats?.leftSidePercentage || 0}%</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-none text-center">
                      <p className="text-sm text-gray-500">Δεξί</p>
                      <p className="text-2xl font-bold text-red-500">{stats?.rightSideStrikes || 0}</p>
                      <p className="text-xs text-gray-400">{stats?.rightSidePercentage || 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="defense" className="mt-4">
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle>Ανάλυση Άμυνας</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { type: 'Block', success: stats?.blocksSuccess || 0, total: stats?.blocksTotal || 0 },
                      { type: 'Dodge', success: stats?.dodgesSuccess || 0, total: stats?.dodgesTotal || 0 },
                      { type: 'Parry', success: stats?.parriesSuccess || 0, total: stats?.parriesTotal || 0 },
                      { type: 'Clinch', success: stats?.clinchSuccess || 0, total: stats?.clinchTotal || 0 },
                    ].map((item, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-none text-center">
                        <p className="text-sm text-gray-500">{item.type}</p>
                        <p className="text-2xl font-bold text-purple-500">{item.success}</p>
                        <p className="text-xs text-gray-400">από {item.total}</p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-none">
                          <div 
                            className="h-full bg-purple-500 rounded-none" 
                            style={{ width: `${item.total > 0 ? (item.success / item.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="editor" className="mt-4">
              <VideoEditorTab userId={selectedUserId} />
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle>Χρονική Ανάλυση</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-center py-8">
                    Επιλέξτε αγώνα για χρονική ανάλυση ανά γύρο
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fights" className="mt-2">
              <FightsHistoryTab userId={selectedUserId} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Fight Recording Dialog */}
      <FightRecordingDialog
        isOpen={isRecordingOpen}
        onClose={() => setIsRecordingOpen(false)}
        userId={selectedUserId}
        coachId={adminId}
        onSuccess={() => {
          // Trigger refresh
          setSelectedUserId('');
          setTimeout(() => setSelectedUserId(selectedUserId), 100);
        }}
      />

      {/* Strike Types Management Dialog */}
      <StrikeTypesDialog
        isOpen={isStrikeTypesOpen}
        onClose={() => setIsStrikeTypesOpen(false)}
        coachId={adminId}
      />
    </div>
  );
};
