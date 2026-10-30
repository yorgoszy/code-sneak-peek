import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Menu, X, LogIn, Users, Dumbbell, CreditCard, ChartNoAxesCombined, CalendarDays, BookOpen, ArrowUpRight, Phone, Check, Mail, MapPin } from "lucide-react";
import { thaihubLandingCopy, type ThaiHubLanguage } from "@/components/coach/thaihubLandingCopy";
import { thaihubPlans } from "@/components/coach/thaihubPlans";
import { ThaiHubPlanCheckoutDialog, startThaiHubCheckout, type ThaiHubCheckoutPlan } from "@/components/coach/ThaiHubPlanCheckoutDialog";
import heroImage from "@/assets/thaihub-hero-ring.png.asset.json";
import thaihubLogo from "@/assets/thaihub-logo.png.asset.json";
import hyperteamLogo from "@/assets/hyperteam-logo.png.asset.json";

const anchors = ['home', 'features', 'purchase', 'contact'];
const featureIcons = [Users, Dumbbell, CreditCard, ChartNoAxesCombined, CalendarDays, BookOpen];
const primaryButton = "rounded-none bg-[var(--th-blue)] hover:bg-[var(--th-blue-hover)] text-[var(--th-white)]";

export default function ThaiHubLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth() as any;
  const [language, setLanguage] = useState<ThaiHubLanguage>(() => localStorage.getItem('thaihub-language') === 'en' ? 'en' : 'el');
  const t = thaihubLandingCopy[language];
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [message, setMessage] = useState<'invalid' | 'enterEmail' | 'resetSent' | 'resetFailed' | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<{ id: ThaiHubCheckoutPlan; name: string; price: number } | null>(null);
  const [planBusy, setPlanBusy] = useState<string | null>(null);
  const [planNotice, setPlanNotice] = useState<string | null>(null);

  const choosePlan = async (plan: typeof thaihubPlans[number]) => {
    const target = { id: (plan.id === 'pro' ? 'federation' : plan.id) as ThaiHubCheckoutPlan, name: plan.name, price: plan.yearlyPrice };
    setPlanNotice(null);
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setCheckoutPlan(target); return; }
    setPlanBusy(plan.id);
    const failure = await startThaiHubCheckout(target.id);
    setPlanBusy(null);
    if (failure) setPlanNotice(failure);
  };

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('plan_session');
    if (!sessionId) return;
    (async () => {
      const { data } = await supabase.functions.invoke('thaihub-plan-checkout', { body: { action: 'verify', session_id: sessionId } });
      if (data?.activated) navigate('/dashboard/coach-overview', { replace: true });
      else setPlanNotice('Η πληρωμή δεν έχει επιβεβαιωθεί ακόμη. Αν χρεώθηκες, μη πληρώσεις ξανά — επικοινώνησε μαζί μας.');
    })();
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('thaihub-language', language);
    const previousTitle = document.title;
    const previousLang = document.documentElement.lang;
    document.documentElement.lang = language;
    document.title = `ThaiHub — ${t.footer}`;
    return () => { document.title = previousTitle; document.documentElement.lang = previousLang; };
  }, [language, t.footer]);

  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).has("preview");
    const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    const previousFavicon = favicon?.href;
    if (favicon) { favicon.href = "/thaihub-icon.png"; favicon.type = "image/png"; }
    if (!isPreview && !loading && isAuthenticated) navigate("/dashboard/coach-overview", { replace: true });
    return () => { if (favicon && previousFavicon) favicon.href = previousFavicon; };
  }, [loading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setMessage('invalid'); return; }
      navigate("/dashboard/coach-overview", { replace: true });
    } catch { setMessage('invalid'); } finally { setBusy(false); }
  };

  const handleReset = async () => {
    if (!email.trim()) { setMessage('enterEmail'); return; }
    setResetBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      setMessage(error ? 'resetFailed' : 'resetSent');
    } catch { setMessage('resetFailed'); } finally { setResetBusy(false); }
  };

  const languagePicker = (
    <div className="flex shrink-0 border border-[var(--th-blue-border)]" role="group" aria-label={language === 'el' ? 'Γλώσσα' : 'Language'}>
      {(['el', 'en'] as const).map(lang => <Button key={lang} size="sm" variant="ghost" aria-pressed={language === lang} onClick={() => setLanguage(lang)} className={`rounded-none px-2 text-xs ${language === lang ? 'bg-[var(--th-blue)] text-[var(--th-white)] hover:bg-[var(--th-blue-hover)] hover:text-[var(--th-white)]' : 'text-[var(--th-blue)] hover:bg-[var(--th-blue-tint)] hover:text-[var(--th-blue)]'}`}>{lang === 'el' ? 'ΕΛ' : 'EN'}</Button>)}
    </div>
  );

  return (
    <div lang={language} className="thaihub-page min-h-screen bg-[var(--th-white)] text-[var(--th-blue)]">
      <nav className="fixed top-0 w-full z-50 bg-[var(--th-white)]" aria-label={t.menu}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16 gap-4">
          <a href="#home"><img src={thaihubLogo.url} alt="ThaiHub" className="h-8 w-auto" /></a>
          <div className="hidden lg:flex items-center gap-7">
            {anchors.map((anchor, i) => <a key={anchor} href={`#${anchor}`} className="text-sm hover:text-[var(--th-blue-hover)] transition-colors">{t.nav[i]}</a>)}
          </div>
          <div className="flex items-center gap-3">{languagePicker}<Button onClick={() => setLoginOpen(true)} className={`hidden lg:inline-flex ${primaryButton}`}><LogIn className="h-4 w-4 mr-2" />{t.login}</Button><Button variant="outline" size="sm" className="lg:hidden rounded-none border-[var(--th-blue-border)] text-[var(--th-blue)]" aria-label={t.menu} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</Button></div>
        </div>
        {menuOpen && <div className="lg:hidden border-t border-[var(--th-blue-border)] bg-[var(--th-white)] px-4 py-4 space-y-3">
          {anchors.map((anchor, i) => <a key={anchor} href={`#${anchor}`} onClick={() => setMenuOpen(false)} className="block py-2 text-sm hover:text-[var(--th-blue-hover)]">{t.nav[i]}</a>)}
          <Button onClick={() => { setMenuOpen(false); setLoginOpen(true); }} className={`w-full ${primaryButton}`}>{t.login}</Button>
        </div>}
      </nav>

      <section id="home" className="relative min-h-[calc(100svh-48px)] flex items-center pt-24 pb-16 scroll-mt-16">
        <img src={heroImage.url} alt={t.heroAlt} width={1920} height={1088} className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-[image:var(--th-hero-overlay)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-xl space-y-6">
            <p className="text-xs uppercase text-[var(--th-blue)] font-semibold">{t.forCoaches}</p>
            <h1 className="text-4xl sm:text-6xl font-bold leading-tight">{t.headline}</h1>
            <p className="text-base sm:text-lg text-[var(--th-blue)]">{t.intro}</p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => setLoginOpen(true)} className={primaryButton}>{t.login}</Button>
              <Button size="lg" asChild className="rounded-none bg-[var(--th-white)] text-[var(--th-blue)] hover:bg-[var(--th-blue-tint)]"><a href="#features">{t.more}</a></Button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-16 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase text-[var(--th-red)] mb-4">01 / {t.featuresLabel}</p>
          <h2 className="text-3xl sm:text-4xl font-bold max-w-2xl">{t.featuresTitle}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 mt-12">
            {t.features.map(([title, description], i) => { const Icon = featureIcons[i]; return <article key={i} className="border-t border-[var(--th-blue-border)] pt-6">
              <Icon className="h-7 w-7 mb-5" aria-hidden="true" /><h3 className="text-xl font-semibold mb-3">{title}</h3><p className="text-sm leading-relaxed">{description}</p>
            </article>; })}
          </div>
        </div>
      </section>

      <section id="purchase" className="scroll-mt-16 py-16 sm:py-24 bg-[var(--th-blue-soft)] border-y border-[var(--th-blue-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase text-[var(--th-red)] mb-4">02 / {t.purchaseLabel}</p>
          <h2 className="text-3xl sm:text-4xl font-bold">{t.purchaseTitle}</h2>
          <p className="mt-6 leading-relaxed max-w-2xl">{t.purchaseText}</p>
          {planNotice && <p role="alert" className="mt-6 text-sm text-[var(--th-red)]">{planNotice}</p>}
          <ThaiHubPlanCheckoutDialog plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {thaihubPlans.map(plan => (
              <article key={plan.id} aria-label={plan.name} className="flex flex-col min-w-0 bg-[var(--th-white)] border border-[var(--th-blue-border)] p-6 lg:p-8">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm mt-3 min-h-10">{t.planDescriptions[plan.id]}</p>
                <div className="flex items-baseline flex-wrap gap-2 mt-6"><span className="text-4xl font-bold">{plan.yearlyPrice}€</span><span className="text-sm">{t.perYear}</span></div>
                <p className="text-xs mt-2">{t.vatIncluded}</p>
                <div className="border-t border-[var(--th-blue-border)] mt-6 pt-6 flex-1">
                  {plan.inheritedPlan && <p className="font-semibold text-sm mb-5">{t.allFrom} {plan.inheritedPlan} {t.plus}</p>}
                  <ul className="space-y-4">{plan.additions.map(feature => <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed"><Check className="h-4 w-4 shrink-0 mt-1" aria-hidden="true" /><span>{t.planFeatures[feature]}</span></li>)}</ul>
                </div>
                <Button disabled={planBusy === plan.id} onClick={() => choosePlan(plan)} aria-label={`${t.planCta} — ${plan.name}`} className={`mt-8 w-full ${primaryButton}`}>{planBusy === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t.planCta}<ArrowUpRight className="ml-3 h-4 w-4 shrink-0" /></>}</Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-16 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
          <div><p className="text-xs font-semibold uppercase text-[var(--th-red)] mb-4">03 / {t.contactLabel}</p><h2 className="text-3xl sm:text-4xl font-bold max-w-lg">{t.contactTitle}</h2><p className="mt-6 max-w-md leading-relaxed">{t.contactText}</p></div>
          <div className="lg:self-center"><p className="text-sm mb-3">{t.phone}</p><a href="tel:+302310529104" className="text-3xl sm:text-4xl font-semibold hover:text-[var(--th-blue-hover)]">+30 2310 529 104</a><div><Button asChild size="lg" className={`mt-6 ${primaryButton}`}><a href="tel:+302310529104"><Phone className="h-4 w-4 mr-2" />{t.call}</a></Button></div></div>
        </div>
      </section>
      <footer className="bg-[var(--th-white)] py-16 text-[var(--th-blue)] border-t border-[var(--th-blue-border)]">
        <style>{`
          .th-footer-link-text { position: relative; display: inline; }
          .th-footer-link-text::after { content: ''; position: absolute; left: 0; bottom: -2px; height: 2px; width: 100%; background-color: currentColor; transform: scaleX(0); transform-origin: right; transition: transform 0.3s ease; }
          .th-footer-link:hover .th-footer-link-text::after { transform: scaleX(1); transform-origin: left; }
          .th-footer-icon-link { position: relative; display: inline-flex; }
          .th-footer-icon-link::after { content: ''; position: absolute; left: 0; right: 0; bottom: -4px; height: 2px; background-color: currentColor; transform: scaleX(0); transform-origin: right; transition: transform 0.3s ease; }
          .th-footer-icon-link:hover::after { transform: scaleX(1); transform-origin: left; }
        `}</style>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-6">{t.footerContact}</h3>
              <div className="space-y-4">
                <a href="https://maps.app.goo.gl/itvAmRgdT8qAG2ZL9" target="_blank" rel="noopener noreferrer" className="th-footer-link flex items-center gap-3 transition-colors">
                  <MapPin className="w-5 h-5" /><span className="th-footer-link-text">{t.footerAddress}</span>
                </a>
                <a href="tel:+302310529104" className="th-footer-link flex items-center gap-3 transition-colors">
                  <Phone className="w-5 h-5" /><span className="th-footer-link-text">+30 2310 529 104</span>
                </a>
                <a href={`mailto:${t.footerEmail}`} className="th-footer-link flex items-center gap-3 transition-colors">
                  <Mail className="w-5 h-5" /><span className="th-footer-link-text">{t.footerEmail}</span>
                </a>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center">
              <a href="#home"><img src={thaihubLogo.url} alt="ThaiHub" className="h-10 w-auto" /></a>
            </div>
            <div className="md:ml-auto">
              <h3 className="text-xl font-bold mb-6">{t.footerHours}</h3>
              <div className="space-y-2">{t.footerHoursLines.map(line => <p key={line}>{line}</p>)}</div>
            </div>
          </div>
          <div className="text-center border-t border-[var(--th-blue-border)] pt-8 mt-12">
            <p className="flex items-center justify-center gap-2 flex-wrap">{t.footerCopyright} <img src={hyperteamLogo.url} alt="HYPERTEAM" className="h-4 w-auto inline-block" /></p>
          </div>
        </div>
      </footer>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent lang={language} className="thaihub-page max-w-sm rounded-none bg-[var(--th-white)] text-[var(--th-blue)]">
          <DialogHeader><img src={thaihubLogo.url} alt="ThaiHub" className="h-8 w-auto self-start" /><DialogTitle>{t.loginTitle}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="th-email">Email</Label><Input id="th-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-none bg-[var(--th-white)] border-[var(--th-blue-border)]" /></div>
            <div className="space-y-2"><Label htmlFor="th-password">{t.password}</Label><Input id="th-password" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="rounded-none bg-[var(--th-white)] border-[var(--th-blue-border)]" /></div>
            {message && <p role="status" className="text-sm">{t[message]}</p>}
            <Button type="submit" disabled={busy} className={`w-full ${primaryButton}`}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{t.login}</Button>
            <Button type="button" variant="link" disabled={resetBusy} onClick={handleReset} className="w-full text-xs text-[var(--th-blue)] rounded-none">{resetBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{t.forgot}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
