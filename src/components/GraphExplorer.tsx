import { useI18n } from "../i18n";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { nodes, links, categories, type GraphNode } from "@/data/graphData";
import { X, ZoomIn, ZoomOut, Maximize2, Info, ExternalLink, BookOpen, Focus, ArrowLeft, Circle, Link as LinkIcon, Camera, CameraOff, Volume2, VolumeX, Search, SlidersHorizontal } from "lucide-react";
import { HandTracker, type HandData } from "@/utils/HandTracker";

/** 铜铃音频引擎 — 基于 Web Audio API，支持3秒淡出 */
class BellAudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private masterGain: GainNode | null = null;
  private src: string;
  private ready = false;
  private muted = false;
  private lastDistance = 0;
  private lastPlayTime = 0; // AudioContext time

  constructor(src: string) {
    this.src = src;
    this.load();
  }

  /** 异步加载音频文件到 AudioBuffer */
  private async load() {
    try {
      this.audioCtx = new AudioContext();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.audioCtx.destination);

      const response = await fetch(this.src);
      if (!response.ok) throw new Error("fetch failed");
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      this.ready = true;
    } catch (e) {
      console.warn("音频加载失败:", e);
    }
  }

  /** 初始化 AudioContext（解决浏览器自动播放限制） */
  initContext() {
    this.audioCtx?.resume();
  }

  /** 拖拽开始时重置上次位移记录 */
  resetDistance() {
    this.lastDistance = 0;
  }

  /** 静音开关：静音时立即淡出当前声音 */
  setMuted(m: boolean) {
    this.muted = m;
    if (m) this.fadeOut();
  }

  /**
   * 根据拖拽位移播放铜铃声
   * 位移越大 → 音量越大、音高越高
   * 位移明显减小 → 3秒内声音淡出至消失
   */
  playWithDistance(distance: number) {
    if (this.muted) return;
    if (!this.ready || !this.audioCtx || !this.audioBuffer || !this.masterGain) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // 150ms 最小间隔
    if (now - this.lastPlayTime < 0.15) return;
    this.lastPlayTime = now;

    // 位移 → 音量映射：3px时0.25, 50px时0.9
    const normalizedDist = Math.min(50, Math.max(3, distance));
    const volume = 0.25 + ((normalizedDist - 3) / 47) * 0.65;
    const startVol = Math.min(0.9, Math.max(0.2, volume));

    // 位移 → 音高映射：小幅低音(0.85), 大幅高音(1.25)
    const rate = 0.85 + (normalizedDist / 50) * 0.4;

    // 创建独立的 source + gain（每个音符可独立控制淡出）
    const source = ctx.createBufferSource();
    source.buffer = this.audioBuffer;
    source.playbackRate.value = Math.min(1.25, Math.max(0.85, rate));

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(startVol, now);

    // 位移明显减小时（<上次位移的70%），安排3秒淡出
    if (this.lastDistance > 0 && distance < this.lastDistance * 0.7) {
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 3);
    }

    source.connect(noteGain);
    noteGain.connect(this.masterGain);
    source.start(now);

    source.onended = () => {
      try { source.disconnect(); } catch {}
      try { noteGain.disconnect(); } catch {}
    };

    this.lastDistance = distance;
  }

  /** 拖拽结束时 — 0.3秒内快速淡出所有声音 */
  stop() {
    if (!this.ready || !this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    // 0.35秒后恢复 masterGain 为下次拖拽准备
    setTimeout(() => {
      if (this.masterGain && this.audioCtx) {
        this.masterGain.gain.setValueAtTime(1, this.audioCtx.currentTime);
      }
    }, 350);
    this.lastDistance = 0;
  }

  /** 无节点移动时 — 2秒内淡出所有声音 */
  fadeOut() {
    if (!this.ready || !this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
  }

  /** 恢复音量（检测到移动时调用） */
  restoreVolume() {
    if (!this.ready || !this.audioCtx || !this.masterGain) return;
    this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
    this.masterGain.gain.setValueAtTime(1, this.audioCtx.currentTime);
  }

  /** 设置主音量（0~1，根据仿真 alpha 调节） */
  setMasterVolume(vol: number) {
    if (!this.ready || !this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), now, 0.05);
  }
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  category: string;
  description: string;
  detail?: string;
  radius?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
  label: string;
}

