import { useState, useEffect } from "react";
import * as fb from './firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const uid = () => Math.random().toString(36).slice(2, 9);

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #1a1208; --paper: #faf7f2; --paper2: #f2ede4; --border: #e0d8cc;
    --accent: #c9622f; --accent2: #e8a87c; --green: #3d7a5e; --red: #b84040;
    --yellow: #c8952a; --shadow: 0 2px 12px rgba(26,18,8,.10); --radius: 10px;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); min-height: 100vh; }
  h1, h2, h3 { font-family: 'DM Serif Display', serif; }
  .app { display: flex; min-height: 100vh; }

  .sidebar {
    width: 220px; background: var(--ink); color: var(--paper);
    display: flex; flex-direction: column; padding: 28px 0 20px;
    position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
  }
  .sidebar-logo { padding: 0 20px 24px; border-bottom: 1px solid rgba(255,255,255,.1); }
  .sidebar-logo h1 { font-size: 1.35rem; color: var(--accent2); }
  .sidebar-logo span { font-size: .72rem; opacity: .45; letter-spacing: .06em; text-transform: uppercase; font-family: 'DM Sans', sans-serif; }
  .nav { display: flex; flex-direction: column; gap: 3px; padding: 20px 10px; flex: 1; }
  .nav-btn {
    background: none; border: none; cursor: pointer; color: rgba(250,247,242,.6);
    font-family: 'DM Sans', sans-serif; font-size: .875rem; font-weight: 500;
    padding: 9px 13px; border-radius: 8px; display: flex; align-items: center; gap: 9px;
    transition: all .15s; text-align: left; width: 100%;
  }
  .nav-btn:hover { background: rgba(255,255,255,.08); color: var(--paper); }
  .nav-btn.active { background: var(--accent); color: #fff; }

  .main { margin-left: 220px; flex: 1; padding: 36px 36px 60px; }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
  .page-header h2 { font-size: 1.9rem; }

  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat {
    background: #fff; border: 1px solid var(--border); border-radius: var(--radius);
    padding: 18px 20px; box-shadow: var(--shadow); position: relative; overflow: hidden;
  }
  .stat::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--accent); }
  .stat.g::before { background: var(--green); }
  .stat.r::before { background: var(--red); }
  .stat.y::before { background: var(--yellow); }
  .stat-label { font-size: .73rem; text-transform: uppercase; letter-spacing: .07em; opacity: .5; margin-bottom: 5px; font-family: 'DM Sans', sans-serif; }
  .stat-val { font-size: 1.9rem; font-family: 'DM Serif Display', serif; }
  .stat-sub { font-size: .78rem; opacity: .45; margin-top: 2px; }

  .card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 22px; }
  .card-title { font-size: 1rem; margin-bottom: 14px; font-family: 'DM Serif Display', serif; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }

  .rooms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
  .room-card {
    background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius);
    padding: 18px 20px; box-shadow: var(--shadow); transition: border-color .15s;
  }
  .room-card:hover { border-color: var(--accent2); }
  .room-card.occupied { border-color: var(--accent2); }
  .room-name { font-size: 1.1rem; font-family: 'DM Serif Display', serif; margin-bottom: 3px; }
  .room-rent { font-size: .82rem; opacity: .5; margin-bottom: 10px; }
  .room-tenant { background: var(--paper2); border-radius: 7px; padding: 10px 12px; margin-bottom: 10px; font-size: .875rem; }
  .room-tenant strong { display: block; margin-bottom: 2px; }
  .room-tenant span { opacity: .55; font-size: .8rem; }
  .room-vacant { background: var(--paper2); border-radius: 7px; padding: 10px 12px; margin-bottom: 10px; opacity: .45; font-size: .85rem; font-style: italic; }
  .room-actions { display: flex; gap: 7px; flex-wrap: wrap; }

  table { width: 100%; border-collapse: collapse; font-size: .875rem; }
  thead th { text-align: left; padding: 9px 12px; border-bottom: 2px solid var(--border); font-size: .72rem; text-transform: uppercase; letter-spacing: .07em; opacity: .5; font-weight: 600; }
  tbody tr { transition: background .1s; }
  tbody tr:hover { background: var(--paper2); }
  tbody td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tbody tr:last-child td { border-bottom: none; }

  .badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: .73rem; font-weight: 600; }
  .bg { background: #d6f0e5; color: var(--green); }
  .br { background: #fce8e8; color: var(--red); }
  .by { background: #fdf3dc; color: var(--yellow); }
  .bx { background: var(--paper2); color: #888; }

  .btn {
    border: none; cursor: pointer; border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: .85rem;
    padding: 8px 16px; transition: all .15s; display: inline-flex; align-items: center; gap: 5px;
  }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: #b5521f; }
  .btn-ghost { background: transparent; border: 1.5px solid var(--border); color: var(--ink); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
  .btn-danger { background: #fce8e8; color: var(--red); }
  .btn-danger:hover { background: var(--red); color: #fff; }
  .btn-green { background: #d6f0e5; color: var(--green); }
  .btn-green:hover { background: var(--green); color: #fff; }
  .btn-sm { padding: 4px 10px; font-size: .78rem; }
  .btn-row { display: flex; gap: 7px; flex-wrap: wrap; }

  .overlay {
    position: fixed; inset: 0; background: rgba(26,18,8,.45);
    z-index: 200; display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(2px); animation: fadeIn .15s;
  }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  .modal {
    background: #fff; border-radius: 14px; padding: 28px;
    width: 440px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 20px 60px rgba(26,18,8,.25); animation: slideUp .2s;
  }
  @keyframes slideUp { from { transform: translateY(16px); opacity:0 } to { transform: none; opacity:1 } }
  .modal h3 { font-size: 1.3rem; margin-bottom: 20px; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 22px; }

  .fg { margin-bottom: 14px; }
  .fg label { display: block; font-size: .78rem; font-weight: 600; margin-bottom: 5px; opacity: .65; text-transform: uppercase; letter-spacing: .04em; }
  .fg input, .fg select {
    width: 100%; padding: 9px 12px; border: 1.5px solid var(--border); border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: .875rem; background: var(--paper); color: var(--ink);
    transition: border .15s; outline: none;
  }
  .fg input:focus, .fg select:focus { border-color: var(--accent); background: #fff; }
  .fg .hint { font-size: .73rem; opacity: .4; margin-top: 3px; }
  .err { color: var(--red); font-size: .77rem; margin-top: 3px; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .filter-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
  .filter-bar select {
    padding: 7px 12px; border: 1.5px solid var(--border); border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: .85rem; background: #fff; outline: none;
  }
  .filter-bar select:focus { border-color: var(--accent); }

  .empty { padding: 36px; text-align: center; opacity: .35; font-size: .875rem; }

  @media (max-width: 860px) {
    .sidebar { width: 56px; }
    .sidebar-logo, .nav-btn span { display: none; }
    .main { margin-left: 56px; padding: 20px 14px; }
    .stats { grid-template-columns: 1fr 1fr; }
    .two-col { grid-template-columns: 1fr; }
  }
`;

const Modal = ({ title, onClose, children }) => (
  <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal"><h3>{title}</h3>{children}</div>
  </div>
);

const Confirm = ({ msg, onOk, onCancel }) => (
  <div className="overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
    <div className="modal" style={{ width: 340 }}>
      <h3>Confirm Delete</h3>
      <p style={{ marginBottom: 22, opacity: .65, fontSize: '.9rem' }}>{msg}</p>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={onOk}>Delete</button>
      </div>
    </div>
  </div>
);

const F = ({ label, error, hint, children }) => (
  <div className="fg">
    <label>{label}</label>
    {children}
    {hint && <div className="hint">{hint}</div>}
    {error && <div className="err">{error}</div>}
  </div>
);

const valRoom = d => {
  const e = {};
  if (!d.name?.trim()) e.name = "Room name is required";
  if (!d.rent || isNaN(d.rent) || +d.rent <= 0) e.rent = "Enter a valid rent amount";
  return e;
};

const valTenant = d => {
  const e = {};
  if (!d.name?.trim()) e.name = "Tenant name is required";
  if (!d.roomId) e.roomId = "Please assign a room";
  if (d.email && !/\S+@\S+\.\S+/.test(d.email)) e.email = "Invalid email format";
  return e;
};

const valBill = d => {
  const e = {};
  if (!d.tenantId) e.tenantId = "Select a tenant";
  if (!d.month) e.month = "Select a month";
  if (!d.amount || isNaN(d.amount) || +d.amount <= 0) e.amount = "Enter a valid amount";
  return e;
};

const BILL_TYPES = ['Rent', 'Electricity', 'Water', 'Internet', 'Maintenance', 'Other'];

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
const Dashboard = ({ rooms, tenants, bills }) => {
  const paid = bills.filter(b => b.paid).length;
  const unpaid = bills.filter(b => !b.paid).length;
  const pending = bills.filter(b => !b.paid).reduce((s, b) => s + +b.amount, 0);
  const recent = [...bills].sort((a, b) => b.createdAt - a.createdAt).slice(0, 7);
  const tenantsUnpaid = tenants.filter(t => bills.some(b => b.tenantId === t.id && !b.paid));

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <span style={{ opacity: .4, fontSize: '.82rem' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">Rooms</div>
          <div className="stat-val">{rooms.length}</div>
          <div className="stat-sub">{tenants.length} tenant{tenants.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat y">
          <div className="stat-label">Occupied</div>
          <div className="stat-val">{new Set(tenants.map(t => t.roomId)).size}</div>
          <div className="stat-sub">{rooms.length - new Set(tenants.map(t => t.roomId)).size} vacant</div>
        </div>
        <div className="stat g">
          <div className="stat-label">Paid Bills</div>
          <div className="stat-val">{paid}</div>
        </div>
        <div className="stat r">
          <div className="stat-label">Unpaid Bills</div>
          <div className="stat-val">{unpaid}</div>
          <div className="stat-sub">₱{pending.toLocaleString()} pending</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title">Recent Bills</div>
          {recent.length === 0 ? <div className="empty">No bills yet</div> : (
            <table>
              <thead><tr><th>Tenant</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map(b => {
                  const t = tenants.find(t => t.id === b.tenantId);
                  return (
                    <tr key={b.id}>
                      <td>{t?.name ?? '—'}</td>
                      <td>{b.type}</td>
                      <td>₱{(+b.amount).toLocaleString()}</td>
                      <td><span className={`badge ${b.paid ? 'bg' : 'br'}`}>{b.paid ? 'Paid' : 'Unpaid'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <div className="card-title">Tenants with Unpaid Bills</div>
          {tenantsUnpaid.length === 0
            ? <div className="empty">🎉 All bills settled!</div>
            : (
              <table>
                <thead><tr><th>Tenant</th><th>Room</th><th>Owed</th></tr></thead>
                <tbody>
                  {tenantsUnpaid.map(t => {
                    const room = rooms.find(r => r.id === t.roomId);
                    const owed = bills.filter(b => b.tenantId === t.id && !b.paid).reduce((s, b) => s + +b.amount, 0);
                    return (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td>{room?.name ?? '—'}</td>
                        <td><span className="badge br">₱{owed.toLocaleString()}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );
};

// ── ROOMS & TENANTS (combined) ────────────────────────────────────────────────
const ROOM_DEF = { name: '', floor: '', rent: '' };
const TENANT_DEF = { name: '', phone: '', email: '', moveIn: '', roomId: '' };

const RoomsTenantsPage = ({ rooms, setRooms, tenants, setTenants, bills }) => {
  const [roomModal, setRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState(ROOM_DEF);
  const [roomErrors, setRoomErrors] = useState({});
  const [roomEditId, setRoomEditId] = useState(null);

  const [tenantModal, setTenantModal] = useState(false);
  const [tenantForm, setTenantForm] = useState(TENANT_DEF);
  const [tenantErrors, setTenantErrors] = useState({});
  const [tenantEditId, setTenantEditId] = useState(null);

  const [delRoom, setDelRoom] = useState(null);
  const [delTenant, setDelTenant] = useState(null);

  const openAddRoom = () => { setRoomForm(ROOM_DEF); setRoomErrors({}); setRoomEditId(null); setRoomModal(true); };
  const openEditRoom = r => { setRoomForm({ name: r.name, floor: r.floor || '', rent: r.rent }); setRoomErrors({}); setRoomEditId(r.id); setRoomModal(true); };
  const submitRoom = () => {
    const e = valRoom(roomForm);
    setRoomErrors(e);
    if (Object.keys(e).length) return;
    if (roomEditId) setRooms(prev => prev.map(r => r.id === roomEditId ? { ...r, ...roomForm } : r));
    else setRooms(prev => [...prev, { ...roomForm, id: uid(), createdAt: Date.now() }]);
    setRoomModal(false);
  };
  const confirmDelRoom = () => {
    setRooms(prev => prev.filter(r => r.id !== delRoom));
    setTenants(prev => prev.map(t => t.roomId === delRoom ? { ...t, roomId: '' } : t));
    setDelRoom(null);
  };

  const openAddTenant = (preRoomId = '') => {
    setTenantForm({ ...TENANT_DEF, roomId: preRoomId });
    setTenantErrors({}); setTenantEditId(null); setTenantModal(true);
  };
  const openEditTenant = t => {
    setTenantForm({ name: t.name, phone: t.phone || '', email: t.email || '', moveIn: t.moveIn || '', roomId: t.roomId });
    setTenantErrors({}); setTenantEditId(t.id); setTenantModal(true);
  };
  const submitTenant = () => {
    const e = valTenant(tenantForm);
    setTenantErrors(e);
    if (Object.keys(e).length) return;
    if (tenantEditId) setTenants(prev => prev.map(t => t.id === tenantEditId ? { ...t, ...tenantForm } : t));
    else setTenants(prev => [...prev, { ...tenantForm, id: uid(), createdAt: Date.now() }]);
    setTenantModal(false);
  };
  const confirmDelTenant = () => { setTenants(prev => prev.filter(t => t.id !== delTenant)); setDelTenant(null); };

  const getTenant = roomId => tenants.find(t => t.roomId === roomId);
  const getUnpaid = tenantId => bills.filter(b => b.tenantId === tenantId && !b.paid).length;
  const availRooms = rooms.filter(r => !tenants.some(t => t.roomId === r.id && t.id !== tenantEditId));

  return (
    <div>
      <div className="page-header">
        <h2>Rooms & Tenants</h2>
        <button className="btn btn-primary" onClick={openAddRoom}>＋ Add Room</button>
      </div>

      {rooms.length === 0
        ? <div className="card"><div className="empty">No rooms yet. Click "Add Room" to get started!</div></div>
        : (
          <div className="rooms-grid">
            {rooms.map(r => {
              const tenant = getTenant(r.id);
              const unpaid = tenant ? getUnpaid(tenant.id) : 0;
              return (
                <div key={r.id} className={`room-card ${tenant ? 'occupied' : ''}`}>
                  <div className="room-name">{r.name}</div>
                  <div className="room-rent">
                    {r.floor ? `${r.floor} · ` : ''}₱{(+r.rent).toLocaleString()}/mo
                  </div>

                  {tenant ? (
                    <div className="room-tenant">
                      <strong>{tenant.name}</strong>
                      <span>
                        {[tenant.phone, tenant.moveIn ? `Since ${tenant.moveIn}` : ''].filter(Boolean).join(' · ')}
                      </span>
                      {unpaid > 0 && (
                        <div style={{ marginTop: 6 }}>
                          <span className="badge br">{unpaid} unpaid bill{unpaid > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="room-vacant">Vacant</div>
                  )}

                  <div className="room-actions">
                    {tenant ? (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditTenant(tenant)}>Edit Tenant</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDelTenant(tenant.id)}>Remove</button>
                      </>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => openAddTenant(r.id)}>＋ Add Tenant</button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditRoom(r)}>Edit Room</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDelRoom(r.id)}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {roomModal && (
        <Modal title={roomEditId ? 'Edit Room' : 'Add Room'} onClose={() => setRoomModal(false)}>
          <F label="Room Name / Number *" error={roomErrors.name}>
            <input value={roomForm.name} onChange={e => setRoomForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Room 101" autoFocus />
          </F>
          <F label="Floor / Block">
            <input value={roomForm.floor} onChange={e => setRoomForm(p => ({ ...p, floor: e.target.value }))} placeholder="e.g. Ground Floor (optional)" />
          </F>
          <F label="Monthly Rent (₱) *" error={roomErrors.rent}>
            <input type="number" value={roomForm.rent} onChange={e => setRoomForm(p => ({ ...p, rent: e.target.value }))} placeholder="e.g. 5000" />
          </F>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setRoomModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitRoom}>{roomEditId ? 'Save Changes' : 'Add Room'}</button>
          </div>
        </Modal>
      )}

      {tenantModal && (
        <Modal title={tenantEditId ? 'Edit Tenant' : 'Add Tenant'} onClose={() => setTenantModal(false)}>
          <F label="Full Name *" error={tenantErrors.name}>
            <input value={tenantForm.name} onChange={e => setTenantForm(p => ({ ...p, name: e.target.value }))} placeholder="Tenant's full name" autoFocus />
          </F>
          <F label="Assign Room *" error={tenantErrors.roomId}>
            <select value={tenantForm.roomId} onChange={e => setTenantForm(p => ({ ...p, roomId: e.target.value }))}>
              <option value="">— Select a room —</option>
              {tenantEditId && tenantForm.roomId && !availRooms.find(r => r.id === tenantForm.roomId) && (
                <option value={tenantForm.roomId}>{rooms.find(r => r.id === tenantForm.roomId)?.name} (current)</option>
              )}
              {availRooms.map(r => <option key={r.id} value={r.id}>{r.name} — ₱{(+r.rent).toLocaleString()}/mo</option>)}
            </select>
          </F>
          <div className="two">
            <F label="Phone" hint="Optional">
              <input value={tenantForm.phone} onChange={e => setTenantForm(p => ({ ...p, phone: e.target.value }))} placeholder="+63..." />
            </F>
            <F label="Move-in Date" hint="Optional">
              <input type="date" value={tenantForm.moveIn} onChange={e => setTenantForm(p => ({ ...p, moveIn: e.target.value }))} />
            </F>
          </div>
          <F label="Email" error={tenantErrors.email} hint="Optional">
            <input value={tenantForm.email} onChange={e => setTenantForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
          </F>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setTenantModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitTenant}>{tenantEditId ? 'Save Changes' : 'Add Tenant'}</button>
          </div>
        </Modal>
      )}

      {delRoom && <Confirm msg="Delete this room? Tenants assigned here will be unassigned." onOk={confirmDelRoom} onCancel={() => setDelRoom(null)} />}
      {delTenant && <Confirm msg="Remove this tenant from the room?" onOk={confirmDelTenant} onCancel={() => setDelTenant(null)} />}
    </div>
  );
};

// ── BILLS ─────────────────────────────────────────────────────────────────────
const BILL_DEF = { tenantId: '', month: '', type: 'Rent', amount: '', notes: '', paid: false };

const BillsPage = ({ bills, setBills, tenants, rooms }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BILL_DEF);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [delId, setDelId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTenant, setFilterTenant] = useState('');

  const openAdd = () => { setForm(BILL_DEF); setErrors({}); setEditId(null); setModal(true); };
  const openEdit = b => { setForm({ ...b }); setErrors({}); setEditId(b.id); setModal(true); };

  const submit = () => {
    const e = valBill(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (editId) setBills(prev => prev.map(b => b.id === editId ? { ...b, ...form } : b));
    else setBills(prev => [...prev, { ...form, id: uid(), createdAt: Date.now() }]);
    setModal(false);
  };

  const togglePaid = id => setBills(prev => prev.map(b => b.id === id ? { ...b, paid: !b.paid } : b));
  const confirmDel = () => { setBills(prev => prev.filter(b => b.id !== delId)); setDelId(null); };

  const visible = bills
    .filter(b => filterStatus === 'all' || (filterStatus === 'paid' ? b.paid : !b.paid))
    .filter(b => !filterTenant || b.tenantId === filterTenant)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <div className="page-header">
        <h2>Bills</h2>
        <button className="btn btn-primary" onClick={openAdd}>＋ Add Bill</button>
      </div>

      <div className="filter-bar">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="paid">Paid only</option>
          <option value="unpaid">Unpaid only</option>
        </select>
        <select value={filterTenant} onChange={e => setFilterTenant(e.target.value)}>
          <option value="">All Tenants</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="card">
        {visible.length === 0
          ? <div className="empty">No bills match the current filters.</div>
          : (
            <table>
              <thead>
                <tr><th>Tenant</th><th>Room</th><th>Month</th><th>Type</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {visible.map(b => {
                  const t = tenants.find(t => t.id === b.tenantId);
                  const room = rooms.find(r => r.id === t?.roomId);
                  return (
                    <tr key={b.id}>
                      <td><strong>{t?.name ?? '—'}</strong></td>
                      <td>{room?.name ?? '—'}</td>
                      <td style={{ fontSize: '.82rem' }}>{b.month}</td>
                      <td><span className="badge bx">{b.type}</span></td>
                      <td>₱{(+b.amount).toLocaleString()}</td>
                      <td>
                        <button className={`btn btn-sm ${b.paid ? 'btn-green' : 'btn-danger'}`} onClick={() => togglePaid(b.id)}>
                          {b.paid ? '✓ Paid' : '✕ Unpaid'}
                        </button>
                      </td>
                      <td>
                        <div className="btn-row">
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDelId(b.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>

      {modal && (
        <Modal title={editId ? 'Edit Bill' : 'Add Bill'} onClose={() => setModal(false)}>
          <F label="Tenant *" error={errors.tenantId}>
            <select value={form.tenantId} onChange={e => setForm(p => ({ ...p, tenantId: e.target.value }))}>
              <option value="">— Select tenant —</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </F>
          <div className="two">
            <F label="Month *" error={errors.month}>
              <input type="month" value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} />
            </F>
            <F label="Type">
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {BILL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
          </div>
          <F label="Amount (₱) *" error={errors.amount}>
            <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 5000" />
          </F>
          <F label="Notes" hint="Optional">
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes…" />
          </F>
          <div className="fg">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', opacity: 1, fontSize: '.875rem', fontWeight: 500 }}>
              <input type="checkbox" checked={form.paid} onChange={e => setForm(p => ({ ...p, paid: e.target.checked }))} />
              Mark as already paid
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>{editId ? 'Save Changes' : 'Add Bill'}</button>
          </div>
        </Modal>
      )}
      {delId && <Confirm msg="Delete this bill? This cannot be undone." onOk={confirmDel} onCancel={() => setDelId(null)} />}
    </div>
  );
};

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [bills, setBills] = useState([]);
  const [page, setPage] = useState('dashboard');

  // Watch login state
  useEffect(() => {
    const unsub = onAuthStateChanged(fb.auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) {
          const d = snap.data();
          setRooms(d.rooms || []);
          setTenants(d.tenants || []);
          setBills(d.bills || []);
        }
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Save to Firestore whenever data changes
  useEffect(() => {
    if (!user) return;
    setDoc(doc(fb.db, 'users', user.uid), { rooms, tenants, bills });
  }, [rooms, tenants, bills, user]);

  if (authLoading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif'}}>Loading…</div>;
  if (!user) return <LoginPage />;

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { id: 'rooms', label: 'Rooms & Tenants', icon: '🏠' },
    { id: 'bills', label: 'Bills', icon: '🧾' },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>RentEase</h1>
            <span>Property Manager</span>
          </div>
          <nav className="nav">
            {nav.map(n => (
              <button key={n.id} className={`nav-btn ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
                <span style={{ fontSize: '1.05rem', width: 20, textAlign: 'center' }}>{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
          </nav>

          <button className="nav-btn" onClick={() => signOut(fb.auth)} style={{marginTop:'auto'}}>
            <span>🚪</span><span>Sign Out</span>
          </button>

          <div style={{ padding: '0 20px', fontSize: '.7rem', opacity: .28 }}>v2.0 · Firestore</div>
        </aside>
        <main className="main">
          {page === 'dashboard' && <Dashboard rooms={rooms} tenants={tenants} bills={bills} />}
          {page === 'rooms' && <RoomsTenantsPage rooms={rooms} setRooms={setRooms} tenants={tenants} setTenants={setTenants} bills={bills} />}
          {page === 'bills' && <BillsPage bills={bills} setBills={setBills} tenants={tenants} rooms={rooms} />}
        </main>
      </div>
    </>
  );

  function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
      setError('');
      try {
        if (isSignup) await createUserWithEmailAndPassword(fb.auth, email, password);
        else await signInWithEmailAndPassword(fb.auth, email, password);
      } catch (e) {
        setError(e.message.replace('Firebase: ', ''));
      }
    };

    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#faf7f2',fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{background:'#fff',padding:'40px',borderRadius:'14px',width:'360px',boxShadow:'0 8px 40px rgba(0,0,0,.12)'}}>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.8rem',marginBottom:'8px'}}>RentEase</h2>
          <p style={{opacity:.5,fontSize:'.85rem',marginBottom:'28px'}}>{isSignup ? 'Create an account' : 'Sign in to your account'}</p>
          <div style={{marginBottom:'14px'}}>
            <label style={{display:'block',fontSize:'.78rem',fontWeight:600,marginBottom:'5px',opacity:.6,textTransform:'uppercase'}}>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com"
              style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e0d8cc',borderRadius:'7px',fontSize:'.9rem',fontFamily:'inherit',outline:'none'}} />
          </div>
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'.78rem',fontWeight:600,marginBottom:'5px',opacity:.6,textTransform:'uppercase'}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
              style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e0d8cc',borderRadius:'7px',fontSize:'.9rem',fontFamily:'inherit',outline:'none'}} />
          </div>
          {error && <p style={{color:'#b84040',fontSize:'.8rem',marginBottom:'12px'}}>{error}</p>}
          <button onClick={submit}
            style={{width:'100%',padding:'10px',background:'#c9622f',color:'#fff',border:'none',borderRadius:'7px',fontFamily:'inherit',fontSize:'.9rem',fontWeight:600,cursor:'pointer'}}>
            {isSignup ? 'Create Account' : 'Sign In'}
          </button>
          <p style={{textAlign:'center',marginTop:'16px',fontSize:'.85rem',opacity:.6}}>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <span onClick={()=>setIsSignup(!isSignup)} style={{color:'#c9622f',cursor:'pointer',fontWeight:600}}>
              {isSignup ? 'Sign In' : 'Sign Up'}
            </span>
          </p>
        </div>
      </div>
    );
  }
}