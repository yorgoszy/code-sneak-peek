import React, { useState, useEffect, useCallback } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
...
  const renderSidebar = () => (
    isAdmin()
      ? <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      : <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

  const getAthleteAvatar = (athlete: { name: string; photo_url: string | null; avatar_url: string | null } | null | undefined) => {
    if (!athlete) return null;
    return athlete.photo_url || athlete.avatar_url;
  };

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <div className="hidden lg:block">{renderSidebar()}</div>

        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">{t('federation.brackets.mobileTitle')}</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-2 lg:p-3 overflow-auto flex flex-col min-h-0">
            {/* Compact header row: title + competition + actions + filters all in one line */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="hidden lg:block text-lg font-bold text-foreground whitespace-nowrap">{t('federation.brackets.title')}</h1>
              
              {/* Competition selector */}
              <div className="w-44">
                <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                  <SelectTrigger className="rounded-none h-8 text-xs">
                    <SelectValue placeholder={t('federation.brackets.selectCompetition')} />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              {selectedCompId && categories.length > 0 && (
                <>
                  {(() => {
                    const selectedComp = competitions.find(c => c.id === selectedCompId);
                    const isDrawFirst = selectedComp?.competition_flow === 'draw_first';
                    const weighInEnded = selectedComp?.weigh_in_ended_at && !selectedComp?.weigh_in_active;
                    // In draw_first mode, bracket can be generated without weigh-in
                    const canGenerate = isDrawFirst || weighInEnded;
                    return (
                      <>
                        {!hasAnyMatches && (
                          <Button 
                            onClick={handleGenerateAllBrackets} 
                            disabled={generatingAll || !canGenerate}
                            size="sm"
                            className="rounded-none bg-foreground text-background hover:bg-foreground/90 h-8 text-xs"
                            title={!canGenerate ? 'Η ζύγιση πρέπει να ολοκληρωθεί πρώτα' : ''}
                          >
                            <Shuffle className="h-3 w-3 mr-1" />
                            {generatingAll ? '...' : !canGenerate ? 'Αναμονή ζύγισης...' : t('federation.brackets.generateDraw')}
                          </Button>
                        )}
                      </>
                    );
                  })()}
                  {hasAnyMatches && (
                    <Button variant="outline" size="sm" onClick={() => setResetDialogOpen(true)} className="rounded-none text-destructive border-destructive h-8 text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      {t('federation.brackets.resetDraw')}
                    </Button>
                  )}

                  {/* Filters inline */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Select value={filterGender} onValueChange={handleGenderChange}>
                      <SelectTrigger className="rounded-none h-8 text-xs w-28">
                        <SelectValue placeholder={t('federation.brackets.genderFilter')} />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map(g => (
                          <SelectItem key={g} value={g}>
                            {g === 'male' ? t('federation.brackets.men') : t('federation.brackets.women')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterAge} onValueChange={handleAgeChange} disabled={!filterGender}>
                      <SelectTrigger className="rounded-none h-8 text-xs w-24">
                        <SelectValue placeholder={t('federation.brackets.ageFilter')} />
                      </SelectTrigger>
                      <SelectContent>
                        {ageOptions.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterWeight} onValueChange={setFilterWeight} disabled={!filterAge}>
                      <SelectTrigger className="rounded-none h-8 text-xs w-32">
                        <SelectValue placeholder={t('federation.brackets.weightFilter')} />
                      </SelectTrigger>
                      <SelectContent>
                        {weightOptions.map(w => (
                          <SelectItem key={w.id} value={w.id}>
                            <span className="flex items-center gap-1">
                              <span>{w.label}</span>
                              {w.count > 0 && (
                                <Badge className="rounded-none text-[8px] h-3.5 px-1 bg-foreground text-background">
                                  {w.count}
                                </Badge>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Selected category badge - compact */}
            {selectedCategoryId && (
              <div className="mb-1">
                <Badge variant="outline" className="rounded-none text-xs py-0.5 px-2">
                  {categories.find(c => c.id === selectedCategoryId)?.name}
                </Badge>
              </div>
            )}

            {/* Bracket Display */}
            {matches.length > 0 && (() => {
              const CARD_H = 110;
              const CARD_GAP = 40;
              const COL_W = 300;
              const CONNECTOR_W = 60;
              const HEADER_H = 41;

              // Non-bye matches per round, sorted by match_order (global sequence) for top-to-bottom display
              const roundMatchArrays = sortedRoundNumbers.map(rn =>
                rounds[rn].filter(m => !m.is_bye).sort((a, b) => (a.match_order || a.match_number) - (b.match_order || b.match_number))
              );
              const firstRoundCount = roundMatchArrays[0]?.length || 1;
              const maxMatchesInAnyRound = Math.max(...roundMatchArrays.map(r => r.length), 1);

               // Initial height: guarantee minimum spacing for all matches
               const minSpacing = CARD_H + CARD_GAP;
               const contentH = HEADER_H + maxMatchesInAnyRound * (CARD_H + CARD_GAP) + 40;
               let totalH = Math.max(contentH, 700);
               const totalW = sortedRoundNumbers.length * (COL_W + CONNECTOR_W);

              // Build a lookup: roundNumber -> match_number -> Match
              const matchByRoundAndNum = new Map<string, Match>();
              sortedRoundNumbers.forEach(rn => {
                rounds[rn].forEach(m => {
                  matchByRoundAndNum.set(`${rn}-${m.match_number}`, m);
                });
              });

              // Y-center positions keyed by match id
              const yPositions = new Map<string, number>();

               // First round: use guaranteed minimum spacing, start right below header
               const firstRoundSpacing = Math.max((totalH - HEADER_H) / firstRoundCount, minSpacing);
               roundMatchArrays[0]?.forEach((m, i) => {
                 yPositions.set(m.id, HEADER_H + 20 + i * firstRoundSpacing + CARD_H / 2);
               });

               // Subsequent rounds: position at midpoint of feeder matches
               for (let ri = 1; ri < sortedRoundNumbers.length; ri++) {
                 const prevRound = sortedRoundNumbers[ri - 1];

                 roundMatchArrays[ri].forEach((m, mi) => {
                   const feederNum1 = m.match_number * 2 - 1;
                   const feederNum2 = m.match_number * 2;

                   const feeder1 = matchByRoundAndNum.get(`${prevRound}-${feederNum1}`);
                   const feeder2 = matchByRoundAndNum.get(`${prevRound}-${feederNum2}`);

                   const y1 = feeder1 && !feeder1.is_bye ? yPositions.get(feeder1.id) : undefined;
                   const y2 = feeder2 && !feeder2.is_bye ? yPositions.get(feeder2.id) : undefined;

                   let yCenter: number;
                   if (y1 !== undefined && y2 !== undefined) {
                     yCenter = (y1 + y2) / 2;
                   } else if (y1 !== undefined) {
                     yCenter = y1;
                   } else if (y2 !== undefined) {
                     yCenter = y2;
                   } else {
                     const spacing = totalH / (roundMatchArrays[ri].length + 1);
                     yCenter = spacing * (mi + 1);
                   }
                   yPositions.set(m.id, yCenter);
                 });

                  // Collision resolution: enforce strict visual order by global match number
                  const roundMatches = roundMatchArrays[ri];
                  const sortedByOrder = [...roundMatches].sort(
                    (a, b) => (a.match_order || a.match_number) - (b.match_order || b.match_number)
                  );

                  for (let j = 1; j < sortedByOrder.length; j++) {
                    const prevY = yPositions.get(sortedByOrder[j - 1].id) || 0;
                    const currY = yPositions.get(sortedByOrder[j].id) || 0;
                    if (currY - prevY < minSpacing) {
                      yPositions.set(sortedByOrder[j].id, prevY + minSpacing);
                    }
                  }
               }

               // Recalculate totalH based on actual positions after collision resolution
               let maxY = 0;
               yPositions.forEach(y => {
                 const bottom = y + CARD_H / 2;
                 if (bottom > maxY) maxY = bottom;
               });
               totalH = Math.max(totalH, maxY + 40);

               // Global match numbering - use match_order from DB (global across all categories)
               const globalMatchNumbers = new Map<string, number>();
               sortedRoundNumbers.forEach(rn => {
                 roundMatchArrays[sortedRoundNumbers.indexOf(rn)].forEach(m => {
                   if (m.match_order) {
                     globalMatchNumbers.set(m.id, m.match_order);
                   }
                 });
               });

              return (
                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto border border-border bg-muted/10 p-3" style={{ height: 'calc(100vh - 80px)' }}>
                  <div className="relative" style={{ width: totalW, minHeight: totalH }}>
                    {sortedRoundNumbers.map((roundNum, ri) => {
                      const rMatches = roundMatchArrays[ri];
                      const xOffset = ri * (COL_W + CONNECTOR_W);

                      return (
                        <React.Fragment key={roundNum}>
                          {/* Round header */}
                          <div
                            className="absolute bg-foreground text-background px-3 py-1.5 border border-border"
                            style={{ left: xOffset, top: 0, width: COL_W }}
                          >
                            <h3 className="font-bold text-xs">
                              {getRoundName(roundNum, t)}
                            </h3>
                            <span className="text-[10px] opacity-70">{rMatches.length} {t('federation.brackets.matchesCount')}</span>
                          </div>

                          {/* Match cards */}
                          {rMatches.map((match) => {
                            const yCenter = yPositions.get(match.id) || 0;
                            const yTop = yCenter - CARD_H / 2;
                            const globalMatchNum = globalMatchNumbers.get(match.id) || 0;
                            const slot1 = getSlotDisplayName(match, 'athlete1', globalMatchNumbers);
                            const slot2 = getSlotDisplayName(match, 'athlete2', globalMatchNumbers);

                            return (
                              <div
                                key={match.id}
                                className={`absolute border cursor-pointer transition-all hover:shadow-lg bg-card ${
                                  match.status === 'completed' ? 'border-[#00ffba] shadow-sm' : 'border-border'
                                }`}
                                style={{ left: xOffset, top: yTop, width: COL_W, height: CARD_H, overflow: 'hidden' }}
                                onClick={() => openWinnerDialog(match)}
                              >
                                {/* Match number header */}
                                <div className="flex items-center justify-between px-2.5 py-1 bg-muted/50 border-b border-border">
                                  <span className="text-[11px] font-bold text-foreground">{t('federation.brackets.fight')} {globalMatchNum}</span>
                                  {match.status === 'completed' && match.result_type && (
                                    <Badge variant="secondary" className="rounded-none text-[9px] h-4 px-1.5 uppercase">
                                      {match.result_type}
                                      {match.athlete1_score && ` ${match.athlete1_score}`}
                                      {match.athlete2_score && ` ${match.athlete2_score}`}
                                    </Badge>
                                  )}
                                </div>

                                {/* Athlete 1 - Red corner */}
                                <div className={`flex items-center gap-2 px-2.5 py-1.5 border-l-[3px] border-l-red-500 ${
                                  match.winner_id === match.athlete1_id ? 'bg-[#00ffba]/10' : ''
                                }`}>
                                  <Avatar className="h-6 w-6 shrink-0">
                                    <AvatarImage src={getAthleteAvatar(match.athlete1) || undefined} />
                                    <AvatarFallback className="text-[10px] bg-red-100 text-red-700">
                                      {match.athlete1?.name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[12px] leading-tight truncate ${slot1.isConfirmed ? 'font-bold text-red-700' : 'text-muted-foreground italic text-[11px]'}`}>
                                      {slot1.name}
                                    </p>
                                    {match.athlete1_club && (
                                      <p className="text-[10px] text-muted-foreground truncate leading-tight">{match.athlete1_club.name}</p>
                                    )}
                                  </div>
                                  {match.winner_id === match.athlete1_id && (
                                    <Trophy className="h-3.5 w-3.5 text-[#cb8954] shrink-0" />
                                  )}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-border/50" />

                                {/* Athlete 2 - Blue corner */}
                                <div className={`flex items-center gap-2 px-2.5 py-1.5 border-l-[3px] border-l-blue-500 ${
                                  match.winner_id === match.athlete2_id ? 'bg-[#00ffba]/10' : ''
                                }`}>
                                  <Avatar className="h-6 w-6 shrink-0">
                                    <AvatarImage src={getAthleteAvatar(match.athlete2) || undefined} />
                                    <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                                      {match.athlete2?.name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[12px] leading-tight truncate ${slot2.isConfirmed ? 'font-bold text-blue-700' : 'text-muted-foreground italic text-[11px]'}`}>
                                      {slot2.name}
                                    </p>
                                    {match.athlete2_club && (
                                      <p className="text-[10px] text-muted-foreground truncate leading-tight">{match.athlete2_club.name}</p>
                                    )}
                                  </div>
                                  {match.winner_id === match.athlete2_id && (
                                    <Trophy className="h-3.5 w-3.5 text-[#cb8954] shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Connector lines to next round */}
                          {ri < sortedRoundNumbers.length - 1 && (
                            <svg
                              className="absolute overflow-visible pointer-events-none"
                              style={{
                                left: xOffset + COL_W,
                                top: 0,
                                width: CONNECTOR_W,
                                height: totalH,
                              }}
                            >
                              {roundMatchArrays[ri + 1].map((nextMatch) => {
                                const prevRound = sortedRoundNumbers[ri];
                                const feederNum1 = nextMatch.match_number * 2 - 1;
                                const feederNum2 = nextMatch.match_number * 2;

                                const feeder1 = matchByRoundAndNum.get(`${prevRound}-${feederNum1}`);
                                const feeder2 = matchByRoundAndNum.get(`${prevRound}-${feederNum2}`);

                                const y1 = feeder1 && !feeder1.is_bye ? yPositions.get(feeder1.id) : undefined;
                                const y2 = feeder2 && !feeder2.is_bye ? yPositions.get(feeder2.id) : undefined;
                                const yNext = yPositions.get(nextMatch.id) || 0;

                                if (y1 === undefined && y2 === undefined) return null;

                                const halfW = CONNECTOR_W / 2;

                                return (
                                  <g key={nextMatch.id}>
                                    {y1 !== undefined && (
                                      <line x1="0" y1={y1} x2={halfW} y2={y1} stroke="hsl(var(--border))" strokeWidth="1.5" />
                                    )}
                                    {y2 !== undefined && (
                                      <line x1="0" y1={y2} x2={halfW} y2={y2} stroke="hsl(var(--border))" strokeWidth="1.5" />
                                    )}
                                    {y1 !== undefined && y2 !== undefined && (
                                      <line x1={halfW} y1={y1} x2={halfW} y2={y2} stroke="hsl(var(--border))" strokeWidth="1.5" />
                                    )}
                                    <line x1={halfW} y1={yNext} x2={CONNECTOR_W} y2={yNext} stroke="hsl(var(--border))" strokeWidth="1.5" />
                                  </g>
                                );
                              })}
                            </svg>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </main>
        </div>
      </div>

      {/* Winner Selection Dialog */}
      {winnerDialog && (
        <Dialog open={winnerDialog.open} onOpenChange={() => setWinnerDialog(null)}>
          <DialogContent className="rounded-none max-w-md">
            <DialogHeader>
              <DialogTitle>{t('federation.brackets.selectWinner')}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                {[
                  { id: winnerDialog.match.athlete1_id, athlete: winnerDialog.match.athlete1, club: winnerDialog.match.athlete1_club },
                  { id: winnerDialog.match.athlete2_id, athlete: winnerDialog.match.athlete2, club: winnerDialog.match.athlete2_club },
                ].map(({ id, athlete, club }) => id && (
                  <button
                    key={id}
                    onClick={() => setSelectedWinnerId(id)}
                    className={`w-full flex items-center gap-3 p-3 border transition-all ${
                      selectedWinnerId === id
                        ? 'border-[#00ffba] bg-[#00ffba]/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getAthleteAvatar(athlete) || undefined} />
                      <AvatarFallback>{athlete?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium text-sm">{athlete?.name || t('federation.brackets.winnerPreviousFight')}</p>
                      {club && <p className="text-xs text-muted-foreground">{club.name}</p>}
                    </div>
                    {selectedWinnerId === id && <Trophy className="h-4 w-4 text-[#cb8954] ml-auto" />}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t('federation.brackets.resultType')}</Label>
                  <Select value={resultType} onValueChange={setResultType}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">{t('federation.brackets.points')}</SelectItem>
                      <SelectItem value="ko">KO</SelectItem>
                      <SelectItem value="tko">TKO</SelectItem>
                      <SelectItem value="dq">{t('federation.brackets.disqualification')}</SelectItem>
                      <SelectItem value="rsc">RSC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t('federation.brackets.score')}</Label>
                  <Input
                    value={scoreText}
                    onChange={(e) => setScoreText(e.target.value)}
                    placeholder={t('federation.brackets.scorePlaceholder')}
                    className="rounded-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setWinnerDialog(null)} className="rounded-none">{t('federation.common.cancel')}</Button>
              <Button
                onClick={handleSelectWinner}
                disabled={!selectedWinnerId}
                className="rounded-none bg-foreground text-background hover:bg-foreground/90"
              >
                {t('federation.brackets.submit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reset Confirmation */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('federation.brackets.resetConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('federation.brackets.resetConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">{t('federation.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAllBrackets} className="bg-destructive hover:bg-destructive/90 rounded-none">
              {t('federation.brackets.deleteAndReset')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default FederationBrackets;
