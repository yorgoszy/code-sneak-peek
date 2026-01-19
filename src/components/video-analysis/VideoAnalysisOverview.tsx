import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Target, Shield, Clock, Activity, TrendingUp, Users, Swords, Plus, Settings, Film } from 'lucide-react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';
import { useVideoAnalysisStats } from '@/hooks/useVideoAnalysisStats';
import { FightRecordingDialog } from './FightRecordingDialog';
import { StrikeTypesDialog } from './StrikeTypesDialog';
import { VideoEditorTab } from './VideoEditorTab';
import { FightsHistoryTab } from './FightsHistoryTab';
import { useCoachContext } from '@/contexts/CoachContext';

export const VideoAnalysisOverview = () => {
  const { userProfile } = useRoleCheck();
  const { coachId } = useCoachContext();
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header με User Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Analysis</h1>
          <p className="text-gray-500 text-sm mt-1">Ανάλυση βίντεο και στατιστικά απόδοσης</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsStrikeTypesOpen(true)}
            variant="outline"
            className="rounded-none"
          >
            <Settings className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Χτυπήματα</span>
          </Button>
          <div className="w-full md:w-80">
            <UserSearchCombobox
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              placeholder="Επιλέξτε χρήστη..."
              coachId={coachId}
            />
          </div>
          {selectedUserId && (
            <Button
              onClick={() => setIsRecordingOpen(true)}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Νέος Αγώνας</span>
              <span className="sm:hidden">Νέος</span>
            </Button>
          )}
        </div>
      </div>

      {!selectedUserId ? (
        <Card className="rounded-none">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Επιλέξτε χρήστη για να δείτε τα στατιστικά</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-none animate-pulse">
              <CardContent className="py-6">
                <div className="h-20 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Hero Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((card, index) => (
              <Card key={index} className="rounded-none hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{card.title}</p>
                      <p className={`text-3xl font-bold ${card.color} mt-1`}>{card.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                    </div>
                    <div className={`p-3 ${card.bgColor} rounded-none`}>
                      <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Fight Style Badge */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="w-5 h-5" />
                Στυλ Μάχης
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 ${styleInfo[currentStyle as keyof typeof styleInfo].color} text-white font-semibold rounded-none`}>
                  {styleInfo[currentStyle as keyof typeof styleInfo].label}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Αναλογία Επίθεσης/Άμυνας:</span>{' '}
                  {stats?.attackDefenseRatio?.toFixed(2) || '1.00'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs για λεπτομερή ανάλυση */}
          <Tabs defaultValue="strikes" className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="flex w-max sm:grid sm:w-full sm:grid-cols-5 rounded-none h-auto gap-1">
                <TabsTrigger value="strikes" className="rounded-none text-xs sm:text-sm py-2 px-4 whitespace-nowrap flex-shrink-0">Χτυπήματα</TabsTrigger>
                <TabsTrigger value="defense" className="rounded-none text-xs sm:text-sm py-2 px-4 whitespace-nowrap flex-shrink-0">Άμυνα</TabsTrigger>
                <TabsTrigger value="editor" className="rounded-none text-xs sm:text-sm py-2 px-4 whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                  <Film className="w-3 h-3" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-none text-xs sm:text-sm py-2 px-4 whitespace-nowrap flex-shrink-0">Χρονική</TabsTrigger>
                <TabsTrigger value="fights" className="rounded-none text-xs sm:text-sm py-2 px-4 whitespace-nowrap flex-shrink-0">Αγώνες</TabsTrigger>
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
              <VideoEditorTab />
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

            <TabsContent value="fights" className="mt-4">
              <FightsHistoryTab 
                userId={selectedUserId} 
                onRefresh={() => {
                  setSelectedUserId('');
                  setTimeout(() => setSelectedUserId(selectedUserId), 100);
                }}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Fight Recording Dialog */}
      <FightRecordingDialog
        isOpen={isRecordingOpen}
        onClose={() => setIsRecordingOpen(false)}
        userId={selectedUserId}
        coachId={coachId}
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
        coachId={coachId}
      />
    </div>
  );
};
