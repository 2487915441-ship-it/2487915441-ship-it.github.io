import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import GraphExplorer from '../components/GraphExplorer';
import { nodes, links } from '../data/graphData';
import { useI18n } from '../i18n';

export default function KnowledgeGraph() {
  const [loaded, setLoaded] = useState(false);
  const { t } = useI18n();
  const g = t.graph;

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-obsidian">
      {/* Loading screen */}
      <div
        className={`fixed inset-0 z-[200] bg-obsidian flex items-center justify-center transition-opacity duration-700 pointer-events-none ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="text-center">
          <h1 className="font-display text-[24px] text-bone mb-2 tracking-widest">{g.loadingTitle}</h1>
          <span className="font-accent text-[11px] text-bronze/60 tracking-[0.4em] uppercase">
            {g.loadingAccent}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Page header */}
      <div className="pt-28 pb-8 px-8 lg:px-16 max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <span className="font-accent text-[12px] text-bronze tracking-[0.3em] uppercase block mb-3">
              {g.eyebrow}
            </span>
            <h1 className="font-display text-[clamp(1.8rem,4vw,2.5rem)] text-bone leading-tight">
              {g.title}
            </h1>
          </div>
          <p className="font-ui text-[13px] text-bone/50 max-w-md leading-relaxed">
            {g.desc(nodes.length, links.length)}
          </p>
        </div>
        <div className="mt-6 w-full h-px bg-gradient-to-r from-bronze/40 via-bone/10 to-transparent" />
      </div>

      {/* 原生图谱（已两站集成，不再依赖外部 iframe） */}
      <div className="px-4 lg:px-8 pb-8">
        <div
          className="relative w-full border border-bone/10 rounded-sm overflow-hidden"
          style={{ height: 'calc(100vh - 200px)', minHeight: 480 }}
        >
          <GraphExplorer />
        </div>
      </div>

      {/* Footer note */}
      <div className="px-8 lg:px-16 pb-8 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between pt-6 border-t border-bone/10">
          <p className="font-ui text-[11px] text-bone/30">
            {g.footnote(nodes.length, links.length)}
          </p>
          <p className="font-ui text-[11px] text-bronze/60 tracking-wider">
            {g.badge}
          </p>
        </div>
      </div>
    </div>
  );
}
