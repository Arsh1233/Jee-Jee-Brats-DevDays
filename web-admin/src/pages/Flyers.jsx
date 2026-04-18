import { useState, useEffect, useRef } from 'react';
import BACKEND_URL from '../config';

const API = BACKEND_URL;

const COLORS = [
    { label: 'Red (Alert)', bg: '#b71c1c', accent: '#ef5350' },
    { label: 'Green (Eco)', bg: '#1b5e20', accent: '#43a047' },
    { label: 'Blue (Info)', bg: '#0d47a1', accent: '#1976d2' },
    { label: 'Orange (Warning)', bg: '#e65100', accent: '#ff6d00' },
    { label: 'Purple (Feature)', bg: '#4a148c', accent: '#7b1fa2' },
    { label: 'Teal (Tip)', bg: '#004d40', accent: '#00897b' },
];

const EMPTY = {
    title: '', subtitle: '', body: '', badge: '',
    bgColor: '#0d47a1', accentColor: '#1976d2', textColor: '#ffffff',
    imageUrl: '', linkUrl: '', active: true,
};

/* ── Flyer Card (grid item) ────────────────────────────────── */
function FlyerCard({ f, onToggle, onDelete }) {
    const hasImage = !!f.imageUrl;
    const imgSrc = f.imageUrl?.startsWith('/') ? `${API}${f.imageUrl}` : f.imageUrl;
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative', borderRadius: 16, overflow: 'hidden',
                background: hasImage ? '#111' : f.bgColor,
                height: 240,
                transition: 'transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s',
                transform: hovered ? 'translateY(-6px) scale(1.015)' : 'none',
                boxShadow: hovered
                    ? `0 16px 40px ${f.bgColor}55, 0 0 0 1px rgba(255,255,255,0.08) inset`
                    : `0 2px 14px rgba(0,0,0,0.12)`,
                cursor: 'default',
                borderLeft: `4px solid ${f.accentColor || f.bgColor}`,
            }}
        >
            {/* Image background */}
            {hasImage && (
                <img src={imgSrc} alt="" style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%', objectFit: 'cover',
                    transition: 'transform .4s',
                    transform: hovered ? 'scale(1.06)' : 'scale(1)',
                }} />
            )}

            {/* Gradient overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: hasImage
                    ? 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.92) 100%)'
                    : `linear-gradient(135deg, ${f.bgColor} 0%, ${f.accentColor}88 100%)`,
            }} />

            {/* Status indicator */}
            <div style={{
                position: 'absolute', top: 12, left: 16, zIndex: 2,
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
                borderRadius: 20, padding: '4px 10px 4px 8px',
            }}>
                <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: f.active ? '#4caf50' : '#ff5252',
                    boxShadow: f.active ? '0 0 8px #4caf5099' : '0 0 8px #ff525299',
                }} />
                <span style={{
                    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
                    textTransform: 'uppercase', letterSpacing: 0.6,
                }}>{f.active ? 'Active' : 'Inactive'}</span>
            </div>

            {/* Link badge */}
            {f.linkUrl && (
                <div style={{
                    position: 'absolute', top: 12, right: 16, zIndex: 2,
                    background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)',
                    borderRadius: 20, padding: '4px 10px',
                    fontSize: 10, color: '#fff', fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.15)',
                }}>🔗 Link</div>
            )}

            {/* Content */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '18px 18px 14px', zIndex: 2,
            }}>
                {f.badge && (
                    <span style={{
                        fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.95)',
                        background: 'rgba(255,255,255,0.18)', borderRadius: 6,
                        padding: '3px 9px', display: 'inline-block', marginBottom: 7,
                        letterSpacing: 0.3,
                    }}>{f.badge}</span>
                )}
                <div style={{
                    fontSize: 16, fontWeight: 800, color: '#fff',
                    marginBottom: 4, lineHeight: 1.35,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}>{f.title}</div>
                {f.subtitle && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 2, letterSpacing: 0.2 }}>
                        {f.subtitle}
                    </div>
                )}
            </div>

            {/* Hover controls */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 3,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                opacity: hovered ? 1 : 0,
                transition: 'opacity .2s',
                pointerEvents: hovered ? 'auto' : 'none',
            }}>
                <button onClick={() => onToggle(f)} style={{
                    padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 12,
                    border: '1.5px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.12)',
                    color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)',
                    transition: 'all .15s',
                }}>{f.active ? '⏸ Deactivate' : '▶ Activate'}</button>
                <button onClick={() => onDelete(f.id)} style={{
                    padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 12,
                    border: 'none', background: 'rgba(220,40,40,0.85)', color: '#fff',
                    cursor: 'pointer', transition: 'all .15s',
                }}>🗑 Delete</button>
            </div>
        </div>
    );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function FlyersPage() {
    const [flyers, setFlyers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState(2);
    const [imagePreview, setImagePreview] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [validationError, setValidationError] = useState('');
    const fileInputRef = useRef(null);

    const load = async () => {
        setLoading(true);
        const r = await fetch(`${API}/api/flyers/all`);
        setFlyers(await r.json());
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const applyPreset = (idx) => {
        setSelectedPreset(idx);
        const p = COLORS[idx];
        setForm(f => ({ ...f, bgColor: p.bg, accentColor: p.accent }));
    };

    const handleImagePick = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch(`${API}/api/flyers/upload`, { method: 'POST', body: fd });
            const { imageUrl } = await res.json();
            setForm(f => ({ ...f, imageUrl }));
        } catch (err) {
            alert('Image upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const clearImage = () => {
        setImagePreview('');
        setForm(f => ({ ...f, imageUrl: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const save = async () => {
        setValidationError('');
        setSaving(true);
        try {
            await fetch(`${API}/api/flyers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            setForm(EMPTY);
            setSelectedPreset(2);
            setImagePreview('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            setShowForm(false);
            await load();
        } catch (err) {
            setValidationError('Failed to publish flyer. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggle = async (f) => {
        await fetch(`${API}/api/flyers/${f.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !f.active }),
        });
        load();
    };

    const del = async (id) => {
        if (!confirm('Delete this flyer?')) return;
        await fetch(`${API}/api/flyers/${id}`, { method: 'DELETE' });
        load();
    };

    const activeCount = flyers.filter(f => f.active).length;

    return (
        <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
            {/* ── Header ── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                marginBottom: 28,
            }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0b2a52', margin: 0 }}>
                        📢 Flyer Management
                    </h1>
                    <p style={{ color: '#5a6a7a', marginTop: 4, fontSize: 13 }}>
                        Create and manage advertisement banners for the mobile app.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Stats pills */}
                    <div style={{
                        display: 'flex', gap: 8,
                    }}>
                        <div style={statPill}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: '#1a66d9' }}>{activeCount}</span>
                            <span style={{ fontSize: 10, color: '#5a6a7a', fontWeight: 600 }}>Active</span>
                        </div>
                        <div style={statPill}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: '#8a97a6' }}>{flyers.length - activeCount}</span>
                            <span style={{ fontSize: 10, color: '#5a6a7a', fontWeight: 600 }}>Paused</span>
                        </div>
                        <div style={statPill}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: '#0b2a52' }}>{flyers.length}</span>
                            <span style={{ fontSize: 10, color: '#5a6a7a', fontWeight: 600 }}>Total</span>
                        </div>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} style={{
                        padding: '10px 22px', borderRadius: 12, border: 'none',
                        background: showForm ? '#e8edf3' : '#1a66d9', color: showForm ? '#5a6a7a' : '#fff',
                        fontSize: 13, fontWeight: 800, cursor: 'pointer',
                        transition: 'all .2s',
                        boxShadow: showForm ? 'none' : '0 4px 16px rgba(26,102,217,0.3)',
                    }}>
                        {showForm ? '✕ Cancel' : '＋ Create Flyer'}
                    </button>
                </div>
            </div>

            {/* ── Create Form (collapsible) ── */}
            {showForm && (
                <div style={{
                    background: '#fff', borderRadius: 20, border: '1px solid #dfe7ef',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: 28,
                    overflow: 'hidden',
                    animation: 'slideDown .25s ease-out',
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0b2a52 0%, #1a3f6f 100%)',
                        padding: '18px 28px', color: '#fff',
                    }}>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: -0.2 }}>✨ Create New Flyer</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>Fill in the details below. Image and link are optional.</p>
                    </div>

                    <div style={{ padding: '28px 32px' }}>
                        {/* Row 1: Image (left) + Title/Subtitle/Badge (right) */}
                        <div style={{ display: 'flex', gap: 28, marginBottom: 24 }}>
                            {/* Image upload — fixed width */}
                            <div style={{ width: 300, flexShrink: 0 }}>
                                <label style={lbl}>🖼️ Advertisement Image</label>
                                {imagePreview ? (
                                    <div style={{
                                        position: 'relative', borderRadius: 14, overflow: 'hidden',
                                        height: 200, background: '#0a0a0a', border: '1px solid #dfe7ef',
                                    }}>
                                        <img src={imagePreview} alt="" style={{
                                            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                                        }} />
                                        <button onClick={clearImage} style={{
                                            position: 'absolute', top: 10, right: 10,
                                            background: 'rgba(0,0,0,0.7)', color: '#fff',
                                            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, width: 30, height: 30,
                                            cursor: 'pointer', fontSize: 14, fontWeight: 900,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            backdropFilter: 'blur(6px)',
                                        }}>✕</button>
                                        {uploading && (
                                            <div style={{
                                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontSize: 13, fontWeight: 700, gap: 8,
                                            }}>
                                                <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                Uploading…
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            border: '2px dashed #c5d5e8', borderRadius: 14,
                                            height: 200, display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', background: '#f8fafd',
                                            transition: 'border-color .2s, background .2s',
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.borderColor = '#1a66d9'; e.currentTarget.style.background = '#eef4ff'; }}
                                        onMouseOut={e => { e.currentTarget.style.borderColor = '#c5d5e8'; e.currentTarget.style.background = '#f8fafd'; }}
                                    >
                                        <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.7 }}>📷</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#3a5a7a' }}>Click to upload image</div>
                                        <div style={{ fontSize: 11, color: '#8a97a6', marginTop: 4 }}>PNG, JPG, WebP · max 5 MB</div>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
                            </div>

                            {/* Fields — fill remaining space */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                    <div>
                                        <label style={lbl}>Title</label>
                                        <input style={inp} placeholder="e.g. साइबर सुरक्षा" value={form.title}
                                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={lbl}>Subtitle</label>
                                        <input style={inp} placeholder="Short tagline" value={form.subtitle}
                                            onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                    <div>
                                        <label style={lbl}>Badge Label</label>
                                        <input style={inp} placeholder="e.g. ⚠️ Alert" value={form.badge}
                                            onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={lbl}>🔗 Link URL</label>
                                        <input style={inp} placeholder="https://example.com" value={form.linkUrl}
                                            onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} />
                                    </div>
                                </div>

                                <label style={lbl}>Body Text</label>
                                <textarea
                                    style={{ ...inp, resize: 'vertical', minHeight: 80 }}
                                    placeholder="Main message / awareness content..."
                                    value={form.body}
                                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Row 2: Color picker + Live Preview side by side */}
                        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
                            {/* Color presets */}
                            {!imagePreview && (
                                <div style={{ width: 300, flexShrink: 0 }}>
                                    <label style={lbl}>🎨 Color Theme</label>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {COLORS.map((c, i) => (
                                            <button key={i} onClick={() => applyPreset(i)} style={{
                                                width: 38, height: 38, borderRadius: 10,
                                                background: `linear-gradient(135deg, ${c.bg}, ${c.accent})`,
                                                border: selectedPreset === i ? '3px solid #1a66d9' : '2px solid transparent',
                                                cursor: 'pointer', outline: 'none',
                                                boxShadow: selectedPreset === i ? '0 0 0 2px #fff, 0 0 0 4px #1a66d9' : 'none',
                                                transition: 'all .15s',
                                            }} title={c.label} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Live Preview */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <label style={lbl}>Live Preview</label>
                                <div style={{
                                    borderRadius: 14, overflow: 'hidden', height: 120,
                                    position: 'relative', background: form.bgColor,
                                }}>
                                    {imagePreview && (
                                        <img src={imagePreview} alt="" style={{
                                            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                                        }} />
                                    )}
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: imagePreview
                                            ? 'linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.75) 100%)'
                                            : `linear-gradient(135deg, ${form.bgColor}, ${form.accentColor}88)`,
                                    }} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 18px', color: '#fff' }}>
                                        {form.badge && (
                                            <span style={{
                                                fontSize: 9, background: 'rgba(255,255,255,0.2)',
                                                borderRadius: 6, padding: '2px 8px', fontWeight: 800,
                                                display: 'inline-block', marginBottom: 5,
                                            }}>{form.badge}</span>
                                        )}
                                        <div style={{ fontWeight: 800, fontSize: 15 }}>{form.title || 'Title preview'}</div>
                                        {form.subtitle && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{form.subtitle}</div>}
                                        {form.linkUrl && <div style={{ fontSize: 9, marginTop: 3, opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔗 {form.linkUrl}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Publish bar */}
                    <div style={{
                        padding: '14px 28px', borderTop: '1px solid #edf1f5',
                        display: 'flex', justifyContent: 'flex-end', gap: 12,
                        background: '#fafbfd',
                    }}>
                        {validationError && (
                            <div style={{ flex: 1, color: '#ef4444', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                ⚠️ {validationError}
                            </div>
                        )}
                        <button onClick={() => { setShowForm(false); setForm(EMPTY); setImagePreview(''); setValidationError(''); }} style={{
                            padding: '10px 24px', borderRadius: 10, border: '1px solid #dfe7ef',
                            background: '#fff', color: '#5a6a7a', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        }}>Cancel</button>
                        <button onClick={save} disabled={saving || uploading} style={{
                            padding: '10px 32px', borderRadius: 10, border: 'none',
                            background: (saving || uploading) ? '#90caf9' : 'linear-gradient(135deg, #1a66d9, #2f7ee6)',
                            color: '#fff', fontSize: 13, fontWeight: 800, cursor: (saving || uploading) ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 16px rgba(26,102,217,0.25)',
                        }}>{saving ? 'Publishing…' : uploading ? 'Uploading…' : '🚀 Publish Flyer'}</button>
                    </div>
                </div>
            )}

            {/* ── Flyer Grid ── */}
            {loading ? (
                <div style={{ textAlign: 'center', color: '#8a97a6', padding: 60, fontSize: 14 }}>Loading…</div>
            ) : flyers.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: 80, color: '#8a97a6',
                    background: '#f7f9fc', borderRadius: 18, border: '2px dashed #dfe7ef',
                }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📢</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#5a6a7a' }}>No flyers yet</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Click "Create Flyer" to get started</div>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 20,
                }}>
                    {flyers.map(f => (
                        <FlyerCard key={f.id} f={f} onToggle={toggle} onDelete={del} />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Style tokens ─────────────────────────────────────────── */
const statPill = {
    background: '#f7f9fc', borderRadius: 12, padding: '8px 14px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    border: '1px solid #edf1f5', minWidth: 56,
};
const sectionHeader = {
    fontSize: 11, fontWeight: 800, color: '#3a5a7a', letterSpacing: 0.6,
    textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6,
    borderBottom: '1px solid #edf1f5',
};
const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#5a6a7a', marginBottom: 5, letterSpacing: 0.2 };
const inp = {
    width: '100%', boxSizing: 'border-box', marginBottom: 0,
    border: '1.5px solid #dfe7ef', borderRadius: 10, padding: '10px 14px',
    fontSize: 13, color: '#1a2332', outline: 'none', background: '#f8fafd',
    transition: 'border-color .2s, box-shadow .2s',
};
