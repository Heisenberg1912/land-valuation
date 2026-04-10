import fs from "fs";

let content = fs.readFileSync("app/page.tsx", "utf-8");
content = content.replace(/\r\n/g, "\n"); // Normalize newlines

// Add imports
if (!content.includes("framer-motion")) {
  content = content.replace(
    'import Image from "next/image";',
    'import Image from "next/image";\nimport { motion, AnimatePresence } from "framer-motion";\nimport { CheckCircle2, AlertTriangle, Clock, DollarSign, Activity, Settings2, BarChart, Hammer, Layers, LayoutList, UploadCloud } from "lucide-react";'
  );
}

// Ensure Accordion is in imports
if (!content.includes("Accordion")) {
  content = content.replace(
    'import { Button, Card, Pill } from "@/components/ui";',
    'import { Button, Card, Pill, Accordion } from "@/components/ui";'
  );
}

// Replace the render block of the Page component
const searchStr = '  return (\n    <div className="min-h-screen flex flex-col overflow-hidden bg-[color:var(--bg)] text-[color:var(--text)] font-sans">';
const renderStartIndex = content.indexOf(searchStr);
if (renderStartIndex === -1) {
  console.log("Could not find start of render block");
  process.exit(1);
}

const renderReplacement = `
  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-[color:var(--bg)] text-[color:var(--text)] font-sans">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.03] [background-image:radial-gradient(var(--text)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute -top-24 right-10 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,var(--glow-1),transparent_70%)]" />
        <div className="absolute bottom-[-120px] left-[-80px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,var(--glow-2),transparent_70%)]" />
      </div>

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--line)] bg-[color:var(--card)]/60 px-6 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="text-center sm:text-left">
            <div className="text-xl font-black tracking-tight text-[color:var(--text)]">{t("title")}</div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-[color:var(--muted)]">{t("subtitle")}</span>
              <Pill className="text-[8px] px-1.5 py-0 border-none bg-[color:var(--accent)] text-[color:var(--accent-contrast)]">{t("engine")}</Pill>
            </div>
          </div>
          {errorShort ? <Pill className="border-red-500/20 bg-red-500/10 text-red-500 font-bold">{errorShort}</Pill> : null}
          {usage ? <Pill className="bg-[color:var(--card-weak)] border-none font-bold text-[color:var(--text)]">{usage.paid ? "PRO" : \`\${Math.max(0, 3 - usage.freeUsed)}/3 FREE\`}</Pill> : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--card)]/50 px-2 py-1 shadow-sm transition-all hover:bg-[color:var(--card)]">
            <Settings2 size={14} className="text-[color:var(--muted)]" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="bg-transparent text-xs font-bold text-[color:var(--text)] outline-none cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[color:var(--card)]">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--card)]/50 px-2 py-1 shadow-sm transition-all hover:bg-[color:var(--card)]" title={fxInfo}>
            <DollarSign size={14} className="text-[color:var(--muted)]" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="bg-transparent text-xs font-bold text-[color:var(--text)] outline-none cursor-pointer"
            >
              {Object.values(CURRENCY_LABELS).map((item) => (
                <option key={item.code} value={item.code} className="bg-[color:var(--card)]">
                  {item.code}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-[color:var(--line)] bg-[color:var(--card)]/50 p-1 shadow-sm">
            <button onClick={() => setTheme("light")} className={\`px-2 py-1 text-[10px] font-black rounded-lg transition-all \${theme === 'light' ? 'bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-sm' : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'}\`}>LT</button>
            <button onClick={() => setTheme("dark")} className={\`px-2 py-1 text-[10px] font-black rounded-lg transition-all \${theme === 'dark' ? 'bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-sm' : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'}\`}>DK</button>
            <button onClick={() => setTheme("hc")} className={\`px-2 py-1 text-[10px] font-black rounded-lg transition-all \${theme === 'hc' ? 'bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-sm' : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'}\`}>HC</button>
          </div>
          
          {authEmail ? (
            <div className="flex items-center gap-2">
              <Pill className="font-bold border-[color:var(--accent)]/10">{authUser?.name || authEmail.split("@")[0]}</Pill>
              <Button variant="outline" onClick={signOut} className="h-8 px-3 text-xs border-none hover:bg-red-500/10 hover:text-red-500">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setAuthMode("signin")} className="h-8 px-3 text-xs border-none">Log In</Button>
              <Button variant="primary" onClick={() => setAuthMode("register")} className="h-8 px-4 text-xs shadow-sm">Join</Button>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col overflow-hidden lg:flex-row">
        {error ? (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 backdrop-blur-md shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-500" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">System Error</div>
                  <div className="text-xs font-bold text-red-500">{error}</div>
                </div>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:bg-red-500/20 p-1.5 rounded-lg transition-colors"><CheckCircle2 size={16} /></button>
            </motion.div>
          </div>
        ) : null}

        {/* Left Side: Capture & Input */}
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={\`flex flex-col justify-center p-6 sm:p-8 \${baseValid ? "w-full border-b border-[color:var(--line)] lg:h-full lg:w-[420px] lg:border-b-0 lg:border-r bg-[color:var(--card)]/20" : "mx-auto w-full h-full max-w-xl"}\`}
        >
          <div className="flex flex-col items-center">
            <Card className={\`w-full transition-all duration-500 \${baseValid ? "shadow-none border-none p-0 bg-transparent" : "p-8 shadow-2xl bg-[color:var(--card)]/80 backdrop-blur-sm"}\`}>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={16} className="text-[color:var(--accent)]" />
                  <Label>{t("capture")}</Label>
                </div>
                <div className="text-2xl font-black text-[color:var(--text)]">{t("inputWindow")}</div>
              </div>

              <div className={\`relative mx-auto mb-6 flex aspect-square w-full max-w-[320px] items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-dashed border-[color:var(--line)] bg-[color:var(--card)] shadow-lg transition-all duration-300 hover:border-[color:var(--accent)]/40 hover:shadow-xl \${imageDataUrl ? "border-solid border-[color:var(--accent)]/10" : ""}\`}>
                {imageDataUrl ? (
                  <Image src={imageDataUrl} alt="Preview" fill className="object-cover transition-transform duration-700 hover:scale-105" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-[color:var(--muted)]">
                    <div className="p-5 rounded-full bg-[color:var(--card-weak)]">
                      <UploadCloud size={40} strokeWidth={1.5} className="text-[color:var(--accent)]" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-black text-[color:var(--text)] block mb-1">Upload Photo</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t("browse")} or Drop</span>
                    </div>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,rgba(0,0,0,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.5)_1px,transparent_1px)] [background-size:12.5%_100%,100%_12.5%]" />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-11 rounded-2xl bg-[color:var(--card)] shadow-sm hover:shadow-md transition-all" onClick={() => {
                    if (browseInputRef.current) { browseInputRef.current.value = ""; browseInputRef.current.click(); }
                  }}>
                    {t("browse")}
                  </Button>
                  <Button variant="outline" className="h-11 rounded-2xl bg-[color:var(--card)] shadow-sm hover:shadow-md transition-all" onClick={() => {
                    if (liveInputRef.current) { liveInputRef.current.value = ""; liveInputRef.current.click(); }
                  }}>
                    {t("live")}
                  </Button>
                </div>

                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="relative">
                    <input
                      value={meta.location}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMeta((s) => ({ ...s, location: value }));
                        setGeoStatus(value ? "manual" : "none");
                      }}
                      placeholder={t("location")}
                      list="city-list"
                      className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--card)] px-4 text-xs font-bold text-[color:var(--text)] outline-none focus:border-[color:var(--accent)] transition-all shadow-sm focus:shadow-md"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={requestGps} className="h-12 w-12 p-0 rounded-2xl shadow-sm">
                      <Activity size={18} />
                    </Button>
                    <Pill className="h-12 px-4 rounded-2xl font-black bg-[color:var(--card-weak)] border-none">
                      {geoStatus === "exif" ? "EXIF" : geoStatus === "gps" ? "GPS" : geoStatus === "manual" ? "MAN" : "OFF"}
                    </Pill>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: meta.projectType, key: 'projectType', opts: ['Residential', 'Commercial', 'Industrial', 'Mixed-use', 'Infrastructure'] },
                    { val: meta.scale, key: 'scale', opts: ['Low-rise', 'Mid-rise', 'High-rise', 'Large-site'] },
                    { val: meta.constructionType, key: 'constructionType', opts: ['RCC', 'Steel', 'Hybrid'] }
                  ].map(sel => (
                    <select 
                      key={sel.key}
                      value={sel.val} 
                      onChange={(e) => setMeta((s) => ({ ...s, [sel.key]: e.target.value }))} 
                      className="h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 text-[10px] font-black text-[color:var(--text)] outline-none cursor-pointer hover:bg-[color:var(--card-weak)] transition-colors"
                    >
                      {sel.opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ))}
                </div>

                <input
                  value={meta.note}
                  onChange={(e) => setMeta((s) => ({ ...s, note: e.target.value }))}
                  placeholder={t("notes")}
                  className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--card)] px-4 text-xs font-bold text-[color:var(--text)] outline-none focus:border-[color:var(--accent)] shadow-sm"
                />

                <Button
                  variant="primary"
                  onClick={runBase}
                  disabled={!imageDataUrl || loading || !canRun}
                  className="h-14 w-full rounded-[1.5rem] text-lg font-black shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? <Spinner /> : t("analyze").toUpperCase()}
                </Button>

                <datalist id="city-list">
                  {CITY_SUGGESTIONS.map((city) => <option key={city} value={city} />)}
                </datalist>
                <input ref={browseInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])} />
                <input ref={liveInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])} />
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Right Side: Results (Scrollable Fit-to-Screen) */}
        <AnimatePresence>
          {baseValid && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0 }}
              className="flex-1 overflow-y-auto p-6 sm:p-10 h-full scrollbar-hide"
            >
              <div className="mx-auto w-full max-w-6xl space-y-8 pb-24">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={\`h-3 w-3 rounded-full animate-pulse \${status === 'Completed' ? 'bg-green-500' : 'bg-orange-500'}\`} />
                      <span className="text-xs font-black uppercase tracking-[0.3em] text-[color:var(--muted)]">Current Phase</span>
                    </div>
                    <h2 className="text-6xl font-black text-[color:var(--text)] tracking-tighter leading-none">{status}</h2>
                  </div>
                  <div className="flex items-end gap-6 bg-[color:var(--card)] p-6 rounded-[2.5rem] shadow-sm border border-[color:var(--line)]">
                    <div className="text-right">
                      <div className="text-6xl font-black text-[color:var(--accent)] tracking-tighter leading-none">{Math.round(progressDisplay)}%</div>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[color:var(--muted)]">{t("progress")}</p>
                    </div>
                    <div className="h-12 w-[1px] bg-[color:var(--line)]" />
                    <div className="text-right">
                      <div className="text-2xl font-black text-[color:var(--text)]">{stageLabel}</div>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[color:var(--muted)]">{t("stage")}</p>
                    </div>
                  </div>
                </div>

                <div className="relative px-2">
                  <div className="relative h-4 overflow-hidden rounded-full bg-[color:var(--card)] border border-[color:var(--line)] shadow-inner p-1">
                    <motion.div 
                      className="absolute inset-y-1 left-1 rounded-full bg-[color:var(--accent)] shadow-lg" 
                      initial={{ width: 0 }}
                      animate={{ width: \`calc(\${progressDisplay}% - 8px)\` }}
                      transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                    />
                    {STAGE_RANGES.slice(1, 5).map((stage) => (
                      <span key={stage.label} className="absolute top-0 h-full w-[2px] bg-[color:var(--bg)]/50 z-10" style={{ left: \`\${stage.min}%\` }} />
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-5 text-[10px] font-black uppercase tracking-widest text-[color:var(--muted)]">
                    <span className="text-left">Planning</span>
                    <span className="text-center">Foundation</span>
                    <span className="text-center">Structure</span>
                    <span className="text-center">Services</span>
                    <span className="text-right">Finishing</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <Accordion title="Execution Performance" icon={<Hammer size={20} />} defaultOpen={true} extra={<Pill className="font-bold border-none bg-[color:var(--accent)] text-[color:var(--accent-contrast)]">{stageLabel}</Pill>}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard label={status === "Completed" ? t("timeTaken") : t("timeLeft")} value={timelineValue} />
                        <StatCard label={manpowerLabel} value={manpowerValue} />
                        <StatCard label={machineryLabel} value={machineryValue} />
                      </div>
                      
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <Label>{t("resources").toUpperCase()}</Label>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {[
                              { label: manpowerTag(stageLabel), color: 'bg-blue-500' },
                              { label: skillsTag(stageLabel), color: 'bg-emerald-500' },
                              { label: machineryTag(stageLabel), color: 'bg-orange-500' },
                              { label: hardwareTag(stageLabel), color: 'bg-purple-500' }
                            ].map((tag, idx) => (
                              <Pill key={idx} className={\`border-none \${tag.color}/10 \${tag.color.replace('bg-', 'text-')} font-black px-4 py-2\`}>{tag.label}</Pill>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>{t("stagesLeft").toUpperCase()}</Label>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {stagesLeft.length ? (
                              stagesLeft.map((item, idx) => (
                                <motion.span 
                                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                                  key={item} 
                                  className="rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--card)] px-4 py-2 text-[11px] font-black text-[color:var(--text)] shadow-sm hover:border-[color:var(--accent)]/20 transition-colors"
                                >
                                  {item}
                                </motion.span>
                              ))
                            ) : (
                              <span className="text-xs font-bold text-[color:var(--muted)]">Sequence Complete</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Accordion>

                    <Accordion title="Advanced Risk & Benchmarks" icon={<AlertTriangle size={20} />} extra={paywalled ? <Pill className="bg-red-500/10 text-red-500 border-none font-black text-[10px]">LOCKED</Pill> : null}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatCard label={t("progressVsIdeal")} value={premium(progressVsIdealDisplay)} />
                        <StatCard label={t("timelineDrift")} value={premium(driftDisplay)} />
                      </div>

                      <div className="mt-8 p-6 rounded-[2rem] bg-[color:var(--bg)] border border-[color:var(--line)]">
                        <div className="flex items-center gap-2 mb-4">
                          <Activity size={18} className="text-[color:var(--accent)]" />
                          <Label>{t("insights").toUpperCase()}</Label>
                        </div>
                        <ul className="space-y-4">
                          {insightsDisplay.map((item, i) => (
                            <motion.li key={\`insight-\${i}\`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-4">
                              <div className="h-6 w-6 rounded-lg bg-[color:var(--accent)] text-[color:var(--accent-contrast)] flex items-center justify-center shrink-0 shadow-sm">
                                <CheckCircle2 size={14} />
                              </div>
                              <span className="text-sm font-bold leading-relaxed text-[color:var(--text)]">{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-8">
                        <Button
                          variant="primary"
                          onClick={runAdvanced}
                          disabled={!baseValid || advLoading || paywalled}
                          className={\`w-full h-14 rounded-2xl font-black shadow-lg \${!paywalled ? "shadow-black/10" : "opacity-40"}\`}
                        >
                          {advLoading ? <Spinner /> : t("revealRisks").toUpperCase()}
                        </Button>
                      </div>
                    </Accordion>
                  </div>

                  <div className="space-y-6">
                    <Accordion title="Financial Valuation" icon={<BarChart size={20} />} defaultOpen={true}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {status === "Completed" ? (
                          <>
                            <div className="col-span-1 sm:col-span-2">
                              <StatCard label={t("propertyVal")} value={premium(formatCurrencyRange(currency, minVal, maxVal, rates))} tag={<Pill className="border-none bg-[color:var(--card-weak)] font-black">{CURRENCY_LABELS[currency].code}</Pill>} />
                            </div>
                            <StatCard label={t("budgetUsed")} value={premium(formatCurrencyRange(currency, minBudgetUsed, maxBudgetUsed, rates))} />
                            <StatCard label={t("confidence")} value={premium(stageMeta.confidence)} />
                          </>
                        ) : (
                          <>
                            <StatCard label={t("budgetLeft")} value={premium(formatCurrencyRange(currency, minBudget, maxBudget, rates))} />
                            <StatCard label={t("budgetUsed")} value={premium(formatCurrencyRange(currency, minBudgetUsed, maxBudgetUsed, rates))} />
                            <StatCard label={t("landVal")} value={premium(formatCurrencyRange(currency, minLand, maxLand, rates))} />
                            <StatCard label={t("projectVal")} value={premium(formatCurrencyRange(currency, minVal, maxVal, rates))} />
                          </>
                        )}
                      </div>
                      
                      <div className="mt-8">
                        <Label>{t("signals").toUpperCase()}</Label>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {signals.length ? (
                            signals.map((item, idx) => (
                              <motion.span 
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + idx * 0.1 }}
                                key={item} 
                                className="rounded-xl border border-[color:var(--line)] bg-[color:var(--bg)] px-4 py-2 text-[10px] font-black text-[color:var(--text)] shadow-sm"
                              >
                                {item.toUpperCase()}
                              </motion.span>
                            ))
                          ) : (
                            <span className="text-[11px] font-bold text-[color:var(--muted)]">Calculating signals...</span>
                          )}
                        </div>
                      </div>
                    </Accordion>
                    
                    <Accordion title="Data Distribution" icon={<Layers size={20} />}>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <PieCard title="Stage Time Split" segments={timeSplitSegments} valueFormatter={(value) => (baseValid ? \`\${value}h\` : "-")} />
                        <PieCard title="Budget Allocation" segments={budgetSplitSegments} valueFormatter={(value) => (baseValid ? formatCurrencyValue(currency, value, rates) : "-")} />
                      </div>

                      <div className="mt-8 overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--bg)] shadow-inner">
                        {selectedCategoryRow ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[color:var(--line)]">
                            {categoryEntries.map((entry, i) => (
                              <div key={entry.label} className="bg-[color:var(--bg)] p-5 transition-colors hover:bg-[color:var(--card)]/50">
                                <div className="text-[9px] font-black uppercase tracking-widest text-[color:var(--muted)] mb-1">{entry.label}</div>
                                <div className="text-sm font-bold text-[color:var(--text)]">{entry.value}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-10 text-center">
                            <Activity size={32} className="mx-auto text-[color:var(--line)] mb-4" />
                            <div className="text-sm font-black text-[color:var(--muted)] uppercase tracking-widest">Matrix Pending Analysis</div>
                          </div>
                        )}
                      </div>
                    </Accordion>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
`;

content = content.substring(0, renderStartIndex) + renderReplacement;

fs.writeFileSync("app/page.tsx", content);
console.log("Patched successfully.");
