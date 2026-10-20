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
  async out() { await this.sb.auth.signOut(); location.hash = '#/'; }
};