const categoryMap = new Map(categories.map((c) => [c.id, c]));

export default function GraphExplorer() {
  const { t } = useI18n();
  const ex = t.graph.explorer;
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  // 铜铃音频引擎
  const bellEngineRef = useRef<BellAudioEngine | null>(null);
  // 拖拽上一次位置（用于计算速度）
  const lastDragPosRef = useRef<{ x: number; y: number } | null>(null);
  // ── 手势追踪 ──
  const [handTrackingEnabled, setHandTrackingEnabled] = useState(false);
  const handTrackerRef = useRef<HandTracker | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const virtualCursorRef = useRef<HTMLDivElement>(null);
  // 手势圆在 SVG 坐标系中的位置（碰撞交互用）
  const handPosRef = useRef<{ x: number; y: number } | null>(null);
  const HAND_RADIUS = 45; // 手势圆半径（与节点类似大小）
  // 碰撞冷却：记录上次碰撞的节点ID和时间，避免同一节点连续高频碰撞
  const collideCooldownRef = useRef<Map<string, number>>(new Map());
  // ── 音效开关 ──
  const [soundEnabled, setSoundEnabled] = useState(true);
  // ── 搜索 ──
  const [searchQuery, setSearchQuery] = useState("");
  // ── 移动端分类面板折叠（桌面默认展开）──
  const [filtersOpen, setFiltersOpen] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  // 缩放行为 / 标签选择集 / 仿真节点引用（搜索定位与标签显隐用）
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const nodeLabelsRef = useRef<d3.Selection<any, SimNode, any, any> | null>(null);
  const linkLabelsRef = useRef<d3.Selection<any, SimLink, any, any> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const getNodeRadius = (d: SimNode) => {
    if (d.radius) return d.radius;
    return d.category === "core" ? 28 : 18;
  };

  // Compute connected nodes for any given node id
  const getConnectedNodes = useCallback((nodeId: string) => {
    const connectedIds = new Set<string>();
    connectedIds.add(nodeId);
    links.forEach((l) => {
      if (l.source === nodeId) connectedIds.add(l.target);
      if (l.target === nodeId) connectedIds.add(l.source);
    });
    return connectedIds;
  }, []);

  // Get related nodes data for selected node
  const relatedNodes = useMemo(() => {
    if (!selectedNode) return [];
    const connected = getConnectedNodes(selectedNode.id);
    return nodes
      .filter((n) => connected.has(n.id) && n.id !== selectedNode.id)
      .map((n) => {
        const link = links.find(
          (l) =>
            (l.source === selectedNode.id && l.target === n.id) ||
            (l.target === selectedNode.id && l.source === n.id)
        );
        return { node: n, relation: link?.label || "" };
      });
  }, [selectedNode, getConnectedNodes]);

  // ── 标签显隐（LOD）：缩得越小显示的标签越少，避免密集区域文字重叠 ──
  const updateLabelVisibility = useCallback(
    (k: number) => {
      nodeLabelsRef.current?.attr("fill-opacity", (d: SimNode) =>
        d.category === "core" || d.id === focusedNodeId || getNodeRadius(d) * k >= 24 ? 1 : 0
      );
      linkLabelsRef.current?.attr("fill-opacity", k >= 1.5 ? 1 : 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusedNodeId]
  );

  // ── 搜索结果（名称命中优先于简介命中）──
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return nodes
      .filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aLabel = a.label.toLowerCase().includes(q) ? 0 : 1;
        const bLabel = b.label.toLowerCase().includes(q) ? 0 : 1;
        return aLabel - bLabel;
      })
      .slice(0, 8);
  }, [searchQuery]);

  /** 搜索结果选中：打开详情 + 居中定位 + 金色脉冲高亮 */
  const handleSearchSelect = useCallback(
    (nodeId: string) => {
      const original = nodes.find((n) => n.id === nodeId);
      if (!original) return;
      setSelectedNode(original);
      setSearchQuery("");
      // 若该节点的分类被过滤掉了，先把它加回来
      if (!activeCategories.has(original.category)) {
        setActiveCategories((prev) => new Set(prev).add(original.category));
      }
      // 延迟到可能的图谱重建完成后再定位
      setTimeout(() => {
        const sim = simNodesRef.current.find((n) => n.id === nodeId);
        const svgEl = svgRef.current;
        const zoom = zoomBehaviorRef.current;
        if (!sim || sim.x === undefined || sim.y === undefined || !svgEl || !zoom) return;
        const width = svgEl.clientWidth;
        const height = svgEl.clientHeight;
        const k = Math.max(1.6, d3.zoomTransform(svgEl).k);
        d3.select(svgEl)
          .transition()
          .duration(600)
          .call(
            zoom.transform as never,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(k)
              .translate(-sim.x, -sim.y)
          );
        // 金色脉冲圈
        if (gRef.current) {
          const r = getNodeRadius(sim);
          const ring = gRef.current
            .selectAll<SVGGElement, SimNode>("g.node")
            .filter((d) => d.id === nodeId)
            .append("circle")
            .attr("r", r + 10)
            .attr("fill", "none")
            .attr("stroke", "#fbbf24")
            .attr("stroke-width", 3)
            .attr("opacity", 1)
            .style("pointer-events", "none");
          ring
            .transition()
            .duration(1600)
            .attr("r", r + 30)
            .attr("opacity", 0)
            .remove();
        }
      }, 150);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCategories]
  );

  const initGraph = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.attr("viewBox", [0, 0, width, height]);

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
        updateLabelVisibility(event.transform.k);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    const g = svg.append("g");
    gRef.current = g;

    // Filter nodes by focus mode and active categories
    let filteredNodes = nodes
      .filter((n) => activeCategories.has(n.category))
      .map((n) => ({ ...n })) as SimNode[];

    let filteredLinks = links.map((l) => ({ ...l })) as SimLink[];

    // Apply focus mode
    if (focusedNodeId) {
      const connectedIds = getConnectedNodes(focusedNodeId);
      filteredNodes = filteredNodes.filter((n) => connectedIds.has(n.id));
      const nodeIds = new Set(filteredNodes.map((n) => n.id));
      filteredLinks = filteredLinks.filter(
        (l) => nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
      );
    } else {
      const nodeIds = new Set(filteredNodes.map((n) => n.id));
      filteredLinks = filteredLinks.filter(
        (l) => nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
      );
    }

    // Simulation — alphaDecay 固定 0.011
    // 拖拽后 alpha=0.5 → alpha=0.005 约需 5~8 秒
    const simulation = d3
      .forceSimulation<SimNode>(filteredNodes)
      .alphaDecay(0.011)
      .velocityDecay(0.12)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(filteredLinks)
          .id((d) => d.id)
          .distance(focusedNodeId ? 150 : 120)
      )
      .force("charge", d3.forceManyBody().strength(focusedNodeId ? -500 : -300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<SimNode>().radius((d) => getNodeRadius(d) + 10))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));

    simulationRef.current = simulation;
    simNodesRef.current = filteredNodes;

    // Links
    const linkGroup = g.append("g").attr("class", "links");

    const link = linkGroup
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke", "#dc2626")
      .attr("stroke-opacity", 0.45)
      .attr("stroke-width", 1.5);

    // Link labels
    const linkLabelGroup = g.append("g").attr("class", "link-labels");

    const linkLabels = linkLabelGroup
      .selectAll("text")
      .data(filteredLinks)
      .join("text")
      .attr("font-size", "10px")
      .attr("fill", "#94a3b8")
      .attr("text-anchor", "middle")
      .attr("dy", -3)
      .text((d) => d.label)
      .style("pointer-events", "none");
    linkLabelsRef.current = linkLabels;

    // Nodes
    const nodeGroup = g.append("g").attr("class", "nodes");

    const node = nodeGroup
      .selectAll("g")
      .data(filteredNodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(
        (d3 as any)
          .drag()
          .on("start", (event: any, d: SimNode) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            // 初始化音频上下文（解决浏览器自动播放限制）
            bellEngineRef.current?.initContext();
            // 重置位移记录
            bellEngineRef.current?.resetDistance();
            lastDragPosRef.current = { x: event.x, y: event.y };
          })
          .on("drag", (event: any, d: SimNode) => {
            d.fx = event.x;
            d.fy = event.y;
            // 根据移动位移触发铜铃声，位移越大声音越大
            if (lastDragPosRef.current) {
              const dx = event.x - lastDragPosRef.current.x;
              const dy = event.y - lastDragPosRef.current.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 3) {
                // 位移越大声音越大，位移变小后3秒内淡出
                bellEngineRef.current?.playWithDistance(dist);
                lastDragPosRef.current = { x: event.x, y: event.y };
              }
            }
          })
          .on("end", (event: any, d: SimNode) => {
            d.fx = null;
            d.fy = null;
            lastDragPosRef.current = null;
            // 拖拽结束时给仿真充能，让节点以惯性缓慢漂移 5~8 秒
            if (!event.active) {
              simulation.alpha(0.5).alphaTarget(0).alphaMin(0.005);
            }
          })
      );

    // Focus indicator ring for focused node
    if (focusedNodeId) {
      const focusedSimNode = filteredNodes.find((n) => n.id === focusedNodeId);
      if (focusedSimNode) {
        node
          .filter((d) => d.id === focusedNodeId)
          .append("circle")
          .attr("r", getNodeRadius(focusedSimNode) + 8)
          .attr("fill", "none")
          .attr("stroke", categoryMap.get(focusedSimNode.category)?.color || "#dc2626")
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", "5,3")
          .attr("opacity", 0.7);
      }
    }

    // ── 铃铛图标节点 ──
    const iconSize = (d: SimNode) => getNodeRadius(d) * 2.2;

    // 铃铛图标（底层）
    node
      .append("image")
      .attr("href", (d) => categoryMap.get(d.category)?.icon || "/icons/1.webp")
      .attr("width", (d) => iconSize(d))
      .attr("height", (d) => iconSize(d))
      .attr("x", (d) => -iconSize(d) / 2)
      .attr("y", (d) => -iconSize(d) / 2)
      .style("filter", (d) => categoryMap.get(d.category)?.filter || "none")
      .attr("opacity", (d) => (focusedNodeId && focusedNodeId !== d.id ? 0.85 : 0.95));

    // 分类色蒙版叠加在图案上（color模式染色）
    node
      .append("circle")
      .attr("r", (d) => getNodeRadius(d) * 0.95)
      .attr("fill", (d) => categoryMap.get(d.category)?.color || "#64748b")
      .style("mix-blend-mode", "color")
      .attr("opacity", 0.65)
      .style("pointer-events", "none");

    // 白色细边框
    node
      .append("circle")
      .attr("r", (d) => getNodeRadius(d))
      .attr("fill", "none")
      .attr("stroke", (d) => categoryMap.get(d.category)?.color || "#94a3b8")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.6)
      .style("pointer-events", "none");

    // Node labels — 白色文字（初始按当前缩放级别做LOD显隐）
    const nodeLabelSel = node
      .append("text")
      .attr("dy", (d) => getNodeRadius(d) + 14)
      .attr("text-anchor", "middle")
      .attr("font-size", (d) => (d.category === "core" ? "13px" : "11px"))
      .attr("font-weight", (d) => (d.category === "core" || d.id === focusedNodeId ? "bold" : "normal"))
      .attr("fill", "#e2e8f0")
      .style("text-shadow", "0 1px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.7)")
      .text((d) => d.label)
      .style("pointer-events", "none");
    nodeLabelsRef.current = nodeLabelSel;
    updateLabelVisibility(svgRef.current ? d3.zoomTransform(svgRef.current).k : 1);

    // Click handler - opens detail panel
    node.on("click", (_event: any, d: SimNode) => {
      const original = nodes.find((n) => n.id === d.id);
      if (original) setSelectedNode(original);
    });

    // Tooltip on hover
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0,0,0,0.8)")
      .style("color", "#fff")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("max-width", "200px")
      .style("pointer-events", "none")
      .style("z-index", "50");

    node
      .on("mouseover", (event: any, d: SimNode) => {
        // 悬停时强制显示该节点标签（LOD 下被隐藏的小节点也能看清）
        d3.select(event.currentTarget as SVGGElement).select("text").attr("fill-opacity", 1);
        tooltip
          .style("visibility", "visible")
          .html(`<strong>${d.label}</strong><br/>${d.description}`);
      })
      .on("mousemove", (event: any) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        tooltip
          .style("left", event.clientX - rect.left + 10 + "px")
          .style("top", event.clientY - rect.top - 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
        if (svgRef.current) {
          updateLabelVisibility(d3.zoomTransform(svgRef.current).k);
        }
      });

      // 节点上一帧位置记录（用于检测仿真自动移动时的位移）
    const prevPositions = new Map<string, { x: number; y: number }>();
    filteredNodes.forEach((n) => {
      if (n.x !== undefined && n.y !== undefined) {
        prevPositions.set(n.id, { x: n.x, y: n.y });
      }
    });
    // 仿真启动后 600ms 内不发声（避免初始散开噪声）
    const simStartTime = Date.now();
    let simFrameCount = 0;
    // 连续静止帧计数（用于检测无移动状态）
    let stillFrameCount = 0;

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      linkLabels
        .attr("x", (d) => (((d.source as SimNode).x! + (d.target as SimNode).x!) / 2))
        .attr("y", (d) => (((d.source as SimNode).y! + (d.target as SimNode).y!) / 2));

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);

      // === 仿真自动移动时声音触发 ===
      simFrameCount++;
      const elapsed = Date.now() - simStartTime;
      if (elapsed < 600 || simFrameCount < 20) return; // 初始冷却期

      let movedCount = 0;
      let anyMoved = false;
      for (const n of filteredNodes) {
        if (n.x === undefined || n.y === undefined) continue;
        const prev = prevPositions.get(n.id);
        if (!prev) {
          prevPositions.set(n.id, { x: n.x, y: n.y });
          continue;
        }
        const dx = n.x - prev.x;
        const dy = n.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // 节点位移超过 2.5px 视为显著移动，触发铜铃声音
        if (dist > 2.5) {
          bellEngineRef.current?.playWithDistance(dist);
          prevPositions.set(n.id, { x: n.x, y: n.y });
          movedCount++;
          anyMoved = true;
          if (movedCount >= 3) break; // 每帧最多3个声音，避免过载
        }
      }

      // === 根据仿真 alpha 调节整体音量 — 漂移中声音逐渐减弱 ===
      const currentAlpha = simulation.alpha();
      if (currentAlpha > 0.15) {
        bellEngineRef.current?.setMasterVolume(1.0);
      } else if (currentAlpha > 0.01) {
        // alpha 0.15→0.01 时，音量 1.0→0.0 线性衰减
        const vol = (currentAlpha - 0.01) / 0.14;
        bellEngineRef.current?.setMasterVolume(Math.max(0, vol));
      } else {
        bellEngineRef.current?.setMasterVolume(0);
      }

      // === 无节点移动时额外淡出 ===
      if (anyMoved) {
        stillFrameCount = 0;
      } else {
        stillFrameCount++;
        if (stillFrameCount === 4) {
          bellEngineRef.current?.fadeOut();
        }
      }

      // === 手势圆碰撞检测 ===
      const handPos = handPosRef.current;
      if (handPos) {
        const now = Date.now();
        const cooldown = collideCooldownRef.current;
        for (const n of filteredNodes) {
          if (n.x === undefined || n.y === undefined) continue;
          const nodeR = getNodeRadius(n);
          const collideR = HAND_RADIUS + nodeR;
          const cdx = n.x - handPos.x;
          const cdy = n.y - handPos.y;
          const cDist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cDist < collideR && cDist > 0.1) {
            // 碰撞！沿手势圆→节点的方向推开
            const pushFactor = 0.35; // 推力系数
            const overlap = collideR - cDist;
            n.x += (cdx / cDist) * overlap * pushFactor;
            n.y += (cdy / cDist) * overlap * pushFactor;
            n.vx = (n.vx || 0) + (cdx / cDist) * overlap * pushFactor * 0.5;
            n.vy = (n.vy || 0) + (cdy / cDist) * overlap * pushFactor * 0.5;

            // 冷却检查：同一节点 250ms 内只响一次
            const lastCollide = cooldown.get(n.id);
            if (!lastCollide || now - lastCollide > 250) {
              cooldown.set(n.id, now);
              bellEngineRef.current?.playWithDistance(overlap * 2);
            }
          }
        }
        // 清理过期冷却记录
        for (const [id, t] of cooldown) {
          if (now - t > 1000) cooldown.delete(id);
        }
      }
    });
  }, [activeCategories, focusedNodeId, getConnectedNodes, updateLabelVisibility]);

  useEffect(() => {
    // 初始化铜铃音频引擎
    if (!bellEngineRef.current) {
      bellEngineRef.current = new BellAudioEngine("/audio/bell.mp3");
    }

    initGraph();

    const handleResize = () => {
      initGraph();
    };
    window.addEventListener("resize", handleResize);

    // 页面可见性变化 — 切回页面时恢复音频上下文
    const handleVisibility = () => {
      if (!document.hidden) {
        bellEngineRef.current?.initContext();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      d3.select(containerRef.current).selectAll(".tooltip").remove();
    };
  }, [initGraph]);

  const toggleCategory = (catId: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        if (next.size > 1) next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  // ── 手势追踪开关 ──
  const toggleHandTracking = useCallback(() => {
    if (handTrackingEnabled) {
      handTrackerRef.current?.stop();
      setHandTrackingEnabled(false);
    } else {
      setHandTrackingEnabled(true); // video 元素渲染后 useEffect 自动启动
    }
  }, [handTrackingEnabled]);

  // 当 handTrackingEnabled 变为 true 且 video 元素就绪后，自动启动追踪
  useEffect(() => {
    if (!handTrackingEnabled) return;
    if (!videoRef.current) return;

    let cancelled = false;
    const startTracker = async () => {
      try {
        const tracker = new HandTracker((data: HandData | null) => {
          if (!data || !data.isPresent) {
            handPosRef.current = null;
            if (virtualCursorRef.current) {
              virtualCursorRef.current.style.opacity = "0";
            }
            return;
          }
          const screenX = data.x * window.innerWidth;
          const screenY = data.y * window.innerHeight;

          // 转换为 SVG 坐标
          if (svgRef.current) {
            const svg = svgRef.current;
            const pt = svg.createSVGPoint();
            pt.x = screenX;
            pt.y = screenY;
            const ctm = svg.getScreenCTM();
            if (ctm) {
              const svgP = pt.matrixTransform(ctm.inverse());
              handPosRef.current = { x: svgP.x, y: svgP.y };
            }
          }

          // 更新视觉光标
          if (virtualCursorRef.current) {
            virtualCursorRef.current.style.transform = `translate(${screenX - HAND_RADIUS}px, ${screenY - HAND_RADIUS}px)`;
            virtualCursorRef.current.style.opacity = "0.8";
          }
        });
        if (cancelled) return;
        handTrackerRef.current = tracker;
        await tracker.start(videoRef.current!, canvasRef.current || undefined);
      } catch (err) {
        console.warn("手势追踪启动失败:", err);
        if (!cancelled) {
          setHandTrackingEnabled(false);
        }
      }
    };
    startTracker();

    return () => {
      cancelled = true;
      handTrackerRef.current?.stop();
    };
  }, [handTrackingEnabled]);

  /** 音效开关：拖拽/碰撞触发的铜铃声 */
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      bellEngineRef.current?.setMuted(!next);
      return next;
    });
  };

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    (svg as any).transition().duration(300).call(
      (d3.zoom() as any).transform,
      d3.zoomTransform(svgRef.current).scale(zoomLevel * 1.3)
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    (svg as any).transition().duration(300).call(
      (d3.zoom() as any).transform,
      d3.zoomTransform(svgRef.current).scale(zoomLevel / 1.3)
    );
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    (svg as any).transition().duration(300).call(
      (d3.zoom() as any).transform,
      d3.zoomIdentity
    );
  };

  const handleFocusNode = (nodeId: string) => {
    setFocusedNodeId(nodeId);
    handleReset();
  };

  const handleClearFocus = () => {
    setFocusedNodeId(null);
    setSelectedNode(null);
    handleReset();
  };

  // void zoomLevel to mark as used
  void zoomLevel;

  return (
    <div className="relative w-full h-full bg-[#030303] overflow-hidden rounded-sm" ref={containerRef} data-lenis-prevent>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center justify-end max-w-7xl mx-auto flex-wrap gap-x-2 gap-y-2">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* 节点搜索 */}
            <div className="relative order-last sm:order-none w-full sm:w-48 md:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults.length > 0) {
                    handleSearchSelect(searchResults[0].id);
                  }
                  if (e.key === "Escape") setSearchQuery("");
                }}
                placeholder={ex.searchPlaceholder}
                aria-label={ex.searchLabel}
                className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500/60"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900/95 border border-slate-700/60 rounded-lg shadow-xl overflow-hidden z-30 backdrop-blur-md">
                  {searchResults.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleSearchSelect(n.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800/70 text-left transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: categoryMap.get(n.category)?.color }}
                      />
                      <span className="text-xs text-slate-200 truncate">{n.label}</span>
                      <span className="text-[10px] text-slate-500 flex-shrink-0 ml-auto">
                        {t.graph.categories[n.category] ?? categoryMap.get(n.category)?.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {focusedNodeId && (
              <button
                onClick={handleClearFocus}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/50 hover:bg-red-800/60 text-red-300 rounded-lg transition-colors text-xs font-medium border border-red-800/30"
                title={ex.backToAll}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {ex.viewAll}
              </button>
            )}
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors hidden sm:block"
              title={ex.zoomIn}
            >
              <ZoomIn className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors hidden sm:block"
              title={ex.zoomOut}
            >
              <ZoomOut className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title={ex.resetView}
            >
              <Maximize2 className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={toggleSound}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title={soundEnabled ? ex.soundOff : ex.soundOn}
              aria-label={soundEnabled ? ex.soundOff : ex.soundOn}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-red-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
            <button
              onClick={toggleHandTracking}
              className={`p-2 rounded-lg transition-colors hidden sm:block ${
                handTrackingEnabled
                  ? "bg-green-900/50 hover:bg-green-800/60"
                  : "hover:bg-slate-800"
              }`}
              title={handTrackingEnabled ? ex.gestureOff : ex.gestureOn}
            >
              {handTrackingEnabled ? (
                <Camera className="w-4 h-4 text-green-400" />
              ) : (
                <CameraOff className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Focus Mode Indicator */}
      {focusedNodeId && (
        <div className="absolute top-[140px] left-28 right-4 md:top-16 md:left-4 z-10 flex justify-center">
          <div className="bg-red-900/40 border border-red-700/40 rounded-xl px-4 py-2 shadow-md flex items-center gap-2">
            <Focus className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-300">
              {ex.focusMode(nodes.find((n) => n.id === focusedNodeId)?.label ?? "")}
            </span>
            <button
              onClick={handleClearFocus}
              className="ml-2 text-xs text-red-400 hover:text-red-200 underline"
            >
              {ex.viewAll}
            </button>
          </div>
        </div>
      )}

      {/* Category Filters — 移动端折叠按钮 */}
      <button
        onClick={() => setFiltersOpen((v) => !v)}
        className="absolute top-[140px] md:top-16 left-4 z-20 md:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50 text-xs text-slate-300 shadow-lg"
        aria-expanded={filtersOpen}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        {ex.filters}
      </button>

      {/* Category Filters */}
      <div
        className={`absolute top-[184px] md:top-16 left-4 z-10 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 shadow-lg max-w-[200px] max-h-[55vh] md:max-h-none overflow-y-auto ${
          filtersOpen ? "block" : "hidden"
        } md:block`}
      >
        <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          {ex.filters}
        </h3>
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                activeCategories.has(cat.id)
                  ? "bg-slate-800 text-slate-200"
                  : "text-slate-500 opacity-40"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: cat.color,
                  opacity: activeCategories.has(cat.id) ? 1 : 0.3,
                }}
              />
              <span className="truncate">{t.graph.categories[cat.id] ?? cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SVG Graph */}
      <svg
        ref={svgRef}
        className="w-full h-full block pt-14"
      />

      {/* Node Detail Panel */}
      {selectedNode && (
        <div className="absolute top-[140px] sm:top-16 left-4 right-4 sm:left-auto sm:right-4 z-10 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl sm:max-w-sm sm:w-full max-h-[55vh] sm:max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: categoryMap.get(selectedNode.category)?.color,
                }}
              />
              <span className="text-xs text-slate-400">
                {t.graph.categories[selectedNode.category] ?? categoryMap.get(selectedNode.category)?.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {!focusedNodeId && (
                <button
                  onClick={() => handleFocusNode(selectedNode.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 rounded-lg transition-colors mr-1"
                  title={ex.focus}
                >
                  <Focus className="w-3.5 h-3.5" />
                  {ex.expand}
                </button>
              )}
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <h2 className="text-lg font-bold text-slate-100 mb-2">
              {selectedNode.label}
            </h2>
            <p className="text-sm text-slate-400 mb-3 leading-relaxed">
              {selectedNode.description}
            </p>
            {selectedNode.detail && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5 mb-2">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-400">
                    {ex.detail}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {selectedNode.detail}
                </p>
              </div>
            )}

            {/* Related Nodes Section */}
            {relatedNodes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5 mb-2">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-400">
                    {ex.related(relatedNodes.length)}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {relatedNodes.map(({ node, relation }, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedNode(node);
                      }}
                      className="w-full flex items-start gap-2 px-2 py-1.5 hover:bg-slate-800/60 rounded-lg transition-colors text-left"
                    >
                      <Circle
                        className="w-2.5 h-2.5 flex-shrink-0 mt-0.5"
                        style={{
                          color: categoryMap.get(node.category)?.color || "#64748b",
                          fill: categoryMap.get(node.category)?.color || "#64748b",
                        }}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-slate-300">
                          {node.label}
                        </span>
                        {relation && (
                          <span className="text-[10px] text-slate-500 ml-1">
                            ({relation})
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {!focusedNodeId && (
                  <button
                    onClick={() => handleFocusNode(selectedNode.id)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-900/30 hover:bg-red-800/40 text-red-400 rounded-lg transition-colors text-xs font-medium border border-red-800/20"
                  >
                    <Focus className="w-3.5 h-3.5" />
                    {ex.focus}
                  </button>
                )}
              </div>
            )}

            {/* Sources Section */}
            {selectedNode.sources && selectedNode.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5 mb-2">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-400">
                    {ex.sources(selectedNode.sources.length)}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {selectedNode.sources.map((source, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <span className="text-[10px] text-slate-600 mt-0.5 flex-shrink-0">
                        [{index + 1}]
                      </span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline leading-relaxed flex items-center gap-1 break-all"
                        title={source.url}
                      >
                        {source.title}
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 虚拟手势光标 — 大圆碰撞体 ── */}
      <div
        ref={virtualCursorRef}
        className="fixed top-0 left-0 z-50 pointer-events-none"
        style={{
          width: HAND_RADIUS * 2,
          height: HAND_RADIUS * 2,
          borderRadius: "50%",
          border: "2px solid rgba(220,38,38,0.6)",
          backgroundColor: "rgba(220,38,38,0.08)",
          opacity: 0,
          boxShadow: "0 0 20px rgba(220,38,38,0.15), inset 0 0 20px rgba(220,38,38,0.05)",
        }}
      >
        {/* 中心精确点 */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "rgba(220,38,38,0.8)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 8px rgba(220,38,38,0.6)",
          }}
        />
      </div>

      {/* ── 摄像头预览 ── */}
      <div
        className={`absolute bottom-4 right-4 z-40 bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 p-2 shadow-xl transition-opacity duration-300 ${
          handTrackingEnabled ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative">
          <video
            ref={videoRef}
            className="w-48 h-36 rounded-lg object-cover"
            style={{ transform: "scaleX(-1)" }}
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            className="absolute top-0 left-0 w-48 h-36 rounded-lg pointer-events-none"
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="absolute top-1 left-1 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-400 font-medium">{ex.tracking}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 text-center">
            {ex.trackingHint}
          </p>
        </div>
      </div>

      {/* Legend bottom */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/70 backdrop-blur-sm rounded-lg border border-slate-700/40 px-3 py-2 shadow-md">
        <p className="text-[10px] text-slate-500">
          {ex.stats(nodes.length, links.length)}
        </p>
      </div>
    </div>
  );
}
