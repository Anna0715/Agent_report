/* Browser-only 48-hour remember-me. Cookie contains NO credentials; tokens stay
 * in this browser's storage, never in report exports or requests to the host.
 * This is not a server-side Supabase session time-box or an HttpOnly cookie. */
(() => {
  'use strict';
  const TTL = 48 * 60 * 60 * 1000;
  const PATH = '/Agent_report/ai-assistant/';
  const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
  const token = value => typeof value === 'string' && value.length > 0 && value.length < 20000 && !/[\x00-\x20\x7f]/.test(value);
  const problem = (message, status = 0, code = '') => Object.assign(new Error(message), {status, code});

  class AIReviewSession {
    constructor(config, {onInvalidated = () => {}} = {}) {
      const url = new URL(config.project_url);
      if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(config.project_url) || url.username || url.password) throw problem('云端项目地址无效。');
      const key = config.publishable_key;
      let publicKey = typeof key === 'string' && /^sb_publishable_[A-Za-z0-9_-]{10,300}$/.test(key);
      if (!publicKey && typeof key === 'string' && key.length < 10000) {
        try { const claims = JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); publicKey = claims.role === 'anon' && claims.ref === url.hostname.split('.')[0]; } catch { /* fail closed */ }
      }
      if (!publicKey) throw problem('只允许使用公开连接密钥。');
      this.config = {project_url:config.project_url,publishable_key:key};
      this.ref = url.hostname.split('.')[0];
      this.storageKey = 'ai-review-session:v1:' + this.ref;
      this.generationKey = this.storageKey + ':generation';
      this.cookieName = '__Secure-ai-review-remember-' + this.ref;
      this.lockName = 'ai-review-session:' + this.ref;
      this.onInvalidated = onInvalidated;
      this._session = null; this._verified = false; this._persistent = false;
      this._epoch = 0; this._attemptId = null; this._timer = null; this._refreshing = null;
      this._canPersist = location.protocol === 'https:' && location.pathname.startsWith(PATH) && !!navigator.locks?.request;
      try { if (typeof BroadcastChannel !== 'undefined') { this._channel = new BroadcastChannel(this.lockName); this._channel.onmessage = () => this._observe(); } } catch { /* storage events are sufficient */ }
      window.addEventListener('storage', event => { if ([this.storageKey,this.generationKey].includes(event.key)) this._observe(); });
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this._observe(); });
    }
    get userId() { return this._session?.userId || null; }
    get deadline() { return this._session?.deadline || null; }
    get persistent() { return this._persistent; }
    get authenticated() { return this._verified && !!this._session && this._session.deadline > Date.now(); }
    _notify() { try { this._channel?.postMessage({changed:true}); } catch { /* no tokens in messages */ } }
    _cookie() {
      try {
        const item = document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(this.cookieName+'='));
        return item ? JSON.parse(decodeURIComponent(item.slice(this.cookieName.length+1))) : null;
      } catch { return null; }
    }
    _removeCookie() {
      try { document.cookie = `${this.cookieName}=; Max-Age=0; Path=${PATH}; Secure; SameSite=Strict`; }
      catch { this._canPersist=false; }
    }
    _generation() { try { return localStorage.getItem(this.generationKey); } catch { return null; } }
    _readStored() {
      if (!this._canPersist) return null;
      try {
        const c = this._cookie(), s = JSON.parse(localStorage.getItem(this.storageKey) || 'null');
        if (!c || !s || s.schema !== 1 || !uuid(s.id) || s.id !== c.id || s.id !== this._generation() || !uuid(s.userId) || !token(s.accessToken) || !token(s.refreshToken)) return null;
        if (!Number.isFinite(s.createdAt) || !Number.isFinite(s.deadline) || !Number.isFinite(s.accessExpiresAt) || s.deadline !== c.until || s.deadline - s.createdAt !== TTL || s.createdAt > Date.now()+30000 || s.deadline <= Date.now()) return null;
        return {schema:1,id:s.id,createdAt:s.createdAt,deadline:s.deadline,userId:s.userId,accessToken:s.accessToken,refreshToken:s.refreshToken,accessExpiresAt:s.accessExpiresAt};
      } catch { return null; }
    }
    _clearMemory(message) {
      this._epoch++; this._session = null; this._verified = false; this._persistent = false; this._attemptId = null;
      clearTimeout(this._timer); this._timer = null;
      this.onInvalidated(message || '登录已结束，请重新登录。');
    }
    clear(message) {
      const owned = this._session?.id || this._attemptId;
      // A delayed response from an older account must not erase a newer login.
      if ((owned && (!this._generation() || this._generation() === owned)) || (!owned && !this._readStored())) {
        try { localStorage.setItem(this.generationKey,crypto.randomUUID()); } catch { /* still attempt to remove credentials */ }
        try { localStorage.removeItem(this.storageKey); } catch { /* also clear memory and cookie */ }
        this._removeCookie();
        this._notify();
      }
      this._clearMemory(message);
    }
    _observe() {
      if (!this._session) return;
      if (this._session.deadline <= Date.now()) { this.clear('已满48小时，请重新登录。'); return; }
      if (!this._persistent) return;
      const latest = this._readStored();
      if (!latest || latest.id !== this._session.id || latest.userId !== this._session.userId) { this._clearMemory('登录已在其他页面结束或切换，请重新登录。'); return; }
      this._session = latest;
    }
    _schedule() {
      clearTimeout(this._timer);
      if (this._session) this._timer = setTimeout(() => this.clear('已满48小时，请重新登录。'), Math.max(0,this._session.deadline-Date.now()));
    }
    _write(s) {
      if (!this._canPersist) return false;
      try {
        if (this._generation() !== s.id) throw problem('登录已被退出或替换。');
        localStorage.setItem(this.storageKey,JSON.stringify(s));
        const remaining = Math.max(0,Math.floor((s.deadline-Date.now())/1000));
        document.cookie = `${this.cookieName}=${encodeURIComponent(JSON.stringify({id:s.id,until:s.deadline}))}; Max-Age=${remaining}; Expires=${new Date(s.deadline).toUTCString()}; Path=${PATH}; Secure; SameSite=Strict`;
        if (!this._readStored()) throw problem('浏览器未保留登录信息。');
        this._notify(); return true;
      } catch (error) {
        if (this._generation() && this._generation() !== s.id) throw error;
        try { localStorage.removeItem(this.storageKey); } catch { /* private mode */ }
        this._removeCookie();
        this._canPersist = false; return false;
      }
    }
    _current(id, epoch) {
      if (this._epoch !== epoch || (this._canPersist && this._generation() !== id)) throw problem('登录状态已改变，本次操作已取消。');
    }
    async _locked(work) { return navigator.locks?.request ? navigator.locks.request(this.lockName,work) : work(); }
    async _raw(path, payload, accessToken) {
      const allowed = /^\/auth\/v1\/(?:token\?grant_type=(?:password|refresh_token)|user|logout\?scope=local)$/.test(path) || /^\/rest\/v1\/rpc\/ai_review_(?:snapshot|save)$/.test(path);
      if (!allowed) throw problem('不允许请求这个接口。');
      const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),30000);
      try {
        const headers = {'Content-Type':'application/json',apikey:this.config.publishable_key};
        if (accessToken) headers.Authorization = 'Bearer '+accessToken;
        const response = await fetch(this.config.project_url+path,{method:payload===undefined?'GET':'POST',headers,body:payload===undefined?undefined:JSON.stringify(payload),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',redirect:'error',signal:controller.signal});
        if (response.status === 204 && response.ok) return null;
        const body = await response.text();
        if (body.length > 2*1024*1024) throw problem('云端响应过大，未应用更改。');
        let data; try { data=JSON.parse(body); } catch { throw problem('无法确认云端响应；请拉取最新结果核对，不要重复提交。'); }
        if (!response.ok) {
          const conflict = response.status === 409 || (data?.code==='P0001' && data?.message==='VERSION_CONFLICT');
          const source = data?.code==='P0001' && data?.message==='SOURCE_MISMATCH';
          const message = conflict ? '版本冲突：另一位复核员已修改此用例。草稿已保留，请读取最新结果后核对再保存。' : source ? '云端与原始报告身份不一致，已停止操作。' : response.status===403 ? '当前账号没有本报告的访问或修改权限。' : response.status===429 ? '请求过于频繁，请稍后重试。' : path.startsWith('/auth/') ? '登录信息无效或已过期，请重新登录复核账号。' : response.status===401 ? '登录已过期，请重新登录。' : '云端操作未完成，请先拉取最新结果核对。';
          throw problem(message,conflict?409:response.status,source?'SOURCE_MISMATCH':String(data?.code||''));
        }
        return data;
      } catch (error) {
        if (error.name==='AbortError' || error instanceof TypeError) throw problem('网络异常或超时，尚未确认云端结果；请先拉取最新结果核对，不要直接重复保存。');
        throw error;
      } finally { clearTimeout(timer); }
    }
    _fromAuth(auth, existing) {
      if (!auth || !token(auth.access_token) || !token(auth.refresh_token) || !uuid(auth.user?.id) || !Number.isFinite(auth.expires_in) || auth.expires_in<=0 || auth.expires_in>86400) throw problem('认证响应无效。');
      if (existing && auth.user.id!==existing.userId) throw problem('续期后的账号身份不一致。');
      const now = Date.now();
      return {...(existing || {schema:1,id:this._attemptId,createdAt:now,deadline:now+TTL}),userId:auth.user.id,accessToken:auth.access_token,refreshToken:auth.refresh_token,accessExpiresAt:now+auth.expires_in*1000};
    }
    async login(email,password) {
      this.clear();
      const id=crypto.randomUUID(); this._attemptId=id;
      if (this._canPersist) { try { localStorage.setItem(this.generationKey,id); } catch { this._canPersist=false; } }
      const epoch=this._epoch;
      try {
        return await this._locked(async()=>{
          this._current(id,epoch);
          let auth;
          try { auth=await this._raw('/auth/v1/token?grant_type=password',{email,password}); } finally { password=null; }
          this._current(id,epoch);
          const s=this._fromAuth(auth);
          const user=await this._raw('/auth/v1/user',undefined,s.accessToken);
          this._current(id,epoch);
          if (user?.id!==s.userId || user.is_anonymous===true) throw problem('无法验证复核账号身份。');
          this._persistent=this._write(s); this._session=s; this._verified=true; this._attemptId=null; this._schedule();
          return true;
        });
      } catch(error) { this._current(id,epoch); this.clear(); throw error; }
    }
    async restore() {
      const s=this._readStored();
      if (!s) {
        let stale = !!this._cookie();
        try { stale ||= !!localStorage.getItem(this.storageKey); } catch { /* storage disabled */ }
        if (stale) this.clear();
        return false;
      }
      this._session=s; this._persistent=true; this._verified=false;
      const id=s.id,epoch=this._epoch;
      try {
        await this._ensure();
        const user=await this.request('/auth/v1/user');
        this._current(id,epoch);
        if (user?.id!==this._session.userId || user.is_anonymous===true) throw problem('无法验证保存的登录身份。',401);
        this._verified=true; this._schedule(); return true;
      } catch(error) {
        this._current(id,epoch);
        if ([400,401,403].includes(error.status)) this.clear();
        else this._verified=false; // Offline does not delete an otherwise valid remembered login.
        throw error;
      }
    }
    async _ensure(failedToken=null) {
      this._observe();
      if (!this._session || this._session.deadline<=Date.now()) { this.clear(); throw problem('登录已结束，请重新登录。',401); }
      if (!failedToken && this._session.accessExpiresAt>Date.now()+60000) return;
      if (failedToken && this._session.accessToken!==failedToken && this._session.accessExpiresAt>Date.now()+60000) return;
      if (this._refreshing) return this._refreshing;
      this._refreshing=this._locked(async()=>{
        this._observe();
        const old=this._session,epoch=this._epoch;
        if (!old || old.deadline<=Date.now()) { this.clear(); throw problem('已满48小时，请重新登录。',401); }
        if (old.accessExpiresAt>Date.now()+60000 && (!failedToken || old.accessToken!==failedToken)) return;
        try {
          const result=await this._raw('/auth/v1/token?grant_type=refresh_token',{refresh_token:old.refreshToken});
          this._current(old.id,epoch);
          const next=this._fromAuth(result,old);
          const user=await this._raw('/auth/v1/user',undefined,next.accessToken);
          this._current(old.id,epoch);
          if (Date.now()>=next.deadline || user?.id!==next.userId || user.is_anonymous===true) throw problem('保存的登录已过期或身份发生变化。',401);
          if (this._persistent) this._persistent=this._write(next);
          this._session=next; this._schedule();
        } catch(error) { this._current(old.id,epoch); if ([400,401,403].includes(error.status)) this.clear(); throw error; }
      }).finally(()=>{this._refreshing=null;});
      return this._refreshing;
    }
    async request(path,payload) {
      await this._ensure();
      if (!this._session) throw problem('登录已结束，请重新登录。',401);
      const id=this._session.id,epoch=this._epoch,accessToken=this._session.accessToken;
      try {
        const result=await this._raw(path,payload,accessToken);
        this._current(id,epoch);
        if (Date.now()>=this._session.deadline) { this.clear(); throw problem('已满48小时，请重新登录。',401); }
        return result;
      } catch(error) {
        // Ignore stale failures too: an old account's late 401/403 must never
        // refresh, revoke or erase a newer account's successful login.
        this._current(id,epoch);
        if (error.status===401 && this._session) {
          await this._ensure(accessToken);
          // Only retry reads. Never automatically repeat a mutation.
          if (path==='/auth/v1/user' || path==='/rest/v1/rpc/ai_review_snapshot') {
            try {
              const value=await this._raw(path,payload,this._session.accessToken); this._current(id,epoch);
              if (Date.now()>=this._session.deadline) { this.clear(); throw problem('已满48小时，请重新登录。',401); }
              return value;
            }
            catch(retryError) { this._current(id,epoch); if ([401,403].includes(retryError.status)) this.clear(); throw retryError; }
          }
          throw problem('登录已续期。本次保存未确认，请先拉取最新结果核对后再次保存。');
        }
        if ([401,403].includes(error.status) || error.code==='SOURCE_MISMATCH') this.clear();
        throw error;
      }
    }
    async logout() {
      const access=this._session?.accessToken;
      this.clear('已退出登录。');
      if (!access) return true;
      try { await this._raw('/auth/v1/logout?scope=local',{},access); return true; }
      catch { return false; }
    }
  }
  window.AIReviewSession=AIReviewSession;
})();
