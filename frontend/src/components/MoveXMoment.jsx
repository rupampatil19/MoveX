import { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { X, Download, Share2, Copy, Check, Sparkles } from 'lucide-react';
import Button from './ui/Button';

const FORMATS = {
  story: { width: 1080, height: 1920, label: 'Story' },
  square: { width: 1080, height: 1080, label: 'Square' },
};

export default function MoveXMoment({ isOpen, onClose, data }) {
  const [format, setFormat] = useState('story');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  const dims = FORMATS[format];

  const caption = data
    ? `Just logged ${Math.round(data.duration || 0)} min of ${data.activityType || 'activity'}${data.distance ? ` (${data.distance} km)` : ''} on MoveX!\n\n⚡ +${data.energy || 0} Energy\n⭐ +${data.xp || 0} XP${data.trophy ? `\n🏆 ${data.trophy}` : ''}\n🔥 ${data.streak || 0}-day streak\n\n${data.region ? `Powered ${data.region}.` : ''} #MoveX #MoveMoreEvolveTogether`
    : '';

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const exportPng = async () => {
    if (!cardRef.current) return null;
    return await toPng(cardRef.current, {
      width: dims.width,
      height: dims.height,
      pixelRatio: 1,
      cacheBust: true,
      style: { transform: 'none', transformOrigin: 'top left' },
    });
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const dataUrl = await exportPng();
      if (!dataUrl) return;
      const link = document.createElement('a');
      link.download = `movex-moment-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Could not export image. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const dataUrl = await exportPng();
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'movex-moment.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My MoveX Moment', text: caption });
      } else {
        const link = document.createElement('a');
        link.download = `movex-moment-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (!isOpen || !data) return null;

  const previewScale = format === 'story' ? 0.24 : 0.3;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="moment-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2563EB]" />
                <h2 className="text-base font-semibold text-gray-900">MoveX Moment</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 px-5 pt-4 shrink-0">
              {Object.entries(FORMATS).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    format === key
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>

            <div className="px-5 py-4 flex justify-center overflow-y-auto">
              <div
                style={{
                  width: `${dims.width * previewScale}px`,
                  height: `${dims.height * previewScale}px`,
                }}
                className="relative overflow-hidden rounded-2xl shadow-lg border border-gray-200"
              >
                <div
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <MomentCard ref={cardRef} data={data} dims={dims} />
                </div>
              </div>
            </div>

            <div className="px-5 shrink-0">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Caption
                </p>
                <p className="text-xs text-gray-700 whitespace-pre-line max-h-16 overflow-hidden">
                  {caption}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-2 shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" onClick={handleShare} loading={busy} icon={Share2}>
                  Share
                </Button>
                <Button variant="secondary" onClick={handleDownload} loading={busy} icon={Download}>
                  Download
                </Button>
              </div>
              <Button
                variant="ghost"
                fullWidth
                onClick={handleCopyCaption}
                icon={copied ? Check : Copy}
              >
                {copied ? 'Copied!' : 'Copy Caption'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   Moment card — full native size (1080x1920 or 1080x1080)
   ============================================================ */
const MomentCard = forwardRef(({ data, dims }, ref) => {
  const isStory = dims.height > dims.width;
  const iconMap = {
    running: '🏃',
    walking: '🚶',
    cycling: '🚴',
    workout: '🏋️',
  };
  const icon = iconMap[data.activityType] || '🏃';

  return (
    <div
      ref={ref}
      style={{
        width: dims.width,
        height: dims.height,
        background: 'linear-gradient(160deg, #2563EB 0%, #1D4ED8 55%, #1e3a8a 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#fff',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -200,
          right: -150,
          width: 600,
          height: 600,
          borderRadius: 9999,
          background: 'rgba(255,255,255,0.06)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -300,
          left: -200,
          width: 800,
          height: 800,
          borderRadius: 9999,
          background: 'rgba(255,255,255,0.05)',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          padding: isStory ? 80 : 64,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              fontStyle: 'italic',
              fontWeight: 800,
              fontSize: isStory ? 56 : 48,
              letterSpacing: -1,
            }}
          >
            Move<span style={{ color: '#93c5fd' }}>X</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.15)',
              padding: '10px 20px',
              borderRadius: 9999,
              fontSize: isStory ? 24 : 22,
              fontWeight: 600,
            }}
          >
            🔥 {data.streak || 0} days
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: isStory ? 32 : 24,
          }}
        >
          <div>
            <div style={{ fontSize: isStory ? 200 : 160, lineHeight: 1, marginBottom: isStory ? 16 : 12 }}>
              {icon}
            </div>
            <div
              style={{
                fontSize: isStory ? 40 : 32,
                textTransform: 'uppercase',
                letterSpacing: 6,
                opacity: 0.85,
                fontWeight: 600,
                marginBottom: isStory ? 12 : 8,
              }}
            >
              {data.activityType || 'Activity'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: isStory ? 64 : 48, flexWrap: 'wrap' }}>
            {data.distance > 0 && (
              <StatBlock label="Distance" value={data.distance} unit="km" isStory={isStory} />
            )}
            <StatBlock label="Duration" value={Math.round(data.duration || 0)} unit="min" isStory={isStory} />
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 32,
            padding: isStory ? 40 : 32,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: isStory ? 32 : 24,
            marginBottom: isStory ? 40 : 32,
          }}
        >
          <RewardBlock icon="⚡" label="Energy" value={data.energy || 0} isStory={isStory} />
          <RewardBlock icon="⭐" label="XP" value={data.xp || 0} isStory={isStory} />
        </div>

        <div>
          {(data.region || data.city || data.state) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: isStory ? 28 : 24,
                opacity: 0.9,
                marginBottom: isStory ? 24 : 16,
              }}
            >
              📍 {[data.region, data.city, data.state].filter(Boolean).join(' · ')}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: isStory ? 32 : 24,
              borderTop: '2px solid rgba(255,255,255,0.2)',
              fontSize: isStory ? 24 : 20,
              opacity: 0.8,
            }}
          >
            <span style={{ fontWeight: 600 }}>Move More. Evolve Together.</span>
            <span>movex.app</span>
          </div>
        </div>
      </div>
    </div>
  );
});

MomentCard.displayName = 'MomentCard';

function StatBlock({ label, value, unit, isStory }) {
  return (
    <div>
      <p
        style={{
          fontSize: isStory ? 24 : 20,
          textTransform: 'uppercase',
          letterSpacing: 4,
          opacity: 0.7,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: isStory ? 88 : 72, fontWeight: 800, lineHeight: 1 }}>
        {value}
        <span style={{ fontSize: isStory ? 32 : 26, marginLeft: 12, opacity: 0.7, fontWeight: 600 }}>
          {unit}
        </span>
      </p>
    </div>
  );
}

function RewardBlock({ icon, label, value, isStory }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: isStory ? 48 : 40, marginBottom: 8 }}>{icon}</div>
      <p
        style={{
          fontSize: isStory ? 24 : 20,
          textTransform: 'uppercase',
          letterSpacing: 3,
          opacity: 0.75,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: isStory ? 56 : 48, fontWeight: 800, lineHeight: 1 }}>
        +{value}
      </p>
    </div>
  );
}