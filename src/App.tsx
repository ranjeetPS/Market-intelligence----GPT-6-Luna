import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownWideNarrow, ArrowUpRight, Bookmark, BookmarkCheck, BriefcaseBusiness, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Command, Filter, Globe2, Layers3, Menu, Newspaper, Plus, RefreshCw, Search, Sparkles, TrendingUp, X } from 'lucide-react'
import './index.css'

type Country = { name: string; code: string; flag: string; market: string; index: string; move: string; direction: 'up' | 'down' }
type Story = { id: string; title: string; summary: string; why: string; country: string; sector: string; category: string; companies: string[]; tickers: string[]; source: string; url: string; time: string; importance: 'High' | 'Medium'; tag?: string }
const countries: Country[] = [
  { name: 'United States', code: 'US', flag: '🇺🇸', market: 'S&P 500', index: '6,693.75', move: '+0.48%', direction: 'up' },
  { name: 'India', code: 'IN', flag: '🇮🇳', market: 'NIFTY 50', index: '24,894.25', move: '+0.31%', direction: 'up' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', market: 'FTSE 100', index: '9,284.11', move: '+0.22%', direction: 'up' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', market: 'Nikkei 225', index: '45,043.75', move: '−0.16%', direction: 'down' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', market: 'ADX General', index: '10,215.68', move: '+0.54%', direction: 'up' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', market: 'S&P/TSX', index: '29,414.20', move: '+0.18%', direction: 'up' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', market: 'DAX', index: '23,481.60', move: '−0.42%', direction: 'down' },
]
const seedStories: Story[] = [
  { id: 'vw-restructure', title: 'Volkswagen’s profit warning deepens as restructuring puts 100,000 jobs in focus', summary: 'Europe’s biggest automaker is moving ahead with a sweeping restructuring as weaker profits, Chinese competition, tariffs and the EV transition weigh on its outlook.', why: 'A major workforce and cost reset signals sustained pressure across European auto manufacturing. Investors will be watching execution, margins and the group’s ability to compete in lower-cost EVs.', country: 'Germany', sector: 'Automotive', category: 'Restructuring', companies: ['Volkswagen'], tickers: ['VOW3.DE'], source: 'CNBC', url: 'https://www.cnbc.com/2026/09/21/volkswagens-latest-profit-warning-compounds-exit-from-blue-chip-index.html', time: 'Sep 21 · 09:42', importance: 'High', tag: 'Profit warning' },
  { id: 'ai-chip-rally', title: 'AI-linked chip stocks rally as investors look ahead to a new earnings season', summary: 'Broadcom and other semiconductor names climbed as investors positioned for results and continued demand from AI-related businesses.', why: 'Chipmakers’ outlooks are an important read-through for AI infrastructure spending, data-centre demand and the wider semiconductor supply chain.', country: 'United States', sector: 'Semiconductors', category: 'Earnings & outlook', companies: ['Broadcom', 'NVIDIA', 'Marvell'], tickers: ['AVGO', 'NVDA', 'MRVL'], source: 'Reuters', url: 'https://www.reuters.com/markets/', time: 'Sep 26 · 14:18', importance: 'High', tag: 'AI infrastructure' },
]
const countryByCode: Record<string, string> = { US: 'United States', IN: 'India', GB: 'United Kingdom', JP: 'Japan', AE: 'United Arab Emirates', CA: 'Canada', DE: 'Germany' }
const symbolMap: Record<string, string> = { apple: 'AAPL', microsoft: 'MSFT', nvidia: 'NVDA', broadcom: 'AVGO', amazon: 'AMZN', tesla: 'TSLA', alphabet: 'GOOGL', google: 'GOOGL', meta: 'META', volkswagen: 'VOW3.DE', siemens: 'SIE.DE', mercedes: 'MBG.DE', bmw: 'BMW.DE', shell: 'SHEL', arm: 'ARM', hsbc: 'HSBA.L', tata: 'TATAMOTORS.NS', reliance: 'RELIANCE.NS', sony: 'SONY', toyota: 'TM', shopify: 'SHOP', enbridge: 'ENB', samsung: '005930.KS', 'airbus': 'AIR.PA' }
const sectors = ['All sectors', 'AI & Technology', 'Automotive', 'Banking', 'Energy', 'Pharmaceuticals', 'Semiconductors']
function symbolsFor(title: string) { return Object.entries(symbolMap).filter(([name]) => title.toLowerCase().includes(name)).map(([, symbol]) => symbol).slice(0, 4) }
function sectorFor(title: string) { const t = title.toLowerCase(); if (/chip|semiconductor|broadcom|nvidia|ai infrastructure/.test(t)) return 'Semiconductors'; if (/oil|energy|solar|renewable|gas/.test(t)) return 'Energy'; if (/bank|lender|finance/.test(t)) return 'Banking'; if (/drug|pharma|biotech/.test(t)) return 'Pharmaceuticals'; if (/auto|vehicle|volkswagen|ev |electric vehicle/.test(t)) return 'Automotive'; return 'AI & Technology' }
function stripHtml(text: string) { const el = document.createElement('div'); el.innerHTML = text; return el.textContent?.trim() || '' }
function storyFromRss(item: any, code: string, index: number): Story { const title = stripHtml(item.title || 'Market update'); const companyList = Object.keys(symbolMap).filter(n => title.toLowerCase().includes(n)).slice(0, 3).map(n => n[0].toUpperCase() + n.slice(1)); const names = companyList.length ? companyList : ['Market participants']; const desc = stripHtml(item.description || item.content || 'A new business development is drawing attention from investors.').slice(0, 230); const time = item.pubDate ? new Date(item.pubDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'; return { id: `rss-${code}-${index}-${item.guid || title.slice(0, 14)}`, title, summary: desc || 'A new business development is drawing attention from investors.', why: `This development may influence expectations across ${sectorFor(title).toLowerCase()} and related listed companies. Follow company disclosures and primary sources for more context.`, country: countryByCode[code] || 'United States', sector: sectorFor(title), category: /deal|acqui|merg|contract/.test(title.toLowerCase()) ? 'Major deal' : /result|earnings|profit/.test(title.toLowerCase()) ? 'Earnings & outlook' : 'Company update', companies: names, tickers: symbolsFor(title), source: item.author || 'Google News', url: item.link || 'https://news.google.com/', time, importance: /acqui|merg|contract|investment|profit warning|approval|billion|layoff|tariff/i.test(title) ? 'High' : 'Medium' } }

function App() {
  const [selected, setSelected] = useState<string[]>(['United States', 'Germany'])
  const [countryMenu, setCountryMenu] = useState(false)
  const [stories, setStories] = useState<Story[]>(seedStories)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('All sectors')
  const [sort, setSort] = useState<'relevance' | 'newest'>('relevance')
  const [showSaved, setShowSaved] = useState(false)
  const [saved, setSaved] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [live, setLive] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const refresh = useCallback(async () => {
    setLoading(true)
    const gathered: Story[] = []
    await Promise.all(selected.map(async name => {
      const country = countries.find(c => c.name === name)
      if (!country) return
      const q = encodeURIComponent(`(${name}) (business OR company OR earnings OR investment OR contract OR acquisition OR stocks) when:7d`)
      const feed = encodeURIComponent(`https://news.google.com/rss/search?q=${q}&hl=en-${country.code}&gl=${country.code}&ceid=${country.code}:en`)
      try {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feed}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.status === 'ok' && Array.isArray(data.items)) gathered.push(...data.items.slice(0, 8).map((item: any, i: number) => storyFromRss(item, country.code, i)))
      } catch { /* curated headlines remain available when a feed is unreachable */ }
    }))
    if (gathered.length) { const unique = new Map<string, Story>(); [...seedStories.filter(s => selected.includes(s.country)), ...gathered].forEach(item => unique.set(item.title.toLowerCase(), item)); setStories([...unique.values()]); setLive(true) }
    setLoading(false)
  }, [selected])
  useEffect(() => { refresh() }, [refresh])
  const visible = useMemo(() => stories.filter(s => selected.includes(s.country) && (!showSaved || saved.includes(s.id)) && (sector === 'All sectors' || s.sector === sector || (sector === 'AI & Technology' && s.sector === 'AI & Technology')) && (!search || `${s.title} ${s.companies.join(' ')} ${s.tickers.join(' ')} ${s.sector}`.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => sort === 'newest' ? b.time.localeCompare(a.time) : (a.importance === 'High' ? -1 : 1)) , [stories, selected, showSaved, saved, sector, search, sort])
  const toggleCountry = (name: string) => setSelected(prev => prev.includes(name) ? (prev.length > 1 ? prev.filter(c => c !== name) : prev) : [...prev, name])
  const toggleSaved = (id: string) => setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const activeCountry = countries.find(c => selected.includes(c.name)) || countries[0]
  const dealCount = stories.filter(s => /deal|merger|acquisition/i.test(s.category)).length + 4
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <a className="brand" href="#top"><span className="brand-mark"><Activity size={20} strokeWidth={2.6}/></span><span>signal<span className="brand-light">/</span>market</span></a>
      <div className="workspace-label">WORKSPACE <button className="icon-button tiny" aria-label="Add workspace"><Plus size={14}/></button></div>
      <nav className="side-nav">
        <button className="nav-link active" onClick={() => {setShowSaved(false); setMobileNav(false)}}><Layers3 size={17}/> Intelligence feed</button>
        <button className={`nav-link ${showSaved ? 'active' : ''}`} onClick={() => {setShowSaved(true); setMobileNav(false)}}><Bookmark size={17}/> Saved stories <span className="nav-count">{saved.length || ''}</span></button>
        <button className="nav-link" onClick={() => {setSector('All sectors'); setSearch('')}}><TrendingUp size={17}/> Company tracker</button>
        <button className="nav-link" onClick={() => setSort(sort === 'newest' ? 'relevance' : 'newest')}><Clock3 size={17}/> Historical archive</button>
      </nav>
      <div className="side-divider"/>
      <div className="workspace-label">YOUR MARKETS <button className="icon-button tiny" onClick={() => setCountryMenu(!countryMenu)} aria-label="Manage markets"><Plus size={14}/></button></div>
      <div className="market-list">{countries.filter(c => selected.includes(c.name)).map(c => <button className="market-row" key={c.code} onClick={() => setSelected([c.name])}><span className="flag">{c.flag}</span><span>{c.name}</span><span className="market-dot"/></button>)}</div>
      <div className="sidebar-spacer"/>
      <div className="plan-card"><div className="plan-icon"><Sparkles size={15}/></div><div><b>Signal intelligence</b><p>Research context, not investment advice.</p></div><ChevronRight size={15}/></div>
      <div className="profile-row"><div className="avatar">JD</div><div className="profile-copy"><strong>Jordan Davis</strong><span>Personal workspace</span></div><ChevronDown size={16}/></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu"/>}
    <main className="main-area" id="top">
      <header className="topbar"><div className="top-left"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={19}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>Market intelligence</strong></div></div><div className="top-actions"><span className="today-label">MON, SEP 28, 2026</span><span className="top-separator"/><button className="help-button"><CircleHelp size={16}/> Help</button><div className="avatar top-avatar">JD</div></div></header>
      <div className="content-wrap">
        <section className="welcome-row"><div><div className="eyebrow"><span className="pulse-dot"/> GLOBAL BUSINESS INTELLIGENCE</div><h1>Market intelligence<span className="title-period">.</span></h1><p className="subhead">The signal behind the headlines. Curated for investors.</p></div><button className="refresh-button" onClick={refresh} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''}/>{loading ? 'Refreshing' : 'Refresh feed'}</button></section>
        <section className="control-row"><div className="country-picker-wrap"><button className="country-picker" onClick={() => setCountryMenu(!countryMenu)}><Globe2 size={16}/><span>Markets</span><span className="selection-count">{selected.length}</span><ChevronDown size={15}/></button>{countryMenu && <><button className="dropdown-scrim" onClick={() => setCountryMenu(false)} aria-label="Close market selector"/><div className="country-dropdown"><div className="dropdown-title">Follow markets <span>SELECT ONE OR MORE</span></div>{countries.map(c => <button key={c.code} className="country-option" onClick={() => toggleCountry(c.name)}><span className="flag">{c.flag}</span><span>{c.name}</span><span className={`check-box ${selected.includes(c.name) ? 'checked' : ''}`}>{selected.includes(c.name) && <Check size={12}/>}</span></button>)}<div className="dropdown-foot">At least one market must be selected</div></div></>}</div>
          <div className="control-divider"/><div className="active-country-flags">{countries.filter(c => selected.includes(c.name)).map(c => <span className="active-flag" title={c.name} key={c.code}>{c.flag}</span>)}</div><div className="control-spacer"/><div className="search-box"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stories, companies, tickers..."/><kbd><Command size={10}/> K</kbd></div></section>
        <section className="market-strip"><div className="strip-label"><span className="pulse-dot"/> MARKET SNAPSHOT <span className="market-live">INDICATIVE</span></div>{countries.filter(c => selected.includes(c.name)).slice(0, 4).map(c => <div className="market-index" key={c.code}><span className="index-country">{c.flag} {c.market}</span><b>{c.index}</b><span className={`index-change ${c.direction}`}>{c.move}</span></div>)}<button className="market-more" onClick={() => setCountryMenu(true)}>All markets <ArrowUpRight size={13}/></button></section>
        <section className="section-heading"><div><div className="section-kicker">YOUR PERSONALIZED BRIEFING</div><h2>{showSaved ? 'Saved stories' : 'Top market-moving news'} <span className="stories-count">{visible.length}</span></h2></div><div className="section-tools"><div className="sort-wrap"><ArrowDownWideNarrow size={15}/><select value={sort} onChange={e => setSort(e.target.value as 'relevance' | 'newest')} aria-label="Sort stories"><option value="relevance">Most relevant</option><option value="newest">Newest first</option></select><ChevronDown size={13}/></div><button className="filter-button" onClick={() => setSector(sector === 'All sectors' ? 'Semiconductors' : 'All sectors')}><Filter size={14}/> Filter <span className="filter-indicator">{sector !== 'All sectors' ? '1' : ''}</span></button></div></section>
        <div className="sector-chips">{sectors.map(s => <button key={s} className={`sector-chip ${sector === s ? 'selected' : ''}`} onClick={() => setSector(s)}>{s}</button>)}</div>
        <div className="feed-layout"><div className="news-feed">{visible.length ? visible.map(story => <article className={`news-card ${expanded === story.id ? 'expanded' : ''}`} key={story.id}>
          <div className="card-topline"><div className="story-meta"><span className="country-label"><span className="flag">{countries.find(c => c.name === story.country)?.flag || '🌐'}</span>{story.country}</span><span className="meta-dot"/><span>{story.sector}</span></div><button className={`save-button ${saved.includes(story.id) ? 'is-saved' : ''}`} onClick={() => toggleSaved(story.id)} aria-label="Save story">{saved.includes(story.id) ? <BookmarkCheck size={17}/> : <Bookmark size={17}/>}</button></div>
          <button className="story-title-button" onClick={() => setExpanded(expanded === story.id ? null : story.id)}><h3>{story.title}</h3></button>
          <p className="story-summary">{story.summary}</p>
          <div className="company-tags">{story.companies.map((company, i) => <span className="company-tag" key={company}><BriefcaseBusiness size={12}/>{company}{story.tickers[i] && <b>{story.tickers[i]}</b>}</span>)}</div>
          <div className="why-box"><span className="why-icon"><Sparkles size={14}/></span><div><strong>Why it matters</strong><p>{story.why}</p></div></div>
          {expanded === story.id && <div className="expanded-context"><div><span>EVENT TYPE</span><b>{story.category}</b></div><div><span>RELATED SECTORS</span><b>{story.sector} · Suppliers · Competitors</b></div><div><span>PUBLIC COMPANIES</span><b>{story.tickers.length ? story.tickers.join(' · ') : 'No ticker identified in headline'}</b></div><p>Company and ticker associations are surfaced as research context, not a prediction of price direction. Verify details against company filings and original reporting.</p></div>}
          <footer className="card-footer"><div className="source-row"><span className={`impact-badge ${story.importance.toLowerCase()}`}><span/> {story.importance} impact</span><span className="category-label">{story.tag || story.category}</span><span className="footer-sep"/><span className="source-time">{story.time}</span><span className="source-via">via <b>{story.source}</b></span></div><a className="source-link" href={story.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Original source <ArrowUpRight size={13}/></a></footer>
        </article>) : <div className="empty-state"><div className="empty-icon"><Newspaper size={22}/></div><h3>{showSaved ? 'No saved stories yet' : 'No matching stories'}</h3><p>{showSaved ? 'Bookmark a story to keep it close at hand.' : 'Try another search, sector, or market selection.'}</p><button onClick={() => {setSearch(''); setSector('All sectors'); setShowSaved(false)}}>Clear filters</button></div>}
          <div className="feed-end"><span className="end-line"/><span>{loading ? 'Checking trusted sources…' : live ? 'Live headlines · Google News RSS' : 'Curated market intelligence'}</span><span className="end-line"/></div>
        </div>
        <aside className="right-rail"><div className="rail-heading"><h3>Market pulse</h3><button aria-label="Market pulse information"><CircleHelp size={14}/></button></div><div className="pulse-card"><div className="pulse-card-top"><span className="pulse-pill"><span/> ON THE RADAR</span><span className="muted-small">7 DAYS</span></div><div className="pulse-stat">{stories.length + 18}<span> signals tracked</span></div><div className="pulse-caption">Across your selected markets</div><div className="pulse-bars">{[38, 52, 42, 74, 60, 89, 67, 100, 71, 82, 57, 94].map((h, i) => <span key={i} style={{height: `${h}%`}} className={i === 7 ? 'bar-active' : ''}/>)}</div><div className="bar-labels"><span>7 days ago</span><span>Today</span></div></div>
          <div className="rail-section"><div className="rail-heading"><h3>Trending companies</h3><button><ArrowUpRight size={14}/></button></div><div className="trend-row"><span className="trend-rank">01</span><span className="ticker-avatar purple">B</span><span className="trend-name"><b>Broadcom</b><small>Semiconductors</small></span><span className="trend-change positive">+2.8%</span></div><div className="trend-row"><span className="trend-rank">02</span><span className="ticker-avatar blue">V</span><span className="trend-name"><b>Volkswagen</b><small>Automotive</small></span><span className="trend-change negative">−1.4%</span></div><div className="trend-row"><span className="trend-rank">03</span><span className="ticker-avatar green">N</span><span className="trend-name"><b>NVIDIA</b><small>Semiconductors</small></span><span className="trend-change positive">+1.9%</span></div><div className="trend-foot">Market data is indicative · delayed</div></div>
          <div className="rail-section deal-section"><div className="rail-heading"><h3>Deal tracker</h3><span className="deal-count">{dealCount} this week</span></div><div className="deal-row"><span className="deal-icon"><BriefcaseBusiness size={14}/></span><div><b>Strategic investments</b><small>Capital flows & major funding</small></div><ChevronRight size={15}/></div><div className="deal-row"><span className="deal-icon discovery"><Sparkles size={14}/></span><div><b>Corporate actions</b><small>M&amp;A · contracts · expansion</small></div><ChevronRight size={15}/></div><button className="view-all" onClick={() => {setSearch('deal'); setSector('All sectors')}}>Explore deal flow <ArrowUpRight size={13}/></button></div>
          <div className="disclaimer"><span><CircleHelp size={14}/></span><p><b>Research, not recommendations.</b> Headlines and market context are provided to inform your own research—not to predict returns or guarantee outcomes.</p></div>
        </aside></div>
        <footer className="page-footer"><span>Signal Market · Built for thoughtful research</span><span><span className="footer-live-dot"/> Sources are linked to original reporting</span></footer>
      </div>
    </main>
  </div>
}
export default App
