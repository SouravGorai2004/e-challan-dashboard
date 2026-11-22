import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, Maximize, Minimize,
  Volume2, VolumeX, RotateCcw, FileVideo,
} from 'lucide-react';
import { formatDuration, formatPrecise } from '../../utils/format';

const SPEEDS = [0.5, 1, 1.5, 2];
const FPS = 25; // frame step assumes 25 fps; adjust if the footage differs
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

export default function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const frameRef = useRef(null);
  const dragRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const [failed, setFailed] = useState(false);

  // Reset when the source changes.
  useEffect(() => {
    setFailed(false); setPlaying(false); setCurrent(0); setZoom(1); setPan({ x: 0, y: 0 });
  }, [src]);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  }, []);

  const seek = (t) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(t, 0), duration || 0);
    setCurrent(v.currentTime);
  };

  const stepFrame = (dir) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    seek(v.currentTime + dir / FPS);
  };

  const changeSpeed = (s) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
  };

  const changeVolume = (val) => {
    setVolume(val);
    setMuted(val === 0);
    if (videoRef.current) { videoRef.current.volume = val; videoRef.current.muted = val === 0; }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  };

  const setZoomClamped = (z) => {
    const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +z.toFixed(2)));
    setZoom(nz);
    if (nz === 1) setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else frameRef.current?.requestFullscreen?.();
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Drag to pan when zoomed in.
  const onPointerDown = (e) => {
    if (zoom <= 1) return;
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const onPointerUp = () => { dragRef.current = null; };

  const onWheel = (e) => {
    if (!e.ctrlKey && !e.altKey) return;
    e.preventDefault();
    setZoomClamped(zoom + (e.deltaY < 0 ? 0.25 : -0.25));
  };

  // Keyboard shortcuts while the player has focus.
  const onKeyDown = (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'range') return;
    switch (e.key) {
      case ' ': e.preventDefault(); togglePlay(); break;
      case 'ArrowLeft': e.preventDefault(); stepFrame(-1); break;
      case 'ArrowRight': e.preventDefault(); stepFrame(1); break;
      case '+': case '=': setZoomClamped(zoom + 0.5); break;
      case '-': setZoomClamped(zoom - 0.5); break;
      case 'f': case 'F': toggleFullscreen(); break;
      default: break;
    }
  };

  return (
    <div className="vp" ref={frameRef} tabIndex={0} onKeyDown={onKeyDown} aria-label="CCTV evidence video player">
      <div
        className="vp-stage"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={toggleFullscreen}
        style={{ cursor: zoom > 1 ? (dragRef.current ? 'grabbing' : 'grab') : 'default' }}
      >
        {!failed ? (
          <video
            ref={videoRef}
            src={src}
            className="vp-video"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            preload="metadata"
            playsInline
            onClick={() => zoom === 1 && togglePlay()}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setFailed(true)}
            draggable={false}
          />
        ) : (
          <div className="vp-missing">
            <FileVideo size={40} />
            <div className="vp-missing-title">CCTV video file not found</div>
            <div className="small">
              Place the supplied footage at <span className="mono">public{src}</span> and reload.
              <br />The path can be changed in <span className="mono">src/data/config.js</span>.
            </div>
          </div>
        )}
        {!failed && zoom > 1 && <div className="vp-zoom-tag">{Math.round(zoom * 100)}% · drag to pan</div>}
      </div>

      <div className="vp-timeline">
        <input
          type="range" min={0} max={duration || 0} step={0.01} value={current}
          onChange={(e) => seek(parseFloat(e.target.value))}
          disabled={failed || !duration} aria-label="Timeline"
          style={{ '--pct': duration ? `${(current / duration) * 100}%` : '0%' }}
        />
      </div>

      <div className="vp-toolbar">
        <div className="vp-group">
          <button className="vp-btn" onClick={() => stepFrame(-1)} disabled={failed} title="Previous frame (←)" aria-label="Previous frame"><SkipBack size={16} /></button>
          <button className="vp-btn vp-btn-main" onClick={togglePlay} disabled={failed} title="Play / Pause (Space)" aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button className="vp-btn" onClick={() => stepFrame(1)} disabled={failed} title="Next frame (→)" aria-label="Next frame"><SkipForward size={16} /></button>
          <span className="vp-time mono" title="Current time / duration">
            {formatPrecise(current)} <span className="vp-dim">/ {formatDuration(duration)}</span>
          </span>
        </div>

        <div className="vp-group">
          <div className="vp-speed" role="group" aria-label="Playback speed">
            {SPEEDS.map((s) => (
              <button key={s} className={`vp-chip ${speed === s ? 'on' : ''}`} onClick={() => changeSpeed(s)} disabled={failed}>{s}x</button>
            ))}
          </div>
        </div>

        <div className="vp-group">
          <button className="vp-btn" onClick={toggleMute} disabled={failed} aria-label={muted ? 'Unmute' : 'Mute'} title="Mute">
            {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input className="vp-vol" type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
            onChange={(e) => changeVolume(parseFloat(e.target.value))} aria-label="Volume" disabled={failed} />
        </div>

        <div className="vp-group">
          <button className="vp-btn" onClick={() => setZoomClamped(zoom - 0.5)} disabled={failed || zoom <= MIN_ZOOM} title="Zoom out (−)" aria-label="Zoom out"><ZoomOut size={16} /></button>
          <span className="vp-zoom mono">{Math.round(zoom * 100)}%</span>
          <button className="vp-btn" onClick={() => setZoomClamped(zoom + 0.5)} disabled={failed || zoom >= MAX_ZOOM} title="Zoom in (+)" aria-label="Zoom in"><ZoomIn size={16} /></button>
          <button className="vp-btn" onClick={resetView} disabled={failed || zoom === 1} title="Reset zoom" aria-label="Reset zoom"><RotateCcw size={15} /></button>
          <button className="vp-btn" onClick={toggleFullscreen} disabled={failed} title="Fullscreen (F)" aria-label="Fullscreen">
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
