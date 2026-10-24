const Auth = {
  sb: null, user: null, session: null, after: null,
  async init() {
    if (!CONFIG.SUPABASE_URL || !window.supabase) return;
    this.sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    const { data } = await this.sb.auth.getSession();
    this.session = data.session; this.user = data.session ? data.session.user : null;
    this.sb.auth.onAuthStateChange((ev, s) => { this.session = s; this.user = s ? s.user : null; if (ev === 'SIGNED_OUT') App.render(); });
  },
  ready() { return !!this.sb; },
  modal(mode, after) {
    if (!this.ready()) return alert('Falta configurar Supabase en js/config.js (SUPABASE_URL y SUPABASE_ANON_KEY).');
    if (after) this.after = after;
    document.getElementById('overlay').innerHTML = C.auth(mode); lucide.createIcons();
  },
  submit(e, mode) { e.preventDefault(); this.run(e.target, mode); return false; },
  async run(form, mode) {
    const d = Object.fromEntries(new FormData(form)), err = document.getElementById('aerr'); err.textContent = '';
    try {
      let r;
      if (mode === 'registro') {
        r = await this.sb.auth.signUp({ email: d.email, password: d.password, options: { data: { nombre: d.nombre, telefono: d.telefono } } });
        if (!r.error && !r.data.session) { err.className = 'text-sm text-neutral-700'; err.textContent = 'Te enviamos un mail para confirmar tu cuenta. Confirmalo y luego ingresá.'; return; }
      } else r = await this.sb.auth.signInWithPassword({ email: d.email, password: d.password });
      if (r.error) { err.textContent = r.error.message; return; }
      this.session = r.data.session; this.user = r.data.user || r.data.session.user;
      App.close(); const f = this.after; this.after = null; if (f) f();
    } catch (x) { err.textContent = 'No se pudo conectar. Revisá tu conexión.'; }
  },
  menu() { document.getElementById('overlay').innerHTML = C.account(); lucide.createIcons(); },
  datos() { document.getElementById('overlay').innerHTML = C.datos(); lucide.createIcons(); },
  passModal() { document.getElementById('overlay').innerHTML = C.password(); lucide.createIcons(); },
  // Guarda datos de entrega en la cuenta (user_metadata de Supabase). Devuelve '' si salió bien o el motivo del error.
  async guardarDatos(obj) {
    try {
      const r = await this.sb.auth.updateUser({ data: obj });
      if (r.error) return r.error.message;
      if (r.data && r.data.user) this.user = r.data.user;
      return '';
    } catch (x) { return 'No se pudo conectar. Revisá tu conexión.'; }
  },
  async saveDatos(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target)), err = document.getElementById('derr'), btn = document.getElementById('dbtn'), t = k => String(d[k] || '').trim().replace(/\s+/g, ' ');
    err.className = 'text-sm text-red-700'; err.textContent = '';
    const dni = t('dni').replace(/[.\s]/g, ''), cp = t('cp');
    if (t('nombre').length < 3) { err.textContent = 'Escribí tu nombre y apellido.'; return false; }
    if (dni && !/^\d{7,8}$/.test(dni)) { err.textContent = 'El DNI tiene que tener 7 u 8 números, sin puntos.'; return false; }
    if (cp && !/^\d{4}$/.test(cp)) { err.textContent = 'El código postal tiene 4 números.'; return false; }
    btn.disabled = true; btn.textContent = 'Guardando…';
    const m = await this.guardarDatos({ nombre: t('nombre').slice(0, 80), dni, telefono: t('telefono').slice(0, 25), direccion: t('direccion').slice(0, 120), piso: t('piso').slice(0, 40), localidad: t('localidad').slice(0, 60), provincia: t('provincia'), cp, notas: t('notas').slice(0, 300) });
    btn.disabled = false; btn.textContent = 'Guardar mis datos';
    if (m) { err.textContent = m; return false; }
    err.className = 'text-sm text-green-700'; err.textContent = '✓ Datos guardados. Se completan solos en tu próximo pedido.';
    return false;
  },
  async savePass(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target)), err = document.getElementById('perr'), btn = document.getElementById('pbtn');
    err.className = 'text-sm text-red-700'; err.textContent = '';
    if (d.p1 !== d.p2) { err.textContent = 'Las dos contraseñas no coinciden.'; return false; }
    if (String(d.p1).length < 6) { err.textContent = 'La contraseña tiene que tener al menos 6 caracteres.'; return false; }
    btn.disabled = true; btn.textContent = 'Guardando…';
    try {
      const r = await this.sb.auth.updateUser({ password: d.p1 });
      btn.disabled = false; btn.textContent = 'Guardar contraseña';
      if (r.error) {
        const msg = r.error.message || '', map = [[/different from the old/i, 'La nueva contraseña tiene que ser distinta de la actual.'], [/reauthenticat|recent/i, 'Por seguridad, cerrá sesión, volvé a ingresar y probá de nuevo.'], [/at least|weak|short/i, 'La contraseña es muy débil. Probá con una más larga.']];
        err.textContent = (map.find(([re]) => re.test(msg)) || [0, msg])[1]; return false;
      }
      e.target.reset(); err.className = 'text-sm text-green-700'; err.textContent = '✓ Contraseña cambiada.';
    } catch (x) { btn.disabled = false; btn.textContent = 'Guardar contraseña'; err.textContent = 'No se pudo conectar. Revisá tu conexión.'; }
    return false;
  },
  async out() { await this.sb.auth.signOut(); location.hash = '#/'; }
};
