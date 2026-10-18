import type { Results, Hands } from "@mediapipe/hands";
import type { Camera } from "@mediapipe/camera_utils";

export interface HandData {
  x: number;       // 手势 x (0~1 归一化)
  y: number;       // 手势 y (0~1 归一化)
  isPresent: boolean; // 手是否在画面中
}

export type HandCallback = (data: HandData | null) => void;

/**
 * 手部追踪器 — 基于 MediaPipe Hands
 * 食指指尖 → 光标位置
 * 握拳 → 点击/拖拽
 */
export class HandTracker {
  private hands: Hands | null = null;
  private camera: Camera | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private callback: HandCallback;
  private isRunning = false;
  private smoothedX = 0.5;
  private smoothedY = 0.5;
  private smoothFactor = 0.15; // 平滑系数，越小越平滑
  // 手丢失确认
  private absentFrames = 0;
  private readonly ABSENT_THRESHOLD = 10;

  // 画布（调试用，可选）
  private canvasEl: HTMLCanvasElement | null = null;

  constructor(callback: HandCallback) {
    this.callback = callback;
  }

  /** 启动摄像头和手部追踪（MediaPipe 按需动态加载，不拖累首屏） */
  async start(videoEl: HTMLVideoElement, canvasEl?: HTMLCanvasElement) {
    if (this.isRunning) return;
    this.videoEl = videoEl;
    this.canvasEl = canvasEl || null;

    const [{ Hands: HandsImpl }, { Camera: CameraImpl }] = await Promise.all([
      import("@mediapipe/hands"),
      import("@mediapipe/camera_utils"),
    ]);

    this.hands = new HandsImpl({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    this.hands.onResults((results) => this.onResults(results));

    this.camera = new CameraImpl(videoEl, {
      onFrame: async () => {
        await this.hands?.send({ image: videoEl });
      },
      width: 640,
      height: 480,
    });

    await this.camera.start();
    this.isRunning = true;
  }

  /** 停止 */
  stop() {
    this.camera?.stop();
    this.hands?.close();
    this.isRunning = false;
    this.absentFrames = 0;
    this.smoothedX = 0.5;
    this.smoothedY = 0.5;
    this.callback(null);
  }

  /** 是否运行中 */
  get running() {
    return this.isRunning;
  }

  /** 处理 MediaPipe 结果 */
  private onResults(results: Results) {
    // 调试用：绘制手部关键点
    if (this.canvasEl && this.videoEl) {
      const ctx = this.canvasEl.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
        ctx.drawImage(this.videoEl, 0, 0, this.canvasEl.width, this.canvasEl.height);
        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            this.drawLandmarks(ctx, landmarks);
          }
        }
        ctx.restore();
      }
    }

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.absentFrames++;
      if (this.absentFrames >= this.ABSENT_THRESHOLD) {
        this.callback(null); // 手确实离开了
      }
      return;
    }
    this.absentFrames = 0;

    // 用手掌中心（食指根部 MCP landmark 5）作为追踪点，最稳定
    const landmarks = results.multiHandLandmarks[0];
    const palmCenter = landmarks[5];

    const rawX = 1 - palmCenter.x; // 水平翻转（镜像）
    const rawY = palmCenter.y;
    this.smoothedX += (rawX - this.smoothedX) * this.smoothFactor;
    this.smoothedY += (rawY - this.smoothedY) * this.smoothFactor;

    this.callback({
      x: this.smoothedX,
      y: this.smoothedY,
      isPresent: true,
    });
  }

  /** 绘制手部关键点（调试用） */
  private drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number }[]
  ) {
    const w = this.canvasEl!.width;
    const h = this.canvasEl!.height;

    // 连接线
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];
    for (const [a, b] of connections) {
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
      ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
      ctx.stroke();
    }

    // 关键点
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "#00ff00";
      ctx.fill();
    }

    // 高亮手掌中心追踪点
    const hl = landmarks[5];
    ctx.beginPath();
    ctx.arc(hl.x * w, hl.y * h, 8, 0, 2 * Math.PI);
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
